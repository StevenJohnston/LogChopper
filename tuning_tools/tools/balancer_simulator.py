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
    if kpa <= 80.0:
        return 1.05
    elif kpa >= 120.0:
        return 0.95
    else:
        return 1.05 - 0.0025 * (kpa - 80.0)

def sigmoid(x):
    return 1.0 / (1.0 + math.exp(-max(-20.0, min(20.0, x))))

def simulate(rom_path, log_path, mode="classic", damping_factor=0.333):
    header_len = 328 if rom_path.lower().endswith(".srf") else 0
    with open(rom_path, "rb") as f:
        f.seek(header_len)
        d = f.read()

    # Load MAF Scaling
    raw_maf = struct.unpack(">130H", d[0x5757a:0x5757a+260])
    raw_v = struct.unpack(">130H", d[0x61fd0:0x61fd0+260])
    maf_table = [r / 100.0 for r in raw_maf]
    volts = [round(r * 5.0 / 1023.0, 3) for r in raw_v]

    # Load MAP Table #1 (0x608AE, 20 MAP x 19 RPM = 380)
    m_elems, r_elems = 20, 19
    tot_map = m_elems * r_elems
    raw_map = struct.unpack(f">{tot_map}H", d[0x608ae:0x608ae+tot_map*2])
    map_table = [(r * 10.0 / 512.0) * 10.0 / 32.0 for r in raw_map]
    m_axis_raw = struct.unpack(f">{m_elems}H", d[0x6344a:0x6344a+m_elems*2])
    map_kpa = [round(((r * 2556.0 / 3800.0) + 0.5) / 2.0, 1) for r in m_axis_raw]
    r_axis_raw = struct.unpack(f">{r_elems}H", d[0x6341e:0x6341e+r_elems*2])
    rpm_axis = [round(r * 1000.0 / 256.0) for r in r_axis_raw]

    with open(log_path, "r", encoding="latin1") as f:
        reader = list(csv.DictReader(f))

    maf_corrs = [[] for _ in range(130)]
    map_corrs = [[] for _ in range(tot_map)]

    for r in reader:
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

            if ipw > 0 and afr > 0 and ect > 75.0 and (app > 10.0 or speed == 0) and mafc > 0 and mapc > 0:
                stft = float(r.get("STFT", 0))
                ltft = float(r.get("CurrentLTFT", 0))
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
                    # The wideband measures fuel delivered by active_load = min(MAFCalcs, MAPCalcs).
                    # Physical true engine load requirement: true_load = active_load * afr_err.
                    # Vacuum target: MAF = true_load, MAP = 1.05 * true_load (ceiling).
                    # Boost target:  MAP = true_load, MAF = true_load / 0.95 (headroom).
                    w = 1.0 if kpa <= 80.0 else (0.0 if kpa >= 120.0 else (120.0 - kpa) / 40.0)
                    active_load = mafc if mafc <= mapc else mapc
                    true_load = active_load * afr_err

                    maf_target = true_load * (w + (1.0 - w) / tgt_r)
                    map_target = true_load * (w * tgt_r + (1.0 - w))

                    c_maf = maf_target / mafc
                    c_map = map_target / mapc

                # Bin into MAF table
                v_idx = min(range(len(volts)), key=lambda i: abs(volts[i] - maf_v))
                if abs(volts[v_idx] - maf_v) <= 0.025:
                    maf_corrs[v_idx].append(c_maf)

                # Bin into MAP table
                k_idx = min(range(len(map_kpa)), key=lambda i: abs(map_kpa[i] - kpa))
                rp_idx = min(range(len(rpm_axis)), key=lambda i: abs(rpm_axis[i] - rpm))
                if abs(map_kpa[k_idx] - kpa) <= 5.0 and abs(rpm_axis[rp_idx] - rpm) <= 200:
                    map_cell_idx = k_idx * r_elems + rp_idx
                    map_corrs[map_cell_idx].append(c_map)

        except (ValueError, KeyError):
            pass

    print("=" * 80)
    print(f"             BALANCER ALGORITHM SIMULATION ({mode.upper()})")
    print("=" * 80)
    print(f"ROM: {os.path.basename(rom_path)}")
    print(f"Log: {os.path.basename(log_path)}")
    print(f"Algorithm Mode : {mode}")
    print(f"Damping Factor : {damping_factor:.3f}")
    print("-" * 80)

    # MAF Results
    maf_deltas = []
    for i in range(130):
        samples = maf_corrs[i]
        n_pts = len(samples)
        if n_pts > 5:
            avg_corr = sum(samples) / n_pts
            w = n_pts
            conf = (w ** 2) / (w ** 2 + 225.0)
            diff = 1.0 - avg_corr
            new_diff = 1.0 - conf * diff
            new_diff = max(0.85, min(1.15, new_diff))
            damped_corr = (new_diff - 1.0) * damping_factor + 1.0

            old_val = maf_table[i]
            new_val = old_val * damped_corr
            pct = (new_val - old_val) / old_val * 100
            maf_deltas.append((i, volts[i], old_val, new_val, damped_corr, pct, n_pts))

    print(f"\n[1] MAF Scaling Table: {len(maf_deltas)} / 130 cells modified")
    print("Idx | Voltage | Base (g/s) | Suggested (g/s) | Multiplier (C_MAF) | Change % | Samples")
    for d in maf_deltas[:12]:
        print(f"{d[0]:3d} | {d[1]:6.3f}V | {d[2]:10.2f} | {d[3]:15.2f} | {d[4]:18.4f} | {d[5]:+7.2f}% | {d[6]:7d}")
    if len(maf_deltas) > 12:
        print(f"  ... and {len(maf_deltas)-12} more cells")

    # MAP Results
    map_deltas = []
    for i in range(tot_map):
        samples = map_corrs[i]
        n_pts = len(samples)
        if n_pts > 5:
            avg_corr = sum(samples) / n_pts
            w = n_pts
            conf = (w ** 2) / (w ** 2 + 225.0)
            diff = 1.0 - avg_corr
            new_diff = 1.0 - conf * diff
            new_diff = max(0.85, min(1.15, new_diff))
            damped_corr = (new_diff - 1.0) * damping_factor + 1.0

            old_val = map_table[i]
            new_val = old_val * damped_corr
            pct = (new_val - old_val) / old_val * 100
            k_idx = i // r_elems
            rp_idx = i % r_elems
            map_deltas.append((i, map_kpa[k_idx], rpm_axis[rp_idx], old_val, new_val, damped_corr, pct, n_pts))

    print(f"\n[2] MAP based Load Calc #1 Table: {len(map_deltas)} / {tot_map} cells modified")
    print("Idx | MAP (kPa) | RPM   | Base Load% | Suggested Load% | Multiplier (C_MAP) | Change % | Samples")
    for d in map_deltas[:12]:
        print(f"{d[0]:3d} | {d[1]:8.1f} | {d[2]:5d} | {d[3]:9.2f}% | {d[4]:14.2f}% | {d[5]:18.4f} | {d[6]:+7.2f}% | {d[7]:7d}")
    if len(map_deltas) > 12:
        print(f"  ... and {len(map_deltas)-12} more cells")
    print("=" * 80)

def main():
    parser = argparse.ArgumentParser(description="Simulate LogChopper MAF & MAP Balancer")
    parser.add_argument("rom", help="Path to ROM file (.srf/.bin)")
    parser.add_argument("log", help="Path to datalog CSV")
    parser.add_argument("--mode", choices=["classic", "physics_coupled"], default="physics_coupled",
                        help="Balancer algorithm mode (classic vs physics_coupled)")
    parser.add_argument("--damping", type=float, default=0.333, help="Damping gain (default 0.333)")
    args = parser.parse_args()

    simulate(args.rom, args.log, mode=args.mode, damping_factor=args.damping)

if __name__ == "__main__":
    main()
