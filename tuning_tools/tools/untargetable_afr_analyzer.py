#!/usr/bin/env python3
"""
Untargetable AFR Disparity & Targetability Analyzer
Analyzes empirical datalogs against ECU ROM calibration to identify MAF voltage
bins that have conflicting, untargetable AFR requirements across RPM / MAP.
"""

import os
import sys
import math
import struct
import csv
from collections import defaultdict

def load_rom(path):
    if not os.path.exists(path):
        sys.exit(f"Error: ROM not found: {path}")
    header_len = 328 if path.lower().endswith(".srf") else 0
    with open(path, "rb") as f:
        d = f.read()[header_len:]
    maf = [x / 100.0 for x in struct.unpack(">130H", d[0x5757A : 0x5757A + 260])]
    volts = [round(x * 5.0 / 1023.0, 3) for x in struct.unpack(">130H", d[0x61FD0 : 0x61FD0 + 260])]
    m_axis_raw = struct.unpack(">20H", d[0x6344A : 0x6344A + 40])
    map_kpa = [round(((r * 2556.0 / 3800.0) + 0.5) / 2.0, 1) for r in m_axis_raw]
    r_axis_raw = struct.unpack(">19H", d[0x6341E : 0x6341E + 38])
    rpm_axis = [round(r * 1000.0 / 256.0) for r in r_axis_raw]
    raw_map2 = struct.unpack(">380H", d[0x605AC : 0x605AC + 760])
    map_grid = [[(raw_map2[m * 19 + r] * 10.0 / 512.0) * 10.0 / 32.0 for m in range(20)] for r in range(19)]
    return {
        "path": path,
        "name": os.path.basename(path),
        "maf": maf,
        "volts": volts,
        "map_kpa": map_kpa,
        "rpm_axis": rpm_axis,
        "map_grid": map_grid,
    }

def get_nearest_bin(volts, v):
    best_idx = 0
    best_diff = abs(volts[0] - v)
    for i, bv in enumerate(volts):
        diff = abs(bv - v)
        if diff < best_diff:
            best_diff = diff
            best_idx = i
    return best_idx

def analyze_log(log_path, rom_data):
    volts = rom_data["volts"]
    maf_table = rom_data["maf"]
    rpm_axis = rom_data["rpm_axis"]
    map_kpa = rom_data["map_kpa"]

    with open(log_path, "r", encoding="latin1") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        sys.exit(f"Log file empty: {log_path}")

    dt = (float(rows[-1]["LogEntrySeconds"]) - float(rows[0]["LogEntrySeconds"])) / max(1, len(rows))

    # Bins by MAF voltage index
    bin_samples = defaultdict(list)
    # 3D grid samples: (rpm_idx, map_idx) -> list of (maf_v, afr, afr_err)
    grid_samples = defaultdict(list)

    total_valid = 0

    for i in range(20, len(rows) - 15):
        r = rows[i]
        # Preconditions: warm engine, active combustion
        # Check IPW around window to eliminate trailing decel fuel cut
        if any(float(rows[k]["IPW"]) <= 0 for k in range(i - 10, i + 6)):
            continue
        ect = float(r["ECT"])
        if ect < 78.0:
            continue
        spd = float(r["Speed"])
        tps = float(r["TPS"])
        app = float(r["APP"])
        rpm = float(r["RPM"])
        kpa = float(r["MAP"])
        mafc = float(r["MAFCalcs"])
        mapc = float(r["MAPCalcs"])
        mafv = float(r["MAF"])

        if mafc <= 0 or mapc <= 0:
            continue

        # Dynamic exhaust transport delay
        flow_proxy = rpm * kpa / 100000.0
        lag = int(round(max(0.10, min(0.45, 0.35 / math.sqrt(max(0.3, flow_proxy)))) / dt))
        if i + lag >= len(rows):
            continue

        afr = float(rows[i + lag]["AFR"])
        afrmap = float(r["AFRMAP"])
        if not (9.5 < afr < 18.5) or afrmap <= 0:
            continue

        stft = float(r.get("STFT", 0) or 0)
        ltft = float(r.get("CurrentLTFT", 0) or 0)
        afr_err = (1.0 - (stft + ltft) / 100.0) * (afr / afrmap)
        afr_delta = afr - afrmap

        # Filter out extreme transients (rapid pedal stomps or throttle slams)
        tps_win = [float(rows[k]["TPS"]) for k in range(i - 3, i + 4)]
        if max(tps_win) - min(tps_win) > 5.0:
            continue

        total_valid += 1
        bin_idx = get_nearest_bin(volts, mafv)

        sample = {
            "row_idx": i,
            "seconds": float(r["LogEntrySeconds"]),
            "rpm": rpm,
            "kpa": kpa,
            "mafv": mafv,
            "mafc": mafc,
            "mapc": mapc,
            "ratio": mapc / mafc,
            "afr": afr,
            "afrmap": afrmap,
            "afr_err": afr_err,
            "afr_delta": afr_delta,
            "tps": tps,
            "app": app,
            "spd": spd,
        }
        bin_samples[bin_idx].append(sample)

        # 3D grid nearest cell
        r_idx = min(range(len(rpm_axis)), key=lambda k: abs(rpm_axis[k] - rpm))
        m_idx = min(range(len(map_kpa)), key=lambda k: abs(map_kpa[k] - kpa))
        grid_samples[(r_idx, m_idx)].append(sample)

    return total_valid, bin_samples, grid_samples

def main():
    rom_path = "/Users/steven/Library/CloudStorage/GoogleDrive-stevenjohnston.ca@gmail.com/My Drive/Evoman/roms/AFR 14.7, scale 262, late 1.005, mafmap ai 27.srf"
    log_path = "/Users/steven/Library/CloudStorage/GoogleDrive-stevenjohnston.ca@gmail.com/My Drive/Evoman/scans/EvoScanDataLog_2026.10.23_19.40.31.csv"

    rom_data = load_rom(rom_path)
    total_valid, bin_samples, grid_samples = analyze_log(log_path, rom_data)

    print(f"Loaded ROM: {rom_data['name']}")
    print(f"Log: {os.path.basename(log_path)}")
    print(f"Total Filtered Steady-State Combustion Samples: {total_valid}\n")

    volts = rom_data["volts"]
    maf = rom_data["maf"]

    results = []

    for bin_idx in sorted(bin_samples.keys()):
        s_list = bin_samples[bin_idx]
        if len(s_list) < 5:
            continue

        v = volts[bin_idx]
        g_s = maf[bin_idx]
        n = len(s_list)

        afr_vals = [s["afr"] for s in s_list]
        err_vals = [s["afr_err"] for s in s_list]
        rpm_vals = [s["rpm"] for s in s_list]
        kpa_vals = [s["kpa"] for s in s_list]

        afr_min, afr_max = min(afr_vals), max(afr_vals)
        afr_delta = afr_max - afr_min
        afr_mean = sum(afr_vals) / n
        afr_std = math.sqrt(sum((x - afr_mean) ** 2 for x in afr_vals) / (n - 1)) if n > 1 else 0

        err_min, err_max = min(err_vals), max(err_vals)
        err_disp = err_max - err_min
        err_mean = sum(err_vals) / n

        rpm_min, rpm_max = min(rpm_vals), max(rpm_vals)
        rpm_spread = rpm_max - rpm_min

        kpa_min, kpa_max = min(kpa_vals), max(kpa_vals)
        kpa_spread = kpa_max - kpa_min

        conflict_index = err_disp * (rpm_spread / 1000.0) if (err_disp >= 0.08 and rpm_spread >= 1000) else 0.0

        results.append({
            "bin_idx": bin_idx,
            "volts": v,
            "maf_gs": g_s,
            "n": n,
            "afr_mean": afr_mean,
            "afr_min": afr_min,
            "afr_max": afr_max,
            "afr_delta": afr_delta,
            "afr_std": afr_std,
            "err_mean": err_mean,
            "err_min": err_min,
            "err_max": err_max,
            "err_disp": err_disp,
            "rpm_min": rpm_min,
            "rpm_max": rpm_max,
            "rpm_spread": rpm_spread,
            "kpa_min": kpa_min,
            "kpa_max": kpa_max,
            "kpa_spread": kpa_spread,
            "conflict_index": conflict_index,
            "samples": s_list,
        })

    # Print summary table
    print("=" * 115)
    print(f"{'Idx':<4} {'Volt':<6} {'g/s':<6} {'Count':<6} {'MeanAFR':<8} {'AFR Spread':<11} {'Err Spread':<11} {'RPM Range':<15} {'MAP Range':<14} {'Conflict Idx':<12} {'Status'}")
    print("=" * 115)

    high_conflict_bins = []

    for r in results:
        status = "TARGETABLE"
        if r["conflict_index"] >= 0.35:
            status = "**CRITICAL**"
            high_conflict_bins.append(r)
        elif r["conflict_index"] >= 0.15:
            status = "*CONFLICT*"
            high_conflict_bins.append(r)
        elif r["err_disp"] >= 0.12:
            status = "WARN (AFR)"

        rpm_str = f"{int(r['rpm_min'])}-{int(r['rpm_max'])}"
        kpa_str = f"{r['kpa_min']:.0f}-{r['kpa_max']:.0f}"

        print(f"{r['bin_idx']:<4} {r['volts']:<6.3f} {r['maf_gs']:<6.2f} {r['n']:<6} {r['afr_mean']:<8.2f} {r['afr_delta']:<11.2f} {r['err_disp']*100:<10.1f}% {rpm_str:<15} {kpa_str:<14} {r['conflict_index']:<12.3f} {status}")

    print("\n" + "=" * 80)
    print("DETAILED BREAKDOWN OF TOP UNTARGETABLE / CONFLICT BINS")
    print("=" * 80)

    # Sort high conflict bins by conflict_index descending
    high_conflict_bins.sort(key=lambda x: x["conflict_index"], reverse=True)

    for h in high_conflict_bins[:8]:
        print(f"\n>>> MAF Bin {h['bin_idx']} | {h['volts']:.3f}V | {h['maf_gs']:.2f} g/s (Samples: {h['n']})")
        print(f"    AFR Range: {h['afr_min']:.2f} to {h['afr_max']:.2f} (Spread: {h['afr_delta']:.2f} AFR points, StdDev: {h['afr_std']:.2f})")
        print(f"    AFR Error: {h['err_min']*100:.1f}% to {h['err_max']*100:.1f}% (Disparity: {h['err_disp']*100:.1f}%)")
        print(f"    RPM Range: {int(h['rpm_min'])} to {int(h['rpm_max'])} (Span: {int(h['rpm_spread'])} RPM)")
        print(f"    MAP Range: {h['kpa_min']:.1f} to {h['kpa_max']:.1f} kPa")
        print(f"    Untargetable Conflict Index: {h['conflict_index']:.3f}")

        # Sub-cluster by RPM
        low_rpm = [s for s in h["samples"] if s["rpm"] < 2500]
        mid_rpm = [s for s in h["samples"] if 2500 <= s["rpm"] < 3800]
        high_rpm = [s for s in h["samples"] if s["rpm"] >= 3800]

        if low_rpm:
            avg_afr = sum(s["afr"] for s in low_rpm) / len(low_rpm)
            avg_map = sum(s["kpa"] for s in low_rpm) / len(low_rpm)
            avg_err = sum(s["afr_err"] for s in low_rpm) / len(low_rpm)
            print(f"      [Low RPM < 2500] (N={len(low_rpm)}): Avg RPM={sum(s['rpm'] for s in low_rpm)/len(low_rpm):.0f}, Avg MAP={avg_map:.1f} kPa -> Avg AFR={avg_afr:.2f} (Error: {avg_err*100:.1f}%)")

        if mid_rpm:
            avg_afr = sum(s["afr"] for s in mid_rpm) / len(mid_rpm)
            avg_map = sum(s["kpa"] for s in mid_rpm) / len(mid_rpm)
            avg_err = sum(s["afr_err"] for s in mid_rpm) / len(mid_rpm)
            print(f"      [Mid RPM 2500-3800] (N={len(mid_rpm)}): Avg RPM={sum(s['rpm'] for s in mid_rpm)/len(mid_rpm):.0f}, Avg MAP={avg_map:.1f} kPa -> Avg AFR={avg_afr:.2f} (Error: {avg_err*100:.1f}%)")

        if high_rpm:
            avg_afr = sum(s["afr"] for s in high_rpm) / len(high_rpm)
            avg_map = sum(s["kpa"] for s in high_rpm) / len(high_rpm)
            avg_err = sum(s["afr_err"] for s in high_rpm) / len(high_rpm)
            print(f"      [High RPM >= 3800] (N={len(high_rpm)}): Avg RPM={sum(s['rpm'] for s in high_rpm)/len(high_rpm):.0f}, Avg MAP={avg_map:.1f} kPa -> Avg AFR={avg_afr:.2f} (Error: {avg_err*100:.1f}%)")

if __name__ == "__main__":
    main()
