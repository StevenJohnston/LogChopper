#!/usr/bin/env python3
"""
fill_log_afrmap.py - Reconstructs and fills missing AFRMAP in EvoScan CSV datalogs.

Uses the 4B11T ECU High Octane Fuel Map (0x55027 in ROM, 21 Load x 16 RPM)
and performs the exact firmware bilinear interpolation to reconstruct AFRMAP.
"""

import argparse
import csv
import os
import shutil
import struct
import sys

def get_fuel_map(rom_path):
    header_len = 328 if rom_path.lower().endswith(".srf") else 0
    with open(rom_path, "rb") as f:
        f.seek(header_len)
        d = f.read()

    # Load axis (21 uint16) at 0x617bc
    load_raw = struct.unpack(">21H", d[0x617bc:0x617bc+42])
    load_axis = [r * 10.0 / 32.0 for r in load_raw]

    # RPM axis (16 uint16) at 0x61796
    rpm_raw = struct.unpack(">16H", d[0x61796:0x61796+32])
    rpm_axis = [r * 1000.0 / 256.0 for r in rpm_raw]

    # High Octane Fuel Map (21 Load rows x 16 RPM cols = 336 bytes) at 0x55027
    raw_bytes = struct.unpack(">336B", d[0x55027:0x55027+336])
    table = [list(raw_bytes[l * 16:(l + 1) * 16]) for l in range(21)]

    return load_axis, rpm_axis, table

def interpolate_afrmap(load, rpm, load_axis, rpm_axis, table):
    # Clamp to boundaries
    l_val = max(load_axis[0], min(load_axis[-1], load))
    r_val = max(rpm_axis[0], min(rpm_axis[-1], rpm))

    # Bracket Load (rows)
    l_idx = 0
    while l_idx < len(load_axis) - 2 and load_axis[l_idx + 1] <= l_val:
        l_idx += 1
    l_frac = (l_val - load_axis[l_idx]) / (load_axis[l_idx + 1] - load_axis[l_idx])

    # Bracket RPM (cols)
    r_idx = 0
    while r_idx < len(rpm_axis) - 2 and rpm_axis[r_idx + 1] <= r_val:
        r_idx += 1
    r_frac = (r_val - rpm_axis[r_idx]) / (rpm_axis[r_idx + 1] - rpm_axis[r_idx])

    # Bilinear interpolation on raw uint8
    c00 = table[l_idx][r_idx]
    c01 = table[l_idx][r_idx + 1]
    c10 = table[l_idx + 1][r_idx]
    c11 = table[l_idx + 1][r_idx + 1]

    top = c00 * (1.0 - r_frac) + c01 * r_frac
    bot = c10 * (1.0 - r_frac) + c11 * r_frac
    raw_interp = top * (1.0 - l_frac) + bot * l_frac

    raw_byte = round(raw_interp)
    if raw_byte <= 0:
        return 14.7
    return 14.7 * 128.0 / raw_byte

def process_log(log_path, rom_path, backup=True):
    load_axis, rpm_axis, table = get_fuel_map(rom_path)

    with open(log_path, "r", encoding="latin1") as f:
        reader = list(csv.reader(f))

    if not reader:
        print(f"Error: {log_path} is empty")
        return False

    header = reader[0]
    if "AFRMAP" not in header:
        print(f"Error: 'AFRMAP' column not found in {log_path}")
        return False

    afrmap_idx = header.indexOf("AFRMAP") if hasattr(header, "indexOf") else header.index("AFRMAP")
    load_idx = header.index("Load") if "Load" in header else header.index("LoadTiming")
    rpm_idx = header.index("RPM")

    if backup:
        bak_path = log_path + ".bak"
        if not os.path.exists(bak_path):
            shutil.copyfile(log_path, bak_path)
            print(f"Created backup: {os.path.basename(bak_path)}")

    filled_count = 0
    total_data_rows = len(reader) - 1

    for row_idx in range(1, len(reader)):
        row = reader[row_idx]
        if len(row) <= max(afrmap_idx, load_idx, rpm_idx):
            continue
        try:
            load = float(row[load_idx])
            rpm = float(row[rpm_idx])
            afrmap_val = interpolate_afrmap(load, rpm, load_axis, rpm_axis, table)
            row[afrmap_idx] = f"{afrmap_val:.12g}"
            filled_count += 1
        except (ValueError, TypeError):
            pass

    # Write back
    temp_path = log_path + ".tmp"
    with open(temp_path, "w", newline="", encoding="latin1") as f:
        writer = csv.writer(f)
        writer.writerows(reader)

    os.replace(temp_path, log_path)
    print(f"Successfully filled AFRMAP in {os.path.basename(log_path)} ({filled_count:,} / {total_data_rows:,} rows)")
    return True

def main():
    parser = argparse.ArgumentParser(description="Reconstruct missing AFRMAP column in EvoScan CSV logs")
    parser.add_argument("logs", nargs="+", help="Path(s) to datalog CSV files")
    parser.add_argument("--rom", default="roms/AFR 14.7, scale 262, late 1.005, mafmap 10 new balancer logic.srf",
                        help="Path to ROM file (.srf/.bin)")
    parser.add_argument("--no-backup", action="store_true", help="Do not create .bak backup files")
    args = parser.parse_args()

    for log in args.logs:
        process_log(log, args.rom, backup=not args.no_backup)

if __name__ == "__main__":
    main()
