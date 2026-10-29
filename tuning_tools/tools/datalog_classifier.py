#!/usr/bin/env python3
"""
datalog_classifier.py - Multi-Domain Telemetry Classifier & Diagnostic Enrichment Engine

Performs per-record physical classification and diagnostic tagging on EvoScan datalogs:
  1. ROM Table Precomputations: Directly evaluates and appends the ECU ROM calibration table
     calling values for every row (MAF scaling, 3D MAP VE load, MAT vs MAP comp multiplier,
     High/Low Octane timing targets, total timing retard, battery latency, and AFRMAP target).
  2. Gear & Transmission Domain: RPM/Speed ratio gear detection (Gears 1-5, Neutral, Stationary)
     and shift transition flagging.
  3. Decel Overrun & Fuel Leakage Domain: Closed-throttle overrun decel fuel cut (DFCO) status,
     detecting unexpected fueling leakage when injectors should be cut off.
  4. Speed Smoothing & Virtual Dyno Domain: 5-frame moving-average smoothed speed, continuous
     longitudinal acceleration (G-force), and calculated instantaneous Wheel HP (WHP) and Torque (WTQ).
  5. MIVEC VVT & Drive-By-Wire Domain: Intake/Exhaust cam target tracking error, DBW pedal vs blade
     throttle cut detection, and Injector Duty Cycle (IDC) headroom monitoring.
  6. Combustion Domain: Knock inception isolation and root-cause classification
     (GENUINE_TIMING, BOV_FLUTTER, DRIVETRAIN_LASH, SHIFT_KNOCK) with confidence scoring.
  7. Fueling & Transport Lag Domain: Dynamic exhaust transport-lag alignment, wideband AFR error,
     and Closed-Loop fuel trim authority (STFT + LTFT).
  8. Airflow & Speed Density Domain: MAF vs MAP load envelope clamping states and ratios.

Outputs an enriched CSV (*_classified.csv) with all original columns plus 25+ diagnostic
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


def interp1d(x_val, xp, fp):
    """1D piecewise linear interpolation with boundary clamping."""
    if not xp or not fp or len(xp) != len(fp):
        return 0.0
    if x_val <= xp[0]:
        return float(fp[0])
    if x_val >= xp[-1]:
        return float(fp[-1])
    for i in range(len(xp) - 1):
        if xp[i] <= x_val <= xp[i + 1]:
            x0, x1 = xp[i], xp[i + 1]
            y0, y1 = fp[i], fp[i + 1]
            if x1 == x0:
                return float(y0)
            return float(y0 + (x_val - x0) * (y1 - y0) / (x1 - x0))
    return float(fp[-1])


def interp2d(x_val, y_val, x_axis, y_axis, grid):
    """
    Bilinear 2D interpolation with boundary clamping.
    grid is 2D list: grid[row_y][col_x]
    """
    if not x_axis or not y_axis or not grid:
        return 0.0

    x_clamped = max(x_axis[0], min(x_axis[-1], x_val))
    y_clamped = max(y_axis[0], min(y_axis[-1], y_val))

    # Bracket X (cols)
    xi = 0
    while xi < len(x_axis) - 2 and x_axis[xi + 1] <= x_clamped:
        xi += 1
    x_frac = (x_clamped - x_axis[xi]) / (x_axis[xi + 1] - x_axis[xi]) if x_axis[xi + 1] != x_axis[xi] else 0.0

    # Bracket Y (rows)
    yi = 0
    while yi < len(y_axis) - 2 and y_axis[yi + 1] <= y_clamped:
        yi += 1
    y_frac = (y_clamped - y_axis[yi]) / (y_axis[yi + 1] - y_axis[yi]) if y_axis[yi + 1] != y_axis[yi] else 0.0

    c00 = grid[yi][xi]
    c01 = grid[yi][xi + 1]
    c10 = grid[yi + 1][xi]
    c11 = grid[yi + 1][xi + 1]

    top = c00 * (1.0 - x_frac) + c01 * x_frac
    bot = c10 * (1.0 - x_frac) + c11 * x_frac
    return float(top * (1.0 - y_frac) + bot * y_frac)


class RomTableEvaluator:
    """Extracts and evaluates ECU ROM tables directly for telemetry row augmentation."""
    def __init__(self, rom_path):
        self.rom_path = rom_path
        self.loaded = False
        self.load_rom()

    def load_rom(self):
        if not self.rom_path or not os.path.exists(self.rom_path):
            return
        header_len = 328 if self.rom_path.lower().endswith(".srf") else 0
        with open(self.rom_path, "rb") as f:
            f.seek(header_len)
            d = f.read()

        try:
            # 1. MAF Scaling Horizontal (0x5757A) + Volts (0x61FD0)
            maf_raw = struct.unpack(">130H", d[0x5757A:0x5757A + 260])
            v_raw = struct.unpack(">130H", d[0x61FD0:0x61FD0 + 260])
            self.maf_volts = [round(x * 5.0 / 1023.0, 3) for x in v_raw]
            self.maf_vals = [x / 100.0 for x in maf_raw]

            # 2. MAP based Load Calc #1 (0x608AE) + MAP axis (0x6344A) + RPM axis (0x6341E)
            m_axis_raw = struct.unpack(">20H", d[0x6344A:0x6344A + 40])
            self.map_kpa_axis = [round(((x * 2556.0 / 3800.0) + 0.5) / 2.0, 1) for x in m_axis_raw]
            r_axis_raw = struct.unpack(">19H", d[0x6341E:0x6341E + 38])
            self.rpm_map_axis = [round(x * 1000.0 / 256.0) for x in r_axis_raw]
            raw_map = struct.unpack(">380H", d[0x608AE:0x608AE + 760])
            # Grid stored column-major: map_col * 19 + rpm_row -> grid[row_rpm][col_map]
            self.map_load_grid = [[(raw_map[m * 19 + r] * 10.0 / 512.0) * 10.0 / 32.0 for m in range(20)] for r in range(19)]

            # 3. High Octane Fuel Map (0x55027) + Load axis (0x617BC) + RPM axis (0x61796)
            load_fuel_raw = struct.unpack(">21H", d[0x617BC:0x617BC + 42])
            self.load_fuel_axis = [r * 10.0 / 32.0 for r in load_fuel_raw]
            rpm_fuel_raw = struct.unpack(">16H", d[0x61796:0x61796 + 32])
            self.rpm_fuel_axis = [r * 1000.0 / 256.0 for r in rpm_fuel_raw]
            raw_fuel = struct.unpack(">336B", d[0x55027:0x55027 + 336])
            self.fuel_grid = [[14.7 * 128.0 / max(1, raw_fuel[l * 16 + r]) for r in range(16)] for l in range(21)]

            # 4. High & Low Octane Timing (0x55957, 0x55B59) + Load axis (0x61836) + RPM axis (0x61802)
            load_tim_raw = struct.unpack(">22H", d[0x61836:0x61836 + 44])
            self.load_tim_axis = [round(r * 10.0 / 32.0, 1) for r in load_tim_raw]
            rpm_tim_raw = struct.unpack(">23H", d[0x61802:0x61802 + 46])
            self.rpm_tim_axis = [round(r * 1000.0 / 256.0) for r in rpm_tim_raw]
            raw_hitim = struct.unpack(">506b", d[0x55957:0x55957 + 506])
            raw_lotim = struct.unpack(">506b", d[0x55B59:0x55B59 + 506])
            # Timing stored column-major: load_col * 23 + rpm_row -> grid[row_rpm][col_load]
            self.hitim_grid = [[float(raw_hitim[c * 23 + r]) for c in range(22)] for r in range(23)]
            self.lotim_grid = [[float(raw_lotim[c * 23 + r]) for c in range(22)] for r in range(23)]

            # 5. Fuel Compensation MAT vs MAP (0x60FCD) + MAT axis (0x634C0) + MAP axis (0x634D4)
            mat_raw = struct.unpack(">7H", d[0x634C0:0x634C0 + 14])
            self.mat_axis = [x - 40 for x in mat_raw]  # -10, 5, 20, 40, 60, 80, 100 C
            map_mat_raw = struct.unpack(">10H", d[0x634D4:0x634D4 + 20])
            self.map_mat_axis = [round(((x * 2556.0 / 3800.0) + 0.5) / 2.0, 1) for x in map_mat_raw]
            raw_mat = struct.unpack(">70B", d[0x60FCD:0x60FCD + 70])
            # Stored column-major: map_col * 7 + mat_row -> grid[row_mat][col_map]
            self.mat_comp_grid = [[(raw_mat[m * 7 + r] + 385.0) / 512.0 * 100.0 for m in range(10)] for r in range(7)]

            # 6. Injector Latency vs Battery Voltage (0x556D0)
            self.vbatt_axis = [4.69, 7.03, 9.38, 11.72, 14.06, 16.41, 18.66]
            raw_lat = struct.unpack(">7B", d[0x556D0:0x556D0 + 7])
            self.latency_vals = [r * 0.015 for r in raw_lat]

            self.loaded = True
        except Exception as e:
            print(f"[!] Warning: Could not fully parse tables from ROM {self.rom_path}: {e}", file=sys.stderr)

    def eval_maf(self, mafv):
        if not self.loaded:
            return 0.0
        return round(interp1d(mafv, self.maf_volts, self.maf_vals), 2)

    def eval_map_load_calc(self, rpm, kpa):
        if not self.loaded:
            return 0.0
        return round(interp2d(kpa, rpm, self.map_kpa_axis, self.rpm_map_axis, self.map_load_grid), 1)

    def eval_mat_comp(self, mat, kpa):
        if not self.loaded:
            return 100.0
        return round(interp2d(kpa, mat, self.map_mat_axis, self.mat_axis, self.mat_comp_grid), 2)

    def eval_afrmap(self, load, rpm):
        if not self.loaded:
            return 14.7
        return round(interp2d(rpm, load, self.rpm_fuel_axis, self.load_fuel_axis, self.fuel_grid), 2)

    def eval_timing_high(self, load, rpm):
        if not self.loaded:
            return 0.0
        return round(interp2d(load, rpm, self.load_tim_axis, self.rpm_tim_axis, self.hitim_grid), 1)

    def eval_timing_low(self, load, rpm):
        if not self.loaded:
            return 0.0
        return round(interp2d(load, rpm, self.load_tim_axis, self.rpm_tim_axis, self.lotim_grid), 1)

    def eval_latency(self, vbatt):
        if not self.loaded:
            return 0.795
        return round(interp1d(vbatt, self.vbatt_axis, self.latency_vals), 3)


class DatalogClassifier:
    def __init__(self, log_path, rom_path=None):
        self.log_path = log_path
        self.rom_path = rom_path
        self.rom_evaluator = RomTableEvaluator(rom_path) if rom_path else None

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
            invvt_tgt = safe_float(r.get("InVVTtarget"), 0.0)
            exvvt_tgt = safe_float(r.get("ExVVTtarget"), 0.0)
            invvt_act = safe_float(r.get("InVVTactual"), 0.0)
            exvvt_act = safe_float(r.get("ExVVTactual"), 0.0)

            # Reconstruct AFRMAP if missing or invalid using ROM evaluator
            if (afrmap <= 5.0 or afrmap > 20.0) and self.rom_evaluator and self.rom_evaluator.loaded:
                eff_load = load if load > 0 else max(mafc, mapc)
                afrmap = self.rom_evaluator.eval_afrmap(eff_load, rpm)
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
                "invvt_tgt": invvt_tgt,
                "exvvt_tgt": exvvt_tgt,
                "invvt_act": invvt_act,
                "exvvt_act": exvvt_act,
            })

    def classify_all(self):
        n = len(self.parsed)
        if n == 0:
            return

        # 1. Continuous Physical Derivatives
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

        # 2. Dynamic Exhaust Transport Delay & Forward-Aligned AFR
        aligned_afr_data = []
        for i in range(n):
            curr = self.parsed[i]
            rpm = max(500.0, curr["rpm"])
            kpa = max(20.0, curr["kpa"])
            denom = math.sqrt(max(0.3, rpm * kpa / 100000.0))
            tau = max(0.10, min(0.45, 0.35 / denom))
            target_time = curr["sec"] + tau

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

        # 3. Knock Inceptions & Root-Cause Classification
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

                diffs = [mafv_vals[k + 1] - mafv_vals[k] for k in range(len(mafv_vals) - 1)]
                reversals = 0
                for k in range(len(diffs) - 1):
                    if diffs[k] * diffs[k + 1] < -0.005:
                        reversals += 1

                pre_tps = self.parsed[max(0, i - 3)]["tps"]
                post_tps = self.parsed[min(n - 1, i + 3)]["tps"]
                tps_slope = post_tps - pre_tps

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

        # 4. Speed Smoothing & Longitudinal Acceleration
        # 5-frame moving average of vehicle speed + centered ~0.4s slope to suppress 1 km/h VSS quantization steps
        smooth_speeds = []
        for i in range(n):
            w_start = max(0, i - 2)
            w_end = min(n, i + 3)
            sub = [self.parsed[k]["speed"] for k in range(w_start, w_end)]
            smooth_speeds.append(sum(sub) / len(sub))

        smooth_accels_g = [0.0] * n
        for i in range(1, n):
            w_lo = max(0, i - 4)
            w_hi = min(n - 1, i + 4)
            dt_win = self.parsed[w_hi]["sec"] - self.parsed[w_lo]["sec"]
            if dt_win > 0.05:
                dv_ms = (smooth_speeds[w_hi] - smooth_speeds[w_lo]) / 3.6
                a_ms2 = dv_ms / dt_win
            else:
                dt = derivatives[i]["dt"]
                dv_ms = (smooth_speeds[i] - smooth_speeds[i - 1]) / 3.6
                a_ms2 = dv_ms / dt if dt > 0.001 else 0.0
            smooth_accels_g[i] = max(-1.5, min(1.5, a_ms2 / 9.80665))

        # 5. Gear Detection (USDM 5MT: Final Drive 4.687, Circumference ~2.03m)
        gear_labels = []
        shift_flags = []
        for i in range(n):
            curr = self.parsed[i]
            rpm = curr["rpm"]
            spd = smooth_speeds[i]
            d = derivatives[i]

            if spd < 3.5:
                gear_labels.append("IDLE_STATIONARY")
                shift_flags.append(0)
            else:
                ratio = rpm / max(1.0, spd)
                # Check gear ratio bounds
                if 115.0 <= ratio <= 155.0:
                    gear = "1"
                elif 72.0 <= ratio <= 98.0:
                    gear = "2"
                elif 51.0 <= ratio <= 69.0:
                    gear = "3"
                elif 38.0 <= ratio <= 50.0:
                    gear = "4"
                elif 27.0 <= ratio <= 37.0:
                    gear = "5"
                else:
                    gear = "NEUTRAL"

                # Check if shifting (clutch disengagement / RPM plunge during rolling)
                is_shifting = 0
                if gear == "NEUTRAL" or (d["d_rpm"] < -450.0 and curr["tps"] < 25.0 and spd > 15.0):
                    is_shifting = 1

                gear_labels.append(gear)
                shift_flags.append(is_shifting)

        # 6. Decel Overrun Fuel Leakage Diagnostics
        decel_statuses = []
        last_dfco_time = -999.0
        last_overrun_event_sec = -999.0
        closed_pedal_start_sec = None
        has_app = ("APP" in self.raw_rows[0]) if self.raw_rows else False
        min_app = min((r["app"] for r in self.parsed if r["app"] >= 0.0), default=0.0)

        for i in range(n):
            curr = self.parsed[i]
            spd = smooth_speeds[i]
            rpm = curr["rpm"]
            tps = curr["tps"]
            ipw = curr["ipw"]
            sec = curr["sec"]
            gear = gear_labels[i]
            is_shifting = shift_flags[i]
            align_afr = aligned_afr_data[i]["aligned_afr"]

            is_closed_pedal = (curr["app"] <= min_app + 1.5) if (has_app and curr["app"] >= 0.0) else (tps <= 14.5)
            if is_closed_pedal:
                if closed_pedal_start_sec is None:
                    closed_pedal_start_sec = sec
            else:
                closed_pedal_start_sec = None

            is_dfco_cut = (ipw <= 0.05) or (is_closed_pedal and (curr["afr"] >= 19.0 or align_afr >= 19.0))
            if is_dfco_cut:
                last_dfco_time = sec

            is_recovery = ((sec - last_dfco_time) <= 0.50) and not is_dfco_cut
            in_gear_driving = (gear in ("1", "2", "3", "4", "5")) and (is_shifting == 0)

            if is_closed_pedal and spd > 12.0 and rpm > 1200.0:
                if is_dfco_cut:
                    status = "CUT_ACTIVE"
                elif in_gear_driving:
                    closed_dur = (sec - closed_pedal_start_sec) if closed_pedal_start_sec is not None else 0.0
                    if rpm < 1900.0 or curr["ect"] < 68.0:
                        status = "DFCO_LOW_RPM_RESUME"
                    elif closed_dur <= 1.25:
                        status = "DFCO_ENTRY_DELAY"
                    else:
                        status = "UNEXPECTED_FUELING"
                        if (sec - last_overrun_event_sec) >= 1.0:
                            last_overrun_event_sec = sec
                            self.operational_events.append({
                                "event_type": "OVERRUN_FUEL_LEAKAGE",
                                "log_id": os.path.basename(self.log_path),
                                "row_idx": i,
                                "time_sec": round(sec, 3),
                                "rpm": round(rpm, 1),
                                "map_kpa": round(curr["kpa"], 1),
                                "tps": round(tps, 1),
                                "mafv": round(curr["mafv"], 3),
                                "ipw_ms": round(ipw, 2),
                                "vbatt": round(curr["vbatt"], 2),
                                "mat_c": round(curr["mat"], 1),
                                "ect_c": round(curr["ect"], 1),
                                "afr": round(curr["afr"], 2),
                                "afrmap": round(curr["afrmap"], 2),
                                "severity": round(ipw, 2),
                                "classification": "DECEL_INJECTOR_LEAK",
                                "confidence": 0.90,
                                "detail_json": {
                                    "ipw_during_decel": round(ipw, 2),
                                    "closed_pedal_sec": round(closed_dur, 2),
                                    "gear": gear,
                                }
                            })
                else:
                    status = "COAST_NEUTRAL"
            elif is_recovery:
                status = "DFCO_RECOVERY"
            else:
                status = "NORMAL_DRIVING"

            decel_statuses.append(status)

        # 7. Virtual Dyno Horsepower & Wheel Torque Calculation
        # Vehicle physics constants (2013 Evo X 5MT)
        M_VEHICLE = 1705.0        # kg (curb + driver)
        RHO_AIR = 1.204          # kg/m3
        CD_AERO = 0.35           # Drag coefficient
        AREA_FRONT = 2.29        # m2 frontal area
        CRR_ROLLING = 0.015      # Rolling resistance coefficient

        wheel_hps = []
        wheel_tqs = []
        dyno_usables = []

        for i in range(n):
            curr = self.parsed[i]
            spd_kmh = smooth_speeds[i]
            v_ms = spd_kmh / 3.6
            a_g = smooth_accels_g[i]
            a_ms2 = a_g * 9.80665
            rpm = curr["rpm"]
            gear = gear_labels[i]
            shift = shift_flags[i]

            # Calculate tractive forces when in gear and not shifting
            if gear in ("1", "2", "3", "4", "5") and shift == 0 and curr["tps"] >= 20.0:
                f_inertial = M_VEHICLE * a_ms2
                f_aero = 0.5 * RHO_AIR * CD_AERO * AREA_FRONT * (v_ms ** 2)
                f_roll = CRR_ROLLING * M_VEHICLE * 9.80665
                f_total = f_inertial + f_aero + f_roll
                power_w = max(0.0, f_total * v_ms)
                whp = power_w / 745.7
                wtq = (whp * 5252.0 / max(1.0, rpm)) if rpm > 500.0 else 0.0
            else:
                whp = 0.0
                wtq = 0.0

            # Usable for clean street/dyno pull: 2nd, 3rd, or 4th gear, brisk/WOT boost pull, non-shifting, warm
            is_dyno = (gear in ("2", "3", "4") and curr["tps"] >= 45.0 and curr["kpa"] >= 120.0
                       and 0.05 <= a_g <= 0.90 and shift == 0 and curr["ect"] >= 75.0)

            wheel_hps.append(round(whp, 1) if whp > 5.0 else 0.0)
            wheel_tqs.append(round(wtq, 1) if wtq > 5.0 else 0.0)
            dyno_usables.append(1 if is_dyno else 0)

        # 8. Multi-Domain Assembly & ROM Table Lookups
        regime_counts = {}
        decel_counts = {}
        usability_counts = {"maf": 0, "ve": 0, "injector": 0, "dyno": 0}
        last_lean_boost_sec = -999.0
        last_high_idc_sec = -999.0

        for i in range(n):
            curr = self.parsed[i]
            d = derivatives[i]
            align = aligned_afr_data[i]
            k_cls = knock_classifications[i]
            k_conf = knock_confidences[i]
            spd = smooth_speeds[i]
            accel_g = smooth_accels_g[i]
            gear = gear_labels[i]
            shift = shift_flags[i]
            decel = decel_statuses[i]
            decel_counts[decel] = decel_counts.get(decel, 0) + 1

            # DFCO & Warmup
            is_dfco_frame = (decel == "CUT_ACTIVE")
            is_dfco_recovery = (decel == "DFCO_RECOVERY")
            is_dfco_entry = (decel == "DFCO_ENTRY_DELAY")
            is_overrun_leak = (decel == "UNEXPECTED_FUELING")
            is_warm = curr["ect"] >= 75.0

            # Stationarity Score (0.0 to 1.0)
            tps_penalty = abs(d["d_tps"]) / 4.0
            map_penalty = abs(d["d_map"]) / 12.0
            rpm_penalty = abs(d["d_rpm"]) / 250.0
            tot_penalty = tps_penalty + map_penalty + rpm_penalty
            stationarity = 0.0 if is_dfco_frame else max(0.0, min(1.0, 1.0 - tot_penalty))

            # Operational Regime Determination
            if is_dfco_frame:
                regime = "DFCO"
            elif is_dfco_recovery:
                regime = "DFCO_RECOVERY"
            elif is_dfco_entry or is_overrun_leak:
                regime = "OVERRUN_DECEL"
            elif spd < 2.0 and curr["tps"] <= 15.0 and abs(d["d_rpm"]) < 120.0:
                regime = "STEADY_IDLE"
            elif spd >= 15.0 and stationarity >= 0.70 and curr["kpa"] <= 95.0 and shift == 0:
                regime = "STEADY_CRUISE"
            elif curr["tps"] >= 65.0 and d["d_tps"] >= -1.0 and curr["kpa"] >= 115.0 and shift == 0:
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
                clamp_state = "UNCLAMPED" if mapc >= 0.99 * mafc else "VACUUM_CEILING_CLAMPED"
            elif curr["kpa"] >= 120.0:
                clamp_state = "BOOST_SPEED_DENSITY" if mapc <= 0.95 * mafc else "BOOST_FLOOR_CLAMPED"
            else:
                clamp_state = "CROSSOVER_TRANSITION"

            # Fuel Trims & Injector Dynamics (4-stroke cycle = 120,000 / RPM ms -> IDC% = RPM * IPW_ms / 1200.0)
            total_trim = curr["stft"] + curr["ltft"]
            is_closed_loop = (abs(curr["stft"]) > 0.01 or abs(curr["afrmap"] - 14.7) < 0.1) and curr["ipw"] > 0.1
            idc_pct = (curr["rpm"] * curr["ipw"]) / 1200.0

            # MIVEC & DBW Mismatches
            in_vvt_err = curr["invvt_act"] - curr["invvt_tgt"]
            ex_vvt_err = curr["exvvt_act"] - curr["exvvt_tgt"]
            dbw_cut = curr["app"] - curr["tps"]

            # ROM Table Calling Values Precomputations
            rom_maf_gs = 0.0
            rom_map_ve = 0.0
            rom_mat_comp = 100.0
            rom_afrmap = curr["afrmap"]
            rom_hi_tim = 0.0
            rom_lo_tim = 0.0
            rom_tim_retard = 0.0
            rom_latency = 0.795

            if self.rom_evaluator and self.rom_evaluator.loaded:
                rom_maf_gs = self.rom_evaluator.eval_maf(curr["mafv"])
                rom_map_ve = self.rom_evaluator.eval_map_load_calc(curr["rpm"], curr["kpa"])
                rom_mat_comp = self.rom_evaluator.eval_mat_comp(curr["mat"], curr["kpa"])
                rom_afrmap = self.rom_evaluator.eval_afrmap(curr["load"] if curr["load"] > 0 else max(mafc, mapc), curr["rpm"])
                rom_hi_tim = self.rom_evaluator.eval_timing_high(curr["load"], curr["rpm"])
                rom_lo_tim = self.rom_evaluator.eval_timing_low(curr["load"], curr["rpm"])
                rom_tim_retard = round(curr["timing"] - rom_hi_tim, 1)
                rom_latency = self.rom_evaluator.eval_latency(curr["vbatt"])

            # Detect Lean Boost Excursion & High IDC Warning
            if (is_warm and not is_dfco_frame and not is_dfco_recovery and shift == 0
                    and curr["kpa"] >= 135.0 and curr["tps"] >= 50.0 and align["aligned_afr_error"] >= 1.06):
                if (curr["sec"] - last_lean_boost_sec) >= 1.0:
                    last_lean_boost_sec = curr["sec"]
                    self.operational_events.append({
                        "event_type": "LEAN_BOOST_EXCURSION",
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
                        "severity": round((align["aligned_afr_error"] - 1.0) * 100.0, 2),
                        "classification": "LEAN_UNDER_BOOST",
                        "confidence": 0.92,
                        "detail_json": {
                            "aligned_afr_error": round(align["aligned_afr_error"], 4),
                            "rom_map_ve_load": round(rom_map_ve, 1),
                            "gear": gear,
                        }
                    })

            if idc_pct >= 85.0 and (curr["sec"] - last_high_idc_sec) >= 2.0:
                last_high_idc_sec = curr["sec"]
                self.operational_events.append({
                    "event_type": "HIGH_IDC_WARNING",
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
                    "severity": round(idc_pct, 1),
                    "classification": "INJECTOR_DUTY_HIGH",
                    "confidence": 0.99,
                    "detail_json": {"idc_pct": round(idc_pct, 1), "gear": gear}
                })

            # Usability Flags & Rejection Reasons
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
            elif is_dfco_entry:
                rej_reasons.append("DFCO_ENTRY_DELAY")
            elif is_overrun_leak:
                rej_reasons.append("OVERRUN_FUEL_LEAK")
            if shift == 1:
                rej_reasons.append("SHIFT_ACTIVE")

            clean_fuel_state = (is_warm and not is_dfco_frame and not is_dfco_recovery
                                and not is_dfco_entry and not is_overrun_leak and shift == 0)

            if clean_fuel_state:
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

            if clean_fuel_state:
                if (stationarity >= 0.60 or regime in ("WOT_BOOST", "STEADY_CRUISE", "STEADY_IDLE")) and k_cls != "BOV_FLUTTER":
                    usable_ve = True
                    usability_counts["ve"] += 1

            if clean_fuel_state and is_closed_loop:
                if stationarity >= 0.75 and abs(d["d_tps"]) <= 1.5:
                    usable_inj = True
                    usability_counts["injector"] += 1

            if dyno_usables[i] == 1:
                usability_counts["dyno"] += 1

            rejection_str = ";".join(rej_reasons) if rej_reasons else "NONE"

            # Assemble Enriched Row
            row_dict = dict(self.raw_rows[i])
            row_dict.update({
                # Precomputed ROM Table Lookups
                "diag_rom_maf_gs": f"{rom_maf_gs:.2f}",
                "diag_rom_map_ve_load": f"{rom_map_ve:.1f}",
                "diag_rom_mat_comp_mult": f"{rom_mat_comp:.2f}",
                "diag_rom_timing_high": f"{rom_hi_tim:.1f}",
                "diag_rom_timing_low": f"{rom_lo_tim:.1f}",
                "diag_rom_timing_retard_total": f"{rom_tim_retard:.1f}",
                "diag_rom_latency_ms": f"{rom_latency:.3f}",
                "diag_rom_afrmap": f"{rom_afrmap:.2f}",
                # Gear & Shift State
                "diag_gear": gear,
                "diag_shift_active": str(shift),
                # Decel Overrun Fuel Leakage
                "diag_decel_fuel_status": decel,
                # Speed Smoothing & Virtual Dyno
                "diag_smooth_speed_kmh": f"{spd:.1f}",
                "diag_smooth_accel_g": f"{accel_g:.3f}",
                "diag_wheel_hp": f"{wheel_hps[i]:.1f}",
                "diag_wheel_tq": f"{wheel_tqs[i]:.1f}",
                "diag_usable_for_dyno": str(dyno_usables[i]),
                # VVT, DBW, and IDC Diagnostics
                "diag_in_vvt_error": f"{in_vvt_err:.2f}",
                "diag_ex_vvt_error": f"{ex_vvt_err:.2f}",
                "diag_dbw_throttle_cut": f"{dbw_cut:.1f}",
                "diag_idc_pct": f"{idc_pct:.1f}",
                # Core Engine States & Regimes
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
                "diag_usable_for_maf": "1" if usable_maf else "0",
                "diag_usable_for_ve": "1" if usable_ve else "0",
                "diag_usable_for_injector": "1" if usable_inj else "0",
                "diag_rejection_reason": rejection_str,
            })
            self.classified_rows.append(row_dict)

        dyno_whps = [wheel_hps[i] for i in range(n) if dyno_usables[i] == 1]
        dyno_wtqs = [wheel_tqs[i] for i in range(n) if dyno_usables[i] == 1]
        clean_whps = [wheel_hps[i] for i in range(n) if smooth_accels_g[i] <= 0.90]
        clean_wtqs = [wheel_tqs[i] for i in range(n) if smooth_accels_g[i] <= 0.90]

        self.summary_stats = {
            "total_records": n,
            "duration_sec": round(self.parsed[-1]["sec"] - self.parsed[0]["sec"], 1),
            "regimes": regime_counts,
            "decel_breakdown": decel_counts,
            "usable_samples": usability_counts,
            "peak_wheel_hp": max(dyno_whps) if dyno_whps else (max(clean_whps) if clean_whps else 0.0),
            "peak_wheel_tq": max(dyno_wtqs) if dyno_wtqs else (max(clean_wtqs) if clean_wtqs else 0.0),
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
        print(f"[+] Exported fully enriched datalog ({len(self.classified_rows):,} rows) to: {out_path}")

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

    base_name = os.path.splitext(os.path.basename(args.input_log))[0]
    out_dir = os.path.dirname(args.input_log)
    csv_out = args.export_csv or os.path.join(out_dir, f"{base_name}_classified.csv")
    classifier.export_csv(csv_out)

    if args.export_events:
        classifier.export_events_json(args.export_events)
    if args.export_summary:
        classifier.export_summary_json(args.export_summary)

    s = classifier.summary_stats
    print("\n" + "=" * 68)
    print("        EXPANDED MULTI-DOMAIN TELEMETRY CLASSIFICATION")
    print("=" * 68)
    print(f"Total Records: {s['total_records']:,} | Duration: {s['duration_sec']:.1f}s ({s['duration_sec']/60:.1f} min)")
    print(f"Peak Virtual Dyno: {s['peak_wheel_hp']:.1f} WHP | {s['peak_wheel_tq']:.1f} WTQ (lb-ft)")

    print("\n[+] Operating Regimes Breakdown:")
    for regime, count in sorted(s["regimes"].items(), key=lambda x: -x[1]):
        pct = (count / s['total_records']) * 100
        print(f"  - {regime:<20}: {count:>6,} frames ({pct:>5.1f}%)")

    print("\n[+] Subsystem Usability for Calibration & Diagnostics:")
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
    print("=" * 68)


if __name__ == "__main__":
    main()
