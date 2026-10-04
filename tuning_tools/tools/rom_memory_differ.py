#!/usr/bin/env python3
"""
rom_memory_differ.py - Comprehensive Memory & Firmware Disassembly Differ for Evo X ROMs

Performs byte-by-byte full-binary comparison of two calibration ROMs (.srf or .bin),
maps changed memory addresses to ECU calibration tables, axis breakpoints, and symbols,
and cross-references each modification with decompiled M32R firmware routines in
tuning_tools/decompiled_c/ to explain the firmware consequences.
"""

import argparse
import csv
import json
import os
import re
import struct
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TOOLKIT_DIR = os.path.dirname(SCRIPT_DIR)
WORKSPACE_DIR = os.path.dirname(TOOLKIT_DIR)
REF_DIR = os.path.join(TOOLKIT_DIR, "references")
DECOMPILED_DIR = os.path.join(TOOLKIT_DIR, "decompiled_c")

# Pre-defined firmware mappings linking table addresses to decompiled C functions and effects
FIRMWARE_MAPPINGS = {
    (0x5757A, 0x5767D): {
        "name": "MAF Scaling Horizontal",
        "routine": "maf_scaling_and_airflow_calc.c (0x0113A0 / 0x04DC64)",
        "scaling_type": "maf",
        "role": (
            "Translates 10-bit MAF sensor voltage into mass airflow (g/s). "
            "Governs cylinder charge calculation MAFCalcs = (K * MAF_airflow) / RPM."
        ),
        "firmware_effect": (
            "Directly scales engine load MAFCalcs and base injector pulse width (IPW). "
            "Reducing MAF values injects less fuel (causes lean AFR in open loop) and "
            "causes the ECU to index lower load columns in timing maps (advancing ignition timing)."
        )
    },
    (0x608AE, 0x60BA5): {
        "name": "MAP based Load Calc #1 - Hot/Interpolated",
        "routine": "map_load_calc_and_blend_engine.c (0x02FDC4) & load_clamp_or_blend.c (0x04DC64)",
        "scaling_type": "map_load",
        "role": (
            "Speed-density engine load calculation table based on MAP (kPa) and RPM under normal hot operating temps. "
            "Multiplied by firmware adder (256 + 0x5494C)/256 = 1.05078 (+5.08%)."
        ),
        "firmware_effect": (
            "Acts as the upper clamping ceiling for steady-state cruise and vacuum: "
            "ChosenCalc = min(MAFCalcs, MAPCalcs). If MAPCalcs is reduced below MAFCalcs, "
            "engine load and fueling are artificially clipped down to MAPCalcs."
        )
    },
    (0x605AC, 0x608A3): {
        "name": "MAP based Load Calc #2 - Cold/Interpolated",
        "routine": "map_load_calc_and_blend_engine.c (0x02FDC4) & load_clamp_or_blend.c (0x04DC64)",
        "scaling_type": "map_load",
        "role": (
            "Speed-density engine load calculation table blended with Table #1 during cold-engine / intermediate coolant temps."
        ),
        "firmware_effect": (
            "Blended with Table #1 according to coolant temp (ECT) axis. If kept identical to Table #1, "
            "prevents temperature-dependent load shifts."
        )
    },
    (0x602AA, 0x605A1): {
        "name": "MAP based Load Calc #3",
        "routine": "map_load_calc_and_blend_engine.c (0x02FDC4) & load_clamp_or_blend.c (0x04DC64)",
        "scaling_type": "map_load",
        "role": (
            "Speed-density engine load calculation table #3 used for cam overlap / alternate cam angle regimes."
        ),
        "firmware_effect": (
            "Blended or selected based on intake/exhaust MIVEC phase angles. If kept identical to Tables #1 and #2, "
            "ensures uniform speed-density load estimation across MIVEC timing transitions."
        )
    },
    (0x55957, 0x55AA6): {
        "name": "High Octane Timing Map",
        "routine": "timing_advance_final_calc.c (0x0A0D00)",
        "scaling_type": "timing",
        "role": "Master primary ignition advance map (21 Load columns x 16 RPM rows).",
        "firmware_effect": (
            "Determines base spark advance. Reducing timing in idle/low-RPM cells (e.g. 500-1000 RPM, 10-50% load) "
            "reduces combustion torque at idle, stabilizing idle RPM and eliminating hanging RPM upon clutch depression."
        )
    },
    (0x55B59, 0x55CA8): {
        "name": "Low Octane Timing Map",
        "routine": "timing_advance_final_calc.c (0x0A0D00)",
        "scaling_type": "timing",
        "role": "Knock recovery / low-octane ignition map blended via Octane Number register (0x008088A0).",
        "firmware_effect": (
            "Ignition fallback map during knock detection. Maintained parallel to High Octane map."
        )
    },
    (0x53C84, 0x53C85): {
        "name": "Target Idle #2",
        "routine": "idle_target_rpm_selector.c (0x025C3C) & idle_rpm_error_calc.c (0x025EF0)",
        "scaling_type": "rpm",
        "role": "Target idle RPM setpoint under specific electrical load / clutch transition conditions.",
        "firmware_effect": (
            "Defines the closed-loop idle RPM target. Lowering this setpoint reduces idle air control throttle opening, "
            "preventing RPM hang when pushing in the clutch while coasting."
        )
    },
    (0x53C86, 0x53C87): {
        "name": "Target Idle #3",
        "routine": "idle_target_rpm_selector.c (0x025C3C)",
        "scaling_type": "rpm",
        "role": "Target idle RPM setpoint.",
        "firmware_effect": "Closed-loop idle target setpoint."
    },
    (0xBFFF0, 0xBFFF3): {
        "name": "ROM Checksum (CRC32)",
        "routine": "ECU Bootloader CRC check",
        "scaling_type": "hex",
        "role": "MitsuCAN 32-bit CRC checksum block.",
        "firmware_effect": "Guarantees binary integrity during ECU boot verification; prevents P0606 / limp-mode."
    }
}


def load_rom_bytes(file_path):
    """Load ROM image, stripping SRF 328-byte header if present."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"ROM file not found: {file_path}")
    header_len = 328 if file_path.lower().endswith(".srf") else 0
    with open(file_path, "rb") as f:
        f.seek(header_len)
        data = f.read()
    return data


def load_symbols():
    """Load XML definitions and CSV symbol map."""
    symbols = []
    
    # 1. Load CSV symbols if available
    csv_path = os.path.join(REF_DIR, "evo10_symbols.csv")
    if os.path.exists(csv_path):
        with open(csv_path, "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                try:
                    addr = int(row["Address_Hex"], 16)
                    symbols.append({
                        "address": addr,
                        "name": row["Raw_Name"],
                        "type": row.get("Type", "Symbol"),
                        "storage": row.get("StorageType", "uint8"),
                        "units": row.get("Units", ""),
                    })
                except (ValueError, KeyError):
                    pass
                    
    # 2. Load discovered XML tables
    xml_paths = [
        os.path.join(REF_DIR, "discovered_unmapped_tables.xml"),
        os.path.join(WORKSPACE_DIR, "XMLs for AI", "59580004 2013 USDM Lancer Evolution X 5MT.xml"),
        os.path.join(WORKSPACE_DIR, "XMLs for AI", "TephraMOD-59580304.xml"),
    ]
    for xp in xml_paths:
        if os.path.exists(xp):
            try:
                tree = ET.parse(xp)
                root = tree.getroot()
                for t in root.findall(".//table"):
                    n = t.attrib.get("name")
                    a_str = t.attrib.get("address")
                    if n and a_str:
                        try:
                            a = int(a_str, 16)
                            symbols.append({
                                "address": a,
                                "name": n,
                                "type": t.attrib.get("type", "Table"),
                                "storage": t.attrib.get("storagetype", "uint8"),
                                "units": t.attrib.get("scaling", ""),
                            })
                        except ValueError:
                            pass
            except Exception:
                pass
                
    return symbols


def find_symbol_for_range(start_addr, end_addr, symbols):
    """Find the best matching symbol for an address range."""
    # Check pre-defined firmware mappings first
    for (m_start, m_end), info in FIRMWARE_MAPPINGS.items():
        if not (end_addr < m_start or start_addr > m_end):
            return {
                "name": info["name"],
                "routine": info["routine"],
                "role": info["role"],
                "firmware_effect": info["firmware_effect"],
                "scaling_type": info["scaling_type"],
                "table_start": m_start,
                "table_end": m_end
            }
            
    # Check general symbols
    for s in symbols:
        s_addr = s["address"]
        # If symbol address is within or closely preceding the change
        if start_addr <= s_addr <= end_addr or (0 <= start_addr - s_addr <= 500):
            return {
                "name": s["name"],
                "routine": "General ECU calibration routine",
                "role": f"ECU parameter at address 0x{s_addr:06X} ({s['type']})",
                "firmware_effect": f"Modifies calibration parameter {s['name']}.",
                "scaling_type": "raw",
                "table_start": s_addr,
                "table_end": s_addr + 100
            }
            
    return {
        "name": f"Unknown Block (0x{start_addr:06X} - 0x{end_addr:06X})",
        "routine": "Unindexed ECU calibration code/data",
        "role": "Calibration parameter or unmapped map",
        "firmware_effect": "Alters ECU data table at specified offset.",
        "scaling_type": "raw",
        "table_start": start_addr,
        "table_end": end_addr
    }


def compare_roms(rom1_path, rom2_path):
    """Compare two ROMs and produce detailed structured memory analysis."""
    b1 = load_rom_bytes(rom1_path)
    b2 = load_rom_bytes(rom2_path)
    symbols = load_symbols()
    
    min_len = min(len(b1), len(b2))
    diff_regions = []
    start = None
    
    for i in range(min_len):
        if b1[i] != b2[i]:
            if start is None:
                start = i
        else:
            if start is not None:
                diff_regions.append((start, i - 1))
                start = None
    if start is not None:
        diff_regions.append((start, min_len - 1))
        
    # Group contiguous or closely spaced regions (< 32 bytes apart in same table)
    grouped = []
    if diff_regions:
        curr_start, curr_end = diff_regions[0]
        for s, e in diff_regions[1:]:
            if s - curr_end <= 32:
                curr_end = e
            else:
                grouped.append((curr_start, curr_end))
                curr_start, curr_end = s, e
        grouped.append((curr_start, curr_end))
        
    results = {
        "rom1": os.path.basename(rom1_path),
        "rom2": os.path.basename(rom2_path),
        "total_regions": len(diff_regions),
        "grouped_blocks": len(grouped),
        "total_changed_bytes": sum(e - s + 1 for s, e in diff_regions),
        "modifications": []
    }
    
    # Analyze each grouped region
    for s, e in grouped:
        sym_info = find_symbol_for_range(s, e, symbols)
        num_bytes = e - s + 1
        
        mod_entry = {
            "address_range": f"0x{s:06X} - 0x{e:06X}",
            "start_addr": s,
            "end_addr": e,
            "byte_count": num_bytes,
            "table_name": sym_info["name"],
            "decompiled_routine": sym_info["routine"],
            "role": sym_info["role"],
            "firmware_effect": sym_info["firmware_effect"],
            "scaling_type": sym_info["scaling_type"],
            "cell_details": []
        }
        
        stype = sym_info["scaling_type"]
        if stype == "maf":
            # MAF Scaling (0x5757A, 130 uint16, big endian)
            raw_v = struct.unpack(">130H", b1[0x61fd0:0x61fd0+260])
            volts = [round(r * 5.0 / 1023.0, 3) for r in raw_v]
            m1 = struct.unpack(">130H", b1[0x5757a:0x5757a+260])
            m2 = struct.unpack(">130H", b2[0x5757a:0x5757a+260])
            for i in range(130):
                cell_addr = 0x5757A + i * 2
                if s <= cell_addr <= e and m1[i] != m2[i]:
                    v1 = m1[i] / 100.0
                    v2 = m2[i] / 100.0
                    pct = (v2 - v1) / v1 * 100 if v1 > 0 else 0
                    mod_entry["cell_details"].append({
                        "cell": f"Bin {i} ({volts[i]:.3f}V)",
                        "old": f"{v1:.2f} g/s",
                        "new": f"{v2:.2f} g/s",
                        "delta": f"{v2 - v1:+.2f} g/s",
                        "pct": f"{pct:+.2f}%"
                    })
        elif stype == "map_load":
            # MAP based load calc table (380 uint16)
            base_addr = sym_info["table_start"]
            m_elems, r_elems = 20, 19
            tot = m_elems * r_elems
            m1 = struct.unpack(f">{tot}H", b1[base_addr:base_addr+tot*2])
            m2 = struct.unpack(f">{tot}H", b2[base_addr:base_addr+tot*2])
            m_axis = struct.unpack(f">{m_elems}H", b1[0x6344a:0x6344a+m_elems*2])
            kpa = [round(((r * 2556.0 / 3800.0) + 0.5) / 2.0, 1) for r in m_axis]
            r_axis = struct.unpack(f">{r_elems}H", b1[0x6341e:0x6341e+r_elems*2])
            rpm = [round(r * 1000.0 / 256.0) for r in r_axis]
            for i in range(tot):
                cell_addr = base_addr + i * 2
                if s <= cell_addr <= e and m1[i] != m2[i]:
                    v1 = (m1[i] * 10.0 / 512.0) * 10.0 / 32.0
                    v2 = (m2[i] * 10.0 / 512.0) * 10.0 / 32.0
                    m_idx = i // r_elems
                    r_idx = i % r_elems
                    pct = (v2 - v1) / v1 * 100 if v1 > 0 else 0
                    mod_entry["cell_details"].append({
                        "cell": f"MAP {kpa[m_idx]}kPa x {rpm[r_idx]}RPM",
                        "old": f"{v1:.2f}%",
                        "new": f"{v2:.2f}%",
                        "delta": f"{v2 - v1:+.2f}%",
                        "pct": f"{pct:+.2f}%"
                    })
        elif stype == "timing":
            # High/Low octane timing map (0x55957, uint8, x - 20)
            base_addr = sym_info["table_start"]
            t1 = b1[base_addr:base_addr+336]
            t2 = b2[base_addr:base_addr+336]
            for i in range(min(len(t1), len(t2))):
                cell_addr = base_addr + i
                if s <= cell_addr <= e and t1[i] != t2[i]:
                    v1 = t1[i] - 20
                    v2 = t2[i] - 20
                    rpm_idx = i // 21
                    load_idx = i % 21
                    mod_entry["cell_details"].append({
                        "cell": f"RPM row {rpm_idx}, Load col {load_idx}",
                        "old": f"{v1} deg",
                        "new": f"{v2} deg",
                        "delta": f"{v2 - v1:+d} deg",
                        "pct": f"{(v2 - v1):+d} deg"
                    })
        elif stype == "rpm":
            raw1 = struct.unpack(">H", b1[s:s+2])[0]
            raw2 = struct.unpack(">H", b2[s:s+2])[0]
            v1 = raw1 * 1000.0 / 256.0
            v2 = raw2 * 1000.0 / 256.0
            mod_entry["cell_details"].append({
                "cell": "Idle Target",
                "old": f"{v1:.1f} RPM",
                "new": f"{v2:.1f} RPM",
                "delta": f"{v2 - v1:+.1f} RPM",
                "pct": f"{(v2 - v1)/v1 * 100:+.2f}%"
            })
            
        results["modifications"].append(mod_entry)
        
    return results


def print_report(results, show_all_cells=False):
    """Print a clean human-readable CLI report of the differences."""
    print("=" * 80)
    print("          EVO X CALIBRATION MEMORY & FIRMWARE DECOMPILE DIFFER")
    print("=" * 80)
    print(f"Base ROM     : {results['rom1']}")
    print(f"Target ROM   : {results['rom2']}")
    print(f"Changed Bytes: {results['total_changed_bytes']} bytes across {results['grouped_blocks']} memory regions")
    print("-" * 80)
    
    for idx, mod in enumerate(results["modifications"], 1):
        print(f"\n[{idx}] {mod['table_name']}")
        print(f"    Memory Address    : {mod['address_range']} ({mod['byte_count']} bytes)")
        print(f"    Decompiled Routine: {mod['decompiled_routine']}")
        print(f"    ECU Role          : {mod['role']}")
        print(f"    Firmware Impact   : {mod['firmware_effect']}")
        
        cells = mod["cell_details"]
        if cells:
            print(f"    Modified Cells ({len(cells)}):")
            to_show = cells if show_all_cells else cells[:8]
            for c in to_show:
                print(f"      • {c['cell']:<26}: {c['old']} -> {c['new']} (Delta: {c['delta']}, {c['pct']})")
            if len(cells) > 8 and not show_all_cells:
                print(f"      ... and {len(cells) - 8} more cells (use --all to display all)")
    print("\n" + "=" * 80)


def main():
    parser = argparse.ArgumentParser(description="Full ROM memory differ with decompiled firmware linking.")
    parser.add_argument("rom1", help="Base ROM (.srf/.bin)")
    parser.add_argument("rom2", help="Modified ROM (.srf/.bin)")
    parser.add_argument("--all", action="store_true", help="Show all modified cells without truncation")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")
    args = parser.parse_args()
    
    results = compare_roms(args.rom1, args.rom2)
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print_report(results, show_all_cells=args.all)


if __name__ == "__main__":
    main()
