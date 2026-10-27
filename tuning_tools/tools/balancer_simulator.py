#!/usr/bin/env python3
"""
balancer_simulator.py - Simulates and Compares MAF & MAP Balancer Algorithms

Simulates calibration updates on both MAF Scaling (2D) and MAP based Load Calc (3D):
  1. Classic Balancer (Dual Pull-Down / Knife-edge logic from MafMapBalancerGroup.tsx)
  2. Physics-Coupled Feed-Forward Balancer (Decoupled MAF-to-Fuel tracking + MAP projected ceiling)
"""

import argparse
import csv
import json
import math
import os
import struct
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TOOLKIT_DIR = os.path.dirname(SCRIPT_DIR)
REF_DIR = os.path.join(TOOLKIT_DIR, "references")

def target_ratio(kpa):
    """
    3-Tier Target Ratio Ramp (MAPCalcs / MAFCalcs):
      - <= 80 kPa (Vacuum / Idle / Cruise): 1.20 (absorbs GSC S2 cam scatter, MAF is master)
      - >= 120 kPa (Boost / WOT): 0.80 (pure Speed Density master, 25% MAF headroom)
      - 80 < kpa < 120: Linear ramp: 1.20 - 0.010 * (kpa - 80.0) [1.00 at 100 kPa]
    """
    if kpa <= 80.0:
        return 1.20
    elif kpa >= 120.0:
        return 0.80
    else:
        return 1.20 - 0.010 * (kpa - 80.0)

def sigmoid(x):
    return 1.0 / (1.0 + math.exp(-max(-20.0, min(20.0, x))))

def get_index_float(arr, val):
    if val <= arr[0]:
        return 0.0
    if val >= arr[-1]:
        return float(len(arr) - 1)
    for i in range(len(arr) - 1):
        if arr[i] <= val <= arr[i+1]:
            if arr[i+1] == arr[i]:
                return float(i)
            return i + (val - arr[i]) / (arr[i+1] - arr[i])
    return 0.0

def simulate(rom_path, log_paths, mode="physics_coupled", damping_factor=0.333,
             bilinear=True, paste_maf=False, paste_map=False, export_dir=None):
    if isinstance(log_paths, str):
        log_paths = [log_paths]

    header_len = 328 if rom_path.lower().endswith(".srf") else 0
    with open(rom_path, "rb") as f:
        f.seek(header_len)
        d = f.read()

    # Load MAF Scaling
    raw_maf = struct.unpack(">130H", d[0x5757a:0x5757a+260])
    raw_v = struct.unpack(">130H", d[0x61fd0:0x61fd0+260])
    maf_table = [r / 100.0 for r in raw_maf]
    volts = [round(r * 5.0 / 1023.0, 3) for r in raw_v]

    # Load MAP Table #2 (0x605AC) / #1 (0x608AE) (20 MAP x 19 RPM = 380)
    m_elems, r_elems = 20, 19
    tot_map = m_elems * r_elems
    raw_map = struct.unpack(f">{tot_map}H", d[0x605ac:0x605ac+tot_map*2])
    map_table = [(r * 10.0 / 512.0) * 10.0 / 32.0 for r in raw_map]
    m_axis_raw = struct.unpack(f">{m_elems}H", d[0x6344a:0x6344a+m_elems*2])
    map_kpa = [round(((r * 2556.0 / 3800.0) + 0.5) / 2.0, 1) for r in m_axis_raw]
    r_axis_raw = struct.unpack(f">{r_elems}H", d[0x6341e:0x6341e+r_elems*2])
    rpm_axis = [round(r * 1000.0 / 256.0) for r in r_axis_raw]

    # Accumulators: [weighted_corr_sum, total_weight, count]
    maf_accum = [[0.0, 0.0, 0] for _ in range(130)]
    map_accum = [[0.0, 0.0, 0] for _ in range(tot_map)]

    total_records = 0
    valid_records = 0

    for log_path in log_paths:
        with open(log_path, "r", encoding="latin1") as f:
            reader = list(csv.DictReader(f))

        for r in reader:
            total_records += 1
            try:
                ipw = float(r["IPW"])
                afr = float(r["AFR"])
                afrmap = float(r["AFRMAP"])
                ect = float(r["ECT"])
                app = float(r["APP"])
                speed = float(r["Speed"])
                mafc = float(r["MAFCalcs"])
                mapc = float(r["MAPCalcs"])
                kpa = float(r["MAP"])
                rpm = float(r["RPM"])
                maf_v = float(r["MAF"])

                if ipw > 0 and afr > 0 and (9.0 < afr < 20.0) and ect >= 75.0 and (app > 10.0 or speed == 0) and mafc > 0 and mapc > 0:
                    valid_records += 1
                    stft = float(r.get("STFT", 0) or 0)
                    ltft = float(r.get("CurrentLTFT", 0) or 0)
                    afr_err = (1.0 - (stft + ltft) / 100.0) * (afr / afrmap)
                    tgt_r = target_ratio(kpa)

                    if mode == "classic":
                        # Classic LogChopper logic (knife-edge dual pull-down)
                        if mafc <= mapc:
                            c_maf = afr_err
                        else:
                            c_maf = (mapc * afr_err) / (tgt_r * mafc)

                        if mapc < mafc:
                            c_map = afr_err
                        else:
                            c_map = (tgt_r * mafc * afr_err) / mapc

                    elif mode == "physics_coupled":
                        # Ground Truth Airflow Balancer:
                        active_load = min(mafc, mapc)
                        true_load = active_load * afr_err

                        if tgt_r >= 1.0:
                            # Vacuum to Crossover: MAF is fuel master, MAP is target ceiling
                            maf_target = true_load
                            map_target = tgt_r * true_load
                        else:
                            # Boost: MAP is Speed Density VE master, MAF is headroom
                            map_target = true_load
                            maf_target = true_load / tgt_r

                        c_maf = maf_target / mafc
                        c_map = map_target / mapc

                    if bilinear:
                        # LogChopper Bilinear Interpolation Weighting
                        fx = get_index_float(volts, maf_v)
                        i0 = int(math.floor(fx))
                        i1 = int(math.ceil(fx))
                        w1 = fx - i0
                        w0 = 1.0 - w1
                        if w0 > 0.01:
                            maf_accum[i0][0] += c_maf * w0
                            maf_accum[i0][1] += w0
                            maf_accum[i0][2] += 1
                        if i1 != i0 and i1 < 130 and w1 > 0.01:
                            maf_accum[i1][0] += c_maf * w1
                            maf_accum[i1][1] += w1
                            maf_accum[i1][2] += 1

                        kx = get_index_float(map_kpa, kpa)
                        rx = get_index_float(rpm_axis, rpm)
                        k0, k1 = int(math.floor(kx)), int(math.ceil(kx))
                        r0, r1 = int(math.floor(rx)), int(math.ceil(rx))
                        wk1, wr1 = kx - k0, rx - r0
                        wk0, wr0 = 1.0 - wk1, 1.0 - wr1
                        for ki, kw in [(k0, wk0), (k1, wk1)]:
                            for ri, rw in [(r0, wr0), (r1, wr1)]:
                                w = kw * rw
                                if w > 0.01 and ki < m_elems and ri < r_elems:
                                    ci = ki * r_elems + ri
                                    map_accum[ci][0] += c_map * w
                                    map_accum[ci][1] += w
                                    map_accum[ci][2] += 1
                    else:
                        # Nearest Neighbor Binning
                        v_idx = min(range(len(volts)), key=lambda i: abs(volts[i] - maf_v))
                        if abs(volts[v_idx] - maf_v) <= 0.035:
                            maf_accum[v_idx][0] += c_maf
                            maf_accum[v_idx][1] += 1.0
                            maf_accum[v_idx][2] += 1

                        k_idx = min(range(len(map_kpa)), key=lambda i: abs(map_kpa[i] - kpa))
                        rp_idx = min(range(len(rpm_axis)), key=lambda i: abs(rpm_axis[i] - rpm))
                        if abs(map_kpa[k_idx] - kpa) <= 8.0 and abs(rpm_axis[rp_idx] - rpm) <= 250:
                            ci = k_idx * r_elems + rp_idx
                            map_accum[ci][0] += c_map
                            map_accum[ci][1] += 1.0
                            map_accum[ci][2] += 1

            except (ValueError, KeyError):
                pass

    print("=" * 80)
    print(f"             BALANCER ALGORITHM SIMULATION ({mode.upper()})")
    print("=" * 80)
    print(f"ROM File       : {os.path.basename(rom_path)}")
    print(f"Log Files ({len(log_paths)}):")
    for lp in log_paths:
        print(f"  • {os.path.basename(lp)}")
    print(f"Total Records  : {total_records} (Valid Warm Steady Samples: {valid_records})")
    print(f"Algorithm Mode : {mode} (3-Tier Ramp: 80 kPa @ 1.20 -> 100 kPa @ 1.00 -> 120 kPa @ 0.80)")
    print(f"Interpolation  : {'Bilinear Weighting (LogChopper Standard)' if bilinear else 'Nearest Neighbor'}")
    print(f"Damping Factor : {damping_factor:.3f}")
    print("-" * 80)

    # MAF Results
    new_maf = list(maf_table)
    maf_deltas = []
    for i in range(130):
        corr_sum, w_sum, n_pts = maf_accum[i]
        if n_pts > 5 and w_sum > 0:
            avg_corr = corr_sum / w_sum
            conf = (w_sum ** 2) / (w_sum ** 2 + 225.0)
            diff = 1.0 - avg_corr
            new_diff = 1.0 - conf * diff
            new_diff = max(0.85, min(1.15, new_diff))
            damped_corr = (new_diff - 1.0) * damping_factor + 1.0
            new_maf[i] = maf_table[i] * damped_corr

    # Monotonicity enforcement (LogChopper combine logic)
    for i in range(1, 130):
        base_step = maf_table[i] - maf_table[i - 1]
        min_val = new_maf[i - 1] + (base_step * 0.25 if base_step > 0 else 0.01)
        if new_maf[i] < min_val:
            new_maf[i] = min_val
    new_maf = [round(x, 2) for x in new_maf]

    for i in range(130):
        if new_maf[i] != maf_table[i]:
            old_val = maf_table[i]
            val = new_maf[i]
            pct = (val - old_val) / old_val * 100.0
            damped_corr = val / old_val if old_val > 0 else 1.0
            maf_deltas.append((i, volts[i], old_val, val, damped_corr, pct, maf_accum[i][2]))

    print(f"\n[1] MAF Scaling Table: {len(maf_deltas)} / 130 cells modified")
    print("Idx | Voltage | Base (g/s) | Suggested (g/s) | Multiplier (C_MAF) | Change % | Samples")
    for d in maf_deltas[:15]:
        print(f"{d[0]:3d} | {d[1]:6.3f}V | {d[2]:10.2f} | {d[3]:15.2f} | {d[4]:18.4f} | {d[5]:+7.2f}% | {d[6]:7d}")
    if len(maf_deltas) > 15:
        print(f"  ... and {len(maf_deltas)-15} more cells")

    # MAP Results
    new_map = list(map_table)
    map_deltas = []
    for i in range(tot_map):
        corr_sum, w_sum, n_pts = map_accum[i]
        if n_pts > 5 and w_sum > 0:
            avg_corr = corr_sum / w_sum
            conf = (w_sum ** 2) / (w_sum ** 2 + 225.0)
            diff = 1.0 - avg_corr
            new_diff = 1.0 - conf * diff
            new_diff = max(0.85, min(1.15, new_diff))
            damped_corr = (new_diff - 1.0) * damping_factor + 1.0

            old_val = map_table[i]
            val = round(old_val * damped_corr, 1)
            new_map[i] = val
            pct = (val - old_val) / old_val * 100.0 if old_val > 0 else 0.0
            k_idx = i // r_elems
            rp_idx = i % r_elems
            map_deltas.append((i, map_kpa[k_idx], rpm_axis[rp_idx], old_val, val, damped_corr, pct, n_pts))

    print(f"\n[2] MAP based Load Calc Table: {len(map_deltas)} / {tot_map} cells modified")
    print("Idx | MAP (kPa) | RPM   | Base Load% | Suggested Load% | Multiplier (C_MAP) | Change % | Samples")
    for d in map_deltas[:15]:
        print(f"{d[0]:3d} | {d[1]:8.1f} | {d[2]:5d} | {d[3]:9.2f}% | {d[4]:14.2f}% | {d[5]:18.4f} | {d[6]:+7.2f}% | {d[7]:7d}")
    if len(map_deltas) > 15:
        print(f"  ... and {len(map_deltas)-15} more cells")
    print("=" * 80)

    # Output Paste Buffers if requested
    if paste_maf:
        print("\n" + "#" * 80)
        print("# ECUFLASH CLIPBOARD PASTE BUFFER: MAF SCALING HORIZONTAL (130 cells)")
        print("#" * 80)
        print("\t".join(f"{x:.2f}" for x in new_maf))

    if paste_map:
        print("\n" + "#" * 80)
        print("# ECUFLASH CLIPBOARD PASTE BUFFER: MAP BASED LOAD CALC (19 RPM Rows x 20 MAP Columns)")
        print("#" * 80)
        for r in range(19):
            row = [new_map[m * 19 + r] for m in range(20)]
            print("\t".join(f"{x:.1f}" for x in row))

    if export_dir:
        os.makedirs(export_dir, exist_ok=True)
        # 1. MAF exports
        maf_txt_p = os.path.join(export_dir, "new_maf_scaling_horizontal.txt")
        with open(maf_txt_p, "w") as f:
            f.write("\t".join(f"{x:.2f}" for x in new_maf) + "\n")

        maf_tsv_p = os.path.join(export_dir, "new_maf_scaling_horizontal.tsv")
        with open(maf_tsv_p, "w") as f:
            f.write("Idx\tVoltage\tAirflow_gps\n")
            for i, (v, val) in enumerate(zip(volts, new_maf)):
                f.write(f"{i}\t{v:.3f}\t{val:.2f}\n")

        # 2. MAP exports
        map_txt_p = os.path.join(export_dir, "new_map_based_load_calc.txt")
        with open(map_txt_p, "w") as f:
            for r in range(19):
                row = [new_map[m * 19 + r] for m in range(20)]
                f.write("\t".join(f"{x:.1f}" for x in row) + "\n")

        map_tsv_p = os.path.join(export_dir, "new_map_based_load_calc.tsv")
        with open(map_tsv_p, "w") as f:
            f.write("RPM\t" + "\t".join(f"{m:.1f}" for m in map_kpa) + "\n")
            for r in range(19):
                row = [new_map[m * 19 + r] for m in range(20)]
                f.write(f"{rpm_axis[r]}\t" + "\t".join(f"{x:.1f}" for x in row) + "\n")

        print(f"\n[+] Successfully exported updated tables to: {export_dir}")

    return new_maf, new_map

def main():
    parser = argparse.ArgumentParser(description="Simulate LogChopper MAF & MAP Balancer with 80->120% Crossover")
    parser.add_argument("rom", help="Path to ROM file (.srf/.bin)")
    parser.add_argument("logs", nargs="+", help="Path to datalog CSV(s)")
    parser.add_argument("--mode", choices=["classic", "physics_coupled"], default="physics_coupled",
                        help="Balancer algorithm mode (classic vs physics_coupled)")
    parser.add_argument("--damping", type=float, default=0.333, help="Damping gain (default 0.333)")
    parser.add_argument("--no-bilinear", action="store_true", help="Disable bilinear interpolation weighting")
    parser.add_argument("--paste-maf", action="store_true", help="Print EcuFlash clipboard paste buffer for MAF Scaling")
    parser.add_argument("--paste-map", action="store_true", help="Print EcuFlash clipboard paste buffer for MAP based Load Calc")
    parser.add_argument("--paste-all", action="store_true", help="Print all EcuFlash paste buffers")
    parser.add_argument("--export-dir", default=None, help="Directory to export .txt and .tsv table files")
    args = parser.parse_args()

    paste_maf = args.paste_maf or args.paste_all
    paste_map = args.paste_map or args.paste_all

    simulate(args.rom, args.logs, mode=args.mode, damping_factor=args.damping,
             bilinear=not args.no_bilinear, paste_maf=paste_maf, paste_map=paste_map,
             export_dir=args.export_dir)

if __name__ == "__main__":
    main()
