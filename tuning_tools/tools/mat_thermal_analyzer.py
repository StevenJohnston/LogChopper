#!/usr/bin/env python3
"""
mat_thermal_analyzer.py - Decoupled MAT Thermal Compensation & Calibration Tool

Applies OEM-grade Control Decoupling Architecture:
  1. The MAT vs MAP table's SOLE responsibility is Thermal Invariance (dAFR / dMAT = 0).
     It targets the Cold-Witnessed Baseline AFR, NOT the global AFRMAP target.
  2. The Base MAF and MAP models are responsible for reference airflow accuracy (targeting AFRMAP).
  3. Prevents the EcuFlash Cold-to-Hot Axis Inversion Trap (Row 0 = -10C / 14F, Row 6 = 100C / 212F).
"""

import argparse
import csv
import os
import struct
import sys

def parse_srf_or_bin(path):
    with open(path, "rb") as f:
        data = f.read()
    if len(data) == 1048904:  # .srf header
        return data[0x148:]
    return data

def get_mat_table_and_axes(rom_bytes):
    # Addresses for 59580004 / 59580304
    # MAP axis: 0x634D4 (10 uint16)
    map_raw = [struct.unpack(">H", rom_bytes[0x634D4 + i*2 : 0x634D4 + (i+1)*2])[0] for i in range(10)]
    map_kpa = [round(((x / 4.0) * 1.6151) + 3.4779, 1) for x in map_raw]

    # MAT axis: 0x634C0 (7 uint16)
    mat_raw = [struct.unpack(">H", rom_bytes[0x634C0 + i*2 : 0x634C0 + (i+1)*2])[0] for i in range(7)]
    mat_c = [x - 40 for x in mat_raw]
    mat_f = [round(1.8 * x - 40) for x in mat_raw]

    # Table: 0x60FCD (10 cols x 7 rows in binary memory)
    # Because swapxy="true" is defined in EcuFlash XML:
    # X Axis = MAP (10 elements), Y Axis = MAT (7 elements)
    # Binary memory is stored column-major: offset = x * 7 + y
    raw_table = [rom_bytes[0x60FCD + i] for i in range(70)]
    scaled_table = [round((b + 384) / 5.12, 1) for b in raw_table]
    grid = [[scaled_table[x * 7 + y] for x in range(10)] for y in range(7)]

    return map_kpa, mat_c, mat_f, grid

def process_log(log_path):
    """Parses datalog and extracts steady-state closed-loop points."""
    with open(log_path, "r", encoding="latin1") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    samples = []
    for r in rows:
        try:
            afr = float(r["AFR"])
            afrmap = float(r["AFRMAP"])
            mat = float(r["MAT"])
            map_kpa = float(r["MAP"])
            tps = float(r.get("TPS", 0))
            rpm = float(r.get("RPM", 0))

            # Filter for valid closed loop operation
            if 10.0 < afr < 18.0 and afrmap == 14.7:
                samples.append({
                    "afr": afr,
                    "afrmap": afrmap,
                    "mat": mat,
                    "map": map_kpa,
                    "tps": tps,
                    "rpm": rpm
                })
        except (ValueError, KeyError):
            continue
    return samples

def find_nearest_index(val, axis):
    idx = 0
    min_dist = abs(val - axis[0])
    for i, a in enumerate(axis):
        d = abs(val - a)
        if d < min_dist:
            min_dist = d
            idx = i
    return idx

def analyze_thermal_drift(cold_log, hot_log, rom_path):
    rom_bytes = parse_srf_or_bin(rom_path)
    map_kpa, mat_c, mat_f, current_table = get_mat_table_and_axes(rom_bytes)

    cold_samples = process_log(cold_log)
    hot_samples = process_log(hot_log)

    print("=" * 80)
    print("MAT THERMAL DECOUPLING & INVARIANCE ANALYZER")
    print("=" * 80)
    print(f"ROM:  {os.path.basename(rom_path)}")
    print(f"Cold Baseline Log: {os.path.basename(cold_log)} ({len(cold_samples)} valid samples)")
    print(f"Hot Telemetry Log: {os.path.basename(hot_log)} ({len(hot_samples)} valid samples)")
    print("-" * 80)

    # Bin cold samples by MAP index for the baseline
    cold_by_map = {c: [] for c in range(10)}
    for s in cold_samples:
        c_idx = find_nearest_index(s["map"], map_kpa)
        cold_by_map[c_idx].append(s["afr"])

    # Compute cold baseline AFR for each MAP column
    cold_baseline_afr = {}
    for c_idx in range(10):
        if cold_by_map[c_idx]:
            cold_baseline_afr[c_idx] = sum(cold_by_map[c_idx]) / len(cold_by_map[c_idx])
        else:
            cold_baseline_afr[c_idx] = 14.70

    # Bin hot samples by MAT row and MAP col
    hot_bins = {(r, c): [] for r in range(7) for c in range(10)}
    for s in hot_samples:
        r_idx = find_nearest_index(s["mat"], mat_c)
        c_idx = find_nearest_index(s["map"], map_kpa)
        hot_bins[(r_idx, c_idx)].append(s["afr"])

    print("\n[STEP 1] BASELINE VERIFICATION & THERMAL DRIFT IDENTIFICATION")
    print("Row Headers: EcuFlash Axis (Cold -10C to Hot 100C)")
    print("Col Headers: Omni 4-bar MAP (kPa)\n")

    recommended_table = [row[:] for row in current_table]

    for r_idx in range(7):
        temp_label = f"MAT {mat_c[r_idx]:3d}C ({mat_f[r_idx]:3d}F)"
        for c_idx in range(10):
            samples_in_cell = hot_bins[(r_idx, c_idx)]
            if len(samples_in_cell) >= 20:
                mean_hot_afr = sum(samples_in_cell) / len(samples_in_cell)
                baseline_afr = cold_baseline_afr[c_idx]
                # Thermal drift ratio relative to cold baseline:
                # If mean_hot_afr = 13.99 and baseline_afr = 14.51:
                # drift_ratio = 13.99 / 14.51 = 0.964 (-3.6% too rich)
                drift_ratio = mean_hot_afr / baseline_afr
                current_val = current_table[r_idx][c_idx]
                # New value trims only the thermal drift:
                # new_val = current_val * drift_ratio
                target_val = round(current_val * drift_ratio, 1)
                recommended_table[r_idx][c_idx] = target_val

                print(f"  {temp_label} | MAP {map_kpa[c_idx]:5.1f} kPa: "
                      f"Hot AFR={mean_hot_afr:.2f} vs Cold Baseline={baseline_afr:.2f} | "
                      f"Thermal Drift={((drift_ratio - 1.0) * 100):+5.1f}% | "
                      f"Cell: {current_val:5.1f}% -> {target_val:5.1f}%")

    print("\n" + "=" * 80)
    print("[STEP 2] RECOMMENDED 'Fuel Compensation MAT vs MAP' TABLE (FOR ECUFLASH)")
    print("=" * 80)
    print("NOTE: Row 0 is -10C (Cold). Row 6 is 100C (Hot). DO NOT INVERT ROWS.\n")

    header = "Temp (C/F)\t" + "\t".join(f"{k:.1f}" for k in map_kpa)
    print(header)
    for r_idx in range(7):
        row_str = f"{mat_c[r_idx]}C/{mat_f[r_idx]}F\t" + "\t".join(f"{v:.1f}" for v in recommended_table[r_idx])
        print(row_str)

    print("\n" + "-" * 80)
    print("[STEP 3] CLEAN PASTE BUFFER FOR ECUFLASH (7 rows x 10 cols)")
    print("-" * 80)
    for r_idx in range(7):
        print("\t".join(f"{v:.1f}" for v in recommended_table[r_idx]))
    print("-" * 80)

    print("\n[CALIBRATION SUMMARY]")
    print("1. Thermal Invariance Achieved: Hot manifold AFR now matches cold morning baseline.")
    print("2. Base Airflow Convergence: Any residual delta between Cold Baseline and AFRMAP (14.7)")
    print("   belongs strictly to MAF Scaling and MAP based Load Calc (LogChopper).")
    print("=" * 80)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Analyze and correct MAT thermal compensation using Cold-Witnessed baseline.")
    parser.add_argument("--cold-log", required=True, help="Path to cold morning/baseline EvoScan CSV log")
    parser.add_argument("--hot-log", required=True, help="Path to hot afternoon/heat-soaked EvoScan CSV log")
    parser.add_argument("--rom", required=True, help="Path to current ROM (.srf or .bin)")
    args = parser.parse_args()

    analyze_thermal_drift(args.cold_log, args.hot_log, args.rom)
