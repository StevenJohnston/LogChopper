#!/usr/bin/env python3
"""
ingest_experience.py - Calibration Experience Database Ingestion Engine

Ingests calibration ROMs (.srf/.bin) and multi-domain classified datalogs (*_classified.csv)
into the persistent SQLite database (tuning_tools/db/calibration_experience.db).

Stores:
  1. ROM metadata & cell-by-cell tables (MAF, MAP Load Calc, Fuel, Timing, Injector Scaling & Latency, MAT Comp).
  2. Datalog metadata, duration, record counts.
  3. Multi-dimensional regime performance summaries (RPM, MAP, MAFV, MAT, Vbatt).
  4. Operational anomaly events ledger (Knock inceptions, Lean excursions, Latency drift, etc.).
"""

import argparse
import csv
import hashlib
import json
import math
import os
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


def init_db(db_path):
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
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
        FOREIGN KEY(rom_id) REFERENCES roms(rom_id)
    );
    """)

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
        FOREIGN KEY(log_id) REFERENCES datalogs(log_id),
        FOREIGN KEY(rom_id) REFERENCES roms(rom_id)
    );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_regime_search ON regime_summaries(rpm_bucket, map_bucket, mafv_bucket);")

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
            # Overwrite updated ROM tables
            cur.execute("DELETE FROM rom_tables WHERE rom_id = ?", (rom_id,))
            cur.execute("UPDATE roms SET file_mtime = ?, sha256 = ? WHERE rom_id = ?", (file_mtime, sha256, rom_id))
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

    # 3. High Octane Ignition Timing Map (0x55957, 23 RPM x 22 Load, int8)
    try:
        raw_tim = struct.unpack(">506b", raw_bytes[0x55957:0x55957 + 506])
        for r_idx in range(23):
            for l_idx in range(22):
                val = raw_tim[r_idx * 22 + l_idx]
                table_rows.append((rom_id, "high_octane_timing", r_idx, l_idx, LOAD_TIMING_AXIS[l_idx], RPM_TIMING_AXIS[r_idx], float(val)))
    except Exception as e:
        print(f"[!] Error reading Timing map from {rom_name}: {e}")

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
        # Column major in memory: offset = map_col * 7 + mat_row
        for m_col in range(10):
            for r_mat in range(7):
                idx = m_col * 7 + r_mat
                mult = (raw_mat[idx] + 385.0) / 512.0 * 100.0  # Percentage multiplier
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
    import re
    from datetime import datetime
    m = re.search(r"EvoScanDataLog_(\d{4})\.(\d{2})\.(\d{2})_(\d{2})\.(\d{2})\.(\d{2})", os.path.basename(path))
    if m:
        try:
            dt = datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)),
                          int(m.group(4)), int(m.group(5)), int(m.group(6)))
            return dt.timestamp()
        except ValueError:
            pass
    # Fallback to raw csv file mtime if file exists
    raw_path = path.replace("_classified.csv", ".csv")
    if os.path.exists(raw_path):
        return os.path.getmtime(raw_path)
    return os.path.getmtime(path)


def ingest_classified_datalog(csv_path, db_path, target_rom_id=None):
    if not os.path.exists(csv_path):
        print(f"[!] File not found: {csv_path}", file=sys.stderr)
        return None

    log_name = os.path.basename(csv_path).replace("_classified.csv", ".csv")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    log_time = parse_log_timestamp(csv_path)

    # Match ROM if not explicitly provided
    rom_id = target_rom_id
    if rom_id is None:
        cur.execute("SELECT rom_id, file_mtime FROM roms ORDER BY file_mtime ASC;")
        rom_rows = cur.fetchall()
        # Find ROM with latest mtime <= log_time (Chronological Association Rule:
        # A scan with mtime T belongs to ROM_i if mtime(ROM_i) <= T < mtime(ROM_{i+1}))
        best_rom = None
        for i in range(len(rom_rows)):
            r_id, r_mtime = rom_rows[i]
            next_mtime = rom_rows[i + 1][1] if (i + 1 < len(rom_rows)) else float("inf")
            if r_mtime <= log_time < next_mtime:
                best_rom = r_id
                break
        rom_id = best_rom or (rom_rows[-1][0] if rom_rows else None)

    with open(csv_path, "r", encoding="latin1") as f:
        reader = list(csv.DictReader(f))

    n = len(reader)
    if n == 0:
        print(f"[!] Empty log: {csv_path}", file=sys.stderr)
        conn.close()
        return None

    duration = float(reader[-1].get("LogEntrySeconds", 0) or 0) - float(reader[0].get("LogEntrySeconds", 0) or 0)
    log_time = os.path.getmtime(csv_path)

    cur.execute("SELECT log_id FROM datalogs WHERE log_name = ?", (log_name,))
    existing = cur.fetchone()
    if existing:
        log_id = existing[0]
        cur.execute("DELETE FROM regime_summaries WHERE log_id = ?", (log_id,))
        cur.execute("DELETE FROM operational_events WHERE log_id = ?", (log_id,))
        cur.execute("UPDATE datalogs SET classified_csv_path = ?, rom_id = ?, log_time = ?, duration_sec = ?, total_records = ? WHERE log_id = ?",
                    (os.path.abspath(csv_path), rom_id, log_time, duration, n, log_id))
    else:
        cur.execute("""
        INSERT INTO datalogs (log_name, file_path, classified_csv_path, rom_id, log_time, duration_sec, total_records)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (log_name, os.path.abspath(csv_path), os.path.abspath(csv_path), rom_id, log_time, duration, n))
        log_id = cur.lastrowid

    # Bucket definition arrays
    rpm_buckets = [750, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000]
    map_buckets = [20.0, 35.0, 50.0, 65.0, 80.0, 90.0, 100.0, 115.0, 130.0, 150.0, 180.0, 210.0, 240.0]
    mat_buckets = [10, 20, 30, 40, 50, 60, 70]
    vbatt_buckets = [11.5, 12.5, 13.5, 14.2]

    # Aggregate records into buckets
    buckets = {}
    events = []

    for idx, r in enumerate(reader):
        try:
            regime = r.get("diag_operating_regime", "TRANSIENT_CRUISE")
            rpm = float(r.get("RPM", 0) or 0)
            kpa = float(r.get("MAP", 0) or 0)
            mafv = float(r.get("MAF", 0) or 0)
            mat = float(r.get("MAT", 0) or 0)
            vbatt = float(r.get("Battery", 14.0) or 14.0)
            afr = float(r.get("AFR", 0) or 0)
            afrmap = float(r.get("AFRMAP", 14.7) or 14.7)
            lag_afr = float(r.get("diag_aligned_afr", afr) or afr)
            lag_err = float(r.get("diag_aligned_afr_error", 1.0) or 1.0)
            steady_conf = float(r.get("diag_steady_confidence", 0.0) or 0.0)
            total_trim = float(r.get("diag_total_fuel_trim", 0.0) or 0.0)
            ipw = float(r.get("IPW", 0.0) or 0.0)
            timing = float(r.get("TimingAdv", 0.0) or 0.0)
            clamp_state = r.get("diag_load_clamping_state", "UNCLAMPED")
            k_cls = r.get("diag_knock_class", "NONE")
            tps = float(r.get("TPS", 0) or 0)
            ect = float(r.get("ECT", 0) or 0)
            sec = float(r.get("LogEntrySeconds", 0) or 0)

            # Check for knock events
            if k_cls != "NONE":
                events.append((log_id, rom_id, f"KNOCK_{k_cls}", idx, sec, rpm, kpa, tps, mafv, ipw, vbatt, mat, ect,
                               afr, afrmap, 1.0, k_cls, float(r.get("diag_knock_confidence", 0.8) or 0.8), "{}"))

            # Group into bucket key: (regime, b_rpm, b_map, b_mafv, b_mat, b_vbatt)
            b_rpm = bucket_value(rpm, rpm_buckets)
            b_map = bucket_value(kpa, map_buckets)
            b_mafv = round(mafv, 2)  # group to 0.01V
            b_mat = bucket_value(mat, mat_buckets)
            b_vbatt = bucket_value(vbatt, vbatt_buckets)

            b_key = (regime, b_rpm, b_map, b_mafv, b_mat, b_vbatt)
            if b_key not in buckets:
                buckets[b_key] = {
                    "count": 0, "steady_count": 0, "afr_sum": 0.0, "afrmap_sum": 0.0,
                    "err_sum": 0.0, "err_sq_sum": 0.0, "trim_sum": 0.0, "ipw_sum": 0.0,
                    "vbatt_sum": 0.0, "timing_sum": 0.0, "clamped_count": 0,
                    "k_genuine": 0, "k_flutter": 0
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

        except (ValueError, KeyError):
            continue

    summary_rows = []
    for b_key, b in buckets.items():
        regime, b_rpm, b_map, b_mafv, b_mat, b_vbatt = b_key
        cnt = b["count"]
        mean_err = b["err_sum"] / cnt
        variance = max(0.0, (b["err_sq_sum"] / cnt) - (mean_err ** 2))
        stddev = math.sqrt(variance)

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
            b["k_flutter"]
        ))

    cur.executemany("""
    INSERT INTO regime_summaries (
        log_id, rom_id, regime, rpm_bucket, map_bucket, mafv_bucket, mat_bucket, vbatt_bucket,
        sample_count, steady_sample_count, avg_afr, avg_afrmap, avg_afr_error, afr_error_stddev,
        avg_total_trim, avg_ipw_ms, avg_vbatt, avg_timing, clamping_rate, knock_count_genuine, knock_count_flutter
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, summary_rows)

    cur.executemany("""
    INSERT INTO operational_events (
        log_id, rom_id, event_type, row_idx, time_sec, rpm, map_kpa, tps, mafv, ipw_ms, vbatt,
        mat_c, ect_c, afr, afrmap, severity, classification, confidence, detail_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, events)

    conn.commit()
    conn.close()
    print(f"[+] Ingested Log '{log_name}' (ID: {log_id}, Linked ROM ID: {rom_id}, {len(summary_rows)} performance buckets, {len(events)} events).")
    return log_id


def main():
    parser = argparse.ArgumentParser(description="Calibration Experience Database Ingestion Engine")
    parser.add_argument("--db", default=DEFAULT_DB_PATH, help=f"Path to SQLite database (default: {DEFAULT_DB_PATH})")
    parser.add_argument("--roms", nargs="*", help="List of ROM files to ingest (.srf/.bin)")
    parser.add_argument("--logs", nargs="*", help="List of classified datalog CSVs to ingest (*_classified.csv)")
    parser.add_argument("--auto-classify-logs", nargs="*", help="List of raw CSV logs to auto-classify and ingest")
    args = parser.parse_args()

    init_db(args.db)

    # Ingest ROMs
    if args.roms:
        for r_path in args.roms:
            ingest_rom(r_path, args.db)

    # Ingest Classified Logs
    if args.logs:
        for l_path in args.logs:
            ingest_classified_datalog(l_path, args.db)

    # Auto classify raw logs if requested
    if args.auto_classify_logs:
        from datalog_classifier import DatalogClassifier
        for raw_path in args.auto_classify_logs:
            print(f"[*] Classifying raw log: {raw_path}")
            cl = DatalogClassifier(raw_path)
            cl.load_and_parse()
            cl.classify_all()
            base = os.path.splitext(raw_path)[0]
            out_csv = f"{base}_classified.csv"
            cl.export_csv(out_csv)
            ingest_classified_datalog(out_csv, args.db)


if __name__ == "__main__":
    main()
