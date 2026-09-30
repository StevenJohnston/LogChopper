#!/usr/bin/env python3
"""
rom_differ.py - Compares two Evo X ROM files (.srf or .bin), identifies modified calibration
tables, and outputs exact cell-by-cell numerical deltas, percentages, and table multipliers (C_MAF).
"""

import argparse
import json
import os
import struct
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MAP_FILE = os.path.join(SCRIPT_DIR, "..", "references", "ecu_memory_map.json")

def load_rom_bytes(path):
    if not os.path.exists(path):
        sys.exit(f"File not found: {path}")
    header_len = 328 if path.lower().endswith(".srf") else 0
    with open(path, "rb") as f:
        f.seek(header_len)
        return f.read()

def diff_roms(rom1_path, rom2_path, show_all=False):
    b1 = load_rom_bytes(rom1_path)
    b2 = load_rom_bytes(rom2_path)
    
    if len(b1) != len(b2):
        print(f"Warning: ROM size mismatch ({len(b1)} vs {len(b2)})")
        
    with open(MAP_FILE, "r") as f:
        mem_map = json.load(f)
        
    print(f"Comparing:")
    print(f"  ROM 1: {os.path.basename(rom1_path)}")
    print(f"  ROM 2: {os.path.basename(rom2_path)}")
    
    # 1. Check MAF Scaling Horizontal (0x5757a)
    maf_def = mem_map["tables"]["MAF Scaling Horizontal"]
    addr = int(maf_def["address"], 16)
    elems = maf_def["elements"]
    
    raw1 = struct.unpack(f">{elems}H", b1[addr:addr+elems*2])
    raw2 = struct.unpack(f">{elems}H", b2[addr:addr+elems*2])
    
    x_addr = int(maf_def["x_axis"]["address"], 16)
    x_raw = struct.unpack(f">{elems}H", b1[x_addr:x_addr+elems*2])
    volts = [round(r * 5.0 / 1023.0, 3) for r in x_raw]
    
    maf_diffs = []
    for i in range(elems):
        if raw1[i] != raw2[i]:
            val1 = raw1[i] / 100.0
            val2 = raw2[i] / 100.0
            factor = val2 / val1 if val1 > 0 else 1.0
            pct = (val2 - val1) / val1 * 100 if val1 > 0 else 0
            maf_diffs.append({
                "index": i, "volts": volts[i], "val1": val1, "val2": val2,
                "factor": factor, "pct": pct, "raw1": raw1[i], "raw2": raw2[i]
            })
            
    print(f"\n[1] MAF Scaling Horizontal (0x5757a): {len(maf_diffs)} / {elems} cells modified")
    if maf_diffs:
        print("Idx | Voltage | ROM 1 (g/s) | ROM 2 (g/s) | Delta (g/s) | Table Factor (C_MAF) | Change %")
        to_show = maf_diffs if show_all else maf_diffs[:20]
        for d in to_show:
            print(f"{d['index']:3d} | {d['volts']:6.3f}V | {d['val1']:10.2f} | {d['val2']:10.2f} | {d['val2']-d['val1']:+10.2f} | {d['factor']:18.4f} | {d['pct']:+6.2f}%")
        if len(maf_diffs) > 20 and not show_all:
            print(f"  ... and {len(maf_diffs)-20} more cells (use --all to show all)")

    # 2. Check MAP based Load Calc #2 (0x605ac)
    map_def = mem_map["tables"]["MAP based Load Calc #2 - Cold/Interpolated"]
    map_addr = int(map_def["address"], 16)
    m_elems = map_def["x_axis"]["elements"] # 20
    r_elems = map_def["y_axis"]["elements"] # 19
    tot_map = m_elems * r_elems # 380
    
    m_raw1 = struct.unpack(f">{tot_map}H", b1[map_addr:map_addr+tot_map*2])
    m_raw2 = struct.unpack(f">{tot_map}H", b2[map_addr:map_addr+tot_map*2])
    
    m_axis_raw = struct.unpack(f">{m_elems}H", b1[int(map_def['x_axis']['address'], 16):int(map_def['x_axis']['address'], 16)+m_elems*2])
    map_kpa = [round(((r * 2556.0 / 3800.0) + 0.5) / 2.0, 1) for r in m_axis_raw]
    r_axis_raw = struct.unpack(f">{r_elems}H", b1[int(map_def['y_axis']['address'], 16):int(map_def['y_axis']['address'], 16)+r_elems*2])
    rpm = [round(r * 1000.0 / 256.0) for r in r_axis_raw]
    
    map_diffs = []
    for i in range(tot_map):
        if m_raw1[i] != m_raw2[i]:
            v1 = (m_raw1[i] * 10.0 / 512.0) * 10.0 / 32.0
            v2 = (m_raw2[i] * 10.0 / 512.0) * 10.0 / 32.0
            m_idx = i // r_elems
            r_idx = i % r_elems
            factor = v2 / v1 if v1 > 0 else 1.0
            pct = (v2 - v1) / v1 * 100 if v1 > 0 else 0
            map_diffs.append({
                "index": i, "map_kpa": map_kpa[m_idx], "rpm": rpm[r_idx],
                "val1": v1, "val2": v2, "factor": factor, "pct": pct
            })
            
    print(f"\n[2] MAP based Load Calc #2 (0x605ac): {len(map_diffs)} / {tot_map} cells modified")
    if map_diffs:
        print("Idx | MAP (kPa) | RPM   | ROM 1 Load% | ROM 2 Load% | Delta Load% | Table Factor (C_MAP) | Change %")
        to_show = map_diffs if show_all else map_diffs[:20]
        for d in to_show:
            print(f"{d['index']:3d} | {d['map_kpa']:8.1f} | {d['rpm']:5d} | {d['val1']:10.2f}% | {d['val2']:10.2f}% | {d['val2']-d['val1']:+10.2f}% | {d['factor']:18.4f} | {d['pct']:+6.2f}%")
        if len(map_diffs) > 20 and not show_all:
            print(f"  ... and {len(map_diffs)-20} more cells (use --all to show all)")

def main():
    parser = argparse.ArgumentParser(description="Diff two Evo X calibration ROMs (.srf/.bin)")
    parser.add_argument("rom1", help="Path to base ROM file")
    parser.add_argument("rom2", help="Path to modified ROM file")
    parser.add_argument("--all", action="store_true", help="Display all changed cells without truncation")
    args = parser.parse_args()
    
    diff_roms(args.rom1, args.rom2, show_all=args.all)

if __name__ == "__main__":
    main()
