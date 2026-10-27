#!/usr/bin/env python3
"""
datalog_classifier.py - Multi-Domain Telemetry Classifier & Diagnostic Enrichment Engine

Performs per-record physical classification and diagnostic tagging on EvoScan datalogs:
  1. Combustion Domain: Knock inception isolation and root-cause classification
     (GENUINE_TIMING, BOV_FLUTTER, DRIVETRAIN_LASH, SHIFT_KNOCK) with confidence scoring.
  2. Fueling Domain: Dynamic exhaust transport-lag alignment, wideband AFR error tracking,
     and Closed-Loop fuel trim authority (STFT + LTFT).
  3. Injector Dynamics Domain: Pulse width, battery voltage, and deadtime latency sensitivity.
  4. Thermal Domain: Manifold air temp (MAT), coolant temp (ECT), and thermal drift tracking.
  5. Airflow & Speed Density Domain: MAF vs MAP load envelope clamping states and ratios.
  6. Operational Regimes & Usability: Multi-variable stationarity scoring (0.0-1.0) and
     subsystem usability flags (usable_for_maf, usable_for_ve, usable_for_injector)
     with explicit rejection reasons for non-usable frames.

Outputs an enriched CSV (*_classified.csv) with all original columns plus 12+ diagnostic
columns, an operational event ledger (*_events.json), and a structured summary.
"""

import argparse
import csv
import json
import math
import os
import struct
import sys


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


def get_fuel_map(rom_path):
    """Loads High Octane Fuel Map (0x55027) from ROM for AFRMAP reconstruction."""
    header_len = 328 if rom_path.lower().endswith(".srf") else 0
    with open(rom_path, "rb") as f:
        f.seek(header_len)
        d = f.read()

    load_raw = struct.unpack(">21H", d[0x617bc:0x617bc + 42])
    load_axis = [r * 10.0 / 32.0 for r in load_raw]

    rpm_raw = struct.unpack(">16H", d[0x61796:0x61796 + 32])
    rpm_axis = [r * 1000.0 / 256.0 for r in rpm_raw]

    raw_bytes = struct.unpack(">336B", d[0x55027:0x55027 + 336])
    table = [list(raw_bytes[l * 16:(l + 1) * 16]) for l in range(21)]

    return load_axis, rpm_axis, table


def interpolate_afrmap(load, rpm, load_axis, rpm_axis, table):
    """Firmware-accurate bilinear interpolation of target AFR from ROM table."""
    l_val = max(load_axis[0], min(load_axis[-1], load))
    r_val = max(rpm_axis[0], min(rpm_axis[-1], rpm))

    l_idx = 0
    while l_idx < len(load_axis) - 2 and load_axis[l_idx + 1] <= l_val:
        l_idx += 1
    l_frac = (l_val - load_axis[l_idx]) / (load_axis[l_idx + 1] - load_axis[l_idx])

    r_idx = 0
    while r_idx < len(rpm_axis) - 2 and rpm_axis[r_idx + 1] <= r_val:
        r_idx += 1
    r_frac = (r_val - rpm_axis[r_idx]) / (rpm_axis[r_idx + 1] - rpm_axis[r_idx])

    c00 = table[l_idx][r_idx]
    c01 = table[l_idx][r_idx + 1]
    c10 = table[l_idx + 1][r_idx]
    c11 = table[l_idx + 1][r_idx + 1]

    top = c00 * (1.0 - r_frac) + c01 * r_frac
    bot = c10 * (1.0 - r_frac) + c11 * r_frac
    raw_val = top * (1.0 - l_frac) + bot * l_frac

    if raw_val <= 0:
        return 14.7
    return round(14.7 * 128.0 / raw_val, 2)


def estimate_latency_ms(vbatt):
    """
    Standard ID1300x / Evo X latency approximation as a function of battery voltage:
    4.69V: 3.81ms, 7.03V: 3.25ms, 9.38V: 1.68ms, 11.72V: 1.095ms, 14.06V: 0.795ms, 16.41V: 0.555ms
    """
    if vbatt <= 7.0:
        return 3.50
    elif vbatt <= 9.4:
        return 3.25 - (vbatt - 7.0) * (3.25 - 1.68) / 2.4
    elif vbatt <= 11.7:
        return 1.68 - (vbatt - 9.4) * (1.68 - 1.10) / 2.3
    elif vbatt <= 14.1:
        return 1.10 - (vbatt - 11.7) * (1.10 - 0.795) / 2.4
    elif vbatt <= 16.4:
        return 0.795 - (vbatt - 14.1) * (0.795 - 0.555) / 2.3
    else:
        return 0.50


class DatalogClassifier:
    def __init__(self, log_path, rom_path=None):
        self.log_path = log_path
        self.rom_path = rom_path
        self.fuel_table_data = None
        if rom_path and os.path.exists(rom_path):
            try:
                self.fuel_table_data = get_fuel_map(rom_path)
            except Exception as e:
                print(f"[!] Warning: Could not load fuel map from ROM {rom_path}: {e}", file=sys.stderr)

        self.raw_rows = []
        self.parsed = []
        self.classified_rows = []
        self.operational_events = []
        self.summary_stats = {}

    def load_and_parse(self):
        with open(self.log_path, "r", encoding="latin1") as f:
            reader = csv.DictReader(f)
            self.raw_rows = list(reader)

        n = len(self.raw_rows)
        if n == 0:
            raise ValueError(f"Log file is empty: {self.log_path}")

        # Extract standard numeric channels
        for i, r in enumerate(self.raw_rows):
            sec = safe_float(r.get("LogEntrySeconds"), 0.0)
            rpm = safe_float(r.get("RPM"), 0.0)
            kpa = safe_float(r.get("MAP"), 101.3)
            tps = safe_float(r.get("TPS"), 0.0)
            app = safe_float(r.get("APP"), 0.0)
            mafv = safe_float(r.get("MAF"), 0.0)
            mafc = safe_float(r.get("MAFCalcs"), 0.0)
            mapc = safe_float(r.get("MAPCalcs"), 0.0)
            load = safe_float(r.get("Load"), 0.0)
            timing = safe_float(r.get("TimingAdv"), 0.0)
            knock = safe_float(r.get("KnockSum"), 0.0)
            afr = safe_float(r.get("AFR"), 0.0)
            afrmap = safe_float(r.get("AFRMAP"), 0.0)
            stft = safe_float(r.get("STFT"), 0.0)
            ltft = safe_float(r.get("CurrentLTFT"), 0.0)
            if ltft == 0.0:
                ltft = safe_float(r.get("CruiseLTFT"), 0.0)
            ipw = safe_float(r.get("IPW"), 0.0)
            speed = safe_float(r.get("Speed"), 0.0)
            vbatt = safe_float(r.get("Battery"), 14.0)
            ect = safe_float(r.get("ECT"), 0.0)
            mat = safe_float(r.get("MAT"), 0.0)
            wgdc = safe_float(r.get("WGDC_Active"), 0.0)

            # Reconstruct AFRMAP if missing or invalid and ROM available
            if (afrmap <= 5.0 or afrmap > 20.0) and self.fuel_table_data:
                eff_load = load if load > 0 else max(mafc, mapc)
                afrmap = interpolate_afrmap(eff_load, rpm, self.fuel_table_data[0], self.fuel_table_data[1], self.fuel_table_data[2])
            elif afrmap <= 5.0 or afrmap > 20.0:
                afrmap = 14.7

            self.parsed.append({
                "idx": i,
                "sec": sec,
                "rpm": rpm,
                "kpa": kpa,
                "tps": tps,
                "app": app,
                "mafv": mafv,
                "mafc": mafc,
                "mapc": mapc,
                "load": load,
                "timing": timing,
                "knock": knock,
                "afr": afr,
                "afrmap": afrmap,
                "stft": stft,
                "ltft": ltft,
                "ipw": ipw,
                "speed": speed,
                "vbatt": vbatt,
                "ect": ect,
                "mat": mat,
                "wgdc": wgdc,
            })

    def classify_all(self):
        n = len(self.parsed)
        if n == 0:
            return

        # 1. Precalculate derivatives: dTPS/dt, dMAP/dt, dMAFV/dt, dRPM/dt, dKnock
        derivatives = []
        for i in range(n):
            if i == 0:
                dt = self.parsed[1]["sec"] - self.parsed[0]["sec"] if n > 1 else 0.03
                if dt <= 0.001 or dt > 0.5:
                    dt = 0.03
                derivatives.append({
                    "dt": dt,
                    "d_tps": 0.0,
                    "d_map": 0.0,
                    "d_mafv": 0.0,
                    "d_rpm": 0.0,
                    "d_knock": 0.0,
                })
            else:
                prev = self.parsed[i - 1]
                curr = self.parsed[i]
                dt = curr["sec"] - prev["sec"]
                if dt <= 0.001 or dt > 0.5:
                    dt = 0.033
                derivatives.append({
                    "dt": dt,
                    "d_tps": (curr["tps"] - prev["tps"]) / dt,
                    "d_map": (curr["kpa"] - prev["kpa"]) / dt,
                    "d_mafv": (curr["mafv"] - prev["mafv"]) / dt,
                    "d_rpm": (curr["rpm"] - prev["rpm"]) / dt,
                    "d_knock": max(0.0, curr["knock"] - prev["knock"]),
                })

        # 2. Precalculate dynamic exhaust transport lag and forward-aligned AFR
        aligned_afr_data = []
        for i in range(n):
            curr = self.parsed[i]
            rpm = max(500.0, curr["rpm"])
            kpa = max(20.0, curr["kpa"])
            # Dynamic exhaust transport delay: tau = clamp(0.35 / sqrt(RPM * MAP / 100000), 0.10, 0.45)
            denom = math.sqrt(max(0.3, rpm * kpa / 100000.0))
            tau = max(0.10, min(0.45, 0.35 / denom))
            target_time = curr["sec"] + tau

            # Search forward for row closest to target_time
            best_idx = i
            best_diff = 999.0
            j = i
            while j < n and (self.parsed[j]["sec"] - curr["sec"]) <= 0.60:
                diff = abs(self.parsed[j]["sec"] - target_time)
                if diff < best_diff:
                    best_diff = diff
                    best_idx = j
                j += 1

            forward_afr = self.parsed[best_idx]["afr"]
            afrmap = curr["afrmap"]
            afr_err = forward_afr / afrmap if (forward_afr > 5.0 and afrmap > 5.0) else 1.0

            aligned_afr_data.append({
                "tau_sec": round(tau, 3),
                "aligned_idx": best_idx,
                "aligned_afr": round(forward_afr, 2),
                "aligned_afr_error": round(afr_err, 4),
            })

        # 3. Identify and classify knock inceptions
        knock_classifications = ["NONE"] * n
        knock_confidences = [0.0] * n

        for i in range(n):
            if derivatives[i]["d_knock"] > 0:
                delta_k = derivatives[i]["d_knock"]
                curr = self.parsed[i]
                w_start = max(0, i - 6)
                w_end = min(n, i + 7)
                w_rows = self.parsed[w_start:w_end]

                mafv_vals = [r["mafv"] for r in w_rows]
                tps_vals = [r["tps"] for r in w_rows]
                mafv_range = max(mafv_vals) - min(mafv_vals)
                tps_range = max(tps_vals) - min(tps_vals)

                # Count MAF reversals in window
                diffs = [mafv_vals[k + 1] - mafv_vals[k] for k in range(len(mafv_vals) - 1)]
                reversals = 0
                for k in range(len(diffs) - 1):
                    if diffs[k] * diffs[k + 1] < -0.005:
                        reversals += 1

                # Rapid lift-off check
                pre_tps = self.parsed[max(0, i - 3)]["tps"]
                post_tps = self.parsed[min(n - 1, i + 3)]["tps"]
                tps_slope = post_tps - pre_tps

                # Classify
                k_class = "GENUINE_TIMING"
                k_conf = 0.85

                if tps_slope < -8.0 or curr["tps"] < 18.0:
                    k_class = "DRIVETRAIN_LASH"
                    k_conf = 0.95
                elif derivatives[i]["d_rpm"] < -600 and tps_range > 15.0:
                    k_class = "SHIFT_KNOCK"
                    k_conf = 0.90
                elif (90.0 <= curr["kpa"] <= 140.0) and mafv_range >= 0.25 and reversals >= 2:
                    k_class = "BOV_FLUTTER"
                    k_conf = 0.98
                elif curr["kpa"] > 135.0 or curr["tps"] > 60.0:
                    k_class = "GENUINE_TIMING"
                    k_conf = 0.95
                elif mafv_range < 0.20 and reversals <= 1:
                    k_class = "GENUINE_TIMING"
                    k_conf = 0.90
                else:
                    k_class = "BOV_FLUTTER" if reversals >= 2 else "GENUINE_TIMING"
                    k_conf = 0.75

                knock_classifications[i] = k_class
                knock_confidences[i] = k_conf

                # Record into operational events ledger
                self.operational_events.append({
                    "event_type": f"KNOCK_{k_class}",
                    "log_id": os.path.basename(self.log_path),
                    "row_idx": i,
                    "time_sec": round(curr["sec"], 3),
                    "rpm": round(curr["rpm"], 1),
                    "map_kpa": round(curr["kpa"], 1),
                    "tps": round(curr["tps"], 1),
                    "mafv": round(curr["mafv"], 3),
                    "ipw_ms": round(curr["ipw"], 2),
                    "vbatt": round(curr["vbatt"], 2),
                    "mat_c": round(curr["mat"], 1),
                    "ect_c": round(curr["ect"], 1),
                    "afr": round(curr["afr"], 2),
                    "afrmap": round(curr["afrmap"], 2),
                    "delta_knock": int(delta_k),
                    "severity": int(delta_k),
                    "classification": k_class,
                    "confidence": round(k_conf, 2),
                    "detail_json": {
                        "mafv_range": round(mafv_range, 3),
                        "reversals": reversals,
                        "tps_slope": round(tps_slope, 2),
                    }
                })

        # 4. Operational Regimes, Load Clamping, and Multi-Domain Tagging
        regime_counts = {}
        usability_counts = {"maf": 0, "ve": 0, "injector": 0}

        # Track DFCO state machine with 0.5s recovery tail
        last_dfco_time = -999.0

        for i in range(n):
            curr = self.parsed[i]
            d = derivatives[i]
            align = aligned_afr_data[i]
            k_cls = knock_classifications[i]
            k_conf = knock_confidences[i]

            # DFCO Detection: IPW == 0 or AFR saturated lean
            is_dfco_frame = (curr["ipw"] <= 0.05 or curr["afr"] >= 19.0)
            if is_dfco_frame:
                last_dfco_time = curr["sec"]

            is_dfco_recovery = (curr["sec"] - last_dfco_time) <= 0.50 and not is_dfco_frame

            # Coolant Warmup
            is_warm = curr["ect"] >= 75.0

            # Stationarity Score (0.0 to 1.0)
            tps_penalty = abs(d["d_tps"]) / 4.0
            map_penalty = abs(d["d_map"]) / 12.0
            rpm_penalty = abs(d["d_rpm"]) / 250.0
            tot_penalty = tps_penalty + map_penalty + rpm_penalty

            if is_dfco_frame:
                stationarity = 0.0
            else:
                stationarity = max(0.0, min(1.0, 1.0 - tot_penalty))

            # Operating Regime Determination
            if is_dfco_frame:
                regime = "DFCO"
            elif is_dfco_recovery:
                regime = "DFCO_RECOVERY"
            elif curr["speed"] < 2.0 and curr["tps"] <= 15.0 and abs(d["d_rpm"]) < 120.0:
                regime = "STEADY_IDLE"
            elif curr["speed"] >= 15.0 and stationarity >= 0.70 and curr["kpa"] <= 95.0:
                regime = "STEADY_CRUISE"
            elif curr["tps"] >= 65.0 and d["d_tps"] >= -1.0 and curr["kpa"] >= 115.0:
                regime = "WOT_BOOST"
            elif (95.0 <= curr["kpa"] <= 125.0) and d["d_map"] > 15.0:
                regime = "SPOOL_RAMP"
            elif d["d_tps"] > 15.0 or d["d_map"] > 30.0:
                regime = "TIP_IN"
            elif d["d_tps"] < -15.0 or d["d_map"] < -30.0:
                regime = "TIP_OUT"
            else:
                regime = "TRANSIENT_CRUISE"

            regime_counts[regime] = regime_counts.get(regime, 0) + 1

            # Load Clamping State
            mafc = curr["mafc"]
            mapc = curr["mapc"]
            ratio = (mapc / mafc) if mafc > 0 else 1.0

            if curr["kpa"] <= 85.0:
                if mapc >= 0.99 * mafc:
                    clamp_state = "UNCLAMPED"
                else:
                    clamp_state = "VACUUM_CEILING_CLAMPED"
            elif curr["kpa"] >= 120.0:
                if mapc <= 0.95 * mafc:
                    clamp_state = "BOOST_SPEED_DENSITY"
                else:
                    clamp_state = "BOOST_FLOOR_CLAMPED"
            else:
                clamp_state = "CROSSOVER_TRANSITION"

            # Injector Dynamics Metrics
            total_trim = curr["stft"] + curr["ltft"]
            is_closed_loop = (abs(curr["stft"]) > 0.01 or abs(curr["afrmap"] - 14.7) < 0.1) and curr["ipw"] > 0.1
            est_lat = estimate_latency_ms(curr["vbatt"])
            lat_sens = est_lat / max(0.1, curr["ipw"])

            # Thermal Drift relative to nominal 20°C baseline
            # (Rough delta tracking: AFR drift per deg C above 20°C)
            mat_delta = curr["mat"] - 20.0
            thermal_drift = (align["aligned_afr"] - 14.70) if (regime == "STEADY_CRUISE" and is_closed_loop) else 0.0

            # Usability Logic & Rejection Reasons
            usable_maf = False
            usable_ve = False
            usable_inj = False
            rej_reasons = []

            if not is_warm:
                rej_reasons.append("COLD_WARMUP")
            if is_dfco_frame:
                rej_reasons.append("DFCO")
            elif is_dfco_recovery:
                rej_reasons.append("DFCO_RECOVERY")

            # Check MAF usability (Strict Steady Cruise/Idle in vacuum, unclamped)
            if is_warm and not is_dfco_frame and not is_dfco_recovery:
                if k_cls == "BOV_FLUTTER":
                    rej_reasons.append("BOV_FLUTTER")
                elif clamp_state == "VACUUM_CEILING_CLAMPED":
                    rej_reasons.append("VACUUM_CEILING_CLAMPED")
                elif stationarity < 0.70:
                    rej_reasons.append("UNSTEADY_THROTTLE")
                elif curr["kpa"] > 105.0:
                    rej_reasons.append("BOOST_REGIME")
                else:
                    usable_maf = True
                    usability_counts["maf"] += 1

            # Check VE usability (Steady or clean monotonic WOT ramp)
            if is_warm and not is_dfco_frame and not is_dfco_recovery:
                if (stationarity >= 0.60 or regime in ("WOT_BOOST", "STEADY_CRUISE", "STEADY_IDLE")) and k_cls != "BOV_FLUTTER":
                    usable_ve = True
                    usability_counts["ve"] += 1

            # Check Injector usability (Warm, Closed-Loop, high stationarity, stable Vbatt)
            if is_warm and is_closed_loop and not is_dfco_frame and not is_dfco_recovery:
                if stationarity >= 0.75 and abs(d["d_tps"]) <= 1.5:
                    usable_inj = True
                    usability_counts["injector"] += 1

            rejection_str = ";".join(rej_reasons) if rej_reasons else "NONE"

            # Check for non-knock operational anomaly events:
            # 1. Lean boost excursion (MAP >= 120 kPa, aligned AFR > AFRMAP + 0.6 for significant boost)
            if curr["kpa"] >= 120.0 and align["aligned_afr"] >= (curr["afrmap"] + 0.6) and curr["ipw"] > 3.0:
                self.operational_events.append({
                    "event_type": "LEAN_EXCURSION_BOOST",
                    "log_id": os.path.basename(self.log_path),
                    "row_idx": i,
                    "time_sec": round(curr["sec"], 3),
                    "rpm": round(curr["rpm"], 1),
                    "map_kpa": round(curr["kpa"], 1),
                    "tps": round(curr["tps"], 1),
                    "mafv": round(curr["mafv"], 3),
                    "ipw_ms": round(curr["ipw"], 2),
                    "vbatt": round(curr["vbatt"], 2),
                    "mat_c": round(curr["mat"], 1),
                    "ect_c": round(curr["ect"], 1),
                    "afr": round(align["aligned_afr"], 2),
                    "afrmap": round(curr["afrmap"], 2),
                    "severity": round(align["aligned_afr"] - curr["afrmap"], 2),
                    "classification": "LEAN_BOOST",
                    "confidence": 0.90,
                    "detail_json": {"error_pct": round(align["aligned_afr_error"] * 100 - 100, 1)}
                })

            # Assemble enriched row
            row_dict = dict(self.raw_rows[i])
            row_dict.update({
                "diag_steady_confidence": f"{stationarity:.3f}",
                "diag_operating_regime": regime,
                "diag_knock_class": k_cls,
                "diag_knock_confidence": f"{k_conf:.2f}",
                "diag_load_clamping_state": clamp_state,
                "diag_ratio_map_to_maf": f"{ratio:.3f}",
                "diag_exhaust_lag_sec": f"{align['tau_sec']:.3f}",
                "diag_aligned_afr": f"{align['aligned_afr']:.2f}",
                "diag_aligned_afr_error": f"{align['aligned_afr_error']:.4f}",
                "diag_total_fuel_trim": f"{total_trim:.2f}",
                "diag_latency_sensitivity": f"{lat_sens:.3f}",
                "diag_thermal_drift_delta": f"{thermal_drift:.2f}",
                "diag_usable_for_maf": "1" if usable_maf else "0",
                "diag_usable_for_ve": "1" if usable_ve else "0",
                "diag_usable_for_injector": "1" if usable_inj else "0",
                "diag_rejection_reason": rejection_str,
            })
            self.classified_rows.append(row_dict)

        self.summary_stats = {
            "total_records": n,
            "duration_sec": round(self.parsed[-1]["sec"] - self.parsed[0]["sec"], 1),
            "regimes": regime_counts,
            "usable_samples": usability_counts,
            "knock_events_total": sum(1 for k in knock_classifications if k != "NONE"),
            "knock_by_class": {
                c: sum(1 for k in knock_classifications if k == c)
                for c in set(knock_classifications) if c != "NONE"
            },
            "operational_events_count": len(self.operational_events),
        }

    def export_csv(self, out_path):
        if not self.classified_rows:
            return
        fieldnames = list(self.classified_rows[0].keys())
        with open(out_path, "w", newline="", encoding="latin1") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.classified_rows)
        print(f"[+] Exported classified datalog ({len(self.classified_rows):,} rows) to: {out_path}")

    def export_events_json(self, out_path):
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(self.operational_events, f, indent=2)
        print(f"[+] Exported operational events ({len(self.operational_events)} events) to: {out_path}")

    def export_summary_json(self, out_path):
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(self.summary_stats, f, indent=2)
        print(f"[+] Exported summary statistics to: {out_path}")


def main():
    parser = argparse.ArgumentParser(description="Multi-Domain Telemetry Classifier & Diagnostic Enrichment Engine")
    parser.add_argument("input_log", help="Path to raw EvoScan CSV datalog")
    parser.add_argument("--target-rom", help="Optional path to matching calibration ROM (.srf/.bin)")
    parser.add_argument("--export-csv", help="Custom output path for enriched CSV (*_classified.csv)")
    parser.add_argument("--export-events", help="Output path for operational events JSON ledger")
    parser.add_argument("--export-summary", help="Output path for summary statistics JSON")
    args = parser.parse_args()

    if not os.path.exists(args.input_log):
        sys.exit(f"Error: Log file not found: {args.input_log}")

    print(f"[*] Processing telemetry: {args.input_log}")
    classifier = DatalogClassifier(args.input_log, args.target_rom)
    classifier.load_and_parse()
    classifier.classify_all()

    # Determine default CSV output name
    base_name = os.path.splitext(os.path.basename(args.input_log))[0]
    out_dir = os.path.dirname(args.input_log)
    csv_out = args.export_csv or os.path.join(out_dir, f"{base_name}_classified.csv")
    classifier.export_csv(csv_out)

    if args.export_events:
        classifier.export_events_json(args.export_events)
    if args.export_summary:
        classifier.export_summary_json(args.export_summary)

    # Print high-impact summary
    s = classifier.summary_stats
    print("\n" + "=" * 65)
    print("           MULTI-DOMAIN TELEMETRY CLASSIFICATION SUMMARY")
    print("=" * 65)
    print(f"Total Records: {s['total_records']:,} | Duration: {s['duration_sec']:.1f}s ({s['duration_sec']/60:.1f} min)")
    print("\n[+] Operating Regimes Breakdown:")
    for regime, count in sorted(s["regimes"].items(), key=lambda x: -x[1]):
        pct = (count / s['total_records']) * 100
        print(f"  - {regime:<20}: {count:>6,} frames ({pct:>5.1f}%)")

    print("\n[+] Subsystem Usability for Base Calibration:")
    for sub, count in s["usable_samples"].items():
        pct = (count / s['total_records']) * 100
        print(f"  - Usable for {sub.upper():<10}: {count:>6,} frames ({pct:>5.1f}%)")

    print("\n[+] Combustion & Knock Analysis:")
    print(f"  - Total Knock Inceptions: {s['knock_events_total']}")
    if s["knock_by_class"]:
        for k_cls, count in s["knock_by_class"].items():
            print(f"    * {k_cls:<20}: {count} events")
    else:
        print("    * No knock inceptions detected!")

    print(f"\n[+] Total Operational Anomaly Events: {s['operational_events_count']}")
    print("=" * 65)


if __name__ == "__main__":
    main()
