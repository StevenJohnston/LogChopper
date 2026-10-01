#!/usr/bin/env python3
"""
scan_rom_tables.py - Automated Mitsubishi Evo X ROM Table Descriptor Scanner

Scans the raw 1MB ROM binary for all 2D and 3D table metadata descriptors:
  - 2D Tables: [0x02, 0x00, Axis_RAM (2 bytes), ...]
  - 3D Tables: [0x03, 0x00, X_Axis_RAM (2 bytes), Y_Axis_RAM (2 bytes), ...]

Cross-references every table against EcuFlash XML definitions to identify:
  1. Fully mapped tables
  2. Unmapped / undiscovered calibration tables
  3. Associated RAM sensor axes (RPM, Load, ECT, TPS, IAT, etc.)

Generates an EcuFlash XML patch definition for all discovered tables.
"""

import sys
import os
import argparse
from pathlib import Path

# Known RAM variables identified in the firmware
KNOWN_RAM_VARS = {
    0xC5DE: "Engine RPM",
    0xC5E0: "Engine Load",
    0xC5EA: "Fast Engine Coolant Temp (ECT)",
    0xC5FA: "Damped Engine Coolant Temp (ECT)",
    0xC5D8: "Boost Error",
    0xC5D6: "Boost Error (Logged 0x8085D6)",
    0xC5E8: "Throttle Position (TPS) / Vehicle Speed",
    0x9186: "Intake Air Temp (IAT)",
    0xC5B8: "Barometric Pressure",
    0xC5C0: "Battery Voltage",
    0xC5C4: "Target Idle RPM",
    0xC586: "Target Boost",
    0xC58E: "Wastegate Duty Cycle (WGDC)",
    0xC686: "ECT Axis Interpolation Cache",
    0xC694: "Damped ECT Axis Interpolation Cache",
}


def load_known_symbols(csv_path):
    known = {}
    if not os.path.exists(csv_path):
        return known
    with open(csv_path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split(",")
            if len(parts) >= 4 and parts[1].isdigit():
                addr = int(parts[1])
                known[addr] = {
                    "label": parts[2],
                    "raw_name": parts[3],
                    "type": parts[4] if len(parts) > 4 else "Unknown"
                }
    return known


def scan_rom(rom_path, known_symbols):
    with open(rom_path, "rb") as f:
        data = f.read()

    # Detect .srf
    header_offset = 328 if len(data) == 1048576 + 328 or rom_path.endswith(".srf") else 0
    rom_bytes = data[header_offset:header_offset + 1048576]

    tables_2d = []
    tables_3d = []

    # Table descriptors typically reside in calibration areas: 0x050000 - 0x06FFFF
    # But can span 0x010000 - 0x0EFFFF
    scan_start = 0x050000
    scan_end = 0x068000

    i = scan_start
    while i < scan_end - 8:
        b0 = rom_bytes[i]
        b1 = rom_bytes[i + 1]

        # 2D table descriptor: 0x02 0x00
        if b0 == 0x02 and b1 == 0x00:
            ram_axis = int.from_bytes(rom_bytes[i + 2:i + 4], "big")
            # Filter valid RAM offsets (typically 0x8000 - 0xFFFF for fp offsets)
            if 0x8000 <= ram_axis <= 0xFFFF:
                # Check data length or header bytes
                data_addr = i + 4
                is_known = data_addr in known_symbols or (data_addr + 3) in known_symbols
                sym_info = known_symbols.get(data_addr, known_symbols.get(data_addr + 3))
                tables_2d.append({
                    "desc_addr": i,
                    "data_addr": data_addr,
                    "ram_axis": ram_axis,
                    "axis_name": KNOWN_RAM_VARS.get(ram_axis, f"Unknown RAM 0x{ram_axis:04X}"),
                    "is_known": bool(is_known),
                    "symbol": sym_info["raw_name"] if sym_info else "UNMAPPED_2D_TABLE"
                })

        # 3D table descriptor: 0x03 0x00
        elif b0 == 0x03 and b1 == 0x00:
            ram_x = int.from_bytes(rom_bytes[i + 2:i + 4], "big")
            ram_y = int.from_bytes(rom_bytes[i + 4:i + 6], "big")
            elements_x = rom_bytes[i + 6]
            if 0x8000 <= ram_x <= 0xFFFF and 0x8000 <= ram_y <= 0xFFFF and 0 < elements_x <= 32:
                data_addr = i + 7
                is_known = data_addr in known_symbols or i in known_symbols
                sym_info = known_symbols.get(data_addr, known_symbols.get(i))
                tables_3d.append({
                    "desc_addr": i,
                    "data_addr": data_addr,
                    "ram_x": ram_x,
                    "axis_x_name": KNOWN_RAM_VARS.get(ram_x, f"Unknown RAM 0x{ram_x:04X}"),
                    "ram_y": ram_y,
                    "axis_y_name": KNOWN_RAM_VARS.get(ram_y, f"Unknown RAM 0x{ram_y:04X}"),
                    "elements_x": elements_x,
                    "is_known": bool(is_known),
                    "symbol": sym_info["raw_name"] if sym_info else "UNMAPPED_3D_SURFACE"
                })

        i += 2  # Descriptors are 16-bit aligned

    return tables_2d, tables_3d


def generate_xml_extension(unmapped_tables, output_path):
    """Generate EcuFlash XML extension for all newly discovered tables."""
    lines = [
        '<rom>',
        '    <!-- Auto-generated EcuFlash XML Extension for Evo X (M32186F8) -->',
        '    <!-- Discovered via scan_rom_tables.py descriptor analysis -->',
        ''
    ]

    for t in unmapped_tables:
        if "ram_axis" in t:
            # 2D table
            addr_hex = f"{t['desc_addr']:x}"
            name = f"Discovered 2D - {t['axis_name']} (0x{t['desc_addr']:05X})"
            lines.append(f'    <table name="{name}" address="{addr_hex}" category="Discovered Tables" type="2D" scaling="Percent128"/>')
        else:
            # 3D table
            addr_hex = f"{t['data_addr']:x}"
            name = f"Discovered 3D - {t['axis_x_name']} x {t['axis_y_name']} (0x{t['data_addr']:05X})"
            lines.append(f'    <table name="{name}" address="{addr_hex}" category="Discovered Tables" type="3D" scaling="Percent128"/>')

    lines.append('</rom>')

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"[+] EcuFlash XML extension saved to: {output_path}")


def main():
    default_ref_dir = Path(__file__).resolve().parent.parent / "references"
    default_symbols = default_ref_dir / "evo10_symbols.csv"

    parser = argparse.ArgumentParser(description="Scan Evo X ROM for table descriptors and unmapped maps")
    parser.add_argument("rom", help="Path to .hex.bin or .srf ROM file")
    parser.add_argument("--symbols", default=str(default_symbols), help="Path to evo10_symbols.csv")
    parser.add_argument("--xml-out", help="Path to output EcuFlash XML extension for unmapped tables")

    args = parser.parse_args()

    known_symbols = load_known_symbols(args.symbols)
    print(f"[*] Loaded {len(known_symbols)} known symbols.")
    print(f"[*] Scanning {Path(args.rom).name} for table descriptors...")

    t2d, t3d = scan_rom(args.rom, known_symbols)

    unmapped_2d = [t for t in t2d if not t["is_known"]]
    unmapped_3d = [t for t in t3d if not t["is_known"]]

    print(f"\n=== Scan Results for {Path(args.rom).name} ===")
    print(f"  2D Table Descriptors Found: {len(t2d)} (Mapped: {len(t2d)-len(unmapped_2d)}, Unmapped: {len(unmapped_2d)})")
    print(f"  3D Table Descriptors Found: {len(t3d)} (Mapped: {len(t3d)-len(unmapped_3d)}, Unmapped: {len(unmapped_3d)})")

    print("\n--- Sample Unmapped 2D Tables ---")
    for t in unmapped_2d[:10]:
        print(f"  [0x{t['desc_addr']:06X}] Axis: {t['axis_name']:<35s} -> Data at 0x{t['data_addr']:06X}")

    print("\n--- Sample Unmapped 3D Surfaces ---")
    for t in unmapped_3d[:10]:
        print(f"  [0x{t['desc_addr']:06X}] X: {t['axis_x_name']:<25s} | Y: {t['axis_y_name']:<20s} (Dim: {t['elements_x']}) -> Data at 0x{t['data_addr']:06X}")

    if args.xml_out:
        generate_xml_extension(unmapped_2d + unmapped_3d, args.xml_out)
    else:
        default_xml = default_ref_dir / "discovered_unmapped_tables.xml"
        generate_xml_extension(unmapped_2d + unmapped_3d, default_xml)


if __name__ == "__main__":
    main()
