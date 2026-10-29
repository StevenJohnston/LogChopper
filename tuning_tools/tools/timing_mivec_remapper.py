#!/usr/bin/env python3
"""
timing_mivec_remapper.py - Automated Ignition Timing & MIVEC Remapper for Evo X

Purpose:
  Aligns the current calibration's Ignition Timing (High & Low Octane) and MIVEC (Intake & Exhaust)
  to precisely deliver the requested spark advance and cam angles established in the pro-tuner
  reference ROM (V3.18), compensating for any load calc shifts resulting from MAF Scaling and
  MAP based Load Calc adjustments.

Decompiled ECU Logic Reference:
  - load_clamp_or_blend.c (0x04DC64):
      ChosenLoad = clamp(MAFCalcs, min(MAP, IMAP), max(MAP, IMAP))
      Under steady state: ChosenLoad = min(MAFCalcs, MAPCalcs)
  - Balanced Pressure Envelope:
      * MAP <= 80 kPa (Vacuum):  MAP/MAF ratio = 1.20 -> MAF is 100% active master.
      * MAP >= 120 kPa (Boost):  MAP/MAF ratio = 0.80 -> MAP (Speed Density) is 100% active master.
      * 80 < MAP < 120 (Cross):  Linear blend weight w_map = (MAP - 80) / 40.

Features:
  1. Base Reference: Defaults to V3.18 (when vehicle ran best on 94 octane).
  2. Flexible Input: Accepts a target ROM file (.srf/.bin) OR standalone MAF/MAP table files (TSV/CSV).
  3. Sensor Analysis: Outputs the MAP and MAF tables populated with resulting timing/MIVEC values,
     displaying 'null' where the sensor is not the primary load master.
  4. EcuFlash Paste Buffers: Emits tab-separated grids ready for direct clipboard pasting into EcuFlash:
     - High Octane Timing Map (23 RPM rows x 22 Load columns)
     - Low Octane Timing Map (23 RPM rows x 22 Load columns)
     - MIVEC Intake Normal Coolant Temp (24 RPM rows x 21 Load columns)
     - MIVEC Exhaust Normal Coolant Temp (24 RPM rows x 21 Load columns)

Usage:
  python3 timing_mivec_remapper.py --target-rom "roms/AFR 14.7, scale 262, late 1.005, MAFMAP TIMING 17.srf"
  python3 timing_mivec_remapper.py --target-rom ... --sensor-tables
  python3 timing_mivec_remapper.py --maf-table maf.tsv --map-table map.tsv
"""

import argparse
import bisect
import csv
import os
import re
import struct
import sys

# Platform Physical Constants
K_MAF = 4964.0          # Empirical displacement scaling constant for 2.0L 4B11T MAFCalcs
K_MAP_RUNTIME = 1.090   # ECU firmware multiplier (256+13)/256 = 1.05078 * nominal MAT/Baro factor (~1.037)

# ROM Memory Addresses (USDM 5MT Base 59580004 / TephraMOD 59580304)
ROM_TIMING_ADDR = 0x55957       # High Octane Timing Map (506 bytes: 23 RPM x 22 Load, int8)
ROM_LOW_TIMING_ADDR = 0x55B59   # Low Octane Timing Map (506 bytes: 23 RPM x 22 Load, int8)
ROM_MIVEC_IN_ADDR = 0x5DE03     # MIVEC Intake Normal Coolant Temp (504 bytes: 24 RPM x 21 Load, uint8)
ROM_MIVEC_EX_ADDR = 0x5E203     # MIVEC Exhaust Normal Coolant Temp (504 bytes: 24 RPM x 21 Load, uint8)
ROM_MAF_SCALING_ADDR = 0x5757A  # MAF Scaling Horizontal (260 bytes: 130 uint16)
ROM_MAF_VOLTS_ADDR = 0x61FD0    # MAF Volts Axis (260 bytes: 130 uint16)
ROM_MAP_CALC_ADDR = 0x608AE     # MAP based Load Calc #1 Hot/Interpolated (760 bytes: 20 MAP x 19 RPM, uint16)
ROM_MAP_CALC2_ADDR = 0x605AC    # MAP based Load Calc #2 Cold/Interpolated (760 bytes: 20 MAP x 19 RPM, uint16)
ROM_MAP_AXIS_ADDR = 0x6344A     # MAP Axis (40 bytes: 20 uint16)

# Axes Definitions
RPM_TIMING_AXIS = [500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3250, 3500, 3750, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000]
LOAD_TIMING_AXIS = [0.0, 10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0, 120.0, 140.0, 160.0, 180.0, 200.0, 220.0, 240.0, 260.0, 280.0, 300.0, 320.0]

RPM_MIVEC_AXIS = [500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3250, 3500, 3750, 4000, 4250, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000]
LOAD_MIVEC_AXIS = [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0, 120.0, 140.0, 160.0, 180.0, 200.0, 220.0, 240.0, 260.0, 280.0, 300.0, 320.0]

RPM_MAP_AXIS = [500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000]
MAP_KPA_AXIS = [13.7, 22.1, 35.6, 49.0, 62.5, 75.9, 89.4, 102.8, 116.3, 129.7, 143.2, 156.6, 170.1, 183.5, 197.0, 210.4, 223.9, 237.4, 250.8, 304.6]


def interp1d(x_val, xp, fp):
    """Piecewise linear 1D interpolation with flat-clamp boundaries."""
    if x_val <= xp[0]:
        return float(fp[0])
    if x_val >= xp[-1]:
        return float(fp[-1])
    idx = bisect.bisect_right(xp, x_val)
    x0, x1 = xp[idx - 1], xp[idx]
    y0, y1 = fp[idx - 1], fp[idx]
    if x1 == x0:
        return float(y0)
    return float(y0 + (x_val - x0) * (y1 - y0) / (x1 - x0))


def load_rom_file(path):
    """Loads a .srf or .bin ROM, stripping the 328-byte Tactrix header if present."""
    if not os.path.exists(path):
        sys.exit(f"Error: ROM file not found: {path}")
    header_len = 328 if path.lower().endswith(".srf") else 0
    with open(path, "rb") as f:
        content = bytearray(f.read())
    rom_bytes = content[header_len:]
    return content, header_len, rom_bytes


def parse_numeric_file(path):
    """Parses whitespace/tab/comma-delimited numbers from a file."""
    if not os.path.exists(path):
        sys.exit(f"Error: Table file not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    tokens = re.split(r"[\s,\t\r\n]+", text.strip())
    vals = []
    for t in tokens:
        if t:
            try:
                vals.append(float(t))
            except ValueError:
                pass
    return vals


def extract_rom_data(rom_bytes):
    """Extracts all relevant calibration tables and axes from binary memory."""
    # Timing Map (23 RPM rows x 22 Load cols, stored column-major)
    raw_t = struct.unpack(">506b", rom_bytes[ROM_TIMING_ADDR:ROM_TIMING_ADDR+506])
    timing = [[float(raw_t[c * 23 + r]) for c in range(22)] for r in range(23)]

    # Low Timing Map (23 RPM rows x 22 Load cols)
    raw_lt = struct.unpack(">506b", rom_bytes[ROM_LOW_TIMING_ADDR:ROM_LOW_TIMING_ADDR+506])
    low_timing = [[float(raw_lt[c * 23 + r]) for c in range(22)] for r in range(23)]

    # MIVEC Intake (24 RPM rows x 21 Load cols, uint8, scaling: 80 - x * 0.625)
    raw_in = rom_bytes[ROM_MIVEC_IN_ADDR:ROM_MIVEC_IN_ADDR+504]
    mivec_in = [[round(80.0 - raw_in[c * 24 + r] * 0.625, 1) for c in range(21)] for r in range(24)]

    # MIVEC Exhaust (24 RPM rows x 21 Load cols, uint8, scaling: 80 - x * 0.625)
    raw_ex = rom_bytes[ROM_MIVEC_EX_ADDR:ROM_MIVEC_EX_ADDR+504]
    mivec_ex = [[round(80.0 - raw_ex[c * 24 + r] * 0.625, 1) for c in range(21)] for r in range(24)]

    # MAF Scaling (130 cells, scaling: x / 100 g/s)
    maf = [x / 100.0 for x in struct.unpack(">130H", rom_bytes[ROM_MAF_SCALING_ADDR:ROM_MAF_SCALING_ADDR+260])]

    # Volts Axis (130 cells, scaling: x * 5 / 1023 V)
    volts = [x * 5.0 / 1023.0 for x in struct.unpack(">130H", rom_bytes[ROM_MAF_VOLTS_ADDR:ROM_MAF_VOLTS_ADDR+260])]

    # MAP Axis (20 cells)
    map_raw = struct.unpack(">20H", rom_bytes[ROM_MAP_AXIS_ADDR:ROM_MAP_AXIS_ADDR+40])
    map_kpa = [round(((x * 2556.0 / 3800.0) + 0.5) / 2.0, 1) for x in map_raw]

    # MAP Load Calc (20 MAP cols x 19 RPM rows, scaling: Loadify x / 163.84 * K_MAP_RUNTIME)
    mapc_raw = struct.unpack(">380H", rom_bytes[ROM_MAP_CALC_ADDR:ROM_MAP_CALC_ADDR+760])
    mapc2_raw = struct.unpack(">380H", rom_bytes[ROM_MAP_CALC2_ADDR:ROM_MAP_CALC2_ADDR+760])
    mapc = [[(mapc_raw[m * 19 + r] / 163.84) * K_MAP_RUNTIME for m in range(20)] for r in range(19)]
    mapc_mismatch = sum(1 for a, b in zip(mapc_raw, mapc2_raw) if a != b)

    return {
        "timing": timing,
        "low_timing": low_timing,
        "mivec_in": mivec_in,
        "mivec_ex": mivec_ex,
        "maf": maf,
        "volts": volts,
        "map_kpa": map_kpa,
        "mapc": mapc,
        "mapc_mismatch": mapc_mismatch
    }


def interp_table_value(rpm, load, rpm_axis, load_axis, table):
    """Looks up value in a 2D table by nearest RPM row and 1D interpolated Load."""
    r_idx = min(range(len(rpm_axis)), key=lambda i: abs(rpm_axis[i] - rpm))
    return interp1d(load, load_axis, table[r_idx])


def remap_timing_and_mivec(base_data, target_data):
    """
    Performs inverse-coordinate remapping from base reference to target calibration.
    Returns:
      (remapped_high_timing, remapped_low_timing, remapped_mivec_in, remapped_mivec_ex)
    """
    # 1. Remap Timing (23 RPM x 22 Load)
    remapped_high = [[0]*22 for _ in range(23)]
    for r_idx, rpm in enumerate(RPM_TIMING_AXIS):
        r_map_idx = min(range(19), key=lambda i: abs(RPM_MAP_AXIS[i] - rpm))
        for c_idx, target_load in enumerate(LOAD_TIMING_AXIS):
            map_kpa = interp1d(target_load, target_data["mapc"][r_map_idx], target_data["map_kpa"])
            if map_kpa <= 80.0:
                w_map = 0.0
            elif map_kpa >= 120.0:
                w_map = 1.0
            else:
                w_map = (map_kpa - 80.0) / 40.0

            if w_map < 1.0:
                req_gs = (target_load * rpm) / K_MAF
                v = interp1d(req_gs, target_data["maf"], target_data["volts"])
                base_gs = interp1d(v, base_data["volts"], base_data["maf"])
                base_ld_maf = (K_MAF * base_gs) / rpm
                t_maf = interp_table_value(rpm, base_ld_maf, RPM_TIMING_AXIS, LOAD_TIMING_AXIS, base_data["timing"])
            else:
                t_maf = 0.0

            if w_map > 0.0:
                base_ld_map = interp1d(map_kpa, base_data["map_kpa"], base_data["mapc"][r_map_idx])
                t_map = interp_table_value(rpm, base_ld_map, RPM_TIMING_AXIS, LOAD_TIMING_AXIS, base_data["timing"])
            else:
                t_map = 0.0

            t_final = (1.0 - w_map) * t_maf + w_map * t_map
            remapped_high[r_idx][c_idx] = int(max(-10.0, min(45.0, round(t_final))))

    # Low Octane Timing: 1-degree safety retard
    remapped_low = [[max(-10, int(remapped_high[r][c] - 1)) for c in range(22)] for r in range(23)]

    # 2. Remap MIVEC Intake & Exhaust (24 RPM x 21 Load)
    remapped_in = [[0.0]*21 for _ in range(24)]
    remapped_ex = [[0.0]*21 for _ in range(24)]
    for r_idx, rpm in enumerate(RPM_MIVEC_AXIS):
        r_map_idx = min(range(19), key=lambda i: abs(RPM_MAP_AXIS[i] - rpm))
        for c_idx, target_load in enumerate(LOAD_MIVEC_AXIS):
            map_kpa = interp1d(target_load, target_data["mapc"][r_map_idx], target_data["map_kpa"])
            if map_kpa <= 80.0:
                w_map = 0.0
            elif map_kpa >= 120.0:
                w_map = 1.0
            else:
                w_map = (map_kpa - 80.0) / 40.0

            if w_map < 1.0:
                req_gs = (target_load * rpm) / K_MAF
                v = interp1d(req_gs, target_data["maf"], target_data["volts"])
                base_gs = interp1d(v, base_data["volts"], base_data["maf"])
                base_ld_maf = (K_MAF * base_gs) / rpm
                m_in_maf = interp_table_value(rpm, base_ld_maf, RPM_MIVEC_AXIS, LOAD_MIVEC_AXIS, base_data["mivec_in"])
                m_ex_maf = interp_table_value(rpm, base_ld_maf, RPM_MIVEC_AXIS, LOAD_MIVEC_AXIS, base_data["mivec_ex"])
            else:
                m_in_maf = m_ex_maf = 0.0

            if w_map > 0.0:
                base_ld_map = interp1d(map_kpa, base_data["map_kpa"], base_data["mapc"][r_map_idx])
                m_in_map = interp_table_value(rpm, base_ld_map, RPM_MIVEC_AXIS, LOAD_MIVEC_AXIS, base_data["mivec_in"])
                m_ex_map = interp_table_value(rpm, base_ld_map, RPM_MIVEC_AXIS, LOAD_MIVEC_AXIS, base_data["mivec_ex"])
            else:
                m_in_map = m_ex_map = 0.0

            m_in_final = (1.0 - w_map) * m_in_maf + w_map * m_in_map
            m_ex_final = (1.0 - w_map) * m_ex_maf + w_map * m_ex_map

            # Quantize to 0.625-deg ECU resolution: x = round((80 - val) / 0.625); val = 80 - x * 0.625
            byte_in = max(0, min(255, round((80.0 - m_in_final) / 0.625)))
            byte_ex = max(0, min(255, round((80.0 - m_ex_final) / 0.625)))
            remapped_in[r_idx][c_idx] = round(80.0 - byte_in * 0.625, 1)
            remapped_ex[r_idx][c_idx] = round(80.0 - byte_ex * 0.625, 1)

    return remapped_high, remapped_low, remapped_in, remapped_ex


def generate_map_table_sensor_view(base_data):
    """
    Generates the MAP table (19 RPM rows x 20 MAP columns) populated with the resulting base
    Timing and MIVEC values.
    For cells where MAP is NOT the primary sensor (MAP <= 80 kPa), outputs 'null'.
    """
    grid_timing = []
    grid_mivec_in = []
    grid_mivec_ex = []

    for r_idx, rpm in enumerate(RPM_MAP_AXIS):
        row_t = []
        row_in = []
        row_ex = []
        for m_idx, map_kpa in enumerate(base_data["map_kpa"]):
            # MAP is not primary sensor in vacuum (<= 80 kPa)
            if map_kpa <= 80.0:
                row_t.append("null")
                row_in.append("null")
                row_ex.append("null")
            else:
                base_load = base_data["mapc"][r_idx][m_idx]
                t_val = interp_table_value(rpm, base_load, RPM_TIMING_AXIS, LOAD_TIMING_AXIS, base_data["timing"])
                in_val = interp_table_value(rpm, base_load, RPM_MIVEC_AXIS, LOAD_MIVEC_AXIS, base_data["mivec_in"])
                ex_val = interp_table_value(rpm, base_load, RPM_MIVEC_AXIS, LOAD_MIVEC_AXIS, base_data["mivec_ex"])
                row_t.append(f"{int(round(t_val))}")
                row_in.append(f"{in_val:.1f}")
                row_ex.append(f"{ex_val:.1f}")
        grid_timing.append(row_t)
        grid_mivec_in.append(row_in)
        grid_mivec_ex.append(row_ex)

    return grid_timing, grid_mivec_in, grid_mivec_ex


def generate_maf_table_sensor_view(base_data, target_data=None):
    """
    Generates the Timing and MIVEC tables decomposed by MAF sensor responsibility.
    For cells where MAF is NOT the primary sensor (MAP >= 120 kPa or Load >= 120%), outputs 'null'.
    """
    data = target_data if target_data is not None else base_data
    grid_maf_timing = []
    for r_idx, rpm in enumerate(RPM_TIMING_AXIS):
        r_map_idx = min(range(19), key=lambda i: abs(RPM_MAP_AXIS[i] - rpm))
        row = []
        for c_idx, load in enumerate(LOAD_TIMING_AXIS):
            map_kpa = interp1d(load, data["mapc"][r_map_idx], data["map_kpa"])
            if map_kpa >= 120.0 or load >= 120.0:
                row.append("null")
            else:
                req_gs = (load * rpm) / K_MAF
                v = interp1d(req_gs, data["maf"], data["volts"])
                base_gs = interp1d(v, base_data["volts"], base_data["maf"])
                base_ld = (K_MAF * base_gs) / rpm
                t = interp_table_value(rpm, base_ld, RPM_TIMING_AXIS, LOAD_TIMING_AXIS, base_data["timing"])
                row.append(f"{int(round(t))}")
        grid_maf_timing.append(row)
    return grid_maf_timing


def format_tsv_grid(grid):
    """Formats a 2D list into tab-separated values."""
    return "\n".join("\t".join(str(cell) for cell in row) for row in grid)


def print_table_header(title, rows_count, cols_count):
    print("\n" + "="*80)
    print(f"{title} ({rows_count} Rows x {cols_count} Columns)")
    print("="*80)


def main():
    parser = argparse.ArgumentParser(description="Evo X Timing & MIVEC Remapper targeting V3.18 reference")
    parser.add_argument("--base-rom",
                        default="roms/Steven Johnston 2.0L 8474 ID1300 GSC S2 FR3.5 Intake 94 oct V3.18.srf",
                        help="Path to pro-tuner base reference ROM (default: V3.18)")
    parser.add_argument("--target-rom",
                        default="roms/AFR 14.7, scale 262, late 1.005, MAFMAP TIMING 17.srf",
                        help="Path to target calibration ROM (e.g. ROM 17)")
    parser.add_argument("--maf-table",
                        help="Optional path to standalone MAF table file (130 values, TSV/CSV)")
    parser.add_argument("--map-table",
                        help="Optional path to standalone MAP table file (19x20 or 380 values, TSV/CSV)")
    parser.add_argument("--sensor-tables", action="store_true",
                        help="Display MAP and MAF tables with resulting values ('null' for non-primary cells)")
    parser.add_argument("--paste-timing", action="store_true",
                        help="Output ready-to-paste High & Low Octane Timing Maps for EcuFlash")
    parser.add_argument("--paste-mivec", action="store_true",
                        help="Output ready-to-paste MIVEC Intake & Exhaust Maps for EcuFlash")
    parser.add_argument("--lower-only", action="store_true",
                        help="Conservative mode: only update cells with lower timing than target calibration (zero advance added)")
    parser.add_argument("--knock-logs", nargs="*", default=None,
                        help="Optional CSV datalogs to detect KnockSum > 0 and apply -1 deg safety retard to affected cells")
    parser.add_argument("--filter-flutter-knock", action="store_true",
                        help="Filter out BOV flutter / rapid cycling knock so only true timing knock triggers safety retard")
    parser.add_argument("--min-knock-frequency", type=float, default=0.25,
                        help="Minimum cell visit knock frequency to treat single-count knock as frequent (default: 0.25 / 25%%)")
    parser.add_argument("--force-retard-all-knock", action="store_true",
                        help="Force timing retard even on isolated single-count (KnockSum=1) knock events")
    parser.add_argument("--export-dir", default=None,
                        help="Optional directory to save exported table files (.txt and .tsv)")
    parser.add_argument("--all", action="store_true",
                        help="Output sensor tables, paste buffers, and comparison reports")
    args = parser.parse_args()

    # Default to all if no specific output flags chosen
    if not (args.sensor_tables or args.paste_timing or args.paste_mivec):
        args.all = True

    print("="*80)
    print("EVO X IGNITION TIMING & MIVEC REMAPPER")
    print("="*80)
    print(f"Base Reference ROM : {os.path.basename(args.base_rom)}")

    # 1. Load Base Reference ROM
    _, _, base_bytes = load_rom_file(args.base_rom)
    base_data = extract_rom_data(base_bytes)

    # 2. Load Target Data
    if args.target_rom and os.path.exists(args.target_rom):
        print(f"Target Calibration : {os.path.basename(args.target_rom)}")
        _, _, target_bytes = load_rom_file(args.target_rom)
        target_data = extract_rom_data(target_bytes)
        if target_data.get("mapc_mismatch", 0) > 0:
            print(f"[!] WARNING: In {os.path.basename(args.target_rom)}, MAP based Load Calc #1 (0x608ae) and #2 (0x605ac) differ in {target_data['mapc_mismatch']} / 380 cells!")
    else:
        target_data = {
            "timing": base_data["timing"],
            "low_timing": base_data["low_timing"],
            "mivec_in": base_data["mivec_in"],
            "mivec_ex": base_data["mivec_ex"],
            "maf": base_data["maf"],
            "volts": base_data["volts"],
            "map_kpa": base_data["map_kpa"],
            "mapc": base_data["mapc"]
        }

    if args.maf_table and args.map_table:
        print(f"Target Load Tables : Standalone Files ({os.path.basename(args.maf_table)}, {os.path.basename(args.map_table)})")
        maf_vals = parse_numeric_file(args.maf_table)
        map_vals = parse_numeric_file(args.map_table)
        if len(maf_vals) != 130:
            sys.exit(f"Error: MAF table must contain exactly 130 values (found {len(maf_vals)})")
        if len(map_vals) != 380:
            sys.exit(f"Error: MAP table must contain exactly 380 values (found {len(map_vals)})")
        target_data["maf"] = maf_vals
        target_data["mapc"] = [[map_vals[r * 20 + m] * K_MAP_RUNTIME for m in range(20)] for r in range(19)]

    # 3. Sensor Responsibility Tables
    if args.sensor_tables or args.all:
        map_t, map_min, map_mex = generate_map_table_sensor_view(base_data)
        maf_t = generate_maf_table_sensor_view(base_data, target_data)

        print("\n" + "#"*80)
        print("# SECTION 1: SENSOR PERSPECTIVE TABLES ('null' = non-primary sensor)")
        print("#"*80)

        print_table_header("MAP TABLE -> RESULTING TIMING (MAP based Load Calc Grid, 19 RPM x 20 MAP kPa)", 19, 20)
        print(format_tsv_grid(map_t))

        print_table_header("MAP TABLE -> RESULTING MIVEC INTAKE (MAP based Load Calc Grid, 19 RPM x 20 MAP kPa)", 19, 20)
        print(format_tsv_grid(map_min))

        print_table_header("MAP TABLE -> RESULTING MIVEC EXHAUST (MAP based Load Calc Grid, 19 RPM x 20 MAP kPa)", 19, 20)
        print(format_tsv_grid(map_mex))

        print_table_header("MAF TABLE -> RESULTING TIMING (Timing Grid, 23 RPM x 22 Load, null in boost)", 23, 22)
        print(format_tsv_grid(maf_t))

    # 4. Compute Remapped Tables for Target Calibration
    remap_high, remap_low, remap_min, remap_mex = remap_timing_and_mivec(base_data, target_data)

    if args.lower_only:
        print("\n[NOTE] --lower-only ACTIVE: Clamping all timing cells to <= current target ROM values.")
        remap_high = [[int(min(target_data["timing"][r][c], remap_high[r][c])) for c in range(22)] for r in range(23)]
        remap_low = [[min(int(target_data["low_timing"][r][c]), remap_high[r][c] - 1) for c in range(22)] for r in range(23)]

    if args.knock_logs:
        knock_cells = {}
        cell_visits = {}
        flutter_ignored = []
        isolated_single_knock = []

        # Count total cell visits in all provided logs
        for log_path in args.knock_logs:
            if os.path.exists(log_path):
                with open(log_path, "r", encoding="latin1") as f:
                    reader = csv.DictReader(f)
                    for r in reader:
                        try:
                            rpm = float(r.get("RPM", 0) or 0)
                            load = float(r.get("Load", 0) or 0)
                            if rpm >= 500 and load >= 10.0:
                                r_idx = min(range(len(RPM_TIMING_AXIS)), key=lambda i: abs(RPM_TIMING_AXIS[i] - rpm))
                                c_idx = min(range(len(LOAD_TIMING_AXIS)), key=lambda i: abs(LOAD_TIMING_AXIS[i] - load))
                                cell_visits[(r_idx, c_idx)] = cell_visits.get((r_idx, c_idx), 0) + 1
                        except (ValueError, KeyError):
                            continue

        if args.filter_flutter_knock:
            try:
                import bov_flutter_knock_detector as bfd
                for log_path in args.knock_logs:
                    if os.path.exists(log_path):
                        evs = bfd.scan_file_for_bov_flutter_knock(log_path)
                        for ev in evs:
                            rpm = ev["rpm"]
                            load = float(ev.get("load", 0) or 0)
                            r_idx = min(range(len(RPM_TIMING_AXIS)), key=lambda i: abs(RPM_TIMING_AXIS[i] - rpm))
                            c_idx = min(range(len(LOAD_TIMING_AXIS)), key=lambda i: abs(LOAD_TIMING_AXIS[i] - load))
                            if ev["category"] == "BOV_FLUTTER":
                                flutter_ignored.append((rpm, load, ev["row"], ev["file"], ev["mafv_range"]))
                            else:
                                if (r_idx, c_idx) not in knock_cells:
                                    knock_cells[(r_idx, c_idx)] = []
                                knock_cells[(r_idx, c_idx)].append(ev)
            except ImportError:
                pass
        else:
            for log_path in args.knock_logs:
                if os.path.exists(log_path):
                    with open(log_path, "r", encoding="latin1") as f:
                        reader = csv.DictReader(f)
                        prev_knk = 0.0
                        for row_idx, r in enumerate(reader, 1):
                            try:
                                knk = float(r.get("KnockSum", 0) or 0)
                                if knk > prev_knk:
                                    delta_k = knk - prev_knk
                                    rpm = float(r["RPM"])
                                    load = float(r["Load"])
                                    r_idx = min(range(len(RPM_TIMING_AXIS)), key=lambda i: abs(RPM_TIMING_AXIS[i] - rpm))
                                    c_idx = min(range(len(LOAD_TIMING_AXIS)), key=lambda i: abs(LOAD_TIMING_AXIS[i] - load))
                                    if (r_idx, c_idx) not in knock_cells:
                                        knock_cells[(r_idx, c_idx)] = []
                                    knock_cells[(r_idx, c_idx)].append({
                                        "rpm": rpm, "load": load, "delta_knock": delta_k,
                                        "total_knock": knk, "row": row_idx, "file": os.path.basename(log_path)
                                    })
                                prev_knk = knk
                            except (ValueError, KeyError):
                                continue

        if flutter_ignored:
            print("\n" + "~"*80)
            print(f"[i] BOV FLUTTER FILTER ACTIVE: Filtered out {len(flutter_ignored)} non-timing knock event(s):")
            for rpm, load, row, fn, swing in flutter_ignored:
                print(f"    • Ignored: Row {row:5d} in {fn} (RPM {rpm:.0f}, Load {load:.1f}%, MAF Swing {swing:.3f}V) -> BOV chatter, no timing retard applied.")
            print("~"*80)

        # Separate frequent/confident knock from isolated single-count knock
        confident_knock_cells = {}
        for (r_idx, c_idx), ev_list in sorted(knock_cells.items()):
            rpm_val = RPM_TIMING_AXIS[r_idx]
            load_val = LOAD_TIMING_AXIS[c_idx]
            visits = cell_visits.get((r_idx, c_idx), 0)
            inceptions = len(ev_list)
            max_delta = max(float(e.get("delta_knock", 1) or 1) for e in ev_list)
            max_knk = max(float(e.get("total_knock", 1) or 1) for e in ev_list)
            freq_pct = (inceptions / max(1, visits)) * 100.0

            # Isolated single-count check:
            # If knock is only a single count (KnockSum <= 1 and delta <= 1), single occurrence,
            # and occurred infrequently (< min_knock_frequency, e.g. < 25%), do NOT retard timing.
            is_isolated_single = (max_knk <= 1.0 and inceptions == 1 and freq_pct < (args.min_knock_frequency * 100.0) and not args.force_retard_all_knock)

            if is_isolated_single:
                isolated_single_knock.append((rpm_val, load_val, inceptions, max_knk, visits, freq_pct, ev_list[0]["file"], ev_list[0]["row"]))
            else:
                confident_knock_cells[(r_idx, c_idx)] = (inceptions, max_delta, max_knk, visits, freq_pct)

        if isolated_single_knock:
            print("\n" + "="*80)
            print(f"[i] ISOLATED SINGLE-COUNT KNOCK (HELD UNCHANGED PER FREQUENCY CONFIDENCE RULE):")
            print("    Recorded in database, but timing table held unchanged because knock was only")
            print("    a single count of 1 that did not happen frequently across visits:")
            for rpm_val, load_val, inceptions, max_knk, visits, freq_pct, fn, row in isolated_single_knock:
                print(f"    • RPM {rpm_val:4d} @ Load {load_val:5.1f}%: 1 count of {max_knk:.0f} in {fn} (row {row}) across {visits} visits ({freq_pct:4.2f}% rate). Timing held.")
            print("="*80)

        if confident_knock_cells:
            print("\n" + "!"*80)
            print(f"[!] TRUE FREQUENT TIMING KNOCK SAFETY RETARD: Identified {len(confident_knock_cells)} confident knock cell(s):")
            for (r_idx, c_idx), (inceptions, max_delta, max_knk, visits, freq_pct) in sorted(confident_knock_cells.items()):
                rpm_val = RPM_TIMING_AXIS[r_idx]
                load_val = LOAD_TIMING_AXIS[c_idx]
                old_hi = remap_high[r_idx][c_idx]
                remap_high[r_idx][c_idx] -= 1
                remap_low[r_idx][c_idx] = min(remap_low[r_idx][c_idx], remap_high[r_idx][c_idx] - 1)
                print(f"    • RPM {rpm_val:4d} @ Load {load_val:5.1f}% ({inceptions:2d} inceptions, max={max_knk:.0f}, {visits} visits, {freq_pct:4.1f}% freq): {old_hi:2d} deg -> {remap_high[r_idx][c_idx]:2d} deg (-1 deg)")
            print("!"*80)

    # 5. Output Remapped Paste Buffers
    if args.paste_timing or args.all:
        print("\n" + "#"*80)
        print("# SECTION 2: ECUFLASH CLIPBOARD PASTE BUFFERS (TIMING)")
        print("#"*80)

        print_table_header("HIGH OCTANE TIMING MAP (23 RPM Rows x 22 Load Columns)", 23, 22)
        print(format_tsv_grid(remap_high))

        print_table_header("LOW OCTANE TIMING MAP (23 RPM Rows x 22 Load Columns)", 23, 22)
        print(format_tsv_grid(remap_low))

    if args.paste_mivec or args.all:
        print("\n" + "#"*80)
        print("# SECTION 3: ECUFLASH CLIPBOARD PASTE BUFFERS (MIVEC)")
        print("#"*80)

        print_table_header("MIVEC INTAKE NORMAL COOLANT TEMP (24 RPM Rows x 21 Load Columns)", 24, 21)
        print(format_tsv_grid(remap_min))

        print_table_header("MIVEC EXHAUST NORMAL COOLANT TEMP (24 RPM Rows x 21 Load Columns)", 24, 21)
        print(format_tsv_grid(remap_mex))

    # 6. Export Files to Directory
    if args.export_dir:
        os.makedirs(args.export_dir, exist_ok=True)
        # High Timing
        with open(os.path.join(args.export_dir, "new_high_octane_timing_map.txt"), "w") as f:
            for row in remap_high:
                f.write("\t".join(str(x) for x in row) + "\n")
        with open(os.path.join(args.export_dir, "new_high_octane_timing_map.tsv"), "w") as f:
            f.write("RPM\t" + "\t".join(f"{l:.1f}" for l in LOAD_TIMING_AXIS) + "\n")
            for r_val, row in zip(RPM_TIMING_AXIS, remap_high):
                f.write(f"{r_val}\t" + "\t".join(str(x) for x in row) + "\n")

        # Low Timing
        with open(os.path.join(args.export_dir, "new_low_octane_timing_map.txt"), "w") as f:
            for row in remap_low:
                f.write("\t".join(str(x) for x in row) + "\n")
        with open(os.path.join(args.export_dir, "new_low_octane_timing_map.tsv"), "w") as f:
            f.write("RPM\t" + "\t".join(f"{l:.1f}" for l in LOAD_TIMING_AXIS) + "\n")
            for r_val, row in zip(RPM_TIMING_AXIS, remap_low):
                f.write(f"{r_val}\t" + "\t".join(str(x) for x in row) + "\n")

        # MIVEC Intake
        with open(os.path.join(args.export_dir, "new_mivec_intake_map.txt"), "w") as f:
            for row in remap_min:
                f.write("\t".join(f"{x:.1f}" for x in row) + "\n")
        with open(os.path.join(args.export_dir, "new_mivec_intake_map.tsv"), "w") as f:
            f.write("RPM\t" + "\t".join(f"{l:.1f}" for l in LOAD_MIVEC_AXIS) + "\n")
            for r_val, row in zip(RPM_MIVEC_AXIS, remap_min):
                f.write(f"{r_val}\t" + "\t".join(f"{x:.1f}" for x in row) + "\n")

        # MIVEC Exhaust
        with open(os.path.join(args.export_dir, "new_mivec_exhaust_map.txt"), "w") as f:
            for row in remap_mex:
                f.write("\t".join(f"{x:.1f}" for x in row) + "\n")
        with open(os.path.join(args.export_dir, "new_mivec_exhaust_map.tsv"), "w") as f:
            f.write("RPM\t" + "\t".join(f"{l:.1f}" for l in LOAD_MIVEC_AXIS) + "\n")
            for r_val, row in zip(RPM_MIVEC_AXIS, remap_mex):
                f.write(f"{r_val}\t" + "\t".join(f"{x:.1f}" for x in row) + "\n")

        print(f"\n[+] Successfully exported Timing & MIVEC tables to: {args.export_dir}")

    # 7. Comparison Summary
    if args.all:
        print("\n" + "#"*80)
        print("# SECTION 4: DELTA VERIFICATION SUMMARY (TARGET ROM vs REMAPPED)")
        print("#"*80)
        for r_check in [2000, 2500, 3000, 3500, 5500]:
            r_t = RPM_TIMING_AXIS.index(r_check)
            r_m = RPM_MIVEC_AXIS.index(r_check)
            print(f"\nEngine Speed: {r_check} RPM")
            hdr = f"{'Load %':<7} | {'Timing (Curr)':<14} | {'Timing (Remap)':<15} | {'Delta':<7} | {'MIVEC In (Remap)':<18} | {'MIVEC Ex (Remap)':<18}"
            print(hdr)
            print("-" * len(hdr))
            for c_t in [4, 6, 8, 10, 12, 14, 16, 18, 20]:
                ld = LOAD_TIMING_AXIS[c_t]
                t_curr = int(target_data["timing"][r_t][c_t])
                t_remap = int(remap_high[r_t][c_t])
                d_t = t_remap - t_curr
                d_str = f"{d_t:+d}°" if d_t != 0 else " 0°"

                # Matching load in MIVEC axis
                c_m = min(range(21), key=lambda i: abs(LOAD_MIVEC_AXIS[i] - ld))
                m_in = remap_min[r_m][c_m]
                m_ex = remap_mex[r_m][c_m]
                print(f"{ld:5.0f}%  | {int(t_curr):12d}° | {int(t_remap):13d}° | {d_str:>6} | {m_in:16.1f}° | {m_ex:16.1f}°")


if __name__ == "__main__":
    main()
