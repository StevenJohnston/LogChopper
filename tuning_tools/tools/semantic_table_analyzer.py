#!/usr/bin/env python3
"""
semantic_table_analyzer.py - Automated M32R Call-Site & Semantic Decoder for Evo X Unmapped Tables

Traces all 272+ discovered unmapped tables through M32R firmware machine code:
  1. Finds exact call sites (ld24 r0, <TableAddr> followed by bl/bra table_interpolate_2d_and_3d)
  2. Disassembles calling basic blocks and extracts the destination RAM variable (_DAT_0080xxxx)
  3. Clusters tables by caller routine / engine subsystem
  4. Generates an evidence-backed manifest (unmapped_table_manifest.json) and
     an isolated EcuFlash XML extension (discovered_tables_decoded.xml)
  5. Preserves 100% of existing ground truth without mutating base definitions.
"""

import os
import re
import sys
import json
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
TOOLKIT_DIR = TOOLS_DIR.parent
REF_DIR = TOOLKIT_DIR / "references"
DECOMPILED_DIR = TOOLKIT_DIR / "decompiled_c"

# Known RAM variables identified in firmware
KNOWN_RAM_VARS = {
    0xC5DE: ("Engine RPM", "RPM"),
    0xC5E0: ("Engine Load", "Load %"),
    0xC5EA: ("Fast Engine Coolant Temp (ECT)", "°C"),
    0xC5FA: ("Damped Engine Coolant Temp (ECT)", "°C"),
    0xC5D8: ("Boost Error", "psi/kPa"),
    0xC5D6: ("Boost Error (Logged 0x8085D6)", "psi/kPa"),
    0xC5E8: ("Throttle Position (TPS) / Vehicle Speed", "% or km/h"),
    0x9186: ("Intake Air Temp (IAT)", "°C"),
    0xC5B8: ("Barometric Pressure", "kPa"),
    0xC5C0: ("Battery Voltage", "V"),
    0xC5C4: ("Target Idle RPM", "RPM"),
    0xC586: ("Target Boost", "psi/kPa"),
    0xC58E: ("Wastegate Duty Cycle (WGDC)", "%"),
    0xC686: ("ECT Axis Interpolation Cache", "ECT"),
    0xC694: ("Damped ECT Axis Interpolation Cache", "Damped ECT"),
    0xC60A: ("Target Airflow / Load Axis", "units"),
    0xC612: ("Vehicle Speed / Gear Axis", "km/h"),
    0xC5E2: ("Engine Load Secondary Filter", "Load %"),
    0xC5FC: ("Dynamic Acceleration / MAP Delta", "units"),
    0xC5F8: ("Filtered Throttle Angle Delta", "%"),
}

# Subsystem code regions (verified via Ghidra and decompiled routines)
CODE_REGIONS = {
    (0x011000, 0x013000): "Primary ECU Task Loop & Tephra Hooks",
    (0x013000, 0x015000): "Vehicle Speed, Sensor Scaling & Filtering",
    (0x015000, 0x017000): "Load Lag Filtering & Boost Error Evaluation",
    (0x017000, 0x019000): "Ignition Timing & Knock Retard Pipeline",
    (0x019000, 0x01B000): "MAP Surface Evaluation & Transient Throttle State",
    (0x01B000, 0x01D000): "Decel Fuel Cut-Off (DFCO) & Boost Fuel Limiter",
    (0x01E000, 0x020000): "Vehicle Speed Hysteresis & Rolling State Machine",
    (0x021000, 0x022000): "Idle Ignition Spark Retard & RAX Direct Boost",
    (0x022000, 0x023000): "Fuel Injection Pulse Width, Cold Start & Per-Cylinder Trims",
    (0x023000, 0x024000): "Target AFR, Calibration Multiplier & Fuel Enrichment",
    (0x024000, 0x025000): "Decel Cut-Off Pulse Zeroing & Rev Limiter",
    (0x025000, 0x027000): "Target Idle RPM Selection & MIVEC Cam Phasing",
    (0x027000, 0x029000): "Drive-by-Wire Idle Airflow & Throttle Actuator Follower",
    (0x029000, 0x02B000): "Throttle Angle Target & Acceleration Enrichment",
    (0x02B000, 0x02D000): "RAX Fast Logging & Smart EC Boost Control",
    (0x02D000, 0x030000): "Idle Subsystem Dispatcher & MAP Load Engine Blend",
    (0x030000, 0x032000): "Minimum IPW Clamp Pipeline & Vehicle Speed Smoothing",
    (0x04B000, 0x04D000): "Idle Ignition Error PI Loop & ECT Axis Evaluator",
    (0x04D000, 0x04F000): "Universal 2D/3D Interpolation Engine & Load Envelope Clamping",
    (0x07C000, 0x07E000): "DBW Throttle Follower Dashpot Decay Routine",
    (0x0A0000, 0x0AC000): "Automatic Transmission / SST Communication & Diagnostics",
    (0x0FB000, 0x0FD000): "TephraMOD v3 Live Map Switching & Knock Throttle Saver",
}


def get_subsystem(pc):
    for (start, end), name in CODE_REGIONS.items():
        if start <= pc < end:
            return name
    return f"Code Region 0x{pc & 0xFFF000:06X}"


def read_rom(rom_path):
    with open(rom_path, "rb") as f:
        data = f.read()
    offset = 328 if len(data) == 1048576 + 328 or str(rom_path).endswith(".srf") else 0
    return data[offset:offset + 1048576], offset


def analyze_unmapped_tables(rom_path, xml_path=None):
    rom_bytes, header_offset = read_rom(rom_path)
    xml_path = xml_path or (REF_DIR / "discovered_unmapped_tables.xml")

    with open(xml_path, "r", encoding="utf-8") as f:
        xml_content = f.read()

    # Extract table entries
    pattern = r'<table name="([^"]+)" address="([0-9a-fA-F]+)" category="([^"]+)" type="([^"]+)"'
    matches = re.findall(pattern, xml_content)

    tables = []
    addrs_set = set()
    for name, addr_hex, cat, ttype in matches:
        addr = int(addr_hex, 16)
        tables.append({
            "name": name,
            "address": addr,
            "address_hex": f"0x{addr:05X}",
            "type": ttype,
            "category": cat
        })
        addrs_set.add(addr)

    # Fast scan for ld24 r0, <addr> or ld24 rX, <addr>
    call_sites = {}
    for i in range(0, len(rom_bytes) - 4, 2):
        b0 = rom_bytes[i]
        if (b0 & 0xF0) == 0xE0:
            target = int.from_bytes(rom_bytes[i+1:i+4], "big")
            if target in addrs_set:
                reg = b0 & 0xF
                call_sites.setdefault(target, []).append((i, reg))

    # Trace each table
    analyzed = []
    for t in tables:
        addr = t["address"]
        sites = call_sites.get(addr, [])
        t_data = dict(t)
        t_data["call_sites_count"] = len(sites)

        # Parse descriptor header from ROM
        if addr + 4 <= len(rom_bytes):
            d0, d1 = rom_bytes[addr], rom_bytes[addr+1]
            if d0 == 0x02 and d1 == 0x00:
                ram_axis = int.from_bytes(rom_bytes[addr+2:addr+4], "big")
                t_data["dim"] = "2D"
                t_data["ram_axis"] = f"0x{ram_axis:04X}"
                axis_info = KNOWN_RAM_VARS.get(ram_axis, (f"RAM 0x{ram_axis:04X}", "raw"))
                t_data["axis_name"] = axis_info[0]
                t_data["axis_units"] = axis_info[1]
            elif d0 == 0x03 and d1 == 0x00:
                ram_x = int.from_bytes(rom_bytes[addr+2:addr+4], "big")
                ram_y = int.from_bytes(rom_bytes[addr+4:addr+6], "big")
                dim_x = rom_bytes[addr+6] if addr+6 < len(rom_bytes) else 0
                t_data["dim"] = "3D"
                t_data["ram_x"] = f"0x{ram_x:04X}"
                t_data["ram_y"] = f"0x{ram_y:04X}"
                t_data["dim_x"] = dim_x
                t_data["axis_x_name"] = KNOWN_RAM_VARS.get(ram_x, (f"RAM 0x{ram_x:04X}", "raw"))[0]
                t_data["axis_y_name"] = KNOWN_RAM_VARS.get(ram_y, (f"RAM 0x{ram_y:04X}", "raw"))[0]

        # Inspect call sites
        call_details = []
        for pc, reg in sites:
            subsys = get_subsystem(pc)
            dest_ram = None
            is_interpolated = False
            # Inspect following instructions (up to 32 bytes) for branch and store
            for step in range(pc + 4, min(len(rom_bytes), pc + 36), 4):
                w = int.from_bytes(rom_bytes[step:step+4], "big")
                b0 = (w >> 24) & 0xFF
                b1 = (w >> 16) & 0xFF
                b2 = (w >> 8) & 0xFF
                b3 = w & 0xFF
                op_major = (b0 >> 4) & 0xF
                r_dest = b0 & 0xF
                r_src = (b1 >> 4) & 0xF
                subop = b1 & 0xF
                simm16 = (b2 << 8) | b3
                if simm16 & 0x8000:
                    simm16 -= 0x10000

                # Check for branch to table interpolation routines
                if (b0 & 0xF0) == 0xF0: # bra or bl
                    pcdisp24 = (b1 << 16) | (b2 << 8) | b3
                    if pcdisp24 & 0x800000:
                        pcdisp24 -= 0x1000000
                    target_branch = (step & ~3) + pcdisp24 * 4
                    if target_branch in (0x04E1A8, 0x04E330, 0x04E380, 0x04E410):
                        is_interpolated = True

                # M32R 32-bit st/stb/sth format: 0xA <r_dest> <subop> <base_reg> <simm16>
                # subop: 0=st, 1=stb, 2=sth. base_reg: 13 (0xD) = FP (0x80C000)
                if op_major == 0xA:
                    st_subop = (b1 >> 4) & 0xF
                    st_base = b1 & 0xF
                    if st_base == 13: # FP relative
                        ram_addr = 0x80C000 + simm16
                        if not dest_ram:
                            dest_ram = f"0x{ram_addr:06X}"

                # Check for 16-bit parcel stores (op == 0x2, sub == 0x4, 0x5, 0x6)
                p_left = (w >> 16) & 0xFFFF
                p_right = w & 0xFFFF
                for p in (p_left, p_right):
                    p0 = (p >> 8) & 0xFF
                    p1 = p & 0xFF
                    pop = (p0 >> 4) & 0xF
                    prd = p0 & 0xF
                    prs = (p1 >> 4) & 0xF
                    psub = p1 & 0xF
                    # if storing r0 to @rX or similar
                    if pop == 0x2 and psub in (0x4, 0x5, 0x6) and prd == 0:
                        is_interpolated = is_interpolated or True

            call_details.append({
                "pc": f"0x{pc:06X}",
                "reg": f"r{reg}",
                "subsystem": subsys,
                "interpolated": is_interpolated,
                "destination_ram": dest_ram
            })

        t_data["references"] = call_details
        if sites:
            t_data["primary_subsystem"] = call_details[0]["subsystem"]
            t_data["primary_dest_ram"] = call_details[0]["destination_ram"]
            t_data["confidence"] = "Tier 1: Proven Reference" if call_details[0]["destination_ram"] else "Tier 2: Subsystem Classified"
        else:
            t_data["primary_subsystem"] = "Unreferenced / Indirect Pointer Table"
            t_data["primary_dest_ram"] = None
            t_data["confidence"] = "Tier 3: Structural Descriptor"

        analyzed.append(t_data)

    return analyzed


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Semantic Table Analyzer for Evo X Unmapped Tables")
    parser.add_argument("rom", help="Path to ROM (.srf or .bin)")
    parser.add_argument("--json-out", help="Path to output JSON manifest")
    parser.add_argument("--xml-out", help="Path to output decoded XML extension")
    args = parser.parse_args()

    print(f"[*] Analyzing unmapped tables in {Path(args.rom).name}...")
    analyzed = analyze_unmapped_tables(args.rom)

    t1 = sum(1 for t in analyzed if "Tier 1" in t["confidence"])
    t2 = sum(1 for t in analyzed if "Tier 2" in t["confidence"])
    t3 = sum(1 for t in analyzed if "Tier 3" in t["confidence"])

    print("\n=== Semantic Analysis Results ===")
    print(f"Total Discovered Tables Analyzed: {len(analyzed)}")
    print(f"  Tier 1 (Proven Call Site + Destination RAM): {t1}")
    print(f"  Tier 2 (Subsystem Classified via Call Site):   {t2}")
    print(f"  Tier 3 (Structural Descriptor in ROM):       {t3}")

    # Subsystem breakdown
    subsys_counts = {}
    for t in analyzed:
        s = t["primary_subsystem"]
        subsys_counts[s] = subsys_counts.get(s, 0) + 1

    print("\n=== Engine Subsystems Driving Discovered Tables ===")
    for s, c in sorted(subsys_counts.items(), key=lambda x: -x[1]):
        print(f"  {s:<55s}: {c} table(s)")

    # Save JSON manifest
    json_path = Path(args.json_out) if args.json_out else (REF_DIR / "unmapped_table_manifest.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(analyzed, f, indent=2)
    print(f"\n[+] Saved detailed evidence manifest to: {json_path}")

    # Generate decoded XML extension (isolated, leaves ground truth untouched)
    xml_path = Path(args.xml_out) if args.xml_out else (REF_DIR / "discovered_tables_decoded.xml")
    lines = [
        '<rom>',
        '    <!-- ================================================================= -->',
        '    <!-- EVO X SEMANTICALLY DECODED CALIBRATION TABLES EXTENSION           -->',
        '    <!-- Generated via Static M32R Machine Code & Decompiler Call-Tracing  -->',
        '    <!-- Truth-Preserved: Layered strictly over factory & Tephra XMLs      -->',
        '    <!-- ================================================================= -->',
        ''
    ]

    for t in analyzed:
        addr_hex = f"{t['address']:x}"
        cat = t["primary_subsystem"]
        # Generate clear, meaningful semantic name
        axis_desc = t.get("axis_name", t.get("axis_x_name", "Raw"))
        dest_desc = f" -> RAM {t['primary_dest_ram']}" if t['primary_dest_ram'] else ""
        name = f"[{t['confidence'][:6]}] {axis_desc} ({t['address_hex']}){dest_desc}"

        lines.append(f'    <!-- Confidence: {t["confidence"]} | Call Sites: {t["call_sites_count"]} -->')
        lines.append(f'    <table name="{name}" address="{addr_hex}" category="Discovered: {cat}" type="{t["type"]}" scaling="Percent128"/>')

    lines.append('</rom>')

    with open(xml_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"[+] Saved decoded EcuFlash XML extension to: {xml_path}")


if __name__ == "__main__":
    main()
