#!/usr/bin/env python3
"""
datalog_classifier.py - Multi-Domain Telemetry Classifier & Diagnostic Enrichment Engine

Performs per-record physical classification and contiguous episode detection on EvoScan datalogs
(configured for 100% Open-Loop operation on TephraMOD v3 + RAX Fast Logging):
  1. ROM Table Precomputations: Directly evaluates ECU ROM calibration tables at every row:
     MAF scaling (0x5757A), 3D MAP VE load (0x608AE), firmware-exact MAT vs MAP multiplier (0x60FCD),
     ECT Fuel Compensation #1 (0x5ADB9), High/Low Octane timing (0x55957 / 0x55B59), total runtime
     timing trim, battery latency (0x556D0), and AFRMAP target (0x55027).
  2. Pure Open-Loop Wideband Validity: Detects Bosch LSU key-on heater warmup (first ~35s) and
     controller rail clipping ([10.08, 18.42] AFR) so clipped/unheated frames never corrupt fuel models.
  3. Thermal Decoupling Domain (ECT vs MAT vs IAT): Tags post-start flare decay (<90s), isolated
     ECT warmup (<80C after 90s), manifold heat-soak flush splits (MAT - IAT >= 10C), intercooler
     boost splits, and empirical runtime MAPCalcs/MAFCalcs air-density multipliers.
  4. Airflow, Speed Density & 1D MAF Aliasing Domain: Classifies pure vacuum MAF authority, spool
     crossover, high-RPM vacuum entering boost MAF bins (MAF_MAP_ALIAS_CONFLICT), boost Speed Density
     headroom vs MAF undercut risk, and transient |IMAPCalcs - MAPCalcs| clamp window width.
  5. Gear, Overrun DFCO & Virtual Dyno Domain: Gear/shift state machine, DFCO fuel leakage vs cut,
     Savitzky-Golay/OLS rotational acceleration (immune to 7.8125 RPM RAX quantization), and WHP/WTQ.
  6. Contiguous Anomaly Episode Aggregator: Groups consecutive anomaly frames into debounced episodes
     with start/end row slices, entry-to-peak deltas, and root-cause tags for instant trace drill-down.
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

    xi = 0
    while xi < len(x_axis) - 2 and x_axis[xi + 1] <= x_clamped:
        xi += 1
    x_frac = (x_clamped - x_axis[xi]) / (x_axis[xi + 1] - x_axis[xi]) if x_axis[xi + 1] != x_axis[xi] else 0.0

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


def ols_slope(times, values):
    """Ordinary least-squares slope dy/dt across a local window to reject quantization steps."""
    m = len(times)
    if m < 2:
        return 0.0
    t_mean = sum(times) / m
    v_mean = sum(values) / m
    denom = sum((t - t_mean) ** 2 for t in times)
    if denom <= 1e-6:
        return 0.0
    numer = sum((times[k] - t_mean) * (values[k] - v_mean) for k in range(m))
    return numer / denom


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
            # Stored column-major: map_col * 19 + rpm_row -> grid[row_rpm][col_map]
            self.map_load_grid = [
                [(raw_map[m * 19 + r] * 10.0 / 512.0) * 10.0 / 32.0 for m in range(20)]
                for r in range(19)
            ]

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
            # Stored column-major: load_col * 23 + rpm_row -> grid[row_rpm][col_load]
            self.hitim_grid = [[float(raw_hitim[c * 23 + r]) for c in range(22)] for r in range(23)]
            self.lotim_grid = [[float(raw_lotim[c * 23 + r]) for c in range(22)] for r in range(23)]

            # 5. Fuel Compensation MAT vs MAP (0x60FCD) + MAT axis (0x634C0) + MAP axis (0x634D4)
            # Firmware map_load_calc_and_blend_engine.c line 551: (raw + 0x180) / 0x200 = (raw + 384) / 512
            mat_raw = struct.unpack(">7H", d[0x634C0:0x634C0 + 14])
            self.mat_axis = [float(x - 40) for x in mat_raw]  # [-10, 5, 20, 40, 60, 80, 100] C
            map_mat_raw = struct.unpack(">10H", d[0x634D4:0x634D4 + 20])
            self.map_mat_axis = [round(((x * 2556.0 / 3800.0) + 0.5) / 2.0, 1) for x in map_mat_raw]
            raw_mat = struct.unpack(">70B", d[0x60FCD:0x60FCD + 70])
            self.mat_comp_grid = [
                [(raw_mat[m * 7 + r] + 384.0) / 512.0 * 100.0 for m in range(10)]
                for r in range(7)
            ]

            # 6. ECT Fuel Compensation #1 (0x5ADB9): 9 ECT rows (0x618F0) x 41 Load cols (0x621BC), swapxy=true
            ect_raw = struct.unpack(">9H", d[0x618F0:0x618F0 + 18])
            self.ect_comp_axis = [float(x - 40) for x in ect_raw]  # [-32, -18, -8, 7, 20, 34, 50, 77, 82] C
            load_41_raw = struct.unpack(">41H", d[0x621BC:0x621BC + 82])
            self.load_41_axis = [x * 5.0 / 16.0 for x in load_41_raw]
            raw_ect1 = struct.unpack(">369B", d[0x5ADB9:0x5ADB9 + 369])
            # Stored column-major: load_col * 9 + ect_row -> grid[row_ect][col_load], Percent128 (x / 1.28)
            self.ect_comp_grid = [
                [raw_ect1[c * 9 + r] / 1.28 for c in range(41)]
                for r in range(9)
            ]

            # 7. Injector Latency vs Battery Voltage (0x556D0)
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

    def eval_ect_comp(self, ect, load):
        if not self.loaded:
            return 100.0
        return round(interp2d(load, ect, self.load_41_axis, self.ect_comp_axis, self.ect_comp_grid), 2)

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
    def __init__(self, log_path, rom_path=None, fallback_unsoaked_err=None, ambient_iat_ref=None):
        self.log_path = log_path
        self.rom_path = rom_path
        self.rom_evaluator = RomTableEvaluator(rom_path) if rom_path else None
        # Optional dict {"idle": float, "cruise": float} from same ROM's unsoaked warm logs for hot-restart logs
        self.fallback_unsoaked_err = fallback_unsoaked_err or {}
        # Optional outdoor ambient IAT (°C) from same-day logs to decouple underhood open-cone IAT soak from summer air
        self.ambient_iat_ref = ambient_iat_ref

        self.raw_rows = []
        self.parsed = []
        self.classified_rows = []
        self.operational_events = []
        self.anomaly_episodes = []
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
            baro = safe_float(r.get("Baro"), 101.0)
            tps = safe_float(r.get("TPS"), 0.0)
            app = safe_float(r.get("APP"), 0.0)
            mafv = safe_float(r.get("MAF"), 0.0)
            mafc = safe_float(r.get("MAFCalcs"), 0.0)
            mapc = safe_float(r.get("MAPCalcs"), 0.0)
            imapc = safe_float(r.get("IMAPCalcs"), mapc)
            chosenc = safe_float(r.get("ChosenCalc"), 0.0)
            load = safe_float(r.get("Load"), 0.0)
            load_timing = safe_float(r.get("LoadTiming"), load)
            timing = safe_float(r.get("TimingAdv"), 0.0)
            knock = safe_float(r.get("KnockSum"), 0.0)
            afr = safe_float(r.get("AFR"), 0.0)
            afrmap = safe_float(r.get("AFRMAP"), 0.0)
            ipw = safe_float(r.get("IPW"), 0.0)
            speed = safe_float(r.get("Speed"), 0.0)
            vbatt = safe_float(r.get("Battery"), 14.0)
            ect = safe_float(r.get("ECT"), 0.0)
            iat = safe_float(r.get("IAT"), safe_float(r.get("MAT"), 20.0))
            mat = safe_float(r.get("MAT"), iat)
            wgdc = safe_float(r.get("WGDC_Active"), 0.0)
            invvt_tgt = safe_float(r.get("InVVTtarget"), 0.0)
            exvvt_tgt = safe_float(r.get("ExVVTtarget"), 0.0)
            invvt_act = safe_float(r.get("InVVTactual"), 0.0)
            exvvt_act = safe_float(r.get("ExVVTactual"), 0.0)

            eff_load = chosenc if chosenc > 0 else (load if load > 0 else max(mafc, mapc))
            if (afrmap <= 5.0 or afrmap > 20.0) and self.rom_evaluator and self.rom_evaluator.loaded:
                afrmap = self.rom_evaluator.eval_afrmap(eff_load, rpm)
            elif afrmap <= 5.0 or afrmap > 20.0:
                afrmap = 14.7

            self.parsed.append({
                "idx": i,
                "sec": sec,
                "rpm": rpm,
                "kpa": kpa,
                "baro": baro,
                "tps": tps,
                "app": app,
                "mafv": mafv,
                "mafc": mafc,
                "mapc": mapc,
                "imapc": imapc,
                "chosenc": chosenc if chosenc > 0 else eff_load,
                "load": load,
                "load_timing": load_timing if load_timing > 0 else eff_load,
                "timing": timing,
                "knock": knock,
                "afr": afr,
                "afrmap": afrmap,
                "ipw": ipw,
                "speed": speed,
                "vbatt": vbatt,
                "ect": ect,
                "iat": iat,
                "mat": mat,
                "wgdc": wgdc,
                "invvt_tgt": invvt_tgt,
                "exvvt_tgt": exvvt_tgt,
                "invvt_act": invvt_act,
                "exvvt_act": exvvt_act,
            })

    def _detect_engine_run_time_and_wb_warmup(self):
        """
        Tracks contiguous logging segments (detecting RAX key-off polling freezes), elapsed seconds
        since engine start (RPM >= 450), Bosch LSU wideband heater warmup (including mid-start log entry),
        and stationary hot-restart fuel-rail vapor purge windows.
        """
        n = len(self.parsed)
        run_secs = [0.0] * n
        wb_ready = [True] * n
        seg_ids = [0] * n
        is_freeze_gap = [False] * n
        is_hot_rail_soak = [False] * n

        curr_seg = 0
        for i in range(1, n):
            raw_dt = self.parsed[i]["sec"] - self.parsed[i - 1]["sec"]
            same_snapshot = (
                self.parsed[i]["rpm"] >= 400.0
                and self.parsed[i]["rpm"] == self.parsed[i - 1]["rpm"]
                and self.parsed[i]["kpa"] == self.parsed[i - 1]["kpa"]
                and self.parsed[i]["ipw"] == self.parsed[i - 1]["ipw"]
                and raw_dt > 0.25
            )
            if raw_dt > 0.50 or raw_dt <= 0.0 or same_snapshot:
                curr_seg += 1
                is_freeze_gap[i] = True
                is_freeze_gap[i - 1] = True
            seg_ids[i] = curr_seg

        # Determine if log genuinely started mid-drive with an already-heated wideband vs fresh cold/hot start
        t0 = self.parsed[0]["sec"]
        early_afrs = [p["afr"] for i_p, p in enumerate(self.parsed[:min(n, 45)])
                      if (p["sec"] - t0) <= 1.5 and seg_ids[i_p] == 0]
        early_wb_live = (
            bool(early_afrs)
            and all(10.3 < a < 17.9 for a in early_afrs)
            and (max(early_afrs) - min(early_afrs) >= 0.06)
        )

        # Check for stationary hot-restart vapor-boil contour when logging began 1-3s after crank
        early_stat_lean = [
            p["afr"] for p in self.parsed
            if 10.0 <= (p["sec"] - t0) <= 28.0 and p["speed"] < 2.0 and p["afr"] > 5.0
        ]
        later_stat_afrs = [
            p["afr"] for p in self.parsed
            if 45.0 <= (p["sec"] - t0) <= 75.0 and p["speed"] < 2.0 and p["afr"] > 5.0
        ]
        looks_like_fresh_hot_start = (
            self.parsed[0]["speed"] < 2.0
            and self.parsed[0]["ect"] >= 75.0
            and (self.parsed[0]["mat"] >= 42.0 or self.parsed[0]["iat"] >= 30.0)
            and (
                not early_wb_live
                or (
                    len(early_stat_lean) >= 10 and len(later_stat_afrs) >= 10
                    and (sum(early_stat_lean) / len(early_stat_lean)) >= 16.0
                    and ((sum(early_stat_lean) / len(early_stat_lean)) - (sum(later_stat_afrs) / len(later_stat_afrs))) >= 1.0
                )
            )
        )

        started_running = (
            not looks_like_fresh_hot_start
            and (
                (self.parsed[0]["rpm"] >= 500.0 and self.parsed[0]["speed"] >= 3.0 and early_wb_live)
                or (self.parsed[0]["rpm"] >= 600.0 and self.parsed[0]["ect"] >= 65.0 and early_wb_live)
            )
        )
        crank_sec = -999.0 if started_running else None
        hot_start_active = False
        hot_soak_purged = True
        purged_streak = 0

        for i, p in enumerate(self.parsed):
            if is_freeze_gap[i]:
                wb_ready[i] = False
                # If logger froze across a multi-second key-off (ECT cooled or battery dipped), reset engine run timer
                if i > 0 and (p["sec"] - self.parsed[i - 1]["sec"]) > 5.0 and (
                    p["ect"] <= self.parsed[i - 1]["ect"] - 1.5 or p["vbatt"] < 12.2 or p["rpm"] < 450.0
                ):
                    crank_sec = None
                    hot_start_active = False
                    hot_soak_purged = True
                    purged_streak = 0
                run_secs[i] = 0.0 if crank_sec is None else max(0.0, p["sec"] - crank_sec)
                continue

            if p["rpm"] < 450.0:
                crank_sec = None
                hot_start_active = False
                hot_soak_purged = True
                purged_streak = 0
                run_secs[i] = 0.0
                wb_ready[i] = False
            else:
                if crank_sec is None:
                    crank_sec = p["sec"]
                    hot_start_active = (
                        p["speed"] < 3.0
                        and p["ect"] >= 75.0
                        and (p["mat"] >= 42.0 or p["iat"] >= 30.0)
                    )
                    hot_soak_purged = not hot_start_active
                    purged_streak = 0

                elapsed = p["sec"] - crank_sec
                run_secs[i] = elapsed
                if elapsed < 35.0:
                    w0 = max(0, i - 8)
                    w1 = min(n, i + 9)
                    afrs = [self.parsed[k]["afr"] for k in range(w0, w1) if seg_ids[k] == seg_ids[i]]
                    span = (max(afrs) - min(afrs)) if afrs else 0.0
                    if (
                        elapsed < 12.0
                        or span < 0.06
                        or p["afr"] <= 5.0
                        or (elapsed < 18.0 and (p["afr"] >= 18.42 or p["afr"] <= 10.2))
                    ):
                        wb_ready[i] = False

                if hot_start_active and not hot_soak_purged:
                    if elapsed >= 75.0 or p["speed"] >= 5.0:
                        hot_soak_purged = True
                    else:
                        if elapsed >= 20.0 and wb_ready[i] and 10.5 < p["afr"] <= (p["afrmap"] * 1.02):
                            purged_streak += 1
                            if purged_streak >= 20:
                                hot_soak_purged = True
                        else:
                            purged_streak = 0
                        if not hot_soak_purged:
                            is_hot_rail_soak[i] = True

        return run_secs, wb_ready, seg_ids, is_freeze_gap, is_hot_rail_soak

    def classify_all(self):
        n = len(self.parsed)
        if n == 0:
            return

        run_secs, wb_ready, seg_ids, is_freeze_gap, is_hot_rail_soak = self._detect_engine_run_time_and_wb_warmup()

        # 1. Continuous Physical Derivatives (zeroed across RAX freeze/timeout boundaries)
        derivatives = []
        for i in range(n):
            if i == 0 or seg_ids[i] != seg_ids[i - 1] or is_freeze_gap[i]:
                derivatives.append({
                    "dt": 0.033,
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

        # 2. Dynamic Exhaust Transport Delay & Forward-Aligned AFR (bounded within contiguous segment)
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
            while j < n and seg_ids[j] == seg_ids[i] and (self.parsed[j]["sec"] - curr["sec"]) <= 0.60:
                diff = abs(self.parsed[j]["sec"] - target_time)
                if diff < best_diff:
                    best_diff = diff
                    best_idx = j
                j += 1

            forward_afr = self.parsed[best_idx]["afr"]
            forward_wb_ready = wb_ready[best_idx]
            afrmap = curr["afrmap"]
            afr_err = forward_afr / afrmap if (forward_afr > 5.0 and afrmap > 5.0) else 1.0

            aligned_afr_data.append({
                "tau_sec": round(tau, 3),
                "aligned_idx": best_idx,
                "aligned_afr": round(forward_afr, 2),
                "aligned_afr_error": round(afr_err, 4),
                "aligned_wb_ready": forward_wb_ready,
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
                    "afr": round(aligned_afr_data[i]["aligned_afr"], 2),
                    "afrmap": round(curr["afrmap"], 2),
                    "delta_knock": int(delta_k),
                    "severity": float(delta_k),
                    "classification": k_class,
                    "confidence": round(k_conf, 2),
                    "detail_json": {
                        "delta_knock": int(delta_k),
                        "knock_sum": int(round(curr["knock"])),
                        "mafv_range": round(mafv_range, 3),
                        "reversals": reversals,
                        "tps_slope": round(tps_slope, 2),
                        "iat_c": round(curr["iat"], 1),
                    }
                })

        # 4. Speed Smoothing, Longitudinal Accel & Quantization-Immune OLS Rotational Accel (bounded by seg_ids)
        smooth_speeds = []
        for i in range(n):
            w_start = max(0, i - 2)
            w_end = min(n, i + 3)
            sub = [self.parsed[k]["speed"] for k in range(w_start, w_end) if seg_ids[k] == seg_ids[i]]
            smooth_speeds.append(sum(sub) / len(sub) if sub else self.parsed[i]["speed"])

        smooth_accels_g = [0.0] * n
        for i in range(1, n):
            if is_freeze_gap[i] or seg_ids[i] != seg_ids[i - 1]:
                continue
            w_lo = i
            while w_lo > max(0, i - 5) and seg_ids[w_lo - 1] == seg_ids[i]:
                w_lo -= 1
            w_hi = i
            while w_hi < min(n - 1, i + 5) and seg_ids[w_hi + 1] == seg_ids[i]:
                w_hi += 1
            dt_win = self.parsed[w_hi]["sec"] - self.parsed[w_lo]["sec"]
            if dt_win > 0.08:
                dv_ms = (smooth_speeds[w_hi] - smooth_speeds[w_lo]) / 3.6
                a_ms2 = dv_ms / dt_win
            else:
                dt = derivatives[i]["dt"]
                dv_ms = (smooth_speeds[i] - smooth_speeds[i - 1]) / 3.6
                a_ms2 = dv_ms / dt if dt > 0.001 else 0.0
            smooth_accels_g[i] = max(-1.5, min(1.5, a_ms2 / 9.80665))

        # 15-frame (~0.50s) OLS rotational acceleration slope & 9-frame (~0.30s) OLS TPS/MAP slopes:
        # Rejects 7.8125 RPM, 0.39% TPS, and 0.67 kPa MAP single-bit RAX ADC quantization noise!
        rpm_accels_rpms = [0.0] * n
        ols_tps_s = [0.0] * n
        ols_map_s = [0.0] * n
        for i in range(n):
            if is_freeze_gap[i]:
                continue
            w_lo = max(0, i - 7)
            w_hi = min(n, i + 8)
            k_15 = [k for k in range(w_lo, w_hi) if seg_ids[k] == seg_ids[i] and not is_freeze_gap[k]]
            if len(k_15) >= 2:
                rpm_accels_rpms[i] = ols_slope([self.parsed[k]["sec"] for k in k_15], [self.parsed[k]["rpm"] for k in k_15])

            w9_lo = max(0, i - 4)
            w9_hi = min(n, i + 5)
            k_9 = [k for k in range(w9_lo, w9_hi) if seg_ids[k] == seg_ids[i] and not is_freeze_gap[k]]
            if len(k_9) >= 2:
                t9_sub = [self.parsed[k]["sec"] for k in k_9]
                ols_tps_s[i] = ols_slope(t9_sub, [self.parsed[k]["tps"] for k in k_9])
                ols_map_s[i] = ols_slope(t9_sub, [self.parsed[k]["kpa"] for k in k_9])

        # Rolling 7-frame local standard deviation for MAP and Load
        map_vars = [0.0] * n
        load_vars = [0.0] * n
        for i in range(n):
            w_s = max(0, i - 3)
            w_e = min(n, i + 4)
            k_7 = [k for k in range(w_s, w_e) if seg_ids[k] == seg_ids[i]]
            m_sub = [self.parsed[k]["kpa"] for k in k_7]
            l_sub = [self.parsed[k]["chosenc"] for k in k_7]
            m_m = sum(m_sub) / len(m_sub)
            l_m = sum(l_sub) / len(l_sub)
            map_vars[i] = math.sqrt(sum((x - m_m) ** 2 for x in m_sub) / len(m_sub))
            load_vars[i] = math.sqrt(sum((x - l_m) ** 2 for x in l_sub) / len(l_sub))

        # 5. Gear Detection, Shift Windows & WOT Slip/Spin Protection (USDM 5MT: FD 4.687, Circ ~2.03m)
        gear_bands = {
            "1": (115.0, 155.0),
            "2": (72.0, 98.0),
            "3": (51.0, 69.0),
            "4": (38.0, 50.0),
            "5": (27.0, 37.0),
        }
        gear_labels = []
        shift_flags = []
        slip_or_spin_flags = []
        shift_start_secs = []
        since_shift_end_secs = []
        prev_engaged_gear = None
        active_shift_start = None
        last_shift_end_sec = -999.0

        for i in range(n):
            curr = self.parsed[i]
            rpm = curr["rpm"]
            spd = smooth_speeds[i]
            d = derivatives[i]
            sec = curr["sec"]

            if spd < 3.5:
                gear = "IDLE_STATIONARY"
                is_shifting = 0
                is_slip = False
                prev_engaged_gear = None
                active_shift_start = None
            else:
                ratio = rpm / max(1.0, spd)
                gear = "NEUTRAL"
                for g_lbl, (lo_r, hi_r) in gear_bands.items():
                    if lo_r <= ratio <= hi_r:
                        gear = g_lbl
                        break
                # Apply +-1.5 ratio hysteresis on the currently engaged gear to prevent 1-bit RAX RPM quantization flicker
                if gear == "NEUTRAL" and prev_engaged_gear in gear_bands:
                    p_lo, p_hi = gear_bands[prev_engaged_gear]
                    if (p_lo - 1.5) <= ratio <= (p_hi + 1.5) and abs(d["d_rpm"]) < 350.0:
                        gear = prev_engaged_gear

                is_slip = False
                is_shifting = 0
                if gear == "NEUTRAL":
                    # Under heavy boost/throttle, RPM/Speed jumping above the engaged gear band is wheelspin/clutch slip, NOT a shift!
                    if (prev_engaged_gear in gear_bands and curr["tps"] >= 55.0
                            and curr["kpa"] >= 130.0 and spd >= 15.0
                            and ratio > gear_bands[prev_engaged_gear][1] * 1.03):
                        gear = prev_engaged_gear
                        is_slip = True
                        is_shifting = 0
                    else:
                        is_shifting = 1
                elif d["d_rpm"] < -450.0 and curr["tps"] < 25.0 and spd > 15.0:
                    is_shifting = 1

                if is_shifting == 1:
                    if active_shift_start is None:
                        active_shift_start = sec
                else:
                    if active_shift_start is not None and gear in gear_bands:
                        shift_dur = sec - active_shift_start
                        if (prev_engaged_gear is not None and gear != prev_engaged_gear) or shift_dur >= 0.18:
                            last_shift_end_sec = sec
                    active_shift_start = None
                    if gear in gear_bands:
                        prev_engaged_gear = gear

            gear_labels.append(gear)
            shift_flags.append(is_shifting)
            slip_or_spin_flags.append(is_slip)
            shift_start_secs.append(active_shift_start)
            since_shift_end_secs.append(sec - last_shift_end_sec)

        # 6. Decel Overrun Fuel Leakage Diagnostics (Wideband ceiling is 18.50 AFR)
        decel_statuses = []
        last_dfco_time = -999.0
        last_overrun_event_sec = -999.0
        closed_pedal_start_sec = None
        has_app = ("APP" in self.raw_rows[0]) if self.raw_rows else False
        min_app = min((r["app"] for r in self.parsed if r["app"] >= 0.0), default=0.0)
        min_tps = min((r["tps"] for r in self.parsed if r["rpm"] >= 500.0 and r["tps"] > 1.0), default=13.0)

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

            if rpm < 450.0 or is_freeze_gap[i]:
                # Never treat engine-off or starter cranking (IPW=0) as overrun DFCO cut!
                last_dfco_time = -999.0
                closed_pedal_start_sec = None
                decel_statuses.append("NORMAL_DRIVING")
                continue

            is_closed_pedal = (curr["app"] <= min_app + 1.5) if (has_app and curr["app"] >= 0.0) else (tps <= min_tps + 1.5)
            if is_closed_pedal:
                if closed_pedal_start_sec is None:
                    closed_pedal_start_sec = sec
            else:
                closed_pedal_start_sec = None

            # Primary DFCO check is IPW <= 0.05ms; secondary catches RAX frame lag when wideband pegs >= 18.42
            is_dfco_cut = (ipw <= 0.05) or (is_closed_pedal and ipw <= 0.45 and (curr["afr"] >= 18.42 or align_afr >= 18.42))
            if is_dfco_cut:
                last_dfco_time = sec
                # Reset entry timer during active fuel cut so exiting DFCO never inherits pre-cut elapsed time
                closed_pedal_start_sec = sec

            is_recovery = ((sec - last_dfco_time) <= 0.55) and not is_dfco_cut
            if is_recovery and is_closed_pedal:
                closed_pedal_start_sec = sec

            in_gear_driving = (gear in ("1", "2", "3", "4", "5")) and (is_shifting == 0)

            if is_closed_pedal and spd > 12.0 and rpm > 1200.0:
                if is_dfco_cut:
                    status = "CUT_ACTIVE"
                elif is_recovery:
                    status = "DFCO_RECOVERY"
                elif in_gear_driving:
                    closed_dur = (sec - closed_pedal_start_sec) if closed_pedal_start_sec is not None else 0.0
                    if rpm < 1900.0 or curr["ect"] < 68.0:
                        status = "DFCO_LOW_RPM_RESUME"
                    elif closed_dur <= 1.25:
                        status = "DFCO_ENTRY_DELAY"
                    elif tps > (min_tps + 1.6):
                        # Foot is off APP, but DBW throttle plate is held slightly open (dashpot / rev-hang) above ECU DFCO TPS gate
                        status = "DBW_DASHPOT_HOLD"
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
                                "classification": "DECEL_INJECTOR_OR_TABLE_LEAK",
                                "confidence": 0.90,
                                "detail_json": {
                                    "ipw_during_decel": round(ipw, 2),
                                    "closed_pedal_sec": round(closed_dur, 2),
                                    "min_tps_ref": round(min_tps, 2),
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
        M_VEHICLE = 1705.0
        RHO_AIR = 1.204
        CD_AERO = 0.35
        AREA_FRONT = 2.29
        CRR_ROLLING = 0.015

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

            is_dyno = (gear in ("2", "3", "4") and curr["tps"] >= 45.0 and curr["kpa"] >= 120.0
                       and 0.05 <= a_g <= 0.90 and shift == 0 and curr["ect"] >= 75.0)

            wheel_hps.append(round(whp, 1) if whp > 5.0 else 0.0)
            wheel_tqs.append(round(wtq, 1) if wtq > 5.0 else 0.0)
            dyno_usables.append(1 if is_dyno else 0)

        # 8. Multi-Domain Assembly, Thermal/MAF-Zone Classifiers & Debounced Steady-Pedal Check
        regime_counts = {}
        thermal_counts = {}
        maf_zone_counts = {}
        wb_state_counts = {}
        decel_counts = {}
        pedal_accel_counts = {}
        usability_counts = {"maf": 0, "ve": 0, "injector": 0, "dyno": 0}
        last_lean_boost_sec = -999.0
        last_high_idc_sec = -999.0
        last_power_drop_sec = -999.0

        # Pre-evaluate steady pedal drop candidate streak to require >= 5 consecutive frames (~0.17s+)
        # Must remain in the SAME engaged gear with zero shift flags across the 0.45s lookback window!
        raw_power_drop_flags = [False] * n
        for i in range(n):
            curr = self.parsed[i]
            gear = gear_labels[i]
            shift = shift_flags[i]
            spd = smooth_speeds[i]
            if gear in ("1", "2", "3", "4", "5") and shift == 0 and spd > 18.0 and curr["rpm"] > 1400.0 and curr["tps"] >= 18.0:
                past_idx = max(0, i - 12)
                gear_check_lo = max(0, i - 14)
                same_gear_window = all(
                    gear_labels[k] == gear and shift_flags[k] == 0 and seg_ids[k] == seg_ids[i] and not is_freeze_gap[k]
                    for k in range(gear_check_lo, i + 1)
                )
                if same_gear_window:
                    w_s_p = max(0, i - 9)
                    w_e_p = min(n, i + 6)
                    app_sub = [self.parsed[k]["app"] for k in range(w_s_p, w_e_p) if self.parsed[k]["app"] >= 0.0]
                    tps_sub = [self.parsed[k]["tps"] for k in range(w_s_p, w_e_p)]
                    app_rng = (max(app_sub) - min(app_sub)) if app_sub else 99.0
                    tps_rng = max(tps_sub) - min(tps_sub)
                    if (app_rng <= 1.5 or tps_rng <= 1.6) and abs(derivatives[i]["d_tps"]) <= 3.5:
                        past_rot = rpm_accels_rpms[past_idx]
                        curr_rot = rpm_accels_rpms[i]
                        past_g = smooth_accels_g[past_idx]
                        curr_g = smooth_accels_g[i]
                        if past_rot >= 90.0 and curr_rot <= -20.0 and (past_rot - curr_rot) >= 160.0 and (past_g - curr_g) >= 0.03:
                            raw_power_drop_flags[i] = True

        # Keep only streaks >= 5 consecutive frames (~0.17s+)
        sustained_power_drop = [False] * n
        idx_scan = 0
        while idx_scan < n:
            if raw_power_drop_flags[idx_scan]:
                j_scan = idx_scan
                while j_scan < n and raw_power_drop_flags[j_scan]:
                    j_scan += 1
                if (j_scan - idx_scan) >= 5:
                    for k_scan in range(idx_scan, j_scan):
                        sustained_power_drop[k_scan] = True
                idx_scan = j_scan
            else:
                idx_scan += 1

        # Resolve Outdoor Ambient IAT Anchor (same-day DB anchor + high-speed airflow minimum)
        moving_iats = [
            self.parsed[k]["iat"] for k in range(n)
            if self.parsed[k]["rpm"] >= 600.0 and smooth_speeds[k] >= 40.0 and not is_freeze_gap[k]
        ]
        eff_ambient_iat = self.ambient_iat_ref
        if moving_iats:
            min_mov_iat = min(moving_iats)
            eff_ambient_iat = min(eff_ambient_iat, min_mov_iat) if eff_ambient_iat is not None else min_mov_iat

        started_hot_soaked = (
            self.parsed[0]["ect"] >= 75.0 and (self.parsed[0]["mat"] >= 42.0 or self.parsed[0]["iat"] >= 32.0)
        )
        is_underhood_iat_soaked = [False] * n
        for i in range(n):
            c_p = self.parsed[i]
            soak_by_ref = (eff_ambient_iat is not None and (c_p["iat"] - eff_ambient_iat) >= 12.0 and c_p["mat"] >= 36.0)
            soak_by_hot_start = (started_hot_soaked and c_p["iat"] >= 33.0 and c_p["mat"] >= 38.0)
            is_underhood_iat_soaked[i] = soak_by_ref or soak_by_hot_start

        # Precompute Decoupled Unsoaked Warm Baseline AFR Error (AGENTS.md §4.1 Thermal Decoupling Rule)
        # Excludes hot-start rail vapor soak and underhood open-cone IAT soak so cool_ref is never inverted!
        unsoaked_idle_errs = []
        unsoaked_cruise_errs = []
        warm_cell_buckets = {}
        for i in range(n):
            c_p = self.parsed[i]
            al_p = aligned_afr_data[i]
            if (not is_freeze_gap[i] and not is_hot_rail_soak[i] and not is_underhood_iat_soaked[i]
                    and c_p["ect"] >= 80.0 and al_p["aligned_wb_ready"]
                    and 10.08 < al_p["aligned_afr"] < 18.42
                    and decel_statuses[i] == "NORMAL_DRIVING" and shift_flags[i] == 0):
                split_p = c_p["mat"] - c_p["iat"]
                st_pen = abs(ols_tps_s[i]) / 8.0 + abs(ols_map_s[i]) / 20.0 + abs(rpm_accels_rpms[i]) / 250.0
                if smooth_speeds[i] < 2.0 and c_p["tps"] <= 15.5 and c_p["mat"] < 38.0 and abs(rpm_accels_rpms[i]) < 120.0:
                    if c_p["kpa"] <= 55.0:
                        unsoaked_idle_errs.append(al_p["aligned_afr_error"])
                elif smooth_speeds[i] >= 15.0 and c_p["kpa"] <= 95.0 and split_p < 10.0 and st_pen <= 0.30:
                    unsoaked_cruise_errs.append(al_p["aligned_afr_error"])

                # Within-drive warm (>=82°C) matched-(RPM, MAP) lookup for validating COLD_ECT_MISFUEL
                if c_p["ect"] >= 82.0 and c_p["mat"] < 42.0 and st_pen <= 0.35:
                    cell_k = (int(round(c_p["rpm"] / 250.0) * 250), int(round(c_p["kpa"] / 4.0) * 4))
                    warm_cell_buckets.setdefault(cell_k, []).append(al_p["aligned_afr_error"])

        def _median(vals):
            if not vals:
                return None
            s_v = sorted(vals)
            m_i = len(s_v) // 2
            return s_v[m_i] if (len(s_v) % 2 == 1) else 0.5 * (s_v[m_i - 1] + s_v[m_i])

        idle_cool_ref = _median(unsoaked_idle_errs) if len(unsoaked_idle_errs) >= 40 else self.fallback_unsoaked_err.get("idle")
        cruise_cool_ref = _median(unsoaked_cruise_errs) if len(unsoaked_cruise_errs) >= 40 else self.fallback_unsoaked_err.get("cruise")
        warm_cell_refs = {ck: _median(vs) for ck, vs in warm_cell_buckets.items() if len(vs) >= 15}

        row_episode_tags = [[] for _ in range(n)]

        # Detect Failed Cranking Starts & Stationary Idle Stalls (distinguished from intentional end-of-drive key-off)
        idx_st = 0
        while idx_st < n:
            if not is_freeze_gap[idx_st] and self.parsed[idx_st]["rpm"] >= 500.0 and smooth_speeds[idx_st] < 3.0:
                run_start = idx_st
                peak_rpm_burst = self.parsed[idx_st]["rpm"]
                while idx_st < n and not is_freeze_gap[idx_st] and self.parsed[idx_st]["rpm"] >= 200.0:
                    if self.parsed[idx_st]["rpm"] > peak_rpm_burst:
                        peak_rpm_burst = self.parsed[idx_st]["rpm"]
                    idx_st += 1
                burst_end = idx_st - 1
                # Check if engine died to <200 RPM within continuous logging (not a logger freeze or moving drive)
                if (idx_st < n and not is_freeze_gap[idx_st]
                        and (burst_end - run_start) >= 2 and smooth_speeds[burst_end] < 3.0):
                    zero_end = idx_st
                    while zero_end < n and not is_freeze_gap[zero_end] and self.parsed[zero_end]["rpm"] < 200.0:
                        zero_end += 1
                    if (zero_end - idx_st) >= 5:
                        collapse_lo = max(run_start, burst_end - 8)
                        ipw_while_dying = any(
                            220.0 <= self.parsed[k]["rpm"] <= 600.0 and self.parsed[k]["ipw"] >= 1.0
                            for k in range(collapse_lo, burst_end + 1)
                        )
                        recranked = any(
                            (self.parsed[k]["sec"] - self.parsed[idx_st]["sec"]) <= 60.0
                            and self.parsed[k]["rpm"] >= 450.0
                            for k in range(zero_end, min(n, zero_end + 2500))
                        )
                        key_stayed_on = (
                            (self.parsed[min(n - 1, zero_end - 1)]["sec"] - self.parsed[idx_st]["sec"]) >= 2.0
                            and self.parsed[idx_st]["vbatt"] >= 11.2
                        )
                        if recranked or (ipw_while_dying and key_stayed_on):
                            st_ect = self.parsed[burst_end]["ect"]
                            if run_secs[burst_end] <= 15.0:
                                st_cause = "COLD_START_CRANK_STALL" if st_ect < 45.0 else "WARM_OR_HOT_START_STALL"
                            else:
                                st_cause = "IDLE_DIP_STALL"
                            st_sev = round(min(25.0, max(8.0, peak_rpm_burst / 60.0)), 1)
                            tag_lo = max(run_start, burst_end - 4)
                            tag_hi = min(n - 1, idx_st + 4)
                            for k_tag in range(tag_lo, tag_hi + 1):
                                row_episode_tags[k_tag].append(("START_OR_IDLE_STALL", st_cause, st_sev))
                            st_p = self.parsed[burst_end]
                            self.operational_events.append({
                                "event_type": "START_OR_IDLE_STALL",
                                "log_id": os.path.basename(self.log_path),
                                "row_idx": burst_end,
                                "time_sec": round(st_p["sec"], 3),
                                "rpm": round(st_p["rpm"], 1),
                                "map_kpa": round(st_p["kpa"], 1),
                                "tps": round(st_p["tps"], 1),
                                "mafv": round(st_p["mafv"], 3),
                                "ipw_ms": round(st_p["ipw"], 2),
                                "vbatt": round(st_p["vbatt"], 2),
                                "mat_c": round(st_p["mat"], 1),
                                "ect_c": round(st_ect, 1),
                                "afr": round(st_p["afr"], 2),
                                "afrmap": round(st_p["afrmap"], 2),
                                "severity": st_sev,
                                "classification": st_cause,
                                "confidence": 0.95,
                                "detail_json": {
                                    "peak_rpm_before_stall": round(peak_rpm_burst, 1),
                                    "run_secs_before_stall": round(run_secs[burst_end], 2),
                                    "recranked": recranked,
                                },
                            })
                    idx_st = zero_end
                    continue
            idx_st += 1

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

            is_dfco_frame = (decel == "CUT_ACTIVE")
            is_dfco_recovery = (decel == "DFCO_RECOVERY")
            is_dfco_entry = (decel == "DFCO_ENTRY_DELAY")
            is_overrun_leak = (decel == "UNEXPECTED_FUELING")
            is_low_rpm_resume = (decel == "DFCO_LOW_RPM_RESUME")
            is_dashpot_hold = (decel == "DBW_DASHPOT_HOLD")
            is_coast_neutral = (decel == "COAST_NEUTRAL")
            is_any_overrun = (is_dfco_entry or is_overrun_leak or is_low_rpm_resume or is_dashpot_hold or is_coast_neutral)
            is_warm = curr["ect"] >= 80.0  # ECT Fuel Comp #1/#2 locks at 100.0% >= 77-82C

            # Pure Open-Loop Wideband Validity State
            if is_freeze_gap[i]:
                wb_state = "LOG_FREEZE_GAP"
            elif curr["rpm"] < 250.0:
                wb_state = "ENGINE_OFF"
            elif curr["rpm"] < 450.0:
                wb_state = "CRANKING"
            elif curr["afr"] <= 5.0 or align["aligned_afr"] <= 5.0:
                wb_state = "WIDEBAND_DROPOUT"
            elif not align["aligned_wb_ready"]:
                wb_state = "SENSOR_WARMUP"
            elif is_dfco_frame or is_dfco_recovery:
                wb_state = "DFCO_AIR"
            elif align["aligned_afr"] <= 10.08:
                wb_state = "RAIL_RICH_CLIP"
            elif align["aligned_afr"] >= 18.42:
                wb_state = "RAIL_LEAN_CLIP"
            else:
                wb_state = "VALID"
            wb_state_counts[wb_state] = wb_state_counts.get(wb_state, 0) + 1

            # Stationarity Score (0.0 to 1.0) using 9-frame/15-frame OLS slopes to avoid RAX 1-bit ADC dither
            tps_penalty = abs(ols_tps_s[i]) / 8.0
            map_penalty = abs(ols_map_s[i]) / 20.0
            rpm_penalty = abs(rpm_accels_rpms[i]) / 250.0
            tot_penalty = tps_penalty + map_penalty + rpm_penalty
            stationarity = 0.0 if (is_dfco_frame or is_freeze_gap[i] or curr["rpm"] < 450.0) else max(0.0, min(1.0, 1.0 - tot_penalty))

            # Operational Regime (Zero-drop: every frame gets its true operating bucket, including shifts & overrun)
            if is_freeze_gap[i]:
                regime = "LOG_FREEZE_GAP"
            elif curr["rpm"] < 450.0:
                regime = "ENGINE_OFF_OR_CRANK"
            elif is_dfco_frame:
                regime = "DFCO"
            elif is_dfco_recovery:
                regime = "DFCO_RECOVERY"
            elif is_any_overrun:
                regime = "OVERRUN_DECEL"
            elif spd < 2.0 and curr["tps"] <= 15.5 and abs(rpm_accels_rpms[i]) < 120.0:
                regime = "STEADY_IDLE"
            elif shift == 1 and spd >= 8.0:
                regime = "SHIFT_TRANSITION"
            elif spd >= 15.0 and stationarity >= 0.70 and curr["kpa"] <= 95.0 and shift == 0:
                regime = "STEADY_CRUISE"
            elif curr["tps"] >= 65.0 and ols_tps_s[i] >= -2.0 and curr["kpa"] >= 115.0 and shift == 0:
                regime = "WOT_BOOST"
            elif (95.0 <= curr["kpa"] <= 125.0) and ols_map_s[i] > 15.0:
                regime = "SPOOL_RAMP"
            elif ols_tps_s[i] > 12.0 or ols_map_s[i] > 25.0:
                regime = "TIP_IN"
            elif ols_tps_s[i] < -12.0 or ols_map_s[i] < -25.0:
                regime = "TIP_OUT"
            else:
                regime = "TRANSIENT_CRUISE"
            regime_counts[regime] = regime_counts.get(regime, 0) + 1

            # Decoupled Thermal Regime (ECT vs MAT vs IAT vs Hot-Start Fuel-Rail Purge)
            iat_mat_delta = curr["mat"] - curr["iat"]
            if is_freeze_gap[i] or curr["rpm"] < 450.0:
                thermal_regime = "ENGINE_OFF"
            elif is_hot_rail_soak[i]:
                thermal_regime = "POST_HOT_START_RAIL_SOAK"
            elif run_secs[i] < 90.0 and curr["ect"] < 78.0:
                thermal_regime = "POST_START_FLARE_DECAY"
            elif curr["ect"] < 80.0:
                thermal_regime = "WARMUP_ECT_ACTIVE"
            elif curr["kpa"] >= 120.0:
                thermal_regime = "INTERCOOLER_BOOST_SPLIT"
            elif spd < 5.0 and curr["mat"] >= 38.0:
                thermal_regime = "HEATSOAK_IDLE_SOAK"
            elif spd >= 15.0 and iat_mat_delta >= 10.0:
                thermal_regime = "HEATSOAK_FLUSH_SPLIT"
            elif spd >= 15.0 and is_underhood_iat_soaked[i]:
                thermal_regime = "UNDERHOOD_IAT_HEATSOAK"
            elif curr["iat"] <= 12.0 and abs(iat_mat_delta) < 10.0:
                thermal_regime = "COLD_AMBIENT_STEADY"
            else:
                thermal_regime = "WARM_AMBIENT_STEADY"
            thermal_counts[thermal_regime] = thermal_counts.get(thermal_regime, 0) + 1

            # Load Clamping & 1D MAF Aliasing Zone (Safeguard #1 compliant: <=2.85V shared vs >=2.89V pure boost)
            mafc = curr["mafc"]
            mapc = curr["mapc"]
            imapc = curr["imapc"]
            ratio = (mapc / mafc) if mafc > 0 else 1.0
            imap_window = abs(imapc - mapc) if imapc > 5.0 else 0.0

            if curr["kpa"] <= 85.0:
                clamp_state = "UNCLAMPED" if mapc >= 0.99 * mafc else "VACUUM_CEILING_CLAMPED"
            elif curr["kpa"] >= 120.0:
                clamp_state = "BOOST_SPEED_DENSITY" if mapc <= 0.98 * mafc else "BOOST_FLOOR_CLAMPED"
            else:
                clamp_state = "CROSSOVER_TRANSITION"

            if curr["mafv"] < 1.65:
                maf_zone = "IDLE_LOW_FLOW"
            elif curr["kpa"] <= 105.0 and curr["mafv"] <= 2.68:
                maf_zone = "PURE_VACUUM_MAF"
            elif curr["kpa"] <= 105.0 and curr["mafv"] >= 2.74:
                maf_zone = "MAF_MAP_ALIAS_CONFLICT"
            elif curr["kpa"] < 120.0:
                maf_zone = "SPOOL_CROSSOVER_MAF"
            elif curr["mafv"] <= 2.86:
                maf_zone = "BOOST_SHARED_BIN_SD_OK" if ratio < 0.98 else "BOOST_MAF_UNDERCUT_RISK"
            elif ratio <= 0.88:
                maf_zone = "BOOST_SD_HEADROOM_OK"
            else:
                maf_zone = "BOOST_MAF_UNDERCUT_RISK"
            maf_zone_counts[maf_zone] = maf_zone_counts.get(maf_zone, 0) + 1

            # Pure Open-Loop Injector Duty & Actuator Errors
            idc_pct = (curr["rpm"] * curr["ipw"]) / 1200.0
            in_vvt_err = curr["invvt_act"] - curr["invvt_tgt"]
            ex_vvt_err = curr["exvvt_act"] - curr["exvvt_tgt"]
            dbw_cut = curr["app"] - curr["tps"]

            # ROM Table Calling Values Precomputations
            rom_maf_gs = 0.0
            rom_map_ve = 0.0
            rom_mat_comp = 100.0
            rom_ect_comp = 100.0
            rom_afrmap = curr["afrmap"]
            rom_hi_tim = 0.0
            rom_lo_tim = 0.0
            rom_tim_retard = 0.0
            rom_latency = 0.795

            if self.rom_evaluator and self.rom_evaluator.loaded:
                rom_maf_gs = self.rom_evaluator.eval_maf(curr["mafv"])
                rom_map_ve = self.rom_evaluator.eval_map_load_calc(curr["rpm"], curr["kpa"])
                rom_mat_comp = self.rom_evaluator.eval_mat_comp(curr["mat"], curr["kpa"])
                rom_ect_comp = self.rom_evaluator.eval_ect_comp(curr["ect"], curr["chosenc"])
                rom_afrmap = self.rom_evaluator.eval_afrmap(curr["chosenc"], curr["rpm"])
                rom_hi_tim = self.rom_evaluator.eval_timing_high(curr["load_timing"], curr["rpm"])
                rom_lo_tim = self.rom_evaluator.eval_timing_low(curr["load_timing"], curr["rpm"])
                rom_tim_retard = round(curr["timing"] - rom_hi_tim, 1)
                rom_latency = self.rom_evaluator.eval_latency(curr["vbatt"])

            emp_map_density = (mapc / rom_map_ve) if (rom_map_ve >= 20.0 and mapc >= 20.0) else 1.090
            base_maf_load = (4964.28 * rom_maf_gs / curr["rpm"]) if (rom_maf_gs >= 3.5 and curr["rpm"] >= 550.0) else 0.0
            emp_maf_mult = (mafc / base_maf_load) if (base_maf_load >= 8.0 and mafc >= 8.0) else 1.000

            # Operational Events & Episode Row Tagging (Zero-drop, root-cause sub-classified)
            if k_cls != "NONE":
                row_episode_tags[i].append((f"KNOCK_{k_cls}", k_cls, float(derivatives[i]["d_knock"])))

            if is_overrun_leak:
                row_episode_tags[i].append(("OVERRUN_FUEL_LEAKAGE", "DECEL_INJECTOR_OR_TABLE_LEAK", curr["ipw"]))
            elif is_dashpot_hold:
                row_episode_tags[i].append(("OVERRUN_FUEL_LEAKAGE", "DECEL_DBW_DASHPOT_HOLD", curr["ipw"]))

            if slip_or_spin_flags[i]:
                row_episode_tags[i].append(("DRIVETRAIN_SLIP_OR_SPIN", "CLUTCH_SLIP_OR_WHEELSPIN", round(curr["rpm"] / max(1.0, spd), 1)))

            # Shift & Post-Shift Drivability Diagnostics (Rev-Hang, Post-Shift Rich Bog, Post-Shift Lean Stumble)
            since_sh = since_shift_end_secs[i]
            local_back = max(0, i - 4)
            local_dt = max(0.08, curr["sec"] - self.parsed[local_back]["sec"])
            local_rpm_slope = (curr["rpm"] - self.parsed[local_back]["rpm"]) / local_dt if seg_ids[local_back] == seg_ids[i] else -999.0
            if (shift == 1 and gear == "NEUTRAL" and shift_start_secs[i] is not None
                    and (curr["sec"] - shift_start_secs[i]) >= 0.40 and curr["rpm"] >= 2300.0
                    and spd >= 20.0 and decel in ("COAST_NEUTRAL", "DBW_DASHPOT_HOLD")
                    and rpm_accels_rpms[i] >= -60.0 and local_rpm_slope >= -60.0):
                hang_sev = max(5.0, min(40.0, (rpm_accels_rpms[i] + 80.0) * 0.25))
                row_episode_tags[i].append(("SHIFT_ANOMALY", "SHIFT_REV_HANG", hang_sev))
            elif (is_warm and wb_state in ("VALID", "RAIL_RICH_CLIP") and shift == 0
                  and gear in ("1", "2", "3", "4", "5") and 0.08 <= since_sh <= 0.80
                  and curr["tps"] >= 22.0 and align["aligned_afr_error"] <= 0.86):
                row_episode_tags[i].append(("SHIFT_ANOMALY", "POST_SHIFT_RICH_BOG", (1.0 - align["aligned_afr_error"]) * 100.0))
            elif (is_warm and wb_state in ("VALID", "RAIL_LEAN_CLIP") and shift == 0
                  and gear in ("1", "2", "3", "4", "5") and 0.08 <= since_sh <= 0.80
                  and curr["tps"] >= 22.0 and align["aligned_afr_error"] >= 1.07):
                row_episode_tags[i].append(("SHIFT_ANOMALY", "POST_SHIFT_LEAN_HESITATION", (align["aligned_afr_error"] - 1.0) * 100.0))

            # Lean Boost Excursion: stays active even during WOT wheelspin/clutch-slip!
            if (is_warm and wb_state in ("VALID", "RAIL_LEAN_CLIP")
                    and (shift == 0 or (curr["tps"] >= 60.0 and curr["kpa"] >= 135.0))
                    and curr["kpa"] >= 130.0 and curr["tps"] >= 45.0 and align["aligned_afr_error"] >= 1.05):
                err_pct = (align["aligned_afr_error"] - 1.0) * 100.0
                row_episode_tags[i].append(("LEAN_BOOST_EXCURSION", "LEAN_UNDER_BOOST", err_pct))
                if curr["kpa"] >= 135.0 and curr["tps"] >= 50.0 and align["aligned_afr_error"] >= 1.06:
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
                            "severity": round(err_pct, 2),
                            "classification": "LEAN_UNDER_BOOST",
                            "confidence": 0.92,
                            "detail_json": {
                                "aligned_afr_error": round(align["aligned_afr_error"], 4),
                                "rom_map_ve_load": round(rom_map_ve, 1),
                                "gear": gear,
                            }
                        })

            if (is_warm and wb_state in ("VALID", "RAIL_RICH_CLIP") and shift == 0
                    and 100.0 <= curr["kpa"] <= 145.0 and curr["tps"] >= 25.0 and align["aligned_afr_error"] <= 0.88):
                r_cause = "POST_SHIFT_RICH_SPOOL" if since_sh <= 0.80 else "RICH_TRANSIENT_OR_IMAP"
                row_episode_tags[i].append(("RICH_SPOOL_BOG", r_cause, (1.0 - align["aligned_afr_error"]) * 100.0))

            if (is_warm and wb_state in ("VALID", "RAIL_LEAN_CLIP") and shift == 0
                    and 88.0 <= curr["kpa"] <= 118.0 and curr["tps"] >= 18.0 and align["aligned_afr_error"] >= 1.06):
                if ratio <= 1.02:
                    c_cause = "CROSSOVER_CLAMP_RECTIFICATION"
                elif since_sh <= 0.75 or ols_tps_s[i] >= 10.0 or rpm_accels_rpms[i] >= 450.0:
                    c_cause = "POST_SHIFT_OR_TIP_IN_LEAN"
                else:
                    c_cause = "STEADY_CROSSOVER_FLOW_LEAN"
                row_episode_tags[i].append(("CROSSOVER_LEAN_SPIKE", c_cause, (align["aligned_afr_error"] - 1.0) * 100.0))

            # Safeguard #1 Boost MAF Undercut vs Pure Boost Headroom (Idx >= 74, >= 2.89V)
            if is_warm and curr["kpa"] >= 120.0 and curr["tps"] >= 35.0 and ratio >= 0.99:
                row_episode_tags[i].append(("BOOST_MAF_UNDERCUT", "ACTUAL_BOOST_MAF_UNDERCUT", ratio * 100.0))
            elif (is_warm and shift == 0 and curr["kpa"] >= 120.0 and curr["tps"] >= 40.0
                  and curr["mafv"] >= 2.89 and ratio >= 0.90):
                row_episode_tags[i].append(("BOOST_MAF_UNDERCUT", "INSUFFICIENT_SD_MAF_HEADROOM", ratio * 100.0))

            if (thermal_regime == "POST_HOT_START_RAIL_SOAK" and wb_state in ("VALID", "RAIL_LEAN_CLIP")
                    and align["aligned_afr_error"] >= 1.06):
                row_episode_tags[i].append((
                    "HOT_SOAK_VAPOR_LEAN",
                    "FUEL_RAIL_VAPOR_OR_POST_START_DECAY",
                    (align["aligned_afr_error"] - 1.0) * 100.0,
                ))

            if (thermal_regime == "WARMUP_ECT_ACTIVE" and wb_state in ("VALID", "RAIL_RICH_CLIP", "RAIL_LEAN_CLIP")
                    and stationarity >= 0.65 and not is_dfco_frame and not is_any_overrun
                    and abs(align["aligned_afr_error"] - 1.0) >= 0.07):
                cell_k = (int(round(curr["rpm"] / 250.0) * 250), int(round(curr["kpa"] / 4.0) * 4))
                warm_match = warm_cell_refs.get(cell_k)
                if warm_match is None:
                    warm_match = warm_cell_refs.get((cell_k[0], cell_k[1] - 4)) or warm_cell_refs.get((cell_k[0], cell_k[1] + 4))
                if warm_match is not None and warm_match > 0.5:
                    ect_delta = (align["aligned_afr_error"] / warm_match) - 1.0
                    if abs(ect_delta) >= 0.045 and ((ect_delta > 0) == (align["aligned_afr_error"] > 1.0)):
                        cause = "ECT_COMP_TOO_RICH" if ect_delta < 0.0 else "ECT_COMP_TOO_LEAN"
                        row_episode_tags[i].append(("COLD_ECT_MISFUEL", cause, abs(ect_delta) * 100.0))
                    elif spd < 2.0 and curr["kpa"] >= 55.5 and align["aligned_afr_error"] >= 1.055:
                        row_episode_tags[i].append((
                            "ELEVATED_IDLE_LOAD_ANOMALY",
                            "HIGH_MAP_ACCESSORY_IDLE_MAF_LEAN",
                            (align["aligned_afr_error"] - 1.0) * 100.0,
                        ))
                else:
                    cause = "ECT_COMP_TOO_RICH" if align["aligned_afr_error"] < 1.0 else "ECT_COMP_TOO_LEAN"
                    row_episode_tags[i].append(("COLD_ECT_MISFUEL", cause, abs(align["aligned_afr_error"] - 1.0) * 100.0))

            if (is_warm and regime == "STEADY_IDLE" and thermal_regime != "POST_HOT_START_RAIL_SOAK"
                    and wb_state in ("VALID", "RAIL_LEAN_CLIP") and stationarity >= 0.70
                    and curr["kpa"] >= 55.5 and align["aligned_afr_error"] >= 1.055):
                row_episode_tags[i].append((
                    "ELEVATED_IDLE_LOAD_ANOMALY",
                    "HIGH_MAP_ACCESSORY_IDLE_MAF_LEAN",
                    (align["aligned_afr_error"] - 1.0) * 100.0,
                ))

            # Thermal Decoupling Rule (AGENTS.md §4.1): Measure MAT drift vs warm unsoaked baseline
            # Includes directional sanity guard so cool_ref bias never labels richer-than-target AFR as TOO_LEAN!
            if (thermal_regime in ("HEATSOAK_FLUSH_SPLIT", "HEATSOAK_IDLE_SOAK", "UNDERHOOD_IAT_HEATSOAK") and wb_state == "VALID"
                    and curr["mat"] >= 34.0 and stationarity >= 0.65 and not is_any_overrun and gear != "NEUTRAL"):
                cool_ref = idle_cool_ref if thermal_regime == "HEATSOAK_IDLE_SOAK" else cruise_cool_ref
                if cool_ref is not None and cool_ref > 0.5:
                    therm_delta = (align["aligned_afr_error"] / cool_ref) - 1.0
                    if therm_delta <= -0.05 and align["aligned_afr_error"] < 0.99:
                        row_episode_tags[i].append(("HEATSOAK_THERMAL_DRIFT", "MAT_COMP_TOO_RICH", abs(therm_delta) * 100.0))
                    elif therm_delta >= 0.05 and align["aligned_afr_error"] > 1.01:
                        row_episode_tags[i].append(("HEATSOAK_THERMAL_DRIFT", "MAT_COMP_TOO_LEAN", abs(therm_delta) * 100.0))
                else:
                    raw_delta = align["aligned_afr_error"] - 1.0
                    if abs(raw_delta) >= 0.06:
                        cause = "MAT_COMP_TOO_RICH_NO_COOL_REF" if raw_delta < 0.0 else "MAT_COMP_TOO_LEAN_NO_COOL_REF"
                        row_episode_tags[i].append(("HEATSOAK_THERMAL_DRIFT", cause, abs(raw_delta) * 100.0))

            if idc_pct >= 85.0:
                row_episode_tags[i].append(("HIGH_IDC_WARNING", "INJECTOR_DUTY_HIGH", idc_pct))
                if (curr["sec"] - last_high_idc_sec) >= 2.0:
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

            # 9. Debounced Steady-Pedal & Rotational Acceleration State
            curr_rot_accel = rpm_accels_rpms[i]
            past_rot_accel = rpm_accels_rpms[max(0, i - 12)]

            if gear in ("1", "2", "3", "4", "5") and shift == 0 and spd > 12.0 and curr["rpm"] > 1200.0:
                if sustained_power_drop[i]:
                    pedal_state = "STEADY_PEDAL_POWER_DROP"
                    drop_mag = max(10.0, past_rot_accel - curr_rot_accel)
                    if not is_warm:
                        p_cause = "COLD_WARMUP_TORQUE_DIP"
                    elif align["aligned_afr_error"] >= 1.05:
                        p_cause = "LEAN_STUMBLE"
                    elif align["aligned_afr_error"] <= 0.90:
                        p_cause = "RICH_BOG"
                    elif dbw_cut >= 5.0:
                        p_cause = "DBW_THROTTLE_CUT"
                    elif rom_tim_retard <= -3.0:
                        p_cause = "SPARK_RETARD"
                    elif clamp_state == "VACUUM_CEILING_CLAMPED":
                        p_cause = "CLAMP_BITE"
                    else:
                        p_cause = "GRADE_OR_TORQUE_DIP"
                    row_episode_tags[i].append(("STEADY_PEDAL_POWER_DROP", p_cause, drop_mag))
                    if is_warm and not is_dfco_frame and not is_dfco_recovery and (curr["sec"] - last_power_drop_sec) >= 2.0:
                        last_power_drop_sec = curr["sec"]
                        self.operational_events.append({
                            "event_type": "STEADY_PEDAL_POWER_DROP",
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
                            "severity": round(drop_mag, 1),
                            "classification": p_cause,
                            "confidence": 0.88,
                            "detail_json": {
                                "past_rpm_accel": round(past_rot_accel, 1),
                                "curr_rpm_accel": round(curr_rot_accel, 1),
                                "accel_drop_rpms": round(drop_mag, 1),
                                "cause": p_cause,
                                "timing_adv": round(curr["timing"], 1),
                                "rom_timing_high": round(rom_hi_tim, 1),
                                "aligned_afr": round(align["aligned_afr"], 2),
                                "gear": gear,
                            }
                        })
                elif curr["tps"] >= 65.0:
                    pedal_state = "WOT_PULL"
                elif curr["tps"] <= 14.5:
                    pedal_state = "COAST_OR_DECEL"
                elif abs(d["d_tps"]) <= 3.5 and curr_rot_accel >= 35.0:
                    pedal_state = "STEADY_ACCEL_LINEAR"
                elif abs(d["d_tps"]) <= 3.5 and curr_rot_accel <= -50.0:
                    pedal_state = "STEADY_PEDAL_DECEL"
                elif abs(d["d_tps"]) <= 3.5:
                    pedal_state = "STEADY_CRUISE_FLAT"
                else:
                    pedal_state = "ACCEL_TRANSIENT"
            else:
                pedal_state = "IDLE_OR_STATIONARY" if spd < 3.5 else "SHIFT_OR_NEUTRAL"

            pedal_accel_counts[pedal_state] = pedal_accel_counts.get(pedal_state, 0) + 1

            # Pure Open-Loop Subsystem Usability & Explicit Rejection Reasons
            usable_maf = False
            usable_ve = False
            usable_inj = False
            rej_reasons = []

            if is_freeze_gap[i]:
                rej_reasons.append("LOG_FREEZE_GAP")
            elif curr["rpm"] < 450.0:
                rej_reasons.append("CRANKING_OR_OFF")
            if not is_warm:
                rej_reasons.append("COLD_WARMUP")
            if thermal_regime == "POST_HOT_START_RAIL_SOAK":
                rej_reasons.append("HOT_START_RAIL_SOAK")
            if wb_state == "SENSOR_WARMUP":
                rej_reasons.append("WIDEBAND_WARMUP")
            elif wb_state == "WIDEBAND_DROPOUT":
                rej_reasons.append("WIDEBAND_DROPOUT")
            elif wb_state in ("RAIL_RICH_CLIP", "RAIL_LEAN_CLIP"):
                rej_reasons.append("WIDEBAND_CLIPPED")
            if is_dfco_frame:
                rej_reasons.append("DFCO")
            elif is_dfco_recovery:
                rej_reasons.append("DFCO_RECOVERY")
            elif is_dfco_entry:
                rej_reasons.append("DFCO_ENTRY_DELAY")
            elif is_overrun_leak:
                rej_reasons.append("OVERRUN_FUEL_LEAK")
            elif is_dashpot_hold:
                rej_reasons.append("DBW_DASHPOT_HOLD")
            elif is_low_rpm_resume:
                rej_reasons.append("DFCO_LOW_RPM_RESUME")
            elif is_coast_neutral:
                rej_reasons.append("COAST_NEUTRAL")
            if shift == 1:
                rej_reasons.append("SHIFT_ACTIVE")

            clean_fuel_state = (
                not is_freeze_gap[i]
                and curr["rpm"] >= 450.0
                and is_warm
                and thermal_regime != "POST_HOT_START_RAIL_SOAK"
                and wb_state == "VALID"
                and not is_dfco_frame and not is_dfco_recovery
                and not is_any_overrun and shift == 0
            )

            if clean_fuel_state:
                if k_cls == "BOV_FLUTTER":
                    rej_reasons.append("BOV_FLUTTER")
                elif maf_zone == "MAF_MAP_ALIAS_CONFLICT":
                    rej_reasons.append("MAF_MAP_ALIAS_ZONE")
                elif clamp_state == "VACUUM_CEILING_CLAMPED":
                    rej_reasons.append("VACUUM_CEILING_CLAMPED")
                elif stationarity < 0.70:
                    rej_reasons.append("UNSTEADY_THROTTLE")
                elif curr["kpa"] > 105.0 or curr["mafv"] > 2.85:
                    rej_reasons.append("BOOST_REGIME")
                else:
                    usable_maf = True
                    usability_counts["maf"] += 1

            if clean_fuel_state:
                if (stationarity >= 0.60 or regime in ("WOT_BOOST", "STEADY_CRUISE", "STEADY_IDLE")) and k_cls != "BOV_FLUTTER":
                    usable_ve = True
                    usability_counts["ve"] += 1

            # Pure Open-Loop Injector Diagnostic Usability (ECT >= 80C, steady unsoaked vacuum/idle, valid wideband)
            if clean_fuel_state and curr["kpa"] <= 105.0:
                if (stationarity >= 0.75 and abs(ols_tps_s[i]) <= 2.5
                        and thermal_regime not in ("HEATSOAK_FLUSH_SPLIT", "HEATSOAK_IDLE_SOAK", "UNDERHOOD_IAT_HEATSOAK")):
                    usable_inj = True
                    usability_counts["injector"] += 1

            if dyno_usables[i] == 1:
                usability_counts["dyno"] += 1

            rejection_str = ";".join(rej_reasons) if rej_reasons else "NONE"

            row_dict = dict(self.raw_rows[i])
            row_dict.update({
                # Precomputed ROM Table Lookups
                "diag_rom_maf_gs": f"{rom_maf_gs:.2f}",
                "diag_rom_map_ve_load": f"{rom_map_ve:.1f}",
                "diag_rom_mat_comp_mult": f"{rom_mat_comp:.2f}",
                "diag_rom_ect_comp_pct": f"{rom_ect_comp:.2f}",
                "diag_rom_timing_high": f"{rom_hi_tim:.1f}",
                "diag_rom_timing_low": f"{rom_lo_tim:.1f}",
                "diag_rom_timing_retard_total": f"{rom_tim_retard:.1f}",
                "diag_rom_latency_ms": f"{rom_latency:.3f}",
                "diag_rom_afrmap": f"{rom_afrmap:.2f}",
                # Thermal & Empirical Air-Density Multipliers
                "diag_thermal_regime": thermal_regime,
                "diag_iat_mat_delta_c": f"{iat_mat_delta:.1f}",
                "diag_emp_map_density_mult": f"{emp_map_density:.4f}",
                "diag_emp_maf_temp_mult": f"{emp_maf_mult:.4f}",
                # Airflow Aliasing, Transient IMAP & Wideband Validity
                "diag_wideband_state": wb_state,
                "diag_maf_zone": maf_zone,
                "diag_imap_window_pct": f"{imap_window:.1f}",
                # Gear & Shift State
                "diag_gear": gear,
                "diag_shift_active": str(shift),
                # Decel Overrun Fuel Leakage
                "diag_decel_fuel_status": decel,
                # Speed Smoothing & Virtual Dyno
                "diag_smooth_speed_kmh": f"{spd:.1f}",
                "diag_smooth_accel_g": f"{accel_g:.3f}",
                "diag_rpm_accel_rpms": f"{curr_rot_accel:.1f}",
                "diag_map_variance": f"{map_vars[i]:.2f}",
                "diag_load_variance": f"{load_vars[i]:.2f}",
                "diag_pedal_accel_state": pedal_state,
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
                "diag_total_fuel_trim": "0.00",
                "diag_usable_for_maf": "1" if usable_maf else "0",
                "diag_usable_for_ve": "1" if usable_ve else "0",
                "diag_usable_for_injector": "1" if usable_inj else "0",
                "diag_rejection_reason": rejection_str,
            })
            self.classified_rows.append(row_dict)

        self._build_anomaly_episodes(row_episode_tags, aligned_afr_data, gear_labels)

        dyno_whps = [wheel_hps[i] for i in range(n) if dyno_usables[i] == 1]
        dyno_wtqs = [wheel_tqs[i] for i in range(n) if dyno_usables[i] == 1]
        clean_whps = [wheel_hps[i] for i in range(n) if smooth_accels_g[i] <= 0.90]
        clean_wtqs = [wheel_tqs[i] for i in range(n) if smooth_accels_g[i] <= 0.90]

        self.summary_stats = {
            "total_records": n,
            "duration_sec": round(self.parsed[-1]["sec"] - self.parsed[0]["sec"], 1),
            "regimes": regime_counts,
            "thermal_regimes": thermal_counts,
            "maf_zones": maf_zone_counts,
            "wideband_states": wb_state_counts,
            "decel_breakdown": decel_counts,
            "pedal_accel_breakdown": pedal_accel_counts,
            "usable_samples": usability_counts,
            "peak_wheel_hp": max(dyno_whps) if dyno_whps else (max(clean_whps) if clean_whps else 0.0),
            "peak_wheel_tq": max(dyno_wtqs) if dyno_wtqs else (max(clean_wtqs) if clean_wtqs else 0.0),
            "knock_events_total": sum(1 for k in knock_classifications if k != "NONE"),
            "knock_by_class": {
                c: sum(1 for k in knock_classifications if k == c)
                for c in set(knock_classifications) if c != "NONE"
            },
            "steady_power_drop_events": sum(1 for e in self.operational_events if e["event_type"] == "STEADY_PEDAL_POWER_DROP"),
            "operational_events_count": len(self.operational_events),
            "anomaly_episodes_count": len(self.anomaly_episodes),
            "unsoaked_warm_refs": {
                "idle": round(idle_cool_ref, 4) if idle_cool_ref is not None else None,
                "cruise": round(cruise_cool_ref, 4) if cruise_cool_ref is not None else None,
            },
        }

    def _build_anomaly_episodes(self, row_episode_tags, aligned_afr_data, gear_labels):
        """
        Groups frame-level anomaly tags into contiguous debounced episodes (merging gaps <= 0.35s)
        and filters ultra-short single-frame noise (except genuine knock inceptions which are always kept).
        """
        n = len(self.parsed)
        min_dur_by_type = {
            "OVERRUN_FUEL_LEAKAGE": 0.30,
            "LEAN_BOOST_EXCURSION": 0.12,
            "RICH_SPOOL_BOG": 0.25,
            "CROSSOVER_LEAN_SPIKE": 0.25,
            "BOOST_MAF_UNDERCUT": 0.20,
            "COLD_ECT_MISFUEL": 1.00,
            "HEATSOAK_THERMAL_DRIFT": 1.50,
            "HOT_SOAK_VAPOR_LEAN": 1.50,
            "ELEVATED_IDLE_LOAD_ANOMALY": 2.00,
            "START_OR_IDLE_STALL": 0.10,
            "STEADY_PEDAL_POWER_DROP": 0.16,
            "HIGH_IDC_WARNING": 0.10,
            "SHIFT_ANOMALY": 0.20,
            "DRIVETRAIN_SLIP_OR_SPIN": 0.20,
        }

        active = {}  # ep_type -> dict
        completed = []

        for i in range(n):
            sec = self.parsed[i]["sec"]
            present_types = {}
            for ep_type, cause, sev in row_episode_tags[i]:
                present_types[ep_type] = (cause, sev)

            # Close out any active episodes whose gap exceeded 0.35s
            for ep_type in list(active.keys()):
                if ep_type not in present_types and (sec - active[ep_type]["end_sec"]) > 0.35:
                    completed.append(active.pop(ep_type))

            # Extend or start present episodes
            for ep_type, (cause, sev) in present_types.items():
                if ep_type in active:
                    ep = active[ep_type]
                    ep["end_row"] = i
                    ep["end_sec"] = sec
                    ep["frames"] += 1
                    if sev > ep["peak_sev"]:
                        ep["peak_sev"] = sev
                        ep["cause"] = cause
                else:
                    active[ep_type] = {
                        "ep_type": ep_type,
                        "start_row": i,
                        "end_row": i,
                        "start_sec": sec,
                        "end_sec": sec,
                        "frames": 1,
                        "peak_sev": sev,
                        "cause": cause,
                    }

        for ep in active.values():
            completed.append(ep)

        completed.sort(key=lambda x: (x["start_sec"], x["ep_type"]))
        self.anomaly_episodes = []

        for ep in completed:
            ep_type = ep["ep_type"]
            s_idx, e_idx = ep["start_row"], ep["end_row"]
            dur = max(0.03, ep["end_sec"] - ep["start_sec"])
            min_req = min_dur_by_type.get(ep_type, 0.0)
            if ep["cause"] == "DECEL_DBW_DASHPOT_HOLD":
                min_req = max(min_req, 0.65)
            if not ep_type.startswith("KNOCK_") and ep_type != "START_OR_IDLE_STALL" and (dur < min_req or ep["frames"] < 3):
                continue

            sl = self.parsed[s_idx:e_idx + 1]
            afr_sl = [aligned_afr_data[k]["aligned_afr"] for k in range(s_idx, e_idx + 1)]
            err_sl = [aligned_afr_data[k]["aligned_afr_error"] for k in range(s_idx, e_idx + 1)]
            worst_idx = max(range(len(err_sl)), key=lambda k: abs(err_sl[k] - 1.0))

            self.anomaly_episodes.append({
                "episode_type": ep_type,
                "start_row": s_idx,
                "end_row": e_idx,
                "start_sec": round(ep["start_sec"], 3),
                "end_sec": round(ep["end_sec"], 3),
                "duration_sec": round(dur, 3),
                "frame_count": ep["frames"],
                "gear": gear_labels[s_idx],
                "rpm_start": round(sl[0]["rpm"], 0),
                "rpm_end": round(sl[-1]["rpm"], 0),
                "map_mean": round(sum(x["kpa"] for x in sl) / len(sl), 1),
                "mafv_mean": round(sum(x["mafv"] for x in sl) / len(sl), 3),
                "ect_c": round(sum(x["ect"] for x in sl) / len(sl), 1),
                "iat_c": round(sum(x["iat"] for x in sl) / len(sl), 1),
                "mat_c": round(sum(x["mat"] for x in sl) / len(sl), 1),
                "afr_worst": round(afr_sl[worst_idx], 2),
                "afrmap_mean": round(sum(x["afrmap"] for x in sl) / len(sl), 2),
                "peak_severity": round(ep["peak_sev"], 2),
                "root_cause": ep["cause"],
                "confidence": 0.92 if ep_type.startswith("KNOCK_") else 0.88,
                "detail_json": json.dumps({
                    "tps_start": round(sl[0]["tps"], 1),
                    "tps_end": round(sl[-1]["tps"], 1),
                    "mean_err_pct": round((sum(err_sl) / len(err_sl) - 1.0) * 100.0, 2),
                }),
            })

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
            json.dump({"events": self.operational_events, "episodes": self.anomaly_episodes}, f, indent=2)
        print(f"[+] Exported operational events ({len(self.operational_events)}) & episodes ({len(self.anomaly_episodes)}) to: {out_path}")

    def export_summary_json(self, out_path):
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(self.summary_stats, f, indent=2)
        print(f"[+] Exported summary statistics to: {out_path}")


def main():
    parser = argparse.ArgumentParser(description="Multi-Domain Telemetry Classifier & Diagnostic Enrichment Engine")
    parser.add_argument("input_log", help="Path to raw EvoScan CSV datalog")
    parser.add_argument("--target-rom", help="Optional path to matching calibration ROM (.srf/.bin)")
    parser.add_argument("--ambient-iat", type=float, default=None, help="Optional outdoor ambient IAT (°C) anchor")
    parser.add_argument("--export-csv", help="Custom output path for enriched CSV (*_classified.csv)")
    parser.add_argument("--export-events", help="Output path for operational events & episodes JSON ledger")
    parser.add_argument("--export-summary", help="Output path for summary statistics JSON")
    args = parser.parse_args()

    if not os.path.exists(args.input_log):
        sys.exit(f"Error: Log file not found: {args.input_log}")

    print(f"[*] Processing telemetry: {args.input_log}")
    classifier = DatalogClassifier(args.input_log, args.target_rom, ambient_iat_ref=args.ambient_iat)
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
    print("\n" + "=" * 72)
    print("       PURE OPEN-LOOP MULTI-DOMAIN TELEMETRY CLASSIFICATION")
    print("=" * 72)
    print(f"Total Records: {s['total_records']:,} | Duration: {s['duration_sec']:.1f}s ({s['duration_sec']/60:.1f} min)")
    print(f"Peak Virtual Dyno: {s['peak_wheel_hp']:.1f} WHP | {s['peak_wheel_tq']:.1f} WTQ (lb-ft)")

    print("\n[+] Operating Regimes Breakdown:")
    for regime, count in sorted(s["regimes"].items(), key=lambda x: -x[1]):
        pct = (count / s["total_records"]) * 100
        print(f"  - {regime:<22}: {count:>6,} frames ({pct:>5.1f}%)")

    print("\n[+] Thermal Decoupling Regimes (ECT / MAT / IAT):")
    for t_reg, count in sorted(s["thermal_regimes"].items(), key=lambda x: -x[1]):
        pct = (count / s["total_records"]) * 100
        print(f"  - {t_reg:<24}: {count:>6,} frames ({pct:>5.1f}%)")

    print("\n[+] 1D MAF vs Speed Density Zone Ownership:")
    for m_zone, count in sorted(s["maf_zones"].items(), key=lambda x: -x[1]):
        pct = (count / s["total_records"]) * 100
        print(f"  - {m_zone:<24}: {count:>6,} frames ({pct:>5.1f}%)")

    print("\n[+] Subsystem Usability for Open-Loop Calibration & Diagnostics:")
    for sub, count in s["usable_samples"].items():
        pct = (count / s["total_records"]) * 100
        print(f"  - Usable for {sub.upper():<10}: {count:>6,} frames ({pct:>5.1f}%)")

    print("\n[+] Combustion, Knock & Contiguous Anomaly Episodes:")
    print(f"  - Total Knock Inceptions     : {s['knock_events_total']}")
    for k_cls, count in s.get("knock_by_class", {}).items():
        print(f"    * {k_cls:<22}: {count} events")
    print(f"  - Contiguous Anomaly Episodes: {s['anomaly_episodes_count']} episodes")
    print("=" * 72)


if __name__ == "__main__":
    main()
