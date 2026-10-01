#!/usr/bin/env python3
"""
load_envelope_analyzer.py - Analyzes EvoScan datalogs (with RAX Fast Logging)
to inspect the ECU's physical Load Clamping & Blending Envelope.

Based on decompiled routine 0x04DC64 (load_clamp_or_blend):
    ChosenCalc = clamp(MAFCalcs, min(MAPCalcs, IMAPCalcs), max(MAPCalcs, IMAPCalcs))

Diagnoses whether the engine is running on:
  1. Pure MAF (Within Envelope: ChosenCalc == MAFCalcs)
  2. Clamped to MAPCalcs (MAP Upper or Lower Boundary reached)
  3. Clamped to IMAPCalcs (Transient throttle interpolation boundary reached)
"""

import argparse
import csv
import math
import os
import sys

def analyze_load_envelope(log_path, ect_min=70.0, verbose=False):
    if not os.path.exists(log_path):
        print(f"Error: Log file not found at {log_path}", file=sys.stderr)
        return False

    with open(log_path, "r", encoding="latin1") as f:
        reader = list(csv.DictReader(f))

    if not reader:
        print("Error: Empty log file.", file=sys.stderr)
        return False

    required = ["MAFCalcs", "MAPCalcs", "IMAPCalcs", "ChosenCalc"]
    missing = [c for c in required if c not in reader[0]]
    if missing:
        print(f"Error: Log file is missing RAX load channels: {missing}", file=sys.stderr)
        print("Note: The log must have RAX Fast Logging Packet H (MAFCalcs, MAPCalcs, IMAPCalcs, ChosenCalc).", file=sys.stderr)
        return False

    has_rpm = "RPM" in reader[0]
    has_map = "MAP" in reader[0]
    has_ect = "ECT" in reader[0]
    has_tps = "TPS" in reader[0]

    total_samples = 0
    filtered_cold = 0
    unclamped_maf = 0
    clamped_map_high = 0 # MAF > MAP (clamped down)
    clamped_map_low = 0  # MAF < MAP (clamped up)
    clamped_imap = 0
    mismatch = 0

    clamp_deltas = [] # abs(MAF - MAP) when clamped
    
    # 2D Grid breakdown: RPM (1000..7500 in 500 RPM bins) x MAP (20..260 kPa in 30 kPa bins)
    rpm_bins = list(range(1000, 7500, 500))
    map_bins = list(range(30, 270, 30))
    grid_total = {}
    grid_clamped = {}

    for r in reader:
        try:
            mafc = float(r["MAFCalcs"])
            mapc = float(r["MAPCalcs"])
            imapc = float(r["IMAPCalcs"])
            chosen = float(r["ChosenCalc"])
            ect = float(r["ECT"]) if has_ect else 85.0
            rpm = float(r["RPM"]) if has_rpm else 0.0
            kpa = float(r["MAP"]) if has_map else 100.0

            if mafc <= 0 and mapc <= 0:
                continue

            if ect < ect_min:
                filtered_cold += 1
                continue

            total_samples += 1

            low = min(mapc, imapc)
            high = max(mapc, imapc)
            pred = max(low, min(high, mafc))

            # Binning
            r_bin = min(rpm_bins, key=lambda b: abs(b - rpm)) if rpm > 800 else 1000
            m_bin = min(map_bins, key=lambda b: abs(b - kpa))
            cell_key = (r_bin, m_bin)
            grid_total[cell_key] = grid_total.get(cell_key, 0) + 1

            if abs(chosen - pred) < 0.2:
                if abs(chosen - mafc) < 0.2:
                    unclamped_maf += 1
                elif abs(chosen - mapc) < 0.2:
                    if mafc > mapc:
                        clamped_map_high += 1
                    else:
                        clamped_map_low += 1
                    clamp_deltas.append(abs(mafc - mapc))
                    grid_clamped[cell_key] = grid_clamped.get(cell_key, 0) + 1
                else:
                    clamped_imap += 1
                    clamp_deltas.append(abs(mafc - imapc))
                    grid_clamped[cell_key] = grid_clamped.get(cell_key, 0) + 1
            else:
                mismatch += 1
        except (ValueError, KeyError):
            continue

    if total_samples == 0:
        print("No valid warm samples found to analyze.", file=sys.stderr)
        return False

    clamped_total = clamped_map_high + clamped_map_low + clamped_imap
    fit_rate = (total_samples - mismatch) / total_samples * 100.0
    maf_pct = unclamped_maf / total_samples * 100.0
    map_high_pct = clamped_map_high / total_samples * 100.0
    map_low_pct = clamped_map_low / total_samples * 100.0
    imap_pct = clamped_imap / total_samples * 100.0

    print("================================================================================")
    print(f"           EVO X ECU LOAD CLAMP & ENVELOPE ANALYSIS")
    print(f"Log: {os.path.basename(log_path)}")
    print("================================================================================")
    print(f"Warm Valid Samples: {total_samples} (Filtered Cold ECT<{ect_min}°C: {filtered_cold})")
    print(f"Decompiled Model Verification Fit: {fit_rate:.2f}% ({total_samples - mismatch} / {total_samples})")
    print("--------------------------------------------------------------------------------")
    print(f"1. Pure MAF Control (ChosenCalc == MAFCalcs):  {unclamped_maf:6d} samples ({maf_pct:5.1f}%)")
    print(f"2. Clamped to MAP Upper Bound (MAF > MAP):      {clamped_map_high:6d} samples ({map_high_pct:5.1f}%)")
    print(f"3. Clamped to MAP Lower Bound (MAF < MAP):      {clamped_map_low:6d} samples ({map_low_pct:5.1f}%)")
    print(f"4. Clamped to Transient IMAP Bound:             {clamped_imap:6d} samples ({imap_pct:5.1f}%)")
    print(f"Total Time Governed by Speed Density Envelope:  {clamped_total:6d} samples ({clamped_total/total_samples*100:5.1f}%)")
    print("  * Note: At steady throttle (IMAPCalcs == 0), Lower Bound = 0.0, so MAPCalcs")
    print("    functions strictly as an UPPER CEILING. Engine runs on pure MAF whenever MAF <= MAP.")
    print("--------------------------------------------------------------------------------")

    if clamp_deltas:
        avg_delta = sum(clamp_deltas) / len(clamp_deltas)
        max_delta = max(clamp_deltas)
        print(f"Load Truncation Delta when Clamped: Mean = {avg_delta:.1f}% load, Max = {max_delta:.1f}% load")

    print("\n--- RPM vs MAP (kPa) Clamping Frequency Breakdown ---")
    print("Format: [ Clamped Samples / Total Samples (% Clamped) ]")
    header_str = "RPM \\ MAP |" + "".join([f"{kpa:6d}k" for kpa in map_bins[:8]])
    print(header_str)
    print("-" * len(header_str))

    for r in rpm_bins:
        row_str = f" {r:4d} RPM |"
        has_any = False
        for m in map_bins[:8]:
            tot = grid_total.get((r, m), 0)
            clp = grid_clamped.get((r, m), 0)
            if tot > 5:
                has_any = True
                pct = int(round(clp / tot * 100))
                row_str += f" {pct:4d}% "
            else:
                row_str += "   --  "
        if has_any:
            print(row_str)

    print("--------------------------------------------------------------------------------")
    print("CALIBRATION DIAGNOSIS:")
    if map_high_pct > 30.0:
        print("  [!] HIGH RISK: MAF is consistently reading HIGHER than MAP load tables.")
        print("      The ECU is actively truncating engine load down to MAPCalcs.")
        print("      -> Action: Raise 'MAP based Load Calc #1 (Hot)' to open the upper envelope,")
        print("                 or check if MAF Scaling was over-scaled without matching MAP tables.")
    elif map_low_pct > 30.0:
        print("  [!] NOTICE: MAF is consistently reading LOWER than MAP load tables.")
        print("      The ECU is artificially boosting engine load up to MAPCalcs.")
        print("      -> Action: Lower 'MAP based Load Calc #1 (Hot)' or recalibrate lower MAF curve.")
    else:
        print("  [+] HEALTHY: Load envelope is balanced. Car transitions smoothly between MAF and MAP.")
    print("================================================================================")
    return True

def main():
    parser = argparse.ArgumentParser(description="Evo X ECU Load Envelope & Clamp Analyzer")
    parser.add_argument("log", help="Path to EvoScan CSV datalog")
    parser.add_argument("--ect", type=float, default=70.0, help="Minimum Coolant Temp threshold (°C, default 70)")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose details")
    args = parser.parse_args()

    analyze_load_envelope(args.log, ect_min=args.ect, verbose=args.verbose)

if __name__ == "__main__":
    main()
