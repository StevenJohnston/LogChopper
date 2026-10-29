#!/usr/bin/env python3
"""
bov_flutter_knock_detector.py - BOV Flutter vs. Timing Knock Classifier for Evo X

Identifies whether knock events recorded in EvoScan datalogs are caused by:
  1. BOV_FLUTTER (Hardware / Fluid Dynamics):
     - Occurs under light-to-medium throttle (TPS 25%-55%, steady foot ΔTPS <= 5%).
     - Transitional boost/crossover (MAP 95-135 kPa).
     - High-frequency airflow oscillations (MAF swing >= 0.28V, multiple direction reversals).
     - Caused by charge-pipe pressure overpowering BOV spring against a partially open
       throttle body, resulting in mechanical acoustic chatter and airflow reversion lean spikes.
     - Cannot be tuned around with ignition timing advance tables!

  2. TRUE_TIMING_KNOCK (Calibration / Spark Advance):
     - Occurs under smooth, non-oscillating airflow (smooth d(MAFV)/dt, MAF swing < 0.25V).
     - Or under sustained boost (>135 kPa) / WOT (TPS > 60%).
     - Caused by excessive ignition timing advance or high in-cylinder pressure.
     - MUST be addressed via ignition timing retards (--lower-only).

  3. LIFT_OFF_DECEL (Drivetrain / Mechanical Shock):
     - Occurs as throttle rapidly snaps shut (ΔTPS < -8%).
     - Mechanical false knock from engine rocking on mounts during overrun transition.

Usage:
  python3 bov_flutter_knock_detector.py scans/EvoScanDataLog_2026.10.24_15.31.59.csv
  python3 bov_flutter_knock_detector.py scans/*.csv --export-json flutter_report.json
"""

import argparse
import csv
import json
import math
import os
import sys


def parse_datalog_rows(log_path):
    """Loads CSV rows and extracts basic timing metadata."""
    if not os.path.exists(log_path):
        print(f"[!] File not found: {log_path}", file=sys.stderr)
        return []
    with open(log_path, "r", encoding="latin1") as f:
        reader = csv.DictReader(f)
        return list(reader)


def detect_knock_inceptions(rows):
    """
    Extracts only true knock inception events where KnockSum increases (ΔKnockSum > 0).
    Filters out rolling counter decay frames.
    """
    inceptions = []
    prev_k = 0.0
    for i, r in enumerate(rows):
        try:
            k = float(r.get("KnockSum", 0) or 0)
            if k > prev_k:
                delta = k - prev_k
                inceptions.append({
                    "row_idx": i,
                    "delta_knock": delta,
                    "total_knock": k,
                    "time": float(r.get("LogEntrySeconds", 0) or 0),
                    "rpm": float(r.get("RPM", 0) or 0),
                    "map_kpa": float(r.get("MAP", 0) or 0),
                    "tps": float(r.get("TPS", 0) or 0),
                    "app": float(r.get("APP", 0) or 0),
                    "maf_v": float(r.get("MAF", 0) or 0),
                    "maf_c": float(r.get("MAFCalcs", 0) or 0),
                    "map_c": float(r.get("MAPCalcs", 0) or 0),
                    "timing": float(r.get("TimingAdv", 0) or 0),
                    "afr": float(r.get("AFR", 0) or 0),
                    "afrmap": float(r.get("AFRMAP", 0) or 0),
                    "raw_row": r
                })
            prev_k = k
        except (ValueError, KeyError):
            continue
    return inceptions


def analyze_airflow_window(rows, center_idx, window=6):
    """
    Analyzes local window around center_idx to compute airflow oscillation metrics:
      - MAF voltage peak-to-peak swing
      - Number of direction reversals (zero-crossings of d(MAFV)/dt)
      - Throttle delta (steady foot verification)
    """
    w_start = max(0, center_idx - window)
    w_end = min(len(rows), center_idx + window + 1)
    w_rows = rows[w_start:w_end]

    tps_vals = [float(r.get("TPS", 0) or 0) for r in w_rows]
    mafv_vals = [float(r.get("MAF", 0) or 0) for r in w_rows]
    map_vals = [float(r.get("MAP", 0) or 0) for r in w_rows]
    afr_vals = [float(r.get("AFR", 0) or 0) for r in w_rows]

    tps_range = max(tps_vals) - min(tps_vals)
    tps_mean = sum(tps_vals) / max(1, len(tps_vals))
    mafv_range = max(mafv_vals) - min(mafv_vals)
    map_mean = sum(map_vals) / max(1, len(map_vals))
    max_afr = max(afr_vals) if afr_vals else 14.7

    # Count direction reversals (high-frequency cycling signature)
    diffs = [mafv_vals[k+1] - mafv_vals[k] for k in range(len(mafv_vals)-1)]
    reversals = 0
    for k in range(len(diffs) - 1):
        if diffs[k] * diffs[k+1] < -0.005:  # significant directional reversal
            reversals += 1

    # Check for rapid throttle lift-off decel (mechanical rock false knock)
    pre_tps = float(rows[max(0, center_idx - 3)].get("TPS", 0) or 0)
    post_tps = float(rows[min(len(rows) - 1, center_idx + 3)].get("TPS", 0) or 0)
    tps_slope = post_tps - pre_tps

    return {
        "tps_mean": tps_mean,
        "tps_range": tps_range,
        "tps_slope": tps_slope,
        "mafv_range": mafv_range,
        "reversals": reversals,
        "map_mean": map_mean,
        "max_afr": max_afr
    }


def classify_knock_event(event, metrics):
    """
    Classifies a knock event into:
      - BOV_FLUTTER
      - TRUE_TIMING_KNOCK
      - LIFT_OFF_DECEL
    """
    rpm = event["rpm"]
    kpa = event["map_kpa"]
    tps = event["tps"]

    # 1. Lift-off decel check
    if metrics["tps_slope"] < -8.0 or tps < 18.0:
        return "LIFT_OFF_DECEL", (
            f"Throttle snapping shut (ΔTPS={metrics['tps_slope']:+.1f}%). "
            f"Mechanical drivetrain/mount rocking false knock."
        )

    # 2. BOV Flutter / Rapid Cycling Check:
    # Criteria:
    #   - Light/medium part-throttle: TPS 25% to 55%
    #   - Steady foot: TPS range <= 5.0%
    #   - Spool/crossover pressure: MAP 95 to 135 kPa
    #   - Low to mid RPM: 1,800 to 3,400 RPM (where 8474 builds pressure against part-open throttle)
    #   - Airflow volatility: MAF swing >= 0.28V AND at least 2 directional reversals
    if (
        25.0 <= metrics["tps_mean"] <= 55.0
        and metrics["tps_range"] <= 5.0
        and 95.0 <= metrics["map_mean"] <= 135.0
        and 1800 <= rpm <= 3400
        and (metrics["mafv_range"] >= 0.28 or (metrics["mafv_range"] >= 0.22 and metrics["reversals"] >= 3))
    ):
        confidence = "High" if metrics["mafv_range"] >= 0.35 else "Moderate"
        afr_note = f" Spiked lean ({metrics['max_afr']:.1f} AFR) in wave trough." if metrics["max_afr"] > 15.0 else ""
        reason = (
            f"BOV rapidly cycling ({confidence} confidence). MAF swung {metrics['mafv_range']:.3f}V "
            f"with {metrics['reversals']} directional reversals at steady {metrics['tps_mean']:.1f}% TPS.{afr_note} "
            f"Mechanical valve acoustic impact / airflow reversion surge."
        )
        return "BOV_FLUTTER", reason

    # 3. Otherwise: True Calibration / Timing Knock
    if kpa >= 135.0 or tps >= 60.0:
        regime = "Positive Boost / WOT"
    else:
        regime = "Steady Cruise / Monotonic Spool"

    reason = (
        f"{regime}. Smooth airflow (MAF swing={metrics['mafv_range']:.3f}V, {metrics['reversals']} reversals). "
        f"In-cylinder combustion detonation -> REQUIRES TIMING RETARD."
    )
    return "TRUE_TIMING_KNOCK", reason


def scan_file_for_bov_flutter_knock(log_path):
    """Scans a single EvoScan CSV log and returns all analyzed knock events."""
    rows = parse_datalog_rows(log_path)
    if not rows:
        return []

    inceptions = detect_knock_inceptions(rows)
    results = []

    for ev in inceptions:
        metrics = analyze_airflow_window(rows, ev["row_idx"], window=6)
        category, explanation = classify_knock_event(ev, metrics)
        results.append({
            "file": os.path.basename(log_path),
            "row": ev["row_idx"],
            "time": ev["time"],
            "delta_knock": ev["delta_knock"],
            "total_knock": ev["total_knock"],
            "rpm": ev["rpm"],
            "load": float(ev["raw_row"].get("Load", 0) or 0),
            "map_kpa": ev["map_kpa"],
            "tps": ev["tps"],
            "timing": ev["timing"],
            "afr": ev["afr"],
            "afrmap": ev["afrmap"],
            "maf_v": ev["maf_v"],
            "mafv_range": metrics["mafv_range"],
            "reversals": metrics["reversals"],
            "tps_range": metrics["tps_range"],
            "category": category,
            "explanation": explanation,
            "raw_row": ev["raw_row"]
        })

    return results


def print_report(results):
    """Prints a structured ASCII report of classified knock events."""
    print("=" * 115)
    print(f"{'BOV FLUTTER VS. TIMING KNOCK DIAGNOSTIC REPORT':^115}")
    print("=" * 115)

    if not results:
        print("\n  [+] ZERO knock inception events (ΔKnockSum > 0) detected across logs! Clean driving.\n")
        print("=" * 115)
        return

    print(
        f"{'Row':>6} | {'Time (s)':>8} | {'RPM':>5} | {'MAP (kPa)':>9} | {'TPS':>5} | "
        f"{'Timing':>6} | {'AFR/Tgt':>11} | {'MAF Swing':>9} | {'Rev':>3} | {'Classification':>18}"
    )
    print("-" * 115)

    counts = {"BOV_FLUTTER": 0, "TRUE_TIMING_KNOCK": 0, "LIFT_OFF_DECEL": 0}

    for r in results:
        counts[r["category"]] = counts.get(r["category"], 0) + 1
        afr_str = f"{r['afr']:4.1f}/{r['afrmap']:4.1f}"
        print(
            f"{r['row']:6d} | {r['time']:8.1f} | {r['rpm']:5.0f} | {r['map_kpa']:9.1f} | {r['tps']:5.1f}% | "
            f"{r['timing']:5.1f}° | {afr_str:>11} | {r['mafv_range']:8.3f}V | {r['reversals']:3d} | [{r['category']:^16}]"
        )

    print("-" * 115)
    print("\nDETAILED EVENT DIAGNOSTICS:")
    for i, r in enumerate(results, 1):
        print(f"\n  [{i}] Row {r['row']} in {r['file']} at t={r['time']:.1f}s:")
        print(f"      Status      : [{r['category']}]")
        print(f"      Telemetry   : {r['rpm']:.0f} RPM | {r['map_kpa']:.1f} kPa | TPS={r['tps']:.1f}% | TimingAdv={r['timing']:.1f}° | AFR={r['afr']:.2f}")
        print(f"      Airflow Dyn : MAF Voltage swing = {r['mafv_range']:.3f}V across window with {r['reversals']} directional reversals")
        print(f"      Root Cause  : {r['explanation']}")

    total = len(results)
    flutter_pct = (counts.get("BOV_FLUTTER", 0) / total) * 100.0
    timing_pct = (counts.get("TRUE_TIMING_KNOCK", 0) / total) * 100.0
    decel_pct = (counts.get("LIFT_OFF_DECEL", 0) / total) * 100.0

    print("\n" + "=" * 115)
    print("SUMMARY & CLASSIFICATION BREAKDOWN:")
    print(f"  • Total Knock Inceptions    : {total}")
    print(f"  • BOV Flutter / Cycling Knock: {counts.get('BOV_FLUTTER', 0):2d} ({flutter_pct:5.1f}%) -> DO NOT RETARD TIMING. Address BOV preload/spring.")
    print(f"  • True Timing / Boost Knock  : {counts.get('TRUE_TIMING_KNOCK', 0):2d} ({timing_pct:5.1f}%) -> MUST RETARD TIMING in timing tables.")
    print(f"  • Lift-Off / Decel Knock     : {counts.get('LIFT_OFF_DECEL', 0):2d} ({decel_pct:5.1f}%) -> Mechanical overrun false knock.")
    print("=" * 115)


def main():
    parser = argparse.ArgumentParser(
        description="Evo X BOV Flutter vs. Timing Knock Classifier"
    )
    parser.add_argument("logs", nargs="+", help="EvoScan CSV datalogs to analyze")
    parser.add_argument("--export-json", default=None, help="Optional path to export JSON results")
    args = parser.parse_args()

    all_results = []
    for log_path in args.logs:
        events = scan_file_for_bov_flutter_knock(log_path)
        all_results.extend(events)

    print_report(all_results)

    if args.export_json:
        with open(args.export_json, "w") as f:
            json.dump(all_results, f, indent=2)
        print(f"[+] Exported classification results to: {args.export_json}")


if __name__ == "__main__":
    main()
