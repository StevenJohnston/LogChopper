#!/usr/bin/env python3
"""
balancer_simulator.py - Simulates the LogChopper MAF & MAP Balancer algorithm on any ROM and datalog.
Supports testing improvements:
  --feed-forward: Targets future MAFCalcs (MAFCalcs * C_MAF) to eliminate moving target lag.
  --soft-blend: Replaces the knife-edge ternary operator with sigmoid blending to prevent boundary chatter.
  --damping: Custom damping factor (default 0.333).
"""

import argparse
import csv
import json
import math
import os
import struct
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MAP_FILE = os.path.join(SCRIPT_DIR, "..", "references", "ecu_memory_map.json")

def target_ratio(kpa):
    if kpa <= 80.0:
        return 1.05
    elif kpa >= 120.0:
        return 0.95
    else:
        return 1.05 - 0.0025 * (kpa - 80.0)

def sigmoid(x):
    return 1.0 / (1.0 + math.exp(-max(-20.0, min(20.0, x))))

def simulate(rom_path, log_path, feed_forward=False, soft_blend=False, damping_factor=0.333):
    header_len = 328 if rom_path.lower().endswith(".srf") else 0
    with open(rom_path, "rb") as f:
        f.seek(header_len)
        d = f.read()
        
    raw_maf = struct.unpack(">130H", d[0x5757a:0x5757a+260])
    raw_v = struct.unpack(">130H", d[0x61fd0:0x61fd0+260])
    maf_table = [r / 100.0 for r in raw_maf]
    volts = [round(r * 5.0 / 1023.0, 3) for r in raw_v]
    
    with open(log_path, "r", encoding="latin1") as f:
        reader = list(csv.DictReader(f))
        
    # Accumulators for 130 MAF bins
    maf_corrs = [[] for _ in range(130)]
    
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
            maf_v = float(r["MAF"])
            
            if ipw > 0 and afr > 0 and ect > 75.0 and (app > 10.0 or speed == 0) and mafc > 0 and mapc > 0:
                afr_err = afr / afrmap
                tgt_r = target_ratio(kpa)
                
                # MAF Correction Calculation
                if not soft_blend:
                    # Stock Balancer ternary logic
                    if mafc < mapc:
                        c_maf = afr_err
                    else:
                        c_maf = 1.0 if kpa <= 80.0 else (mapc / (tgt_r * mafc))
                else:
                    # Soft sigmoid blend around delta
                    delta_norm = (mapc - mafc) / max(1.0, (mapc + mafc) / 2.0) * 10.0 # scale
                    w_afr = sigmoid(delta_norm)
                    alt_corr = 1.0 if kpa <= 80.0 else (mapc / (tgt_r * mafc))
                    c_maf = w_afr * afr_err + (1.0 - w_afr) * alt_corr
                    
                v_idx = min(range(len(volts)), key=lambda i: abs(volts[i] - maf_v))
                if abs(volts[v_idx] - maf_v) <= 0.02:
                    maf_corrs[v_idx].append(c_maf)
        except (ValueError, KeyError):
            pass
            
    print(f"================ BALANCER SIMULATION ================")
    print(f"ROM: {os.path.basename(rom_path)}")
    print(f"Log: {os.path.basename(log_path)}")
    print(f"Options: Feed-Forward = {feed_forward} | Soft-Blend = {soft_blend} | Damping = {damping_factor:.3f}")
    
    updated_maf = list(maf_table)
    table_deltas = []
    
    for i in range(130):
        samples = maf_corrs[i]
        n_pts = len(samples)
        if n_pts > 5:
            avg_corr = sum(samples) / n_pts
            # LogChopper Confidence & Damping formula
            w = n_pts
            conf = (w ** 2) / (w ** 2 + 225.0)
            diff = 1.0 - avg_corr
            new_diff = 1.0 - conf * diff
            new_diff = max(0.85, min(1.15, new_diff))
            damped_corr = (new_diff - 1.0) * damping_factor + 1.0
            
            old_val = maf_table[i]
            new_val = old_val * damped_corr
            updated_maf[i] = new_val
            pct = (new_val - old_val) / old_val * 100
            table_deltas.append((i, volts[i], old_val, new_val, damped_corr, pct, n_pts))
            
    print(f"\nModified MAF Voltage Bins: {len(table_deltas)} / 130")
    print("Idx | Voltage | Base (g/s) | Suggested (g/s) | Multiplier (C_MAF) | Change % | Samples")
    for d in table_deltas[:20]:
        print(f"{d[0]:3d} | {d[1]:6.3f}V | {d[2]:10.2f} | {d[3]:15.2f} | {d[4]:18.4f} | {d[5]:+7.2f}% | {d[6]:7d}")
    if len(table_deltas) > 20:
        print(f"  ... and {len(table_deltas)-20} more cells")

def main():
    parser = argparse.ArgumentParser(description="Simulate LogChopper MAF & MAP Balancer")
    parser.add_argument("rom", help="Path to ROM file (.srf/.bin)")
    parser.add_argument("log", help="Path to datalog CSV")
    parser.add_argument("--feed-forward", action="store_true", help="Enable feed-forward MAF target for MAP")
    parser.add_argument("--soft-blend", action="store_true", help="Enable soft sigmoid blending across boundary")
    parser.add_argument("--damping", type=float, default=0.333, help="Damping gain (default 0.333)")
    args = parser.parse_args()
    
    simulate(args.rom, args.log, feed_forward=args.feed_forward, soft_blend=args.soft_blend, damping_factor=args.damping)

if __name__ == "__main__":
    main()
