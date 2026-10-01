#!/usr/bin/env python3
"""
match_roms_and_logs.py - Automatically sorts and pairs the latest ROMs and EvoScan logs
based on file modification timestamps and the fundamental association rule:

Rule: Any log created/modified between ROM_N and ROM_{N+1} belongs to the older ROM (ROM_N).
"""

import os
import sys
import glob
from datetime import datetime

def get_file_info(directory, extensions):
    files = []
    for ext in extensions:
        files.extend(glob.glob(os.path.join(directory, f"*{ext}")))
        files.extend(glob.glob(os.path.join(directory, f"*{ext.upper()}")))
    
    file_list = []
    for f in set(files):
        try:
            mtime = os.path.getmtime(f)
            file_list.append((mtime, f))
        except OSError:
            pass
    file_list.sort(key=lambda x: x[0])
    return file_list

def match_latest(roms_dir, scans_dir, limit=5):
    roms = get_file_info(roms_dir, [".srf", ".bin"])
    scans = get_file_info(scans_dir, [".csv"])

    if not roms:
        print(f"No ROM files found in {roms_dir}", file=sys.stderr)
        return
    if not scans:
        print(f"No scan logs found in {scans_dir}", file=sys.stderr)
        return

    # Pair scans to ROMs:
    # A scan with mtime T belongs to ROM_i if mtime(ROM_i) <= T < mtime(ROM_{i+1}).
    # If T >= mtime(ROM_latest), it belongs to ROM_latest.
    # Scans older than the oldest ROM are assigned to 'Pre-ROM / Legacy'.
    paired = {r[1]: [] for r in roms}
    unmatched_legacy = []

    for s_mtime, s_path in scans:
        matched_rom = None
        for i in range(len(roms)):
            r_mtime, r_path = roms[i]
            next_mtime = roms[i+1][0] if (i + 1 < len(roms)) else float("inf")
            if r_mtime <= s_mtime < next_mtime:
                matched_rom = r_path
                break
        if matched_rom:
            paired[matched_rom].append((s_mtime, s_path))
        else:
            unmatched_legacy.append((s_mtime, s_path))

    # Print the latest N ROMs and their associated logs
    print("================================================================================")
    print("           LATEST EVOMAN ROM & LOG CHRONOLOGICAL ASSOCIATIONS")
    print("Rule: Any log dated between ROM_N and ROM_{N+1} belongs to ROM_N (the older ROM)")
    print("================================================================================\n")

    latest_roms = roms[-limit:]
    latest_roms.reverse()

    for idx, (r_mtime, r_path) in enumerate(latest_roms):
        r_dt = datetime.fromtimestamp(r_mtime).strftime("%Y-%m-%d %H:%M:%S")
        r_name = os.path.basename(r_path)
        associated_scans = paired[r_path]
        
        print(f"[{idx+1}] ROM: {r_name}")
        print(f"    Timestamp: {r_dt}")
        print(f"    Associated Scans ({len(associated_scans)} log(s)):")
        if not associated_scans:
            print("      (No logs recorded for this calibration yet)")
        else:
            for s_mtime, s_path in associated_scans:
                s_dt = datetime.fromtimestamp(s_mtime).strftime("%Y-%m-%d %H:%M:%S")
                s_name = os.path.basename(s_path)
                print(f"      • {s_name} [{s_dt}]")
        print()

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    roms_dir = os.path.join(root_dir, "roms")
    scans_dir = os.path.join(root_dir, "scans")

    limit = 6
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
        except ValueError:
            pass

    match_latest(roms_dir, scans_dir, limit=limit)

if __name__ == "__main__":
    main()
