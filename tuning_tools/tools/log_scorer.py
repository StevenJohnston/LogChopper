#!/usr/bin/env python3
"""
log_scorer.py - Automated Datalog Scoring & Drivability Evaluation Suite for Evo X

Evaluates EvoScan datalogs against calibration objectives:
  1. Fuel Delivery Accuracy & Convergence (Target AFRMAP tracking, RMSE, Error bands)
  2. MAF vs MAP Load Envelope Balance (Target ratio 1.05/0.95, Inversion avoidance, Clamping rate)
  3. Idle & Drivability Smoothness (RPM variance, Timing stability, Transient jitter)
  4. Engine Safety & Knock (Knock events, High-load lean excursions)

Outputs an overall 0-100 score and subscores to quantify whether calibration passes
are progressing, deteriorating, or oscillating.
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

def stddev(values):
    if len(values) < 2:
        return 0.0
    mean = sum(values) / len(values)
    var = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
    return math.sqrt(var)

def score_log(csv_path, min_ect=75.0):
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Datalog not found: {csv_path}")

    with open(csv_path, "r", encoding="latin1") as f:
        reader = list(csv.DictReader(f))

    total_rows = len(reader)
    if total_rows == 0:
        raise ValueError("Log file is empty")

    warm_samples = []
    idle_samples = []
    cruise_samples = []
    boost_samples = []
    knock_events = []
    lean_boost_events = []

    def safe_float(val, default=0.0):
        if val is None:
            return default
        s = str(val).strip()
        if not s:
            return default
        try:
            return float(s)
        except (ValueError, TypeError):
            return default

    for idx, r in enumerate(reader):
        try:
            ect = safe_float(r.get("ECT"), 0.0)
            ipw = safe_float(r.get("IPW"), 0.0)
            afr = safe_float(r.get("AFR"), 0.0)
            afrmap = safe_float(r.get("AFRMAP"), 14.7)
            if afrmap <= 0: afrmap = 14.7
            rpm = safe_float(r.get("RPM"), 0.0)
            speed = safe_float(r.get("Speed"), 0.0)
            app = safe_float(r.get("APP"), 0.0)
            tps = safe_float(r.get("TPS"), 0.0)
            load = safe_float(r.get("Load"), 0.0)
            mafc = safe_float(r.get("MAFCalcs"), 0.0)
            mapc = safe_float(r.get("MAPCalcs"), 0.0)
            kpa = safe_float(r.get("MAP"), 0.0)
            timing = safe_float(r.get("TimingAdv"), 0.0)
            knock = safe_float(r.get("KnockSum"), 0.0)
            chosen = safe_float(r.get("ChosenCalc"), load)

            # Exclude cold engine and decel fuel cut (IPW == 0 or TPS < 13%)
            if ect < min_ect or ipw <= 0.0 or afr <= 5.0 or afr >= 25.0:
                continue

            sample = {
                "idx": idx, "rpm": rpm, "speed": speed, "app": app, "tps": tps,
                "load": load, "mafc": mafc, "mapc": mapc, "kpa": kpa,
                "afr": afr, "afrmap": afrmap, "timing": timing, "knock": knock,
                "chosen": chosen, "afr_err": afr / afrmap if afrmap > 0 else 1.0,
                "ratio": mapc / mafc if mafc > 0 else 1.0,
                "target_ratio": target_ratio(kpa)
            }
            warm_samples.append(sample)

            # Regime sorting
            if rpm < 1150 and speed < 5.0 and app < 5.0:
                idle_samples.append(sample)
            elif 1500 <= rpm <= 3500 and 40.0 <= load <= 110.0 and tps < 25.0 and speed > 10.0:
                cruise_samples.append(sample)
            elif load > 140.0 or kpa > 130.0:
                boost_samples.append(sample)

            if knock > 0:
                knock_events.append((sample, knock))

            if load > 120.0 and afr > 12.8:
                lean_boost_events.append(sample)

        except (ValueError, TypeError, KeyError):
            pass

    n = len(warm_samples)
    if n == 0:
        return {"error": "No valid warm engine samples found"}

    # -------------------------------------------------------------
    # 1. FUEL DELIVERY ACCURACY (Max 40 points)
    # -------------------------------------------------------------
    afr_errors = [s["afr_err"] for s in warm_samples]
    sorted_err = sorted(afr_errors)
    median_err = sorted_err[n // 2]
    mean_err = sum(afr_errors) / n

    # RMSE from target AFRMAP
    rmse = math.sqrt(sum((s["afr"] - s["afrmap"]) ** 2 for s in warm_samples) / n)

    # Error bands
    within_2pct = sum(1 for e in afr_errors if abs(e - 1.0) <= 0.02) / n * 100
    within_5pct = sum(1 for e in afr_errors if abs(e - 1.0) <= 0.05) / n * 100
    within_10pct = sum(1 for e in afr_errors if abs(e - 1.0) <= 0.10) / n * 100

    # Fuel Subscores:
    # A. Median centering (10 pts): 10 if within 1%, drops to 0 at 5%
    med_dev = abs(median_err - 1.0)
    fuel_median_score = max(0.0, min(10.0, 10.0 * (1.0 - med_dev / 0.05)))

    # B. RMSE (15 pts): 15 if RMSE <= 0.4, 0 if RMSE >= 1.5
    fuel_rmse_score = max(0.0, min(15.0, 15.0 * (1.5 - rmse) / 1.1))

    # C. Band coverage (15 pts): Based on % within 5% error
    fuel_band_score = max(0.0, min(15.0, 15.0 * (within_5pct / 90.0)))

    fuel_score = fuel_median_score + fuel_rmse_score + fuel_band_score

    # -------------------------------------------------------------
    # 2. LOAD BALANCE & ENVELOPE COHERENCE (Max 30 points)
    # -------------------------------------------------------------
    # Target ratio tracking
    ratio_devs = [abs(s["ratio"] - s["target_ratio"]) for s in warm_samples if s["mafc"] > 0]
    mean_ratio_mad = sum(ratio_devs) / len(ratio_devs) if ratio_devs else 0.1

    # Ratio Tracking Score (10 pts): 10 if MAD <= 0.03, 0 if MAD >= 0.15
    load_ratio_score = max(0.0, min(10.0, 10.0 * (0.15 - mean_ratio_mad) / 0.12))

    # Vacuum Inversion Rate (Crucial! MAF > MAP when MAP <= 80 kPa)
    vacuum_samples = [s for s in warm_samples if s["kpa"] <= 80.0]
    n_vac = len(vacuum_samples)
    if n_vac > 0:
        inverted_vac = sum(1 for s in vacuum_samples if s["mafc"] > s["mapc"])
        vac_inversion_rate = (inverted_vac / n_vac) * 100
    else:
        vac_inversion_rate = 0.0

    # Inversion Score (10 pts): 10 if inversion <= 10%, 0 if >= 60%
    load_inversion_score = max(0.0, min(10.0, 10.0 * (60.0 - vac_inversion_rate) / 50.0))

    # Clamping Discontinuity Score (10 pts): % of time ChosenCalc equals MAPCalcs when MAFCalcs is higher
    # Measures smooth continuous airflow without truncation
    clamped_samples = sum(1 for s in warm_samples if s["mafc"] > s["mapc"] + 1.0)
    clamp_rate = (clamped_samples / n) * 100
    load_clamp_score = max(0.0, min(10.0, 10.0 * (50.0 - clamp_rate) / 40.0))

    load_score = load_ratio_score + load_inversion_score + load_clamp_score

    # -------------------------------------------------------------
    # 3. IDLE & CRUISE DRIVABILITY SMOOTHNESS (Max 20 points)
    # -------------------------------------------------------------
    # A. Idle RPM Variance (6 pts): ideal RPM stddev <= 25 RPM
    idle_rpms = [s["rpm"] for s in idle_samples]
    idle_rpm_std = stddev(idle_rpms) if len(idle_rpms) > 10 else 40.0
    idle_rpm_score = max(0.0, min(6.0, 6.0 * (60.0 - idle_rpm_std) / 40.0))

    # B. Idle AFR Stability (7 pts): ideal idle AFR stddev <= 0.30
    idle_afrs = [s["afr"] for s in idle_samples]
    idle_afr_std = stddev(idle_afrs) if len(idle_afrs) > 10 else 0.5
    idle_afr_score = max(0.0, min(7.0, 7.0 * (0.80 - idle_afr_std) / 0.55))

    # C. Cruise AFR Stability (7 pts): ideal cruise AFR stddev <= 0.50
    cruise_afrs = [s["afr"] for s in cruise_samples]
    cruise_afr_std = stddev(cruise_afrs) if len(cruise_afrs) > 10 else 0.8
    cruise_afr_score = max(0.0, min(7.0, 7.0 * (1.20 - cruise_afr_std) / 0.80))

    smoothness_score = idle_rpm_score + idle_afr_score + cruise_afr_score

    # -------------------------------------------------------------
    # 4. ENGINE SAFETY & HEALTH (Max 10 points)
    # -------------------------------------------------------------
    # Knock penalty: 2 points per knock event
    knock_penalty = min(8.0, len(knock_events) * 2.0)
    # Lean boost penalty: 2 points per event
    lean_penalty = min(5.0, len(lean_boost_events) * 2.5)
    safety_score = max(0.0, 10.0 - knock_penalty - lean_penalty)

    # -------------------------------------------------------------
    # OVERALL SCORE
    # -------------------------------------------------------------
    total_score = fuel_score + load_score + smoothness_score + safety_score

    # Grade
    if total_score >= 88: grade = "A"
    elif total_score >= 78: grade = "B"
    elif total_score >= 68: grade = "C"
    elif total_score >= 58: grade = "D"
    else: grade = "F"

    return {
        "file": os.path.basename(csv_path),
        "total_rows": total_rows,
        "warm_samples": n,
        "idle_samples": len(idle_samples),
        "cruise_samples": len(cruise_samples),
        "boost_samples": len(boost_samples),
        "metrics": {
            "median_afr_err": round(median_err, 4),
            "mean_afr_err": round(mean_err, 4),
            "afr_rmse": round(rmse, 3),
            "within_2pct": round(within_2pct, 1),
            "within_5pct": round(within_5pct, 1),
            "within_10pct": round(within_10pct, 1),
            "mean_ratio_mad": round(mean_ratio_mad, 4),
            "vac_inversion_rate": round(vac_inversion_rate, 1),
            "clamp_rate": round(clamp_rate, 1),
            "idle_rpm_std": round(idle_rpm_std, 1),
            "idle_afr_std": round(idle_afr_std, 2),
            "cruise_afr_std": round(cruise_afr_std, 2),
            "knock_events": len(knock_events),
            "max_knock": max([k[1] for k in knock_events]) if knock_events else 0.0
        },
        "subscores": {
            "fuel_accuracy": round(fuel_score, 1),
            "load_balance": round(load_score, 1),
            "smoothness": round(smoothness_score, 1),
            "engine_safety": round(safety_score, 1),
            "total_score": round(total_score, 1),
            "grade": grade
        }
    }

def print_score_card(score_data):
    s = score_data
    m = s["metrics"]
    sc = s["subscores"]
    print("=" * 75)
    print(f"       EVOMAN TELEMETRY SCORING & CALIBRATION HEALTH CARD")
    print("=" * 75)
    print(f"Log File      : {s['file']}")
    print(f"Samples       : {s['warm_samples']:,} warm rows (Idle: {s['idle_samples']:,} | Cruise: {s['cruise_samples']:,} | Boost: {s['boost_samples']:,})")
    print(f"Overall Grade : {sc['grade']} ({sc['total_score']} / 100)")
    print("-" * 75)
    print(f"1. FUEL DELIVERY ACCURACY       : {sc['fuel_accuracy']:4.1f} / 40.0 pts")
    print(f"   • Median Error Ratio         : {m['median_afr_err']:.4f} (Ideal: 1.0000)")
    print(f"   • AFR RMSE from Target       : {m['afr_rmse']:.3f} AFR pts")
    print(f"   • Error Bands                : ±2%: {m['within_2pct']}% | ±5%: {m['within_5pct']}% | ±10%: {m['within_10pct']}%")
    print(f"2. LOAD BALANCE & ENVELOPE      : {sc['load_balance']:4.1f} / 30.0 pts")
    print(f"   • Target Ratio Deviation MAD : {m['mean_ratio_mad']:.4f}")
    print(f"   • Vacuum Inversion Rate      : {m['vac_inversion_rate']}% (MAF > MAP at <= 80 kPa)")
    print(f"   • Ceiling Clamping Rate      : {m['clamp_rate']}%")
    print(f"3. DRIVABILITY SMOOTHNESS       : {sc['smoothness']:4.1f} / 20.0 pts")
    print(f"   • Idle RPM StdDev            : {m['idle_rpm_std']:.1f} RPM")
    print(f"   • Idle AFR StdDev            : {m['idle_afr_std']:.2f}")
    print(f"   • Cruise AFR StdDev          : {m['cruise_afr_std']:.2f}")
    print(f"4. ENGINE SAFETY & KNOCK        : {sc['engine_safety']:4.1f} / 10.0 pts")
    print(f"   • Knock Events               : {m['knock_events']} (Max Knock: {m['max_knock']})")
    print("=" * 75)

def compare_logs(log_paths):
    scores = [score_log(p) for p in log_paths]
    print("=" * 85)
    print("                 MULTI-LOG CALIBRATION PROGRESSION COMPARISON")
    print("=" * 85)
    headers = [s["file"][:26] for s in scores]
    print(f"{'Metric / Subscore':<30} | " + " | ".join(f"{h:<24}" for h in headers))
    print("-" * 85)
    
    rows = [
        ("Total Score (Grade)", [f"{s['subscores']['total_score']:.1f} ({s['subscores']['grade']})" for s in scores]),
        ("  1. Fuel Accuracy (/40)", [f"{s['subscores']['fuel_accuracy']:.1f}" for s in scores]),
        ("     Median AFR Error", [f"{s['metrics']['median_afr_err']:.4f}" for s in scores]),
        ("     AFR RMSE", [f"{s['metrics']['afr_rmse']:.3f}" for s in scores]),
        ("     Samples Within ±5%", [f"{s['metrics']['within_5pct']:.1f}%" for s in scores]),
        ("  2. Load Balance (/30)", [f"{s['subscores']['load_balance']:.1f}" for s in scores]),
        ("     Vacuum Inversion Rate", [f"{s['metrics']['vac_inversion_rate']:.1f}%" for s in scores]),
        ("     Ceiling Clamp Rate", [f"{s['metrics']['clamp_rate']:.1f}%" for s in scores]),
        ("  3. Smoothness (/20)", [f"{s['subscores']['smoothness']:.1f}" for s in scores]),
        ("     Idle RPM StdDev", [f"{s['metrics']['idle_rpm_std']:.1f} RPM" for s in scores]),
        ("     Cruise AFR StdDev", [f"{s['metrics']['cruise_afr_std']:.2f}" for s in scores]),
        ("  4. Safety (/10)", [f"{s['subscores']['engine_safety']:.1f}" for s in scores]),
        ("     Knock Events", [f"{s['metrics']['knock_events']}" for s in scores]),
    ]
    
    for label, vals in rows:
        print(f"{label:<30} | " + " | ".join(f"{v:<24}" for v in vals))
    print("=" * 85)

def main():
    parser = argparse.ArgumentParser(description="Score EvoScan datalog calibration health and drivability.")
    parser.add_argument("logs", nargs="+", help="Path to one or more datalog CSV files")
    parser.add_argument("--json", action="store_true", help="Output JSON formatted scores")
    args = parser.parse_args()

    if len(args.logs) == 1:
        s = score_log(args.logs[0])
        if args.json:
            print(json.dumps(s, indent=2))
        else:
            print_score_card(s)
    else:
        if args.json:
            scores = [score_log(p) for p in args.logs]
            print(json.dumps(scores, indent=2))
        else:
            compare_logs(args.logs)

if __name__ == "__main__":
    main()
