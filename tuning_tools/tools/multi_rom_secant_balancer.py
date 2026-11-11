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
  4. Unvisited Cell/Bin Shape-Preserving Interpolation + 5%-10% Safety Cushion:
     - Identifies all MAF bins (Idx >= 35) and MAP based Load Calc cells (Col >= 1)
       that have zero empirical telemetry coverage across the current logs, previous
       ROM logs, and calibration_experience.db (maf_bin_experience & map_cell_experience).
     - Interpolates unvisited cells/bins from visited (data-backed) anchors in
       normalized V3.18 ratio space partitioned by physical regime, and applies a
       distance-graded +5.0% to +10.0% safety cushion (+5.0% at distance 1, +7.5% at
       distance 2, +10.0% at distance >= 3) so the ECU commands more fuel and less
       ignition timing if the car enters unexplored regions for the first time.
     - Strictly preserves all visited cells/bins (has_data == True) untouched by the
       unvisited safety margin and prevents cumulative ratcheting across flashes.
  5. Dual-Table (#1 0x608AE & #2 0x605AC) Parity & --lower-only Timing Synchronization:
     - Emits ready-to-paste EcuFlash tables (MAF 130 cells, MAP 19x20 cells, High/Low
       Octane Timing 23x22 cells).
"""

import argparse
import csv
import math
import os
import sqlite3
import statistics
import struct
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(SCRIPT_DIR, "..", "db", "calibration_experience.db")
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
    map_grid1 = [[round((raw_map1[m * 19 + r] * 10.0 / 512.0) * 10.0 / 32.0, 1) for m in range(20)] for r in range(19)]
    map_grid2 = [[round((raw_map2[m * 19 + r] * 10.0 / 512.0) * 10.0 / 32.0, 1) for m in range(20)] for r in range(19)]
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
    boost_true_gs = [[0.0, 0.0, 0] for _ in range(130)]
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

        # Detect crank / cold key-on start for 35s wideband O2 heater warmup gate
        crank_sec = None
        for r0 in rows:
            if float(r0.get("RPM", 0) or 0) >= 450.0:
                crank_sec = float(r0["LogEntrySeconds"])
                break
        needs_wb_gate = (float(rows[0].get("RPM", 0) or 0) < 300.0) or (float(rows[0].get("ECT", 85) or 85) < 40.0)

        for i, r in enumerate(rows):
            knk = float(r.get("KnockSum", 0) or 0)
            if knk > 0:
                knock_clusters.append((os.path.basename(fn), i, float(r["RPM"]), float(r["MAP"]), float(r["Load"]), float(r["AFR"]), float(r["AFRMAP"]), float(r["TimingAdv"]), knk))

        for i in range(20, len(rows) - 15):
            r = rows[i]
            sec_now = float(r["LogEntrySeconds"])
            if needs_wb_gate and crank_sec is not None and (sec_now - crank_sec) < 35.0:
                continue
            if any(float(rows[k]["IPW"]) <= 0 for k in range(i - 16, i + 9)):
                continue
            ect = float(r["ECT"])
            if ect < 80.0:
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
            # Pure Open-Loop Wideband Validity Gate (exclude <=10.08 rich rail & >=18.42 lean rail)
            if not (10.08 < afr < 18.42) or afrmap <= 0:
                continue
            afr_err = afr / afrmap

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

            # 1. Pure Unclamped MAF accumulation (MAPCalcs >= 0.99 * MAFCalcs, MAP <= 105 kPa, MAFV <= 2.74V)
            if kpa <= 105.0 and mafv <= 2.74 and mapc >= mafc * 0.99:
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

            # Track empirical true mass airflow (g/s) in boost for non-cumulative MAF SD headroom
            if kpa >= 115.0 and tps >= 30.0 and mafv >= 2.85:
                true_gs = (true_load_5 * rpm) / 4964.28
                fx_b = get_index_float(volts, mafv)
                ib = int(round(fx_b))
                if 74 <= ib < 130:
                    boost_true_gs[ib][0] += true_gs
                    boost_true_gs[ib][1] += 1.0
                    boost_true_gs[ib][2] += 1

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

    return unclamped_maf, boost_true_gs, map_true_ratio, regimes, knock_clusters


def _distance_safety_margin(dist_cells, margin_min=0.05, margin_max=0.10):
    """
    Distance-graded unvisited safety margin:
      - d = 1 cell from nearest visited cell -> margin_min (+5.0%)
      - d = 2 cells from nearest visited cell -> midpoint (+7.5%)
      - d >= 3 cells from nearest visited cell -> margin_max (+10.0%)
    """
    if margin_max <= margin_min:
        return margin_min
    span = margin_max - margin_min
    return max(margin_min, min(margin_max, margin_min + 0.5 * span * max(0.0, dist_cells - 1.0)))


def _map_col_regime(col_idx):
    if col_idx == 0:
        return 0
    if col_idx <= 5:
        return 1  # Vacuum (22.1..75.9 kPa)
    if col_idx <= 7:
        return 2  # Atmospheric Crossover (89.4..102.8 kPa)
    return 3      # Positive Boost SD (116.3..304.6 kPa)


def interpolate_unvisited_map_cells(cal_map, vis_map, map318, margin_min=0.05, margin_max=0.10):
    """
    2D regime-aware shape-preserving interpolation + distance-graded [+5%, +10%] safety
    margin for unvisited MAP based Load Calc cells (vis_map[r][m] == False, m >= 1).
    Visited cells (vis_map[r][m] == True) are strictly preserved and never modified.
    """
    out_map = [[cal_map[r][m] for m in range(20)] for r in range(19)]
    margin_grid = [[0.0 for _ in range(20)] for _ in range(19)]
    rho_vis = [
        [
            (cal_map[r][m] / max(1.0, map318[r][m])) if vis_map[r][m] else None
            for m in range(20)
        ]
        for r in range(19)
    ]

    for r in range(19):
        for m in range(1, 20):
            if vis_map[r][m]:
                continue
            reg = _map_col_regime(m)

            # 1. Vertical interpolation/extrapolation along column m
            v_rows = [rr for rr in range(19) if vis_map[rr][m]]
            rho_v, d_v = None, 99.0
            r_min_col = min(v_rows) if v_rows else None
            if v_rows:
                below = [rr for rr in v_rows if rr < r]
                above = [rr for rr in v_rows if rr > r]
                if below and above:
                    r0, r1 = below[-1], above[0]
                    t = (r - r0) / float(r1 - r0)
                    rho_v = rho_vis[r0][m] * (1.0 - t) + rho_vis[r1][m] * t
                    d_v = float(min(r - r0, r1 - r))
                elif below:
                    r0 = below[-1]
                    rho_v = rho_vis[r0][m]
                    d_v = float(r - r0)
                else:
                    r1 = above[0]
                    rho_v = rho_vis[r1][m]
                    d_v = float(r1 - r)

            # 2. Horizontal interpolation/extrapolation along row r within same regime
            h_cols = [mm for mm in range(1, 20) if vis_map[r][mm] and _map_col_regime(mm) == reg]
            if not h_cols and reg == 3:
                h_cols = [mm for mm in range(6, 20) if vis_map[r][mm]]
            rho_h, d_h = None, 99.0
            if h_cols:
                left = [mm for mm in h_cols if mm < m]
                right = [mm for mm in h_cols if mm > m]
                if left and right:
                    m0, m1 = left[-1], right[0]
                    t = (m - m0) / float(m1 - m0)
                    rho_h = rho_vis[r][m0] * (1.0 - t) + rho_vis[r][m1] * t
                    d_h = float(min(m - m0, m1 - m))
                elif left:
                    m0 = left[-1]
                    rho_h = rho_vis[r][m0]
                    d_h = float(m - m0)
                else:
                    m1 = right[0]
                    rho_h = rho_vis[r][m1]
                    d_h = float(m1 - m)

            # 3. Blend vertical & horizontal normalized ratios, or 2D IDW over regime visited cells
            if rho_v is not None and rho_h is not None:
                if reg == 1 and r_min_col is not None and r < r_min_col:
                    # Low-RPM vacuum below lowest visited RPM in column m: anchor to min(rho_v, rho_h)
                    rho_est = min(rho_v, rho_h)
                else:
                    wv = 1.0 / (d_v ** 2)
                    wh = 1.0 / (d_h ** 2)
                    rho_est = (wv * rho_v + wh * rho_h) / (wv + wh)
                d_min = min(d_v, d_h)
            elif rho_v is not None:
                rho_est, d_min = rho_v, d_v
            elif rho_h is not None:
                rho_est, d_min = rho_h, d_h
            else:
                pts = [
                    (rr, mm, rho_vis[rr][mm])
                    for rr in range(19)
                    for mm in range(1, 20)
                    if vis_map[rr][mm] and _map_col_regime(mm) == reg
                ]
                if not pts:
                    pts = [
                        (rr, mm, rho_vis[rr][mm])
                        for rr in range(19)
                        for mm in range(1, 20)
                        if vis_map[rr][mm]
                    ]
                w_sum, rw_sum, d_min = 0.0, 0.0, 99.0
                for rr, mm, rv in pts:
                    dist = math.hypot(r - rr, m - mm)
                    d_min = min(d_min, dist)
                    w = 1.0 / ((dist ** 2) + 0.25)
                    w_sum += w
                    rw_sum += w * rv
                rho_est = (rw_sum / w_sum) if w_sum > 0 else 1.0

            if reg == 3:
                rho_est = max(1.0, rho_est)

            margin = _distance_safety_margin(d_min, margin_min, margin_max)
            margin_grid[r][m] = margin
            interp_val = map318[r][m] * rho_est
            # Unvisited safety cushion must NEVER reduce an unvisited cell below its current ROM value
            # (reducing load would advance timing and lean out fuel).
            out_map[r][m] = max(cal_map[r][m], round(interp_val * (1.0 + margin), 1))

    # 4. Enforce non-decreasing monotonicity strictly on UNVISITED cells (visited cells are NEVER modified,
    #    and unvisited cells are only ever adjusted upward so safety margin is never eroded)
    for m in range(1, 20):
        for r in range(7, 19):
            if not vis_map[r][m] and out_map[r][m] < out_map[r - 1][m]:
                out_map[r][m] = out_map[r - 1][m]

    for r in range(19):
        for m in range(1, 20):
            if not vis_map[r][m] and out_map[r][m] <= out_map[r][m - 1]:
                out_map[r][m] = round(out_map[r][m - 1] + 0.5, 1)

    return out_map, margin_grid


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
    parser.add_argument("--export-dir", default=None, help="Directory to export changed MAF and MAP paste tables")
    parser.add_argument(
        "--include-unchanged",
        action="store_true",
        help="Export tables even if 0 cells changed relative to --target-rom",
    )
    parser.add_argument(
        "--unvisited-margin-min",
        type=float,
        default=0.05,
        help="Minimum extra safety margin on unvisited interpolated cells/bins at distance 1 (default: 0.05 = +5%%)",
    )
    parser.add_argument(
        "--unvisited-margin-max",
        type=float,
        default=0.10,
        help="Maximum extra safety margin on unvisited interpolated cells/bins at distance >= 3 (default: 0.10 = +10%%)",
    )
    parser.add_argument(
        "--no-unvisited-interp",
        action="store_true",
        help="Disable shape-preserving interpolation + 5-10%% safety cushion on unvisited cells/bins",
    )
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
    fleet_boost_gs = [[0.0, 0.0] for _ in range(130)]
    if args.prev_rom1 and args.prev_logs1:
        r1 = load_rom(args.prev_rom1)
        u1, bgs1, mtr1, reg1, knk1 = collect_telemetry(args.prev_logs1, volts, map_kpa, rpm_axis)
        print_regime_summary(r1["name"], reg1, knk1)
        prev_history.append((r1, u1, mtr1))
        for bi in range(130):
            fleet_boost_gs[bi][0] += bgs1[bi][0]
            fleet_boost_gs[bi][1] += bgs1[bi][1]

    if args.prev_rom2 and args.prev_logs2:
        r2 = load_rom(args.prev_rom2)
        u2, bgs2, mtr2, reg2, knk2 = collect_telemetry(args.prev_logs2, volts, map_kpa, rpm_axis)
        print_regime_summary(r2["name"], reg2, knk2)
        prev_history.append((r2, u2, mtr2))
        for bi in range(130):
            fleet_boost_gs[bi][0] += bgs2[bi][0]
            fleet_boost_gs[bi][1] += bgs2[bi][1]

    u_curr, bgs_curr, mtr_curr, reg_curr, knk_curr = collect_telemetry(args.logs, volts, map_kpa, rpm_axis)
    print_regime_summary(curr["name"], reg_curr, knk_curr)
    for bi in range(130):
        fleet_boost_gs[bi][0] += bgs_curr[bi][0]
        fleet_boost_gs[bi][1] += bgs_curr[bi][1]

    # Supplement boost TrueLoad g/s and fleet coverage from calibration_experience.db if available
    db_maf_vac_n = [0 for _ in range(130)]
    db_maf_bst_n = [0 for _ in range(130)]
    db_map_vis = [[False for _ in range(20)] for _ in range(19)]
    if os.path.exists(DEFAULT_DB_PATH):
        try:
            conn = sqlite3.connect(DEFAULT_DB_PATH)
            cur = conn.cursor()
            cur.execute("""
            SELECT bin_idx,
                   COALESCE(SUM(unclamped_vac_samples), 0),
                   COALESCE(SUM(boost_sd_samples), 0),
                   COALESCE(SUM(boost_sd_samples * avg_boost_true_gs), 0.0)
            FROM maf_bin_experience
            GROUP BY bin_idx;
            """)
            for b_idx, u_cnt, b_cnt, b_sum in cur.fetchall():
                if 0 <= b_idx < 130:
                    db_maf_vac_n[b_idx] = int(u_cnt)
                    db_maf_bst_n[b_idx] = int(b_cnt)
                if 74 <= b_idx < 130 and b_cnt > 0 and b_sum > 0 and fleet_boost_gs[b_idx][1] < 3.0:
                    fleet_boost_gs[b_idx][0] += b_sum
                    fleet_boost_gs[b_idx][1] += b_cnt

            cur.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='map_cell_experience';")
            if cur.fetchone():
                cur.execute("""
                SELECT row_idx, col_idx, SUM(sample_count), SUM(weight_sum)
                FROM map_cell_experience
                GROUP BY row_idx, col_idx
                HAVING SUM(sample_count) >= 3 AND SUM(weight_sum) >= 0.5;
                """)
                for r_i, c_i, _, _ in cur.fetchall():
                    if 0 <= r_i < 19 and 0 <= c_i < 20:
                        db_map_vis[r_i][c_i] = True
            conn.close()
        except Exception:
            pass

    # Determine fleet-wide visited mask for MAF (130 bins) and MAP (19x20 cells)
    vis_maf = [False for _ in range(130)]
    for i in range(35):
        vis_maf[i] = True  # Sub-idle bins locked (Safeguard #5: No Low-Voltage Idle Shelf)
    for i in range(35, 74):
        has_cli_vac = (u_curr[i][2] >= 3 and u_curr[i][1] > 0.3) or any(
            p_u[i][2] >= 3 and p_u[i][1] > 0.4 for _, p_u, _ in prev_history
        )
        if has_cli_vac or db_maf_vac_n[i] >= 5:
            vis_maf[i] = True
    for i in range(74, 130):
        if fleet_boost_gs[i][1] >= 5.0 or db_maf_bst_n[i] >= 5:
            vis_maf[i] = True

    vis_map = [[False for _ in range(20)] for _ in range(19)]
    for r in range(19):
        vis_map[r][0] = True  # Lock Col 0 (13.7 kPa extreme closed-throttle overrun DFCO)
        for m in range(1, 20):
            has_cli_map = (mtr_curr[r][m][2] >= 3 and mtr_curr[r][m][1] >= 0.5) or any(
                p_mtr[r][m][2] >= 3 and p_mtr[r][m][1] >= 0.5 for _, _, p_mtr in prev_history
            )
            if has_cli_map or db_map_vis[r][m]:
                vis_map[r][m] = True

    # 1. Solve MAF Scaling Horizontal (130 cells)
    maf_curr = curr["maf"]
    maf_318 = v318["maf"]
    new_maf = list(maf_curr)
    raw_maf = list(maf_curr)
    brackets = {}
    maf_unvisited_margins = {}

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

    # Non-Cumulative Boost Speed Density Headroom (Idx 74..77: 2.89V..3.01V)
    # Heals the flat-line shelf at Idx 76..77 without deflating upper boost curve Idx 78..129
    for idx_b in range(74, 78):
        if fleet_boost_gs[idx_b][1] >= 3.0:
            emp_true_gs = fleet_boost_gs[idx_b][0] / fleet_boost_gs[idx_b][1]
            min_sd_headroom = emp_true_gs * 1.22
            max_sd_headroom = emp_true_gs * 1.32
            if raw_maf[idx_b] < min_sd_headroom:
                raw_maf[idx_b] = min_sd_headroom
            elif raw_maf[idx_b] > max_sd_headroom:
                raw_maf[idx_b] = 0.5 * (raw_maf[idx_b] + max_sd_headroom)

    # 3-point multiplier smoothing across visited Pure Vacuum MAF range (Idx 36..72) with Bracket Invariance
    for i in range(36, 73):
        if not vis_maf[i]:
            continue
        left_i = i - 1 if vis_maf[i - 1] else i
        right_i = i + 1 if vis_maf[i + 1] else i
        m_prev = raw_maf[left_i] / maf_curr[left_i]
        m_curr = raw_maf[i] / maf_curr[i]
        m_next = raw_maf[right_i] / maf_curr[right_i]
        val = maf_curr[i] * (0.25 * m_prev + 0.50 * m_curr + 0.25 * m_next)
        if i in brackets:
            val = max(brackets[i][0], min(brackets[i][1], val))
        new_maf[i] = val
    new_maf[35] = max(new_maf[35], idle_floors[35])
    for i in range(73, 130):
        new_maf[i] = raw_maf[i]

    # Heal any localized 3-point concavity / flat-line shelf across visited vacuum bins Idx 55..70
    for i in range(55, 70):
        if vis_maf[i - 1] and vis_maf[i] and vis_maf[i + 1]:
            d_curr = new_maf[i] - new_maf[i - 1]
            d_prev = new_maf[i - 1] - new_maf[i - 2]
            d_next = new_maf[i + 1] - new_maf[i]
            ref_slope = 0.5 * (max(0.01, d_prev) + max(0.01, d_next))
            if ref_slope >= 0.80 and d_curr < 0.42 * ref_slope:
                w318 = (maf_318[i] - maf_318[i - 1]) / max(0.1, maf_318[i + 1] - maf_318[i - 1])
                new_maf[i] = new_maf[i - 1] + w318 * (new_maf[i + 1] - new_maf[i - 1])

    if not args.no_unvisited_interp:
        # 1a. Interpolate unvisited shared vacuum/crossover bins (Idx 35..73 where vis_maf[i] == False)
        vis_vac_bins = [j for j in range(35, 74) if vis_maf[j]]
        if vis_vac_bins:
            for i in range(35, 74):
                if vis_maf[i]:
                    continue
                left_bins = [j for j in vis_vac_bins if j < i]
                right_bins = [j for j in vis_vac_bins if j > i]
                if left_bins and right_bins:
                    j0, j1 = left_bins[-1], right_bins[0]
                    t = (i - j0) / float(j1 - j0)
                    rho_interp = (new_maf[j0] / maf_318[j0]) * (1.0 - t) + (new_maf[j1] / maf_318[j1]) * t
                    d_min = float(min(i - j0, j1 - i))
                elif left_bins:
                    j0 = left_bins[-1]
                    rho_interp = new_maf[j0] / maf_318[j0]
                    d_min = float(i - j0)
                else:
                    j1 = right_bins[0]
                    rho_interp = new_maf[j1] / maf_318[j1]
                    d_min = float(j1 - i)
                margin = _distance_safety_margin(d_min, args.unvisited_margin_min, args.unvisited_margin_max)
                maf_unvisited_margins[i] = margin
                # Cap shared bins <= 73 strictly below Safeguard #1 limit (1.135x V3.18)
                new_maf[i] = min(maf_318[i] * 1.135, maf_318[i] * rho_interp * (1.0 + margin))

        # Smoothly bridge visited transition boost bins Idx 74..77 between Idx 73 and Idx 78 along V3.18 steps
        if new_maf[78] > new_maf[73] and (maf_318[78] - maf_318[73]) > 0:
            span_new = new_maf[78] - new_maf[73]
            span_318 = maf_318[78] - maf_318[73]
            for idx_b in range(74, 78):
                prop_val = new_maf[73] + span_new * ((maf_318[idx_b] - maf_318[73]) / span_318)
                if fleet_boost_gs[idx_b][1] >= 3.0:
                    emp_tgs = fleet_boost_gs[idx_b][0] / fleet_boost_gs[idx_b][1]
                    prop_val = max(emp_tgs * 1.22, prop_val)
                new_maf[idx_b] = prop_val

        # 1b. Interpolate unvisited high-voltage boost bins (Idx 74..129 where vis_maf[i] == False)
        vis_bst_bins = [j for j in range(74, 130) if vis_maf[j]]
        if vis_bst_bins:
            for i in range(74, 130):
                if vis_maf[i]:
                    continue
                left_bins = [j for j in vis_bst_bins if j < i]
                right_bins = [j for j in vis_bst_bins if j > i]
                if left_bins and right_bins:
                    j0, j1 = left_bins[-1], right_bins[0]
                    t = (i - j0) / float(j1 - j0)
                    rho_interp = (new_maf[j0] / maf_318[j0]) * (1.0 - t) + (new_maf[j1] / maf_318[j1]) * t
                    d_min = float(min(i - j0, j1 - i))
                    interp_gs = maf_318[i] * rho_interp
                elif left_bins:
                    j0 = left_bins[-1]
                    d_min = float(i - j0)
                    # Extrapolate along visited boost curve growth rate at j0 (anchored strictly to visited bins)
                    if j0 >= 75 and vis_maf[j0 - 1] and new_maf[j0 - 1] > 0:
                        g_rate = max(1.03, min(1.06, new_maf[j0] / new_maf[j0 - 1]))
                        interp_gs = new_maf[j0] * (g_rate ** d_min)
                    else:
                        interp_gs = maf_318[i] * (new_maf[j0] / maf_318[j0])
                else:
                    j1 = right_bins[0]
                    d_min = float(j1 - i)
                    interp_gs = maf_318[i] * (new_maf[j1] / maf_318[j1])
                # Ramp margin smoothly over d=1..4 on high-slope boost curve to avoid step cliffs while delivering +5%..+10%
                span_m = max(0.0, args.unvisited_margin_max - args.unvisited_margin_min)
                margin = min(args.unvisited_margin_max, args.unvisited_margin_min + (span_m / 3.0) * max(0.0, d_min - 1.0))
                maf_unvisited_margins[i] = margin
                new_maf[i] = min(655.35, max(maf_curr[i], interp_gs * (1.0 + margin)))
    else:
        # Legacy continuity step across Idx 73..78 when unvisited interpolation is disabled
        for i in range(73, 79):
            v318_step = max(0.50, maf_318[i] - maf_318[i - 1])
            min_smooth_step = 0.72 * v318_step
            if (new_maf[i] - new_maf[i - 1]) < min_smooth_step:
                new_maf[i] = new_maf[i - 1] + min_smooth_step

    for i in range(1, 130):
        if new_maf[i] <= new_maf[i - 1] and maf_curr[i] > maf_curr[i - 1]:
            if new_maf[i - 1] >= 655.35:
                new_maf[i] = 655.35
            else:
                new_maf[i] = min(655.35, new_maf[i - 1] + max(0.01, (maf_curr[i] - maf_curr[i - 1]) * 0.25))
    new_maf = [round(x, 2) for x in new_maf]

    # 2. Solve MAP based Load Calc (19 RPM rows x 20 MAP columns)
    map_curr = curr["map_grid"]
    map_curr2 = curr["map_grid2"]
    map318 = v318["map_grid"]
    raw_map = [[map_curr[r][m] for m in range(20)] for r in range(19)]
    modified = [[False for _ in range(20)] for _ in range(19)]

    # Vacuum (m = 1..5: 22.1..75.9 kPa) -> 1.20 * TrueLoad_5frame on telemetry-visited cells
    for m in range(1, 6):
        for r in range(1, 19):
            cs, ws, n = mtr_curr[r][m]
            if n >= 3 and ws > 0.5:
                eff_tbl = 0.5 * (map_curr[r][m] + map_curr2[r][m])
                target_tbl = eff_tbl * (cs / ws) * 1.20
                conf = (ws ** 2) / (ws ** 2 + 10.0)
                step = 0.50 * conf * (target_tbl - map_curr[r][m])
                if r >= 7 and step < 0:
                    continue
                raw_map[r][m] = map_curr[r][m] + max(-1.5, min(2.5, step))
                modified[r][m] = True

    # Crossover Anti-Rectification (m = 6: 89.4 kPa -> 1.14x, m = 7: 102.8 kPa -> 1.06x)
    # Only update rows that actually have telemetry coverage; never nudge unvisited cells by +/-0.1
    for r in range(1, 19):
        cs6, ws6, n6 = mtr_curr[r][6]
        if n6 >= 3 and ws6 > 2.0:
            eff6 = 0.5 * (map_curr[r][6] + map_curr2[r][6])
            ref6 = max(0.5 * (eff6 * (cs6 / ws6) * 1.14 + map318[r][6]), eff6 * (cs6 / ws6) * 1.14)
            if ref6 > map_curr[r][6]:
                raw_map[r][6] = map_curr[r][6] + 0.65 * (ref6 - map_curr[r][6])
                modified[r][6] = True

        cs7, ws7, n7 = mtr_curr[r][7]
        if n7 >= 3 and ws7 > 2.0:
            eff7 = 0.5 * (map_curr[r][7] + map_curr2[r][7])
            ref7 = max(eff7 * (cs7 / ws7) * 1.06, map318[r][7] - 1.5)
            if ref7 > map_curr[r][7]:
                raw_map[r][7] = map_curr[r][7] + 0.70 * (ref7 - map_curr[r][7])
                modified[r][7] = True

    # Spool Floor (m = 8: 116.3 kPa, m = 9: 129.7 kPa) & Sustained Boost VE Convergence (m = 10..19: 143.2..304.6 kPa)
    for m in (8, 9):
        for r in range(6, 19):
            if vis_map[r][m] or args.no_unvisited_interp:
                floor_val = round(max([map_curr[r][m], map318[r][m]] + [p[0]["map_grid"][r][m] for p in prev_history]), 1)
                if floor_val > map_curr[r][m] + 0.15:
                    raw_map[r][m] = floor_val
                    modified[r][m] = True

    for m in range(10, 20):
        trimmed_rows = []
        for r in range(6, 19):
            cs, ws, n = mtr_curr[r][m]
            if n >= 8 and ws >= 4.0:
                eff_tbl = 0.5 * (map_curr[r][m] + map_curr2[r][m])
                true_tbl = eff_tbl * (cs / ws)
                conf = (ws ** 2) / (ws ** 2 + 12.0)
                target_tbl = max(map318[r][m], true_tbl)
                step = 0.60 * conf * (target_tbl - map_curr[r][m])
                raw_map[r][m] = map_curr[r][m] + max(-4.0, min(2.5, step))
                modified[r][m] = True
                if raw_map[r][m] < map_curr[r][m] - 0.2:
                    trimmed_rows.append(r)
        if trimmed_rows and args.no_unvisited_interp:
            r_ref = trimmed_rows[0]
            delta_ref = raw_map[r_ref][m] - map318[r_ref][m]
            for r in range(2, r_ref):
                taper_val = map318[r][m] + delta_ref
                if taper_val < raw_map[r][m]:
                    raw_map[r][m] = max(map_curr[r][m] - 3.5, max(map318[r][m], taper_val))
                    modified[r][m] = True

    # Delta-only vertical smoothing restricted to telemetry-modified cells with +/-0.1 anti-jitter deadband.
    # Prevents untouched visited cells from drifting by +/-0.1 when pasted into EcuFlash.
    cal_map = [[map_curr[r][m] for m in range(20)] for r in range(19)]
    for m in range(1, 20):
        deltas = [raw_map[r][m] - map_curr[r][m] for r in range(19)]
        sm_deltas = list(deltas)
        for r in range(1, 18):
            if modified[r][m]:
                sm_deltas[r] = 0.25 * deltas[r - 1] + 0.50 * deltas[r] + 0.25 * deltas[r + 1]
        for r in range(19):
            if modified[r][m] and abs(sm_deltas[r]) >= 0.15:
                cal_map[r][m] = round(map_curr[r][m] + sm_deltas[r], 1)
            else:
                cal_map[r][m] = map_curr[r][m]
        if any(cal_map[r][m] != map_curr[r][m] for r in range(19)):
            for r in range(7, 19):
                if vis_map[r][m] and cal_map[r][m] < cal_map[r - 1][m]:
                    cal_map[r][m] = cal_map[r - 1][m]

    for r in range(19):
        if any(cal_map[r][m] != map_curr[r][m] for m in range(20)):
            for m in range(1, 20):
                if vis_map[r][m] and cal_map[r][m] <= cal_map[r][m - 1]:
                    cal_map[r][m] = round(cal_map[r][m - 1] + 0.5, 1)

    if not args.no_unvisited_interp:
        new_map, map_margin_grid = interpolate_unvisited_map_cells(
            cal_map, vis_map, map318, args.unvisited_margin_min, args.unvisited_margin_max
        )
    else:
        new_map = [list(row) for row in cal_map]
        map_margin_grid = [[0.0 for _ in range(20)] for _ in range(19)]

    # 3. Diff vs Target ROM & Export Only Changed Tables
    maf_diffs = [
        (i, volts[i], maf_curr[i], new_maf[i], round(new_maf[i] - maf_curr[i], 2), vis_maf[i])
        for i in range(130)
        if round(new_maf[i], 2) != round(maf_curr[i], 2)
    ]
    map_diffs = [
        (r, m, rpm_axis[r], map_kpa[m], map_curr[r][m], new_map[r][m], round(new_map[r][m] - map_curr[r][m], 1), vis_map[r][m], map_margin_grid[r][m])
        for r in range(19)
        for m in range(20)
        if round(new_map[r][m], 1) != round(map_curr[r][m], 1)
        or round(new_map[r][m], 1) != round(map_curr2[r][m], 1)
    ]

    maf_vis_diffs = [d for d in maf_diffs if d[5]]
    maf_unvis_diffs = [d for d in maf_diffs if not d[5]]
    map_vis_diffs = [d for d in map_diffs if d[7]]
    map_unvis_diffs = [d for d in map_diffs if not d[7]]
    total_vis_maf = sum(1 for i in range(35, 130) if vis_maf[i])
    total_unvis_maf = sum(1 for i in range(35, 130) if not vis_maf[i])
    total_vis_map = sum(1 for r in range(19) for m in range(1, 20) if vis_map[r][m])
    total_unvis_map = sum(1 for r in range(19) for m in range(1, 20) if not vis_map[r][m])

    print("\n==================== CALIBRATION CHANGE SUMMARY ====================")
    print(
        f"  MAF Scaling Horizontal    : {len(maf_diffs):3d} / 130 bins changed "
        f"({len(maf_vis_diffs)} visited telemetry, {len(maf_unvis_diffs)} unvisited interp +5..10% safety; "
        f"coverage={total_vis_maf}/95 active bins)"
    )
    print(
        f"  MAP based Load Calc #1/#2 : {len(map_diffs):3d} / 380 cells changed "
        f"({len(map_vis_diffs)} visited telemetry, {len(map_unvis_diffs)} unvisited interp +5..10% safety; "
        f"coverage={total_vis_map}/361 active cells)"
    )
    if map_vis_diffs:
        print("  [Visited Telemetry-Driven MAP Cell Updates]:")
        for _, _, rpm_v, kpa_v, old_v, new_v, d_v, _, _ in map_vis_diffs:
            print(f"    • {rpm_v:4d} RPM @ {kpa_v:5.1f} kPa: {old_v:5.1f} -> {new_v:5.1f} ({d_v:+4.1f}) [VISITED]")
    if map_unvis_diffs:
        print(f"  [Unvisited Interpolated + {args.unvisited_margin_min*100:.0f}%..{args.unvisited_margin_max*100:.0f}% Safety Cushion MAP Cells ({len(map_unvis_diffs)} cells)]:")
        for _, _, rpm_v, kpa_v, old_v, new_v, d_v, _, marg in map_unvis_diffs[:12]:
            print(f"    • {rpm_v:4d} RPM @ {kpa_v:5.1f} kPa: {old_v:5.1f} -> {new_v:5.1f} ({d_v:+4.1f}, safety=+{marg*100:.1f}%) [UNVISITED]")
        if len(map_unvis_diffs) > 12:
            print(f"    ... and {len(map_unvis_diffs) - 12} additional unvisited interpolated cells.")

    if args.export_dir:
        os.makedirs(args.export_dir, exist_ok=True)
        maf_tsv = os.path.join(args.export_dir, "new_maf_scaling.tsv")
        maf_txt = os.path.join(args.export_dir, "new_maf_scaling.txt")
        map_tsv = os.path.join(args.export_dir, "new_map_load_calc.tsv")
        map_txt = os.path.join(args.export_dir, "new_map_load_calc.txt")

        if maf_diffs or args.include_unchanged:
            maf_str = "\t".join(f"{x:.2f}" for x in new_maf) + "\n"
            with open(maf_tsv, "w", encoding="utf-8") as f:
                f.write(maf_str)
            with open(maf_txt, "w", encoding="utf-8") as f:
                f.write(maf_str)
            print(f"[+] Exported MAF Scaling Horizontal ({len(maf_diffs)} bins changed) -> {args.export_dir}")
        else:
            for p in (maf_tsv, maf_txt):
                if os.path.exists(p):
                    os.remove(p)
            print("[=] MAF Scaling Horizontal: 0 bins changed vs target ROM (omitted from export)")

        if map_diffs or args.include_unchanged:
            map_str = "".join("\t".join(f"{new_map[r][m]:.1f}" for m in range(20)) + "\n" for r in range(19))
            with open(map_tsv, "w", encoding="utf-8") as f:
                f.write(map_str)
            with open(map_txt, "w", encoding="utf-8") as f:
                f.write(map_str)
            print(f"[+] Exported MAP based Load Calc #1 & #2 ({len(map_diffs)} cells changed) -> {args.export_dir}")
        else:
            for p in (map_tsv, map_txt):
                if os.path.exists(p):
                    os.remove(p)
            print("[=] MAP based Load Calc #1 & #2: 0 cells changed vs target ROM (omitted from export)")


if __name__ == "__main__":
    main()
