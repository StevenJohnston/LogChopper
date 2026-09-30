#!/usr/bin/env python3
"""
rom_extractor.py - Extracts calibration tables from Mitsubishi Evo X ROMs (.srf / .bin).
Supports automatic header skipping (328 bytes for .srf, 0 for .bin), scaling conversion,
and exporting to text, TSV, or JSON.
"""

import argparse
import json
import os
import struct
import sys

# Load default memory map relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MAP_FILE = os.path.join(SCRIPT_DIR, "..", "references", "ecu_memory_map.json")

def load_memory_map():
    if os.path.exists(MAP_FILE):
        with open(MAP_FILE, "r") as f:
            return json.load(f)
    return None

def extract_maf_table(rom_bytes, table_def):
    addr = int(table_def["address"], 16)
    elems = table_def["elements"]
    raw = struct.unpack(f">{elems}H", rom_bytes[addr:addr + elems * 2])
    vals = [r / 100.0 for r in raw]
    
    x_def = table_def["x_axis"]
    x_addr = int(x_def["address"], 16)
    x_elems = x_def["elements"]
    raw_x = struct.unpack(f">{x_elems}H", rom_bytes[x_addr:x_addr + x_elems * 2])
    volts = [round(r * 5.0 / 1023.0, 3) for r in raw_x]
    
    return {"name": "MAF Scaling Horizontal", "type": "2D", "volts": volts, "values": vals, "raw": list(raw)}

def extract_map_table(rom_bytes, table_def, name="MAP based Load Calc #2 - Cold/Interpolated"):
    addr = int(table_def["address"], 16)
    x_def = table_def["x_axis"]
    y_def = table_def["y_axis"]
    
    x_addr = int(x_def["address"], 16)
    x_elems = x_def["elements"]
    raw_x = struct.unpack(f">{x_elems}H", rom_bytes[x_addr:x_addr + x_elems * 2])
    map_kpa = [round(((r * 2556.0 / 3800.0) + 0.5) / 2.0, 1) for r in raw_x]
    
    y_addr = int(y_def["address"], 16)
    y_elems = y_def["elements"]
    raw_y = struct.unpack(f">{y_elems}H", rom_bytes[y_addr:y_addr + y_elems * 2])
    rpm = [round(r * 1000.0 / 256.0) for r in raw_y]
    
    total_elems = x_elems * y_elems
    raw_load = struct.unpack(f">{total_elems}H", rom_bytes[addr:addr + total_elems * 2])
    scaled_load = [(r * 10.0 / 512.0) * 10.0 / 32.0 for r in raw_load]
    
    # swapxy: stored as 20 MAP blocks of 19 RPM values each
    # matrix[map_idx][rpm_idx]
    matrix = []
    for m in range(x_elems):
        row = scaled_load[m * y_elems : (m + 1) * y_elems]
        matrix.append(row)
        
    return {
        "name": name,
        "type": "3D",
        "map_axis": map_kpa,
        "rpm_axis": rpm,
        "matrix_map_rows_rpm_cols": matrix,
        "raw": list(raw_load)
    }

def main():
    parser = argparse.ArgumentParser(description="Extract calibration tables from Evo X ROM (.srf/.bin)")
    parser.add_argument("rom", help="Path to ROM file (.srf or .bin)")
    parser.add_argument("--table", choices=["all", "maf", "map"], default="all", help="Table to extract")
    parser.add_argument("--format", choices=["table", "tsv", "json"], default="table", help="Output format")
    args = parser.parse_args()
    
    if not os.path.exists(args.rom):
        sys.exit(f"Error: ROM file not found: {args.rom}")
        
    mem_map = load_memory_map()
    if not mem_map:
        sys.exit("Error: Could not load ecu_memory_map.json")
        
    header_len = 328 if args.rom.lower().endswith(".srf") else 0
    with open(args.rom, "rb") as f:
        f.seek(header_len)
        rom_bytes = f.read()
        
    res = {}
    if args.table in ["all", "maf"]:
        res["maf"] = extract_maf_table(rom_bytes, mem_map["tables"]["MAF Scaling Horizontal"])
    if args.table in ["all", "map"]:
        res["map"] = extract_map_table(rom_bytes, mem_map["tables"]["MAP based Load Calc #2 - Cold/Interpolated"])
        
    if args.format == "json":
        print(json.dumps(res, indent=2))
        return
        
    if "maf" in res:
        maf = res["maf"]
        if args.format == "tsv":
            print("# Voltage\tMAF_Airflow_g_per_s")
            for v, val in zip(maf["volts"], maf["values"]):
                print(f"{v:.3f}\t{val:.2f}")
        else:
            print("================ MAF SCALING HORIZONTAL (0x5757a) ================")
            print("Idx | Voltage | Airflow (g/s) | Raw Hex (uint16)")
            for i, (v, val, raw) in enumerate(zip(maf["volts"], maf["values"], maf["raw"])):
                if val > 0:
                    print(f"{i:3d} | {v:6.3f}V | {val:11.2f} | 0x{raw:04x} ({raw:5d})")
                    
    if "map" in res:
        map_tbl = res["map"]
        if args.format == "tsv":
            print("# MAP based Load Calc #2 TSV (Rows = MAP kPa, Cols = RPM)")
            header = "\t".join(["MAP_kPa"] + [str(r) for r in map_tbl["rpm_axis"]])
            print(header)
            for m_val, row in zip(map_tbl["map_axis"], map_tbl["matrix_map_rows_rpm_cols"]):
                row_str = "\t".join([f"{x:.1f}" for x in row])
                print(f"{m_val:.1f}\t{row_str}")
        else:
            print("\n================ MAP BASED LOAD CALC #2 (0x605ac) ================")
            header = "MAP\\RPM | " + " ".join([f"{r:5d}" for r in map_tbl["rpm_axis"][:10]]) + " ..."
            print(header)
            for m_val, row in zip(map_tbl["map_axis"], map_tbl["matrix_map_rows_rpm_cols"]):
                row_str = " ".join([f"{x:5.1f}" for x in row[:10]])
                print(f"{m_val:5.1f} kPa | {row_str} ...")

if __name__ == "__main__":
    main()
