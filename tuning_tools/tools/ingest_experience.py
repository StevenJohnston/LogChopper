#!/usr/bin/env python3
"""
ingest_experience.py - Calibration Experience Database Ingestion & Rehydration Engine

Ingests calibration ROMs (.srf/.bin) and multi-domain classified datalogs (*_classified.csv)
into the persistent SQLite database (tuning_tools/db/calibration_experience.db).

Stores:
  1. ROM metadata & cell-by-cell tables (MAF, MAP Load Calc #1 & #2, High/Low Timing,
     Injector Scaling & Latency, MAT Fuel Comp).
  2. Datalog drive-level summaries (duration, record counts, peak virtual dyno WHP/WTQ,
     DFCO cut vs overrun leak frames, shift frames, and subsystem usability counts).
  3. Multi-dimensional regime performance summaries (RPM, MAP, MAFV, MAT, Vbatt) enriched
     with precomputed ROM table lookups, dominant gear, virtual dyno HP/TQ, VVT/DBW/IDC health,
     and knock breakdowns.
  4. Operational anomaly events ledger (Genuine timing knock with delta_knock severity,
     BOV flutter, drivetrain lash, overrun fuel leakage, lean boost excursions, high IDC).
"""

import argparse
from collections import Counter
import csv
from datetime import datetime
import glob
import hashlib
import json
import math
import os
import re
import sqlite3
import struct
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(SCRIPT_DIR, "..", "db", "calibration_experience.db")

# Platform Axes Definitions
RPM_TIMING_AXIS = [500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3250, 3500, 3750, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000]
LOAD_TIMING_AXIS = [0.0, 10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0, 120.0, 140.0, 160.0, 180.0, 200.0, 220.0, 240.0, 260.0, 280.0, 300.0, 320.0]
RPM_MAP_AXIS = [500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000]
MAP_KPA_AXIS = [13.7, 22.1, 35.6, 49.0, 62.5, 75.9, 89.4, 102.8, 116.3, 129.7, 143.2, 156.6, 170.1, 183.5, 197.0, 210.4, 223.9, 237.4, 250.8, 304.6]
VBATT_AXIS = [4.69, 7.03, 9.38, 11.72, 14.06, 16.41, 18.66]
MAT_AXIS = [-10.0, 5.0, 20.0, 40.0, 60.0, 80.0, 100.0]


def _ensure_columns(cur, table_name, required_cols):
    cur.execute(f"PRAGMA table_info({table_name});")
    existing = {row[1] for row in cur.fetchall()}
    for col_name, col_def in required_cols:
        if col_name not in existing:
            cur.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_def};")


def init_db(db_path, reset=False):
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    if reset and os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS roms (
        rom_id INTEGER PRIMARY KEY AUTOINCREMENT,
        rom_name TEXT UNIQUE,
        file_path TEXT,
        file_mtime REAL,
        sha256 TEXT
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS rom_tables (
        table_id INTEGER PRIMARY KEY AUTOINCREMENT,
        rom_id INTEGER,
        table_name TEXT,
        row_idx INTEGER,
        col_idx INTEGER,
        axis_x REAL,
        axis_y REAL,
        cell_value REAL,
        FOREIGN KEY(rom_id) REFERENCES roms(rom_id)
    );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_rom_tables_lookup ON rom_tables(table_name, axis_x, axis_y);")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS datalogs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_name TEXT UNIQUE,
        file_path TEXT,
        classified_csv_path TEXT,
        rom_id INTEGER,
        log_time REAL,
        duration_sec REAL,
        total_records INTEGER,
        peak_whp REAL DEFAULT 0.0,
        peak_wtq REAL DEFAULT 0.0,
        decel_cut_frames INTEGER DEFAULT 0,
        decel_leak_frames INTEGER DEFAULT 0,
        shift_frames INTEGER DEFAULT 0,
        usable_maf_frames INTEGER DEFAULT 0,
        usable_ve_frames INTEGER DEFAULT 0,
        usable_injector_frames INTEGER DEFAULT 0,
        usable_dyno_frames INTEGER DEFAULT 0,
        FOREIGN KEY(rom_id) REFERENCES roms(rom_id)
    );
    """)

    _ensure_columns(cur, "datalogs", [
        ("peak_whp", "REAL DEFAULT 0.0"),
        ("peak_wtq", "REAL DEFAULT 0.0"),
        ("decel_cut_frames", "INTEGER DEFAULT 0"),
        ("decel_leak_frames", "INTEGER DEFAULT 0"),
        ("shift_frames", "INTEGER DEFAULT 0"),
        ("usable_maf_frames", "INTEGER DEFAULT 0"),
        ("usable_ve_frames", "INTEGER DEFAULT 0"),
        ("usable_injector_frames", "INTEGER DEFAULT 0"),
        ("usable_dyno_frames", "INTEGER DEFAULT 0"),
    ])

    cur.execute("""
    CREATE TABLE IF NOT EXISTS regime_summaries (
        summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id INTEGER,
        rom_id INTEGER,
        regime TEXT,
        rpm_bucket INTEGER,
        map_bucket REAL,
        mafv_bucket REAL,
        mat_bucket INTEGER,
        vbatt_bucket REAL,
        sample_count INTEGER,
        steady_sample_count INTEGER,
        avg_afr REAL,
        avg_afrmap REAL,
        avg_afr_error REAL,
        afr_error_stddev REAL,
        avg_total_trim REAL,
        avg_ipw_ms REAL,
        avg_vbatt REAL,
        avg_timing REAL,
        clamping_rate REAL,
        knock_count_genuine INTEGER,
        knock_count_flutter INTEGER,
        knock_count_other INTEGER DEFAULT 0,
        dominant_gear TEXT DEFAULT 'IDLE_STATIONARY',
        avg_rom_maf_gs REAL DEFAULT 0.0,
        avg_rom_map_ve_load REAL DEFAULT 0.0,
        avg_rom_mat_comp_mult REAL DEFAULT 100.0,
        avg_rom_timing_high REAL DEFAULT 0.0,
        avg_rom_timing_low REAL DEFAULT 0.0,
        avg_rom_timing_retard REAL DEFAULT 0.0,
        avg_rom_latency_ms REAL DEFAULT 0.795,
        avg_wheel_hp REAL DEFAULT 0.0,
        max_wheel_hp REAL DEFAULT 0.0,
        avg_wheel_tq REAL DEFAULT 0.0,
        avg_accel_g REAL DEFAULT 0.0,
        avg_in_vvt_err REAL DEFAULT 0.0,
        avg_ex_vvt_err REAL DEFAULT 0.0,
        avg_dbw_cut REAL DEFAULT 0.0,
        avg_idc_pct REAL DEFAULT 0.0,
        decel_cut_count INTEGER DEFAULT 0,
        decel_leak_count INTEGER DEFAULT 0,
        shift_count INTEGER DEFAULT 0,
        usable_maf_count INTEGER DEFAULT 0,
        usable_ve_count INTEGER DEFAULT 0,
        usable_injector_count INTEGER DEFAULT 0,
        usable_dyno_count INTEGER DEFAULT 0,
        FOREIGN KEY(log_id) REFERENCES datalogs(log_id),
        FOREIGN KEY(rom_id) REFERENCES roms(rom_id)
    );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_regime_search ON regime_summaries(rpm_bucket, map_bucket, mafv_bucket);")

    _ensure_columns(cur, "regime_summaries", [
        ("knock_count_other", "INTEGER DEFAULT 0"),
        ("dominant_gear", "TEXT DEFAULT 'IDLE_STATIONARY'"),
        ("avg_rom_maf_gs", "REAL DEFAULT 0.0"),
        ("avg_rom_map_ve_load", "REAL DEFAULT 0.0"),
        ("avg_rom_mat_comp_mult", "REAL DEFAULT 100.0"),
        ("avg_rom_timing_high", "REAL DEFAULT 0.0"),
        ("avg_rom_timing_low", "REAL DEFAULT 0.0"),
        ("avg_rom_timing_retard", "REAL DEFAULT 0.0"),
        ("avg_rom_latency_ms", "REAL DEFAULT 0.795"),
        ("avg_wheel_hp", "REAL DEFAULT 0.0"),
        ("max_wheel_hp", "REAL DEFAULT 0.0"),
        ("avg_wheel_tq", "REAL DEFAULT 0.0"),
        ("avg_accel_g", "REAL DEFAULT 0.0"),
        ("avg_in_vvt_err", "REAL DEFAULT 0.0"),
        ("avg_ex_vvt_err", "REAL DEFAULT 0.0"),
        ("avg_dbw_cut", "REAL DEFAULT 0.0"),
        ("avg_idc_pct", "REAL DEFAULT 0.0"),
        ("decel_cut_count", "INTEGER DEFAULT 0"),
        ("decel_leak_count", "INTEGER DEFAULT 0"),
        ("shift_count", "INTEGER DEFAULT 0"),
        ("usable_maf_count", "INTEGER DEFAULT 0"),
        ("usable_ve_count", "INTEGER DEFAULT 0"),
        ("usable_injector_count", "INTEGER DEFAULT 0"),
        ("usable_dyno_count", "INTEGER DEFAULT 0"),
    ])

    cur.execute("""
    CREATE TABLE IF NOT EXISTS operational_events (
        event_id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_id INTEGER,
        rom_id INTEGER,
        event_type TEXT,
        row_idx INTEGER,
        time_sec REAL,
        rpm REAL,
        map_kpa REAL,
        tps REAL,
        mafv REAL,
        ipw_ms REAL,
        vbatt REAL,
        mat_c REAL,
        ect_c REAL,
        afr REAL,
        afrmap REAL,
        severity REAL,
        classification TEXT,
        confidence REAL,
        detail_json TEXT,
        FOREIGN KEY(log_id) REFERENCES datalogs(log_id),
        FOREIGN KEY(rom_id) REFERENCES roms(rom_id)
    );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON operational_events(event_type);")

    conn.commit()
    conn.close()


def load_rom_bytes(rom_path):
    header_len = 328 if rom_path.lower().endswith(".srf") else 0
    with open(rom_path, "rb") as f:
        f.seek(header_len)
        return f.read()


def ingest_rom(rom_path, db_path):
    if not os.path.exists(rom_path):
        print(f"[!] ROM not found: {rom_path}", file=sys.stderr)
        return None

    raw_bytes = load_rom_bytes(rom_path)
    sha256 = hashlib.sha256(raw_bytes).hexdigest()
    rom_name = os.path.splitext(os.path.basename(rom_path))[0]
    file_mtime = os.path.getmtime(rom_path)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("SELECT rom_id, sha256 FROM roms WHERE rom_name = ?", (rom_name,))
    row = cur.fetchone()
    if row:
        rom_id = row[0]
        if row[1] == sha256:
            print(f"[*] ROM '{rom_name}' already ingested (ID: {rom_id}).")
            conn.close()
            return rom_id
        else:
            cur.execute("DELETE FROM rom_tables WHERE rom_id = ?", (rom_id,))
            cur.execute("UPDATE roms SET file_path = ?, file_mtime = ?, sha256 = ? WHERE rom_id = ?",
                        (os.path.abspath(rom_path), file_mtime, sha256, rom_id))
    else:
        cur.execute("INSERT INTO roms (rom_name, file_path, file_mtime, sha256) VALUES (?, ?, ?, ?)",
                    (rom_name, os.path.abspath(rom_path), file_mtime, sha256))
        rom_id = cur.lastrowid

    table_rows = []

    # 1. MAF Scaling Horizontal (0x5757a, 130 uint16) + Volts Axis (0x61fd0, 130 uint16)
    try:
        maf_raw = struct.unpack(">130H", raw_bytes[0x5757A:0x5757A + 260])
        v_raw = struct.unpack(">130H", raw_bytes[0x61FD0:0x61FD0 + 260])
        volts = [round(x * 5.0 / 1023.0, 3) for x in v_raw]
        for idx in range(130):
            table_rows.append((rom_id, "maf_scaling", 0, idx, volts[idx], 0.0, maf_raw[idx] / 100.0))
    except Exception as e:
        print(f"[!] Error reading MAF table from {rom_name}: {e}")

    # 2. MAP based Load Calc #1 (0x608ae) & #2 (0x605ac) (20 MAP x 19 RPM, uint16)
    try:
        for tbl_name, addr in [("map_load_calc_1", 0x608AE), ("map_load_calc_2", 0x605AC)]:
            raw_map = struct.unpack(">380H", raw_bytes[addr:addr + 760])
            for m_idx in range(20):
                for r_idx in range(19):
                    val = (raw_map[m_idx * 19 + r_idx] * 10.0 / 512.0) * 10.0 / 32.0
                    table_rows.append((rom_id, tbl_name, r_idx, m_idx, MAP_KPA_AXIS[m_idx], RPM_MAP_AXIS[r_idx], round(val, 2)))
    except Exception as e:
        print(f"[!] Error reading MAP Load Calc from {rom_name}: {e}")

    # 3. High Octane (0x55957) & Low Octane (0x55757) Ignition Timing Maps (23 RPM x 22 Load, int8)
    try:
        for tbl_name, addr in [("high_octane_timing", 0x55957), ("low_octane_timing", 0x55757)]:
            raw_tim = struct.unpack(">506b", raw_bytes[addr:addr + 506])
            for r_idx in range(23):
                for l_idx in range(22):
                    val = raw_tim[r_idx * 22 + l_idx]
                    table_rows.append((rom_id, tbl_name, r_idx, l_idx, LOAD_TIMING_AXIS[l_idx], RPM_TIMING_AXIS[r_idx], float(val)))
    except Exception as e:
        print(f"[!] Error reading Timing maps from {rom_name}: {e}")

    # 4. Injector Scaling (0x536d8, uint16, 29241/x)
    try:
        raw_scale = struct.unpack(">H", raw_bytes[0x536D8:0x536D8 + 2])[0]
        if raw_scale > 0:
            scale_cc = 29241.0 / raw_scale
            table_rows.append((rom_id, "fuel_injector_scaling", 0, 0, 0.0, 0.0, round(scale_cc, 1)))
    except Exception as e:
        print(f"[!] Error reading Injector Scaling from {rom_name}: {e}")

    # 5. Injector Latency vs Battery Voltage (0x556d0, 7 uint8, x * 0.015)
    try:
        raw_lat = struct.unpack(">7B", raw_bytes[0x556D0:0x556D0 + 7])
        for idx in range(7):
            lat_ms = raw_lat[idx] * 0.015
            table_rows.append((rom_id, "injector_latency", 0, idx, VBATT_AXIS[idx], 0.0, round(lat_ms, 3)))
    except Exception as e:
        print(f"[!] Error reading Injector Latency from {rom_name}: {e}")

    # 6. Fuel Compensation MAT vs MAP (0x60fcd, 7 MAT rows x 10 MAP cols, swapxy=true)
    try:
        raw_mat = struct.unpack(">70B", raw_bytes[0x60FCD:0x60FCD + 70])
        for m_col in range(10):
            for r_mat in range(7):
                idx = m_col * 7 + r_mat
                mult = (raw_mat[idx] + 385.0) / 512.0 * 100.0
                table_rows.append((rom_id, "fuel_comp_mat_vs_map", r_mat, m_col, float(m_col), MAT_AXIS[r_mat], round(mult, 2)))
    except Exception as e:
        print(f"[!] Error reading MAT table from {rom_name}: {e}")

    cur.executemany("""
    INSERT INTO rom_tables (rom_id, table_name, row_idx, col_idx, axis_x, axis_y, cell_value)
    VALUES (?, ?, ?, ?, ?, ?, ?);
    """, table_rows)

    conn.commit()
    conn.close()
    print(f"[+] Ingested ROM '{rom_name}' (ID: {rom_id}, {len(table_rows)} table cells indexed).")
    return rom_id


def bucket_value(val, buckets):
    """Finds nearest bucket value."""
    best = buckets[0]
    best_diff = abs(val - best)
    for b in buckets[1:]:
        diff = abs(val - b)
        if diff < best_diff:
            best_diff = diff
            best = b
    return best


def parse_log_timestamp(path):
    m = re.search(r"EvoScanDataLog_(\d{4})\.(\d{2})\.(\d{2})_(\d{2})\.(\d{2})\.(\d{2})", os.path.basename(path))
    if m:
        try:
            dt = datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)),
                          int(m.group(4)), int(m.group(5)), int(m.group(6)))
            return dt.timestamp()
        except ValueError:
            pass
    raw_path = path.replace("_classified.csv", ".csv")
    if os.path.exists(raw_path):
        return os.path.getmtime(raw_path)
    return os.path.getmtime(path)


def get_matching_rom_id_and_path(log_time, db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT rom_id, file_path, file_mtime FROM roms ORDER BY file_mtime ASC;")
    rom_rows = cur.fetchall()
    conn.close()
    if not rom_rows:
        return None, None
    best_id, best_path = None, None
    for i in range(len(rom_rows)):
        r_id, r_path, r_mtime = rom_rows[i]
        next_mtime = rom_rows[i + 1][2] if (i + 1 < len(rom_rows)) else float("inf")
        if r_mtime <= log_time < next_mtime:
            best_id, best_path = r_id, r_path
            break
    if not best_id and rom_rows:
        best_id, best_path = rom_rows[-1][0], rom_rows[-1][1]
    return best_id, best_path


def _f(row, key, default=0.0):
    val = row.get(key)
    if val is None or val == "":
        return default
    try:
        return float(val)
    except ValueError:
        return default


def ingest_classified_datalog(csv_path, db_path, target_rom_id=None):
    if not os.path.exists(csv_path):
        print(f"[!] File not found: {csv_path}", file=sys.stderr)
        return None

    log_name = os.path.basename(csv_path).replace("_classified.csv", ".csv")
    raw_candidate = csv_path.replace("_classified.csv", ".csv")
    raw_file_path = os.path.abspath(raw_candidate) if os.path.exists(raw_candidate) else os.path.abspath(csv_path)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    log_time = parse_log_timestamp(csv_path)

    rom_id = target_rom_id
    if rom_id is None:
        rom_id, _ = get_matching_rom_id_and_path(log_time, db_path)

    with open(csv_path, "r", encoding="latin1") as f:
        reader = list(csv.DictReader(f))

    n = len(reader)
    if n == 0:
        print(f"[!] Empty log: {csv_path}", file=sys.stderr)
        conn.close()
        return None

    duration = _f(reader[-1], "LogEntrySeconds", 0.0) - _f(reader[0], "LogEntrySeconds", 0.0)

    # Drive-level counters
    dyno_whps = []
    dyno_wtqs = []
    clean_whps = []
    clean_wtqs = []
    decel_cut_frames = 0
    decel_leak_frames = 0
    shift_frames = 0
    usable_maf_frames = 0
    usable_ve_frames = 0
    usable_inj_frames = 0
    usable_dyno_frames = 0

    # Bucket definition arrays
    rpm_buckets = [750, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000]
    map_buckets = [20.0, 35.0, 50.0, 65.0, 80.0, 90.0, 100.0, 115.0, 130.0, 150.0, 180.0, 210.0, 240.0]
    mat_buckets = [10, 20, 30, 40, 50, 60, 70]
    vbatt_buckets = [11.5, 12.5, 13.5, 14.2]

    buckets = {}
    events = []
    last_overrun_sec = -999.0
    last_lean_boost_sec = -999.0
    last_high_idc_sec = -999.0
    prev_knock = 0.0

    for idx, r in enumerate(reader):
        try:
            regime = r.get("diag_operating_regime") or "TRANSIENT_CRUISE"
            rpm = _f(r, "RPM", 0.0)
            kpa = _f(r, "MAP", 0.0)
            mafv = _f(r, "MAF", 0.0)
            mat = _f(r, "MAT", 0.0)
            ect = _f(r, "ECT", 0.0)
            tps = _f(r, "TPS", 0.0)
            vbatt = _f(r, "Battery", 14.0)
            afr = _f(r, "AFR", 0.0)
            afrmap = _f(r, "AFRMAP", _f(r, "diag_rom_afrmap", 14.7))
            lag_afr = _f(r, "diag_aligned_afr", afr)
            lag_err = _f(r, "diag_aligned_afr_error", 1.0)
            steady_conf = _f(r, "diag_steady_confidence", 0.0)
            total_trim = _f(r, "diag_total_fuel_trim", 0.0)
            ipw = _f(r, "IPW", 0.0)
            timing = _f(r, "TimingAdv", 0.0)
            knock_val = _f(r, "KnockSum", 0.0)
            sec = _f(r, "LogEntrySeconds", 0.0)
            clamp_state = r.get("diag_load_clamping_state") or "UNCLAMPED"
            k_cls = r.get("diag_knock_class") or "NONE"
            k_conf = _f(r, "diag_knock_confidence", 0.85)

            # Expanded classifications & precomputed ROM table lookups
            gear = r.get("diag_gear") or "IDLE_STATIONARY"
            shift_act = int(_f(r, "diag_shift_active", 0))
            decel_status = r.get("diag_decel_fuel_status") or "NORMAL_DRIVING"
            whp = _f(r, "diag_wheel_hp", 0.0)
            wtq = _f(r, "diag_wheel_tq", 0.0)
            accel_g = _f(r, "diag_smooth_accel_g", 0.0)
            in_vvt_err = _f(r, "diag_in_vvt_error", 0.0)
            ex_vvt_err = _f(r, "diag_ex_vvt_error", 0.0)
            dbw_cut = _f(r, "diag_dbw_throttle_cut", 0.0)
            idc_pct = _f(r, "diag_idc_pct", (rpm * ipw) / 1200.0)

            rom_maf_gs = _f(r, "diag_rom_maf_gs", 0.0)
            rom_map_ve = _f(r, "diag_rom_map_ve_load", 0.0)
            rom_mat_comp = _f(r, "diag_rom_mat_comp_mult", 100.0)
            rom_hi_tim = _f(r, "diag_rom_timing_high", 0.0)
            rom_lo_tim = _f(r, "diag_rom_timing_low", 0.0)
            rom_tim_ret = _f(r, "diag_rom_timing_retard_total", 0.0)
            rom_latency = _f(r, "diag_rom_latency_ms", 0.795)

            u_maf = int(_f(r, "diag_usable_for_maf", 0))
            u_ve = int(_f(r, "diag_usable_for_ve", 0))
            u_inj = int(_f(r, "diag_usable_for_injector", 0))
            u_dyno = int(_f(r, "diag_usable_for_dyno", 0))

            # Drive-level tally
            if decel_status == "CUT_ACTIVE":
                decel_cut_frames += 1
            elif decel_status == "UNEXPECTED_FUELING":
                decel_leak_frames += 1
            if shift_act == 1:
                shift_frames += 1
            usable_maf_frames += u_maf
            usable_ve_frames += u_ve
            usable_inj_frames += u_inj
            usable_dyno_frames += u_dyno
            if u_dyno == 1:
                dyno_whps.append(whp)
                dyno_wtqs.append(wtq)
            if accel_g <= 0.90:
                clean_whps.append(whp)
                clean_wtqs.append(wtq)

            # 1. Knock Operational Events (preserve exact delta_knock severity)
            delta_knock = max(1, int(round(knock_val - prev_knock))) if idx > 0 else max(1, int(round(knock_val)))
            prev_knock = knock_val

            if k_cls != "NONE":
                detail = json.dumps({
                    "delta_knock": delta_knock,
                    "knock_sum": int(round(knock_val)),
                    "gear": gear,
                    "shift_active": shift_act,
                    "timing_adv": round(timing, 1),
                    "rom_timing_high": round(rom_hi_tim, 1),
                    "rom_map_ve_load": round(rom_map_ve, 1),
                    "aligned_afr": round(lag_afr, 2),
                    "aligned_afr_error": round(lag_err, 4),
                })
                events.append((
                    0, rom_id, f"KNOCK_{k_cls}", idx, sec, rpm, kpa, tps, mafv, ipw, vbatt,
                    mat, ect, lag_afr, afrmap, float(delta_knock), k_cls, k_conf, detail
                ))

            # 2. Overrun Decel Fuel Leakage Events (debounced 1.0s)
            if decel_status == "UNEXPECTED_FUELING" and (sec - last_overrun_sec) >= 1.0:
                last_overrun_sec = sec
                detail = json.dumps({
                    "ipw_during_decel": round(ipw, 2),
                    "gear": gear,
                    "rom_mat_comp_mult": round(rom_mat_comp, 2),
                })
                events.append((
                    0, rom_id, "OVERRUN_FUEL_LEAKAGE", idx, sec, rpm, kpa, tps, mafv, ipw, vbatt,
                    mat, ect, afr, afrmap, round(ipw, 2), "DECEL_INJECTOR_LEAK", 0.90, detail
                ))

            # 3. Lean Boost Excursion Events (debounced 1.0s)
            if (ect >= 75.0 and decel_status not in ("CUT_ACTIVE", "DFCO_RECOVERY") and shift_act == 0
                    and kpa >= 135.0 and tps >= 50.0 and lag_err >= 1.06 and (sec - last_lean_boost_sec) >= 1.0):
                last_lean_boost_sec = sec
                err_pct = round((lag_err - 1.0) * 100.0, 2)
                detail = json.dumps({
                    "aligned_afr_error": round(lag_err, 4),
                    "rom_map_ve_load": round(rom_map_ve, 1),
                    "gear": gear,
                })
                events.append((
                    0, rom_id, "LEAN_BOOST_EXCURSION", idx, sec, rpm, kpa, tps, mafv, ipw, vbatt,
                    mat, ect, lag_afr, afrmap, err_pct, "LEAN_UNDER_BOOST", 0.92, detail
                ))

            # 4. High Injector Duty Cycle Warning (debounced 2.0s)
            if idc_pct >= 85.0 and (sec - last_high_idc_sec) >= 2.0:
                last_high_idc_sec = sec
                detail = json.dumps({"idc_pct": round(idc_pct, 1), "gear": gear})
                events.append((
                    0, rom_id, "HIGH_IDC_WARNING", idx, sec, rpm, kpa, tps, mafv, ipw, vbatt,
                    mat, ect, lag_afr, afrmap, round(idc_pct, 1), "INJECTOR_DUTY_HIGH", 0.99, detail
                ))

            # Group into multi-dimensional bucket
            b_rpm = bucket_value(rpm, rpm_buckets)
            b_map = bucket_value(kpa, map_buckets)
            b_mafv = round(mafv, 2)
            b_mat = bucket_value(mat, mat_buckets)
            b_vbatt = bucket_value(vbatt, vbatt_buckets)

            b_key = (regime, b_rpm, b_map, b_mafv, b_mat, b_vbatt)
            if b_key not in buckets:
                buckets[b_key] = {
                    "count": 0, "steady_count": 0, "afr_sum": 0.0, "afrmap_sum": 0.0,
                    "err_sum": 0.0, "err_sq_sum": 0.0, "trim_sum": 0.0, "ipw_sum": 0.0,
                    "vbatt_sum": 0.0, "timing_sum": 0.0, "clamped_count": 0,
                    "k_genuine": 0, "k_flutter": 0, "k_other": 0,
                    "gears": Counter(),
                    "rom_maf_sum": 0.0, "rom_ve_sum": 0.0, "rom_mat_sum": 0.0,
                    "rom_hi_tim_sum": 0.0, "rom_lo_tim_sum": 0.0, "rom_ret_sum": 0.0, "rom_lat_sum": 0.0,
                    "whp_sum": 0.0, "max_whp": 0.0, "wtq_sum": 0.0, "accel_sum": 0.0,
                    "in_vvt_sum": 0.0, "ex_vvt_sum": 0.0, "dbw_cut_sum": 0.0, "idc_sum": 0.0,
                    "decel_cut_cnt": 0, "decel_leak_cnt": 0, "shift_cnt": 0,
                    "u_maf_cnt": 0, "u_ve_cnt": 0, "u_inj_cnt": 0, "u_dyno_cnt": 0,
                }

            b = buckets[b_key]
            b["count"] += 1
            if steady_conf >= 0.70:
                b["steady_count"] += 1
            b["afr_sum"] += lag_afr
            b["afrmap_sum"] += afrmap
            b["err_sum"] += lag_err
            b["err_sq_sum"] += lag_err ** 2
            b["trim_sum"] += total_trim
            b["ipw_sum"] += ipw
            b["vbatt_sum"] += vbatt
            b["timing_sum"] += timing
            if clamp_state == "VACUUM_CEILING_CLAMPED":
                b["clamped_count"] += 1
            if k_cls == "GENUINE_TIMING":
                b["k_genuine"] += 1
            elif k_cls == "BOV_FLUTTER":
                b["k_flutter"] += 1
            elif k_cls != "NONE":
                b["k_other"] += 1

            b["gears"][gear] += 1
            b["rom_maf_sum"] += rom_maf_gs
            b["rom_ve_sum"] += rom_map_ve
            b["rom_mat_sum"] += rom_mat_comp
            b["rom_hi_tim_sum"] += rom_hi_tim
            b["rom_lo_tim_sum"] += rom_lo_tim
            b["rom_ret_sum"] += rom_tim_ret
            b["rom_lat_sum"] += rom_latency
            b["whp_sum"] += whp
            if whp > b["max_whp"]:
                b["max_whp"] = whp
            b["wtq_sum"] += wtq
            b["accel_sum"] += accel_g
            b["in_vvt_sum"] += in_vvt_err
            b["ex_vvt_sum"] += ex_vvt_err
            b["dbw_cut_sum"] += dbw_cut
            b["idc_sum"] += idc_pct
            if decel_status == "CUT_ACTIVE":
                b["decel_cut_cnt"] += 1
            elif decel_status == "UNEXPECTED_FUELING":
                b["decel_leak_cnt"] += 1
            b["shift_cnt"] += shift_act
            b["u_maf_cnt"] += u_maf
            b["u_ve_cnt"] += u_ve
            b["u_inj_cnt"] += u_inj
            b["u_dyno_cnt"] += u_dyno

        except (ValueError, KeyError):
            continue

    peak_whp = max(dyno_whps) if dyno_whps else (max(clean_whps) if clean_whps else 0.0)
    peak_wtq = max(dyno_wtqs) if dyno_wtqs else (max(clean_wtqs) if clean_wtqs else 0.0)

    cur.execute("SELECT log_id FROM datalogs WHERE log_name = ?", (log_name,))
    existing = cur.fetchone()
    if existing:
        log_id = existing[0]
        cur.execute("DELETE FROM regime_summaries WHERE log_id = ?", (log_id,))
        cur.execute("DELETE FROM operational_events WHERE log_id = ?", (log_id,))
        cur.execute("""
        UPDATE datalogs SET
            file_path = ?, classified_csv_path = ?, rom_id = ?, log_time = ?, duration_sec = ?,
            total_records = ?, peak_whp = ?, peak_wtq = ?, decel_cut_frames = ?, decel_leak_frames = ?,
            shift_frames = ?, usable_maf_frames = ?, usable_ve_frames = ?, usable_injector_frames = ?,
            usable_dyno_frames = ?
        WHERE log_id = ?
        """, (
            raw_file_path, os.path.abspath(csv_path), rom_id, log_time, round(duration, 1), n,
            round(peak_whp, 1), round(peak_wtq, 1), decel_cut_frames, decel_leak_frames,
            shift_frames, usable_maf_frames, usable_ve_frames, usable_inj_frames, usable_dyno_frames,
            log_id
        ))
    else:
        cur.execute("""
        INSERT INTO datalogs (
            log_name, file_path, classified_csv_path, rom_id, log_time, duration_sec, total_records,
            peak_whp, peak_wtq, decel_cut_frames, decel_leak_frames, shift_frames,
            usable_maf_frames, usable_ve_frames, usable_injector_frames, usable_dyno_frames
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log_name, raw_file_path, os.path.abspath(csv_path), rom_id, log_time, round(duration, 1), n,
            round(peak_whp, 1), round(peak_wtq, 1), decel_cut_frames, decel_leak_frames,
            shift_frames, usable_maf_frames, usable_ve_frames, usable_inj_frames, usable_dyno_frames
        ))
        log_id = cur.lastrowid

    # Bind log_id into events
    final_events = [(log_id,) + ev[1:] for ev in events]

    summary_rows = []
    for b_key, b in buckets.items():
        regime, b_rpm, b_map, b_mafv, b_mat, b_vbatt = b_key
        cnt = b["count"]
        mean_err = b["err_sum"] / cnt
        variance = max(0.0, (b["err_sq_sum"] / cnt) - (mean_err ** 2))
        stddev = math.sqrt(variance)
        dom_gear = b["gears"].most_common(1)[0][0] if b["gears"] else "IDLE_STATIONARY"

        summary_rows.append((
            log_id, rom_id, regime, b_rpm, b_map, b_mafv, b_mat, b_vbatt,
            cnt, b["steady_count"],
            round(b["afr_sum"] / cnt, 2),
            round(b["afrmap_sum"] / cnt, 2),
            round(mean_err, 4),
            round(stddev, 4),
            round(b["trim_sum"] / cnt, 2),
            round(b["ipw_sum"] / cnt, 2),
            round(b["vbatt_sum"] / cnt, 2),
            round(b["timing_sum"] / cnt, 1),
            round(b["clamped_count"] / cnt * 100.0, 1),
            b["k_genuine"],
            b["k_flutter"],
            b["k_other"],
            dom_gear,
            round(b["rom_maf_sum"] / cnt, 2),
            round(b["rom_ve_sum"] / cnt, 1),
            round(b["rom_mat_sum"] / cnt, 2),
            round(b["rom_hi_tim_sum"] / cnt, 1),
            round(b["rom_lo_tim_sum"] / cnt, 1),
            round(b["rom_ret_sum"] / cnt, 1),
            round(b["rom_lat_sum"] / cnt, 3),
            round(b["whp_sum"] / cnt, 1),
            round(b["max_whp"], 1),
            round(b["wtq_sum"] / cnt, 1),
            round(b["accel_sum"] / cnt, 3),
            round(b["in_vvt_sum"] / cnt, 2),
            round(b["ex_vvt_sum"] / cnt, 2),
            round(b["dbw_cut_sum"] / cnt, 1),
            round(b["idc_sum"] / cnt, 1),
            b["decel_cut_cnt"],
            b["decel_leak_cnt"],
            b["shift_cnt"],
            b["u_maf_cnt"],
            b["u_ve_cnt"],
            b["u_inj_cnt"],
            b["u_dyno_cnt"],
        ))

    cur.executemany("""
    INSERT INTO regime_summaries (
        log_id, rom_id, regime, rpm_bucket, map_bucket, mafv_bucket, mat_bucket, vbatt_bucket,
        sample_count, steady_sample_count, avg_afr, avg_afrmap, avg_afr_error, afr_error_stddev,
        avg_total_trim, avg_ipw_ms, avg_vbatt, avg_timing, clamping_rate,
        knock_count_genuine, knock_count_flutter, knock_count_other,
        dominant_gear, avg_rom_maf_gs, avg_rom_map_ve_load, avg_rom_mat_comp_mult,
        avg_rom_timing_high, avg_rom_timing_low, avg_rom_timing_retard, avg_rom_latency_ms,
        avg_wheel_hp, max_wheel_hp, avg_wheel_tq, avg_accel_g,
        avg_in_vvt_err, avg_ex_vvt_err, avg_dbw_cut, avg_idc_pct,
        decel_cut_count, decel_leak_count, shift_count,
        usable_maf_count, usable_ve_count, usable_injector_count, usable_dyno_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, summary_rows)

    cur.executemany("""
    INSERT INTO operational_events (
        log_id, rom_id, event_type, row_idx, time_sec, rpm, map_kpa, tps, mafv, ipw_ms, vbatt,
        mat_c, ect_c, afr, afrmap, severity, classification, confidence, detail_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, final_events)

    conn.commit()
    conn.close()
    print(f"[+] Ingested Log '{log_name}' (ID: {log_id}, ROM ID: {rom_id}, {len(summary_rows)} buckets, {len(final_events)} events, Peak: {peak_whp:.1f} WHP).")
    return log_id


def rehydrate_database(db_path, roms_dir, scans_dir, since_date_str):
    from datalog_classifier import DatalogClassifier

    cutoff_dt = datetime.strptime(since_date_str, "%Y-%m-%d")
    cutoff_ts = cutoff_dt.timestamp()

    print("\n" + "=" * 72)
    print(f"  REHYDRATING CALIBRATION EXPERIENCE DB (SINCE {since_date_str})")
    print("=" * 72)

    init_db(db_path, reset=True)

    # 1. Discover V3.18 reference ROM + all ROMs modified on/after cutoff_ts
    rom_candidates = sorted(
        glob.glob(os.path.join(roms_dir, "*.srf")) + glob.glob(os.path.join(roms_dir, "*.bin")),
        key=os.path.getmtime
    )
    selected_roms = [
        p for p in rom_candidates
        if ("V3.18" in os.path.basename(p)) or (os.path.getmtime(p) >= cutoff_ts)
    ]

    print(f"[*] Indexing {len(selected_roms)} calibration ROMs...")
    for r_path in selected_roms:
        ingest_rom(r_path, db_path)

    # 2. Discover all raw EvoScan CSV logs on/after cutoff_ts
    raw_logs = [
        p for p in glob.glob(os.path.join(scans_dir, "EvoScanDataLog_*.csv"))
        if not p.endswith("_classified.csv") and parse_log_timestamp(p) >= cutoff_ts
    ]
    raw_logs.sort(key=parse_log_timestamp)

    print(f"\n[*] Re-classifying and ingesting {len(raw_logs)} post-{since_date_str} datalogs...")
    for raw_path in raw_logs:
        log_ts = parse_log_timestamp(raw_path)
        r_id, r_path = get_matching_rom_id_and_path(log_ts, db_path)
        r_label = os.path.basename(r_path) if r_path else "UNMATCHED"
        print(f"  -> {os.path.basename(raw_path)}  ==>  ROM {r_id}: {r_label}")
        cl = DatalogClassifier(raw_path, rom_path=r_path)
        cl.load_and_parse()
        cl.classify_all()
        out_csv = f"{os.path.splitext(raw_path)[0]}_classified.csv"
        cl.export_csv(out_csv)
        ingest_classified_datalog(out_csv, db_path, target_rom_id=r_id)

    conn = sqlite3.connect(db_path)
    conn.execute("ANALYZE;")
    conn.execute("VACUUM;")
    conn.close()
    print("\n[+] Full database rehydration & VACUUM complete!")
    print("=" * 72)


def main():
    parser = argparse.ArgumentParser(description="Calibration Experience Database Ingestion & Rehydration Engine")
    parser.add_argument("--db", default=DEFAULT_DB_PATH, help=f"Path to SQLite database (default: {DEFAULT_DB_PATH})")
    parser.add_argument("--roms", nargs="*", help="List of ROM files to ingest (.srf/.bin)")
    parser.add_argument("--logs", nargs="*", help="List of classified datalog CSVs to ingest (*_classified.csv)")
    parser.add_argument("--auto-classify-logs", nargs="*", help="List of raw CSV logs to auto-classify and ingest")
    parser.add_argument("--target-rom", help="Optional explicit target ROM to pair with datalogs (.srf/.bin)")
    parser.add_argument("--rehydrate", action="store_true", help="Rebuild DB cleanly and re-classify all ROMs and logs since --since-date")
    parser.add_argument("--since-date", default="2026-10-22", help="Cutoff date YYYY-MM-DD for --rehydrate (default: 2026-10-22)")
    parser.add_argument("--roms-dir", default="roms", help="ROM directory for --rehydrate (default: roms)")
    parser.add_argument("--scans-dir", default="scans", help="Scans directory for --rehydrate (default: scans)")
    args = parser.parse_args()

    if args.rehydrate:
        rehydrate_database(args.db, args.roms_dir, args.scans_dir, args.since_date)
        return

    init_db(args.db, reset=False)

    explicit_rom_id = None
    if args.target_rom:
        explicit_rom_id = ingest_rom(args.target_rom, args.db)

    if args.roms:
        for r_path in args.roms:
            ingest_rom(r_path, args.db)

    if args.logs:
        for l_path in args.logs:
            ingest_classified_datalog(l_path, args.db, target_rom_id=explicit_rom_id)

    if args.auto_classify_logs:
        from datalog_classifier import DatalogClassifier
        for raw_path in args.auto_classify_logs:
            log_time = parse_log_timestamp(raw_path)
            r_id = explicit_rom_id
            r_path = args.target_rom
            if not r_path:
                r_id, r_path = get_matching_rom_id_and_path(log_time, args.db)
            print(f"[*] Classifying raw log: {raw_path}")
            if r_path:
                print(f"    -> Using matching ROM: {os.path.basename(r_path)} (ID: {r_id})")
            cl = DatalogClassifier(raw_path, rom_path=r_path)
            cl.load_and_parse()
            cl.classify_all()
            base = os.path.splitext(raw_path)[0]
            out_csv = f"{base}_classified.csv"
            cl.export_csv(out_csv)
            ingest_classified_datalog(out_csv, args.db, target_rom_id=r_id)


if __name__ == "__main__":
    main()
