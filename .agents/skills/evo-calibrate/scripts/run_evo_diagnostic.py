#!/usr/bin/env python3
"""
run_evo_diagnostic.py - One-shot Discovery, Classification, DB Sync & Multi-Domain Audit Runner

Automatically:
  1. Finds the latest ROM in roms/ and chronologically associated raw logs in scans/.
  2. Ensures the latest ROM and all of its raw logs are classified (*_classified.csv)
     and ingested into tuning_tools/db/calibration_experience.db.
  3. Runs multi-domain experience audits (health/progression, anomaly events, thermal, injectors)
     and optional operating-point similarity / reverse-match lookups if --rpm and --map are given.
"""

import argparse
import glob
import os
import sqlite3
import subprocess
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "..", "..", ".."))
TOOLS_DIR = os.path.join(REPO_ROOT, "tuning_tools", "tools")
DEFAULT_DB = os.path.join(REPO_ROOT, "tuning_tools", "db", "calibration_experience.db")

sys.path.insert(0, TOOLS_DIR)
from ingest_experience import init_db, ingest_rom, parse_log_timestamp, get_matching_rom_id_and_path, ingest_classified_datalog  # noqa: E402
from datalog_classifier import DatalogClassifier  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description="One-shot Evo X Diagnostic & Experience DB Sync Runner")
    parser.add_argument("--roms-dir", default=os.path.join(REPO_ROOT, "roms"))
    parser.add_argument("--scans-dir", default=os.path.join(REPO_ROOT, "scans"))
    parser.add_argument("--db", default=DEFAULT_DB)
    parser.add_argument("--since-date", default="2026-10-22", help="Ignore files older than YYYY-MM-DD")
    parser.add_argument("--force-reclassify", action="store_true", help="Re-classify latest ROM's logs even if already in DB")
    parser.add_argument("--rpm", type=float, help="Optional focus RPM from user prompt for k-NN & reverse-match")
    parser.add_argument("--map", type=float, help="Optional focus MAP kPa from user prompt for k-NN & reverse-match")
    parser.add_argument("--gear", help="Optional focus Gear (1..5) from user prompt")
    args = parser.parse_args()

    from datetime import datetime
    cutoff_ts = datetime.strptime(args.since_date, "%Y-%m-%d").timestamp()

    init_db(args.db, reset=False)

    # 1. Sync any post-cutoff ROMs not yet in DB
    roms = sorted(
        glob.glob(os.path.join(args.roms_dir, "*.srf")) + glob.glob(os.path.join(args.roms_dir, "*.bin")),
        key=os.path.getmtime
    )
    active_roms = [p for p in roms if ("V3.18" in os.path.basename(p)) or (os.path.getmtime(p) >= cutoff_ts)]
    for rp in active_roms:
        ingest_rom(rp, args.db)

    latest_rom = active_roms[-1] if active_roms else None
    print(f"\n[*] Active Latest ROM: {os.path.basename(latest_rom) if latest_rom else 'None'}")

    # 2. Check post-cutoff raw logs and classify/ingest any missing (or forced) logs
    conn = sqlite3.connect(args.db)
    cur = conn.cursor()
    cur.execute("SELECT log_name FROM datalogs;")
    existing_logs = {r[0] for r in cur.fetchall()}
    conn.close()

    raw_logs = sorted(
        [p for p in glob.glob(os.path.join(args.scans_dir, "EvoScanDataLog_*.csv"))
         if not p.endswith("_classified.csv") and parse_log_timestamp(p) >= cutoff_ts],
        key=parse_log_timestamp
    )

    new_count = 0
    for lp in raw_logs:
        lname = os.path.basename(lp)
        log_ts = parse_log_timestamp(lp)
        r_id, r_path = get_matching_rom_id_and_path(log_ts, args.db)
        is_latest_rom_log = (latest_rom and r_path and os.path.abspath(r_path) == os.path.abspath(latest_rom))

        if lname not in existing_logs or (args.force_reclassify and is_latest_rom_log):
            print(f"[*] Auto-classifying & ingesting: {lname} (ROM ID {r_id})")
            cl = DatalogClassifier(lp, rom_path=r_path)
            cl.load_and_parse()
            cl.classify_all()
            out_csv = f"{os.path.splitext(lp)[0]}_classified.csv"
            cl.export_csv(out_csv)
            ingest_classified_datalog(out_csv, args.db, target_rom_id=r_id)
            new_count += 1

    if new_count == 0:
        print("[*] All post-cutoff datalogs are already classified and indexed in calibration_experience.db.")

    # 3. Run multi-domain audits
    query_script = os.path.join(TOOLS_DIR, "experience_query.py")
    for subcmd in ["audit-health", "audit-events", "audit-thermal", "audit-injectors"]:
        subprocess.run([sys.executable, query_script, "--db", args.db, subcmd], check=False)

    if args.rpm is not None and args.map is not None:
        rev_cmd = [sys.executable, query_script, "--db", args.db, "reverse-match",
                   "--rpm", str(args.rpm), "--map", str(args.map)]
        sim_cmd = [sys.executable, query_script, "--db", args.db, "find-similar",
                   "--rpm", str(args.rpm), "--map", str(args.map)]
        if args.gear:
            rev_cmd.extend(["--gear", str(args.gear)])
            sim_cmd.extend(["--gear", str(args.gear)])
        subprocess.run(rev_cmd, check=False)
        subprocess.run(sim_cmd, check=False)


if __name__ == "__main__":
    main()
