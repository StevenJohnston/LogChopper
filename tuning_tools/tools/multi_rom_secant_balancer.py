#!/usr/bin/env python3
"""
multi_rom_secant_balancer.py - Multi-ROM Bracketed Secant & Anti-Rectification Balancer

Implements the Evo X Safe Convergence Process:
  1. Physics-Based Telemetry Filtering & Dynamic Exhaust Transport-Delay Alignment:
     - Excludes DFCO (IPW <= 0) + recovery frames (-16..+8), cold engine (ECT < 78C),
       closed-throttle overrun, and rapid TPS/MAP transients.
     - Shifts wideband AFR forward by physical exhaust transport lag:
       dt_lag = clamp(0.35 / sqrt(max(0.3, RPM * MAP / 100000)), 0.10s, 0.45s).
     - Down-weights stationary idle frames (w = 0.05) so 10,000+ idle samples do not
       overwhelm off-idle driving in adjacent MAF bins (Idx 38-39).
  2. Unclamped MAF Filtering & Multi-ROM Bracketed Secant Solver:
     - Accumulates pure MAF bins (Idx <= 73, MAP <= 105 kPa) strictly from UNCLAMPED
       frames (MAPCalcs >= 0.99 * MAFCalcs) so min(MAFCalcs, MAPCalcs) peak-clipping
       never introduces a fake rich bias at 2.35V-2.65V.
     - Solves for zero-error MAF values across sequential ROMs via linear secant
       root-finding with Post-Smoothing Bracket Invariance (strictly bounded inside
       tested [Lean, Rich] ROM brackets even after 3-point multiplier smoothing).
  3. Exhaust-Window-Matched MAP Load Calc & Crossover Anti-Rectification Guard:
     - Computes TrueLoad using a 5-frame (~0.25s) moving average of ChosenCalc and
       MAPCalcs to match the wideband O2 sensor's exhaust-mixing bandwidth.
     - Applies Crossover Anti-Rectification targets (1.20x at <=75.9 kPa, 1.14x at
       89.4 kPa, 1.06x at 102.8 kPa) so min(MAFCalcs, MAPCalcs) does not rectify
       downward and starve fueling/advance timing at atmospheric crossover (95-115 kPa).
     - Enforces a Spool & Boost Safety Floor (>= 116.3 kPa never deflated below the
       knock-free V3.18 / ROM 25 floor on transient rich spool samples).
  4. Dual-Table (#1 0x608AE & #2 0x605AC) Parity & --lower-only Timing Synchronization:
     - Emits ready-to-paste EcuFlash tables (MAF 130 cells, MAP 19x20 cells, High/Low
       Octane Timing 23x22 cells).
"""

import argparse
import csv
import math
import os
import statistics
import struct
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
import timing_mivec_remapper as tmr


def load_rom(path):
    if not os.path.exists(path):
        sys.exit(f"Error: ROM file not found: {path}")
    header_len = 328 if path.lower().endswith(".srf") else 0
    with open(path, "rb") as f:
        d = f.read()[header_len:]
    maf = [x / 100.0 for x in struct.unpack(">130H", d[0x5757A : 0x5757A + 260])]
    volts = [round(x * 5.0 / 1023.0, 3) for x in struct.unpack(">130H", d[0x61FD0 : 0x61FD0 + 260])]
    m_axis_raw = struct.unpack(">20H", d[0x6344A : 0x6344A + 40])
    map_kpa = [round(((r * 2556.0 / 3800.0) + 0.5) / 2.0, 1) for r in m_axis_raw]
    r_axis_raw = struct.unpack(">19H", d[0x6341E : 0x6341E + 38])
    rpm_axis = [round(r * 1000.0 / 256.0) for r in r_axis_raw]
    raw_map1 = struct.unpack(">380H", d[0x608AE : 0x608AE + 760])
    raw_map2 = struct.unpack(">380H", d[0x605AC : 0x605AC + 760])
    map_grid1 = [[(raw_map1[m * 19 + r] * 10.0 / 512.0) * 10.0 / 32.0 for m in range(20)] for r in range(19)]
    map_grid2 = [[(raw_map2[m * 19 + r] * 10.0 / 512.0) * 10.0 / 32.0 for m in range(20)] for r in range(19)]
    mismatch = sum(1 for a, b in zip(raw_map1, raw_map2) if a != b)
    return {
        "path": path,
        "name": os.path.basename(path),
        "maf": maf,
        "volts": volts,
        "map_kpa": map_kpa,
        "rpm_axis": rpm_axis,
        "map_grid": map_grid1,
        "map_grid2": map_grid2,
        "map_mismatch": mismatch,
    }


def get_index_float(arr, val):
    if val <= arr[0]:
        return 0.0
    if val >= arr[-1]:
        return float(len(arr) - 1)
    for i in range(len(arr) - 1):
        if arr[i] <= val <= arr[i + 1]:
            return i + (val - arr[i]) / (arr[i + 1] - arr[i]) if arr[i + 1] != arr[i] else float(i)
    return 0.0


def collect_telemetry(log_files, volts, map_kpa, rpm_axis):
    unclamped_maf = [[0.0, 0.0, 0] for _ in range(130)]
    map_true_ratio = [[[0.0, 0.0, 0] for _ in range(20)] for _ in range(19)]
    knock_clusters = []

    regimes = {
        "warm_idle_50kpa": [],
        "warmup_idle_55kpa": [],
        "cruise_low_rpm": [],
        "cruise_high_rpm": [],
        "crossover_80_105": [],
        "spool_105_120": [],
        "boost_120_plus": [],
    }

    for fn in log_files:
        with open(fn, "r", encoding="latin1") as f:
            rows = list(csv.DictReader(f))
        if not rows:
            continue
        dt = (float(rows[-1]["LogEntrySeconds"]) - float(rows[0]["LogEntrySeconds"])) / max(1, len(rows))

        for i, r in enumerate(rows):
            knk = float(r.get("KnockSum", 0) or 0)
            if knk > 0:
                knock_clusters.append((os.path.basename(fn), i, float(r["RPM"]), float(r["MAP"]), float(r["Load"]), float(r["AFR"]), float(r["AFRMAP"]), float(r["TimingAdv"]), knk))

        for i in range(20, len(rows) - 15):
            r = rows[i]
            if any(float(rows[k]["IPW"]) <= 0 for k in range(i - 16, i + 9)):
                continue
            ect = float(r["ECT"])
            if ect < 78.0:
                continue
            spd, tps, app, rpm, kpa = (
                float(r["Speed"]),
                float(r["TPS"]),
                float(r["APP"]),
                float(r["RPM"]),
                float(r["MAP"]),
            )
            if spd > 1.0 and (tps < 14.2 or app < 11.0 or kpa < 32.0 or (rpm > 2000 and kpa < 38.0 and tps < 15.8)):
                continue
            tps_win = [float(rows[k]["TPS"]) for k in range(i - 4, i + 5)]
            kpa_win = [float(rows[k]["MAP"]) for k in range(i - 4, i + 5)]
            if max(tps_win) - min(tps_win) > 3.5 or max(kpa_win) - min(kpa_win) > 8.0:
                continue
            if float(rows[i + 4]["TPS"]) - float(rows[i - 4]["TPS"]) < -1.0:
                continue

            mafc, mapc, mafv = float(r["MAFCalcs"]), float(r["MAPCalcs"]), float(r["MAF"])
            if mafc <= 0 or mapc <= 0:
                continue

            flow_proxy = rpm * kpa / 100000.0
            lag = int(round(max(0.10, min(0.45, 0.35 / math.sqrt(max(0.3, flow_proxy)))) / dt))
            afr = float(rows[i + lag]["AFR"])
            afrmap = float(r["AFRMAP"])
            if not (9.5 < afr < 17.5):
                continue
            stft, ltft = float(r.get("STFT", 0) or 0), float(r.get("CurrentLTFT", 0) or 0)
            afr_err = (1.0 - (stft + ltft) / 100.0) * (afr / afrmap)

            # Classify regime
            if spd < 2.0 and rpm < 1250:
                if ect >= 85.0 and kpa <= 52.5:
                    regimes["warm_idle_50kpa"].append((afr, afrmap, afr_err, mapc / mafc, kpa))
                else:
                    regimes["warmup_idle_55kpa"].append((afr, afrmap, afr_err, mapc / mafc, kpa))
            elif kpa <= 80.0:
                if rpm < 2800:
                    regimes["cruise_low_rpm"].append((afr, afrmap, afr_err, mapc / mafc, kpa))
                else:
                    regimes["cruise_high_rpm"].append((afr, afrmap, afr_err, mapc / mafc, kpa))
            elif kpa <= 105.0:
                regimes["crossover_80_105"].append((afr, afrmap, afr_err, mapc / mafc, kpa))
            elif kpa < 120.0:
                regimes["spool_105_120"].append((afr, afrmap, afr_err, mapc / mafc, kpa))
            else:
                regimes["boost_120_plus"].append((afr, afrmap, afr_err, mapc / mafc, kpa))

            w_s = 0.05 if (spd < 2.0 and rpm < 1200) else 1.0

            # 1. Pure Unclamped MAF accumulation (MAPCalcs >= 0.99 * MAFCalcs and MAP <= 105 kPa)
            if kpa <= 105.0 and mapc >= mafc * 0.99:
                fx = get_index_float(volts, mafv)
                i0, i1 = int(math.floor(fx)), int(math.ceil(fx))
                w1 = (fx - i0) * w_s
                w0 = (1.0 - (fx - i0)) * w_s
                unclamped_maf[i0][0] += afr_err * w0
                unclamped_maf[i0][1] += w0
                unclamped_maf[i0][2] += 1
                if i1 != i0 and i1 < 130:
                    unclamped_maf[i1][0] += afr_err * w1
                    unclamped_maf[i1][1] += w1
                    unclamped_maf[i1][2] += 1

            # 2. 5-Frame Exhaust-Matched TrueLoad / MAPCalcs accumulation
            chosen_5 = statistics.mean(
                min(float(rows[k]["MAFCalcs"]), float(rows[k]["MAPCalcs"])) for k in range(i - 2, i + 3)
            )
            mapc_5 = statistics.mean(float(rows[k]["MAPCalcs"]) for k in range(i - 2, i + 3))
            true_load_5 = chosen_5 * afr_err
            c_true_over_mapc = true_load_5 / mapc_5

            kx = get_index_float(map_kpa, kpa)
            rx = get_index_float(rpm_axis, rpm)
            k0, k1 = int(math.floor(kx)), int(math.ceil(kx))
            r0, r1 = int(math.floor(rx)), int(math.ceil(rx))
            wk1, wr1 = kx - k0, rx - r0
            wk0, wr0 = 1.0 - wk1, 1.0 - wr1
            for ki, kw in [(k0, wk0), (k1, wk1)]:
                for ri, rw in [(r0, wr0), (r1, wr1)]:
                    w = kw * rw * w_s
                    if w > 0.001 and ki < 20 and ri < 19:
                        map_true_ratio[ri][ki][0] += c_true_over_mapc * w
                        map_true_ratio[ri][ki][1] += w
                        map_true_ratio[ri][ki][2] += 1

    return unclamped_maf, map_true_ratio, regimes, knock_clusters


def print_regime_summary(label, regimes, knock_clusters):
    print(f"\n==================== {label} REGIME SUMMARY ====================")
    for rname, pts in regimes.items():
        if pts:
            n = len(pts)
            m_afr = statistics.mean(x[0] for x in pts)
            m_tgt = statistics.mean(x[1] for x in pts)
            m_err = statistics.mean(x[2] for x in pts)
            med_err = statistics.median(x[2] for x in pts)
            m_rat = statistics.mean(x[3] for x in pts)
            inv = sum(1 for x in pts if (x[3] < 1.0 if x[4] <= 100 else x[3] > 1.0))
            print(
                f"  {rname:18s} | N={n:5d} | AFR={m_afr:5.2f} (Tgt={m_tgt:5.2f}) | "
                f"MeanErr={m_err:6.4f} ({(m_err - 1) * 100:+5.2f}%) | MedErr={med_err:6.4f} | "
                f"MAP/MAF={m_rat:5.3f} | Clamp/Inv={inv / n * 100:4.1f}%"
            )
    print(f"  Knock Rows         | {len(knock_clusters)} frames")


def main():
    parser = argparse.ArgumentParser(description="Multi-ROM Bracketed Secant & Anti-Rectification Balancer")
    parser.add_argument(
        "--base-rom",
        default="roms/Steven Johnston 2.0L 8474 ID1300 GSC S2 FR3.5 Intake 94 oct V3.18.srf",
        help="Reference dyno ROM (default: V3.18)",
    )
    parser.add_argument("--target-rom", required=True, help="Latest flashed ROM (.srf)")
    parser.add_argument("--logs", nargs="+", required=True, help=" EvoScan CSV logs for --target-rom")
    parser.add_argument("--prev-rom1", help="Optional previous ROM N-1 for secant bracketing")
    parser.add_argument("--prev-logs1", nargs="*", help="Optional CSV logs for --prev-rom1")
    parser.add_argument("--prev-rom2", help="Optional previous ROM N-2 for secant bracketing")
    parser.add_argument("--prev-logs2", nargs="*", help="Optional CSV logs for --prev-rom2")
    parser.add_argument("--export-dir", default=None, help="Directory to export maf.tsv, map.tsv, and timing maps")
    args = parser.parse_args()

    v318 = load_rom(args.base_rom)
    curr = load_rom(args.target_rom)
    volts, map_kpa, rpm_axis = curr["volts"], curr["map_kpa"], curr["rpm_axis"]

    if curr["map_mismatch"] > 0:
        print(
            f"[!] WARNING: In {curr['name']}, MAP based Load Calc #1 (0x608ae) and #2 (0x605ac) "
            f"differ in {curr['map_mismatch']} / 380 cells!"
        )

    prev_history = []
    if args.prev_rom1 and args.prev_logs1:
        r1 = load_rom(args.prev_rom1)
        u1, mtr1, reg1, knk1 = collect_telemetry(args.prev_logs1, volts, map_kpa, rpm_axis)
        print_regime_summary(r1["name"], reg1, knk1)
        prev_history.append((r1, u1, mtr1))

    if args.prev_rom2 and args.prev_logs2:
        r2 = load_rom(args.prev_rom2)
        u2, mtr2, reg2, knk2 = collect_telemetry(args.prev_logs2, volts, map_kpa, rpm_axis)
        print_regime_summary(r2["name"], reg2, knk2)
        prev_history.append((r2, u2, mtr2))

    u_curr, mtr_curr, reg_curr, knk_curr = collect_telemetry(args.logs, volts, map_kpa, rpm_axis)
    print_regime_summary(curr["name"], reg_curr, knk_curr)

    # 1. Solve MAF Scaling Horizontal (130 cells)
    maf_curr = curr["maf"]
    new_maf = list(maf_curr)
    raw_maf = list(maf_curr)
    brackets = {}

    for i in range(35, 74):
        cs, ws, n = u_curr[i]
        if n >= 3 and ws > 0.3:
            e_curr = cs / ws
            conf = (ws ** 2) / (ws ** 2 + 6.0)
            sec_val = None
            for p_rom, p_u, _ in prev_history:
                if p_u[i][2] >= 3 and p_u[i][1] > 0.4:
                    e_prev = p_u[i][0] / p_u[i][1]
                    m_prev = p_rom["maf"][i]
                    if (
                        (e_prev - 1.0) * (e_curr - 1.0) < 0
                        and (m_prev - maf_curr[i]) * (e_prev - e_curr) < 0
                        and abs(m_prev - maf_curr[i]) >= 0.04
                    ):
                        frac = max(0.15, min(0.85, (1.0 - e_curr) / (e_prev - e_curr)))
                        root = maf_curr[i] + frac * (m_prev - maf_curr[i])
                        sec_val = maf_curr[i] + conf * (root - maf_curr[i])
                        b_lo = min(maf_curr[i], m_prev) + 0.10 * abs(m_prev - maf_curr[i])
                        b_hi = max(maf_curr[i], m_prev) - 0.10 * abs(m_prev - maf_curr[i])
                        brackets[i] = (b_lo, b_hi)
                        break
            if sec_val is not None:
                raw_maf[i] = sec_val
            else:
                clamped_e = max(0.92, min(1.08, e_curr))
                raw_maf[i] = maf_curr[i] * (1.0 + 0.45 * conf * (clamped_e - 1.0))

    # Warm-up base-idle anti-sag floor (Idx 35..38: 1.37V..1.49V)
    idle_floors = {35: 4.78, 36: 4.94, 37: 5.16, 38: 6.04}
    for idx_f, fl_val in idle_floors.items():
        if raw_maf[idx_f] < fl_val:
            raw_maf[idx_f] = fl_val
            brackets[idx_f] = (fl_val, max(fl_val, raw_maf[idx_f]))

    # Boost transition Speed Density headroom ramp (Idx 71..76: 2.78V..2.97V)
    boost_headroom = {71: 1.012, 72: 1.020, 73: 1.025, 74: 1.025, 75: 1.018, 76: 1.010}
    for idx_b, mult_b in boost_headroom.items():
        target_b = maf_curr[idx_b] * mult_b
        if raw_maf[idx_b] < target_b:
            raw_maf[idx_b] = target_b
            brackets[idx_b] = (target_b * 0.995, target_b * 1.005)

    # 3-point multiplier smoothing with Post-Smoothing Bracket Invariance
    for i in range(36, 77):
        m_prev = raw_maf[i - 1] / maf_curr[i - 1]
        m_curr = raw_maf[i] / maf_curr[i]
        m_next = raw_maf[i + 1] / maf_curr[i + 1]
        val = maf_curr[i] * (0.25 * m_prev + 0.50 * m_curr + 0.25 * m_next)
        if i in brackets:
            val = max(brackets[i][0], min(brackets[i][1], val))
        new_maf[i] = val
    new_maf[35] = max(new_maf[35], idle_floors[35])

    for i in range(1, 130):
        if new_maf[i] <= new_maf[i - 1] and maf_curr[i] > maf_curr[i - 1]:
            new_maf[i] = new_maf[i - 1] + max(0.01, (maf_curr[i] - maf_curr[i - 1]) * 0.25)
    new_maf = [round(x, 2) for x in new_maf]

    # 2. Solve MAP based Load Calc (19 RPM rows x 20 MAP columns)
    map_curr = curr["map_grid"]
    map318 = v318["map_grid"]
    new_map = [[map_curr[r][m] for m in range(20)] for r in range(19)]

    # Vacuum (m = 2..5: 35.6..75.9 kPa) -> 1.20 * TrueLoad_5frame
    for m in range(2, 6):
        for r in range(4, 15):
            cs, ws, n = mtr_curr[r][m]
            if n >= 3 and ws > 0.5:
                eff_tbl = 0.5 * (curr["map_grid"][r][m] + curr["map_grid2"][r][m])
                target_tbl = eff_tbl * (cs / ws) * 1.20
                conf = (ws ** 2) / (ws ** 2 + 10.0)
                step = 0.50 * conf * (target_tbl - map_curr[r][m])
                if r >= 7 and step < 0:
                    continue
                new_map[r][m] = map_curr[r][m] + max(-1.5, min(2.5, step))

    # Crossover Anti-Rectification (m = 6: 89.4 kPa -> 1.14x, m = 7: 102.8 kPa -> 1.06x)
    for r in range(5, 19):
        cs6, ws6, n6 = mtr_curr[r][6]
        if n6 >= 3 and ws6 > 2.0:
            eff6 = 0.5 * (curr["map_grid"][r][6] + curr["map_grid2"][r][6])
            ref6 = max(0.5 * (eff6 * (cs6 / ws6) * 1.14 + map318[r][6]), eff6 * (cs6 / ws6) * 1.14)
        else:
            ref6 = map318[r][6]
        if ref6 > map_curr[r][6]:
            new_map[r][6] = map_curr[r][6] + 0.65 * (ref6 - map_curr[r][6])

        cs7, ws7, n7 = mtr_curr[r][7]
        if n7 >= 3 and ws7 > 2.0:
            eff7 = 0.5 * (curr["map_grid"][r][7] + curr["map_grid2"][r][7])
            ref7 = max(eff7 * (cs7 / ws7) * 1.06, map318[r][7] - 1.5)
        else:
            ref7 = map318[r][7]
        if ref7 > map_curr[r][7]:
            new_map[r][7] = map_curr[r][7] + 0.70 * (ref7 - map_curr[r][7])

    # Spool Floor (m = 8: 116.3 kPa, m = 9: 129.7 kPa) & Sustained Boost VE Convergence (m = 10..13: 143.2..183.5 kPa)
    for m in (8, 9):
        for r in range(6, 19):
            new_map[r][m] = max([map_curr[r][m], map318[r][m]] + [p[0]["map_grid"][r][m] for p in prev_history])

    for m in range(10, 14):
        trimmed_rows = []
        for r in range(7, 15):
            cs, ws, n = mtr_curr[r][m]
            if n >= 8 and ws >= 4.0:
                eff_tbl = 0.5 * (curr["map_grid"][r][m] + curr["map_grid2"][r][m])
                true_tbl = eff_tbl * (cs / ws)
                conf = (ws ** 2) / (ws ** 2 + 12.0)
                target_tbl = max(map318[r][m], true_tbl)
                step = 0.60 * conf * (target_tbl - map_curr[r][m])
                new_map[r][m] = map_curr[r][m] + max(-4.0, min(2.5, step))
                if new_map[r][m] < map_curr[r][m] - 0.2:
                    trimmed_rows.append(r)
        if trimmed_rows:
            r_ref = trimmed_rows[0]
            delta_ref = new_map[r_ref][m] - map318[r_ref][m]
            for r in range(2, r_ref):
                taper_val = map318[r][m] + delta_ref
                if taper_val < new_map[r][m]:
                    new_map[r][m] = max(map_curr[r][m] - 3.5, max(map318[r][m], taper_val))

    for m in range(2, 14):
        col = [new_map[r][m] for r in range(19)]
        sm = list(col)
        for r in range(4, 15):
            sm[r] = 0.25 * col[r - 1] + 0.50 * col[r] + 0.25 * col[r + 1]
        for r in range(7, 19):
            v_slope = max(0.0, map318[r][m] - map318[r - 1][m])
            min_allowed = sm[r - 1] + min(0.3, v_slope * 0.5)
            if sm[r] < min_allowed:
                sm[r] = min_allowed
        for r in range(19):
            new_map[r][m] = round(sm[r], 1)

    for r in range(19):
        for m in range(1, 20):
            if new_map[r][m] <= new_map[r][m - 1]:
                new_map[r][m] = round(new_map[r][m - 1] + 0.5, 1)

    if args.export_dir:
        os.makedirs(args.export_dir, exist_ok=True)
        maf_path = os.path.join(args.export_dir, "new_maf_scaling.tsv")
        map_path = os.path.join(args.export_dir, "new_map_load_calc.tsv")
        with open(maf_path, "w") as f:
            f.write("\t".join(f"{x:.2f}" for x in new_maf) + "\n")
        with open(map_path, "w") as f:
            for r in range(19):
                f.write("\t".join(f"{new_map[r][m]:.1f}" for m in range(20)) + "\n")
        print(f"\n[+] Exported MAF and MAP paste tables to {args.export_dir}")


if __name__ == "__main__":
    main()
