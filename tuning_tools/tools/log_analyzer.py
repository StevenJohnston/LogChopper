#!/usr/bin/env python3
"""
log_analyzer.py - Comprehensive statistical analyzer for EvoScan datalog CSVs.
Evaluates fuel delivery accuracy (AFR vs AFRMAP), MAF vs MAP load balance,
operating regimes (Idle, Cruise, Mid, Boost), knock events, and inverted load states.
"""

import argparse
import csv
import json
import math
import os
import sys

def target_ratio(kpa):
    if kpa <= 80.0:
        return 1.05
    elif kpa >= 120.0:
        return 0.95
    else:
        return 1.05 - 0.0025 * (kpa - 80.0)

def analyze_log(log_path, ect_min=75.0, app_min=10.0, json_output=False):
    if not os.path.exists(log_path):
        sys.exit(f"Log file not found: {log_path}")
        
    with open(log_path, "r", encoding="latin1") as f:
        reader = list(csv.DictReader(f))
        
    total_rows = len(reader)
    if total_rows == 0:
        sys.exit("Log file is empty")
        
    filtered = []
    knock_events = []
    
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
            knock = float(r["KnockSum"])
            timing = float(r.get("TimingAdv", 0))
            tps = float(r.get("TPS", 0))
            chosen = float(r.get("ChosenCalc", 0))
            
            if knock > 0:
                knock_events.append({"time": r.get("LogEntryTime", ""), "rpm": rpm, "load": r.get("Load", 0), "map": kpa, "knock": knock, "timing": timing})
                
            # Filter condition: active engine operation, warmed up, off decel fuel cutoff
            if ipw > 0 and afr > 0 and ect > ect_min and (app > app_min or speed == 0) and mafc > 0 and mapc > 0:
                filtered.append({
                    "ipw": ipw, "afr": afr, "afrmap": afrmap, "ect": ect,
                    "app": app, "speed": speed, "mafc": mafc, "mapc": mapc,
                    "map": kpa, "rpm": rpm, "knock": knock, "timing": timing,
                    "tps": tps, "chosen": chosen, "err": afr / afrmap,
                    "diff": afr - afrmap, "pct_err": abs(afr - afrmap) / afrmap * 100,
                    "ratio": mapc / mafc, "tgt_ratio": target_ratio(kpa)
                })
        except (ValueError, KeyError):
            pass

    n = len(filtered)
    if n == 0:
        sys.exit(f"No records passed filter criteria (ECT > {ect_min}, IPW > 0, etc.)")
        
    # Overall statistics
    afr_errs = [f["err"] for f in filtered]
    pct_errs = [f["pct_err"] for f in filtered]
    rmse_afr = math.sqrt(sum(f["diff"]**2 for f in filtered) / n)
    mean_err = sum(afr_errs) / n
    std_err = math.sqrt(sum((x - mean_err)**2 for x in afr_errs) / n)
    sorted_errs = sorted(afr_errs)
    median_err = sorted_errs[n // 2] if n % 2 != 0 else (sorted_errs[n//2-1] + sorted_errs[n//2]) / 2.0
    
    within_2 = sum(1 for p in pct_errs if p <= 2.0) / n * 100
    within_5 = sum(1 for p in pct_errs if p <= 5.0) / n * 100
    within_10 = sum(1 for p in pct_errs if p <= 10.0) / n * 100
    
    # Ratios
    ratios = [f["ratio"] for f in filtered]
    mean_ratio = sum(ratios) / n
    ratio_devs = [f["ratio"] - f["tgt_ratio"] for f in filtered]
    mean_dev = sum(ratio_devs) / n
    mean_abs_dev = sum(abs(x) for x in ratio_devs) / n
    
    # Sub-regimes
    regimes = {
        "Idle": [f for f in filtered if f["speed"] == 0 and f["app"] <= app_min],
        "Cruise": [f for f in filtered if f["map"] <= 80.0 and f["app"] > app_min],
        "Mid": [f for f in filtered if 80.0 < f["map"] < 120.0],
        "Boost": [f for f in filtered if f["map"] >= 120.0]
    }
    
    # Inverted state counts
    low_map_pts = [f for f in filtered if f["map"] <= 80.0]
    low_normal = sum(1 for f in low_map_pts if f["mafc"] < f["mapc"])
    low_inverted = len(low_map_pts) - low_normal
    
    high_map_pts = [f for f in filtered if f["map"] >= 120.0]
    high_normal = sum(1 for f in high_map_pts if f["mapc"] < f["mafc"])
    high_inverted = len(high_map_pts) - high_normal
    
    res = {
        "file": os.path.basename(log_path),
        "total_rows": total_rows,
        "filtered_rows": n,
        "afr_metrics": {
            "mean_afr": sum(f["afr"] for f in filtered) / n,
            "target_afr": sum(f["afrmap"] for f in filtered) / n,
            "mean_ratio": mean_err,
            "median_ratio": median_err,
            "std_ratio": std_err,
            "rmse_afr": rmse_afr,
            "pct_within_2": within_2,
            "pct_within_5": within_5,
            "pct_within_10": within_10
        },
        "ratio_metrics": {
            "mean_map_maf_ratio": mean_ratio,
            "mean_dev_from_target": mean_dev,
            "mean_abs_dev": mean_abs_dev,
            "low_map_normal_pct": (low_normal / max(1, len(low_map_pts))) * 100,
            "low_map_inverted_pct": (low_inverted / max(1, len(low_map_pts))) * 100
        },
        "knock_metrics": {
            "knock_samples": len(knock_events),
            "max_knock": max((k["knock"] for k in knock_events), default=0.0)
        }
    }
    
    if json_output:
        print(json.dumps(res, indent=2))
        return

    print(f"================ LOG ANALYSIS: {os.path.basename(log_path)} ================")
    print(f"Total Rows: {total_rows:,} | Filtered Samples: {n:,} ({n/total_rows*100:.1f}%)")
    print(f"\n--- FUEL DELIVERY ACCURACY ---")
    print(f"  Mean AFR: {res['afr_metrics']['mean_afr']:.2f} (Target: {res['afr_metrics']['target_afr']:.2f})")
    print(f"  AFR/AFRMAP Ratio: Mean = {mean_err:.4f}, Median = {median_err:.4f}, StdDev = {std_err:.4f}")
    print(f"  AFR RMSE: {rmse_afr:.3f} AFR points")
    print(f"  Error Bands: <= 2%: {within_2:.1f}% | <= 5%: {within_5:.1f}% | <= 10%: {within_10:.1f}%")
    
    print(f"\n--- MAF & MAP LOAD BALANCE ---")
    print(f"  Mean MAP/MAF Ratio: {mean_ratio:.4f}")
    print(f"  Mean Deviation from Target Curve: {mean_dev:+.4f} (Mean Abs Dev: {mean_abs_dev:.4f})")
    print(f"  Low MAP (<= 80 kPa): Normal (MAF < MAP): {low_normal} ({res['ratio_metrics']['low_map_normal_pct']:.1f}%) | Inverted: {low_inverted} ({res['ratio_metrics']['low_map_inverted_pct']:.1f}%)")
    if high_map_pts:
        print(f"  High MAP (>= 120 kPa): Normal (MAP < MAF): {high_normal} ({high_normal/len(high_map_pts)*100:.1f}%) | Inverted: {high_inverted} ({high_inverted/len(high_map_pts)*100:.1f}%)")

    print(f"\n--- REGIME BREAKDOWN ---")
    for reg_name, reg in regimes.items():
        if reg:
            reg_n = len(reg)
            r_afr = sum(x["afr"] for x in reg) / reg_n
            r_tgt = sum(x["afrmap"] for x in reg) / reg_n
            r_err = sum(x["err"] for x in reg) / reg_n
            r_rmse = math.sqrt(sum(x["diff"]**2 for x in reg) / reg_n)
            r_ratio = sum(x["ratio"] for x in reg) / reg_n
            r_tgt_r = sum(x["tgt_ratio"] for x in reg) / reg_n
            r_ldiff = sum(abs(x["mafc"] - x["mapc"]) for x in reg) / reg_n
            print(f"  [{reg_name:6s}] N={reg_n:4d} | AFR: {r_afr:5.2f} (err: {r_err:.4f}, rmse: {r_rmse:.3f}) | Ratio: {r_ratio:.3f} (target {r_tgt_r:.3f}) | Load Diff: {r_ldiff:4.1f}%")

    print(f"\n--- ENGINE HEALTH & KNOCK ---")
    print(f"  Knock Samples: {len(knock_events)} | Max Knock: {res['knock_metrics']['max_knock']}")
    if knock_events:
        print("  Sample Knock Events:")
        for k in knock_events[:5]:
            print(f"    Time: {k['time']} | RPM: {k['rpm']:.0f} | Load: {k['load']} | MAP: {k['map']:.1f} kPa | Knock: {k['knock']}")

def main():
    parser = argparse.ArgumentParser(description="Analyze EvoScan datalog CSV for fuel and load balance")
    parser.add_argument("log", help="Path to EvoScan CSV log file")
    parser.add_argument("--ect", type=float, default=75.0, help="Minimum ECT threshold (default 75C)")
    parser.add_argument("--app", type=float, default=10.0, help="Minimum APP threshold (default 10%)")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    args = parser.parse_args()
    
    analyze_log(args.log, ect_min=args.ect, app_min=args.app, json_output=args.json)

if __name__ == "__main__":
    main()
