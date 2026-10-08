#!/usr/bin/env python3
import json
import xml.sax.saxutils as saxutils
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REF_DIR = TOOLS_DIR.parent / "references"
manifest_path = REF_DIR / "unmapped_table_manifest.json"
xml_path = REF_DIR / "discovered_tables_decoded.xml"

cluster9_proven = {
    0x55908: {
        "semantic_name": "Rolling Vehicle Speed Smoothing Multiplier (Coast / Decel) vs Engine RPM",
        "category": "Vehicle Speed & Gear State Machine",
        "scaling": "Percent128",
        "role": "State table in routine 0x1E210 applying smoothing multiplier on calculated vehicle speed during deceleration and coasting.",
        "units": "% Multiplier"
    },
    0x5591A: {
        "semantic_name": "Rolling Vehicle Speed Smoothing Multiplier (Cruise / Neutral) vs Engine RPM",
        "category": "Vehicle Speed & Gear State Machine",
        "scaling": "Percent128",
        "role": "State table in routine 0x1E210 applying smoothing multiplier on calculated vehicle speed during steady-state cruise or neutral.",
        "units": "% Multiplier"
    },
    0x5592C: {
        "semantic_name": "Rolling Vehicle Speed Smoothing Multiplier (Mode 1 / Acceleration) vs Engine RPM",
        "category": "Vehicle Speed & Gear State Machine",
        "scaling": "Percent128",
        "role": "State table in routine 0x1E210 applying dynamic smoothing multiplier on calculated vehicle speed during acceleration.",
        "units": "% Multiplier"
    },
    0x5593E: {
        "semantic_name": "Rolling Vehicle Speed Smoothing Multiplier (Mode 2 / Overrun) vs Engine RPM",
        "category": "Vehicle Speed & Gear State Machine",
        "scaling": "Percent128",
        "role": "State table in routine 0x1E210 applying dynamic smoothing multiplier on calculated vehicle speed during throttle overrun.",
        "units": "% Multiplier"
    },
    0x5AD9A: {
        "semantic_name": "Vehicle Moving Detection Speed Floor vs Engine RPM",
        "category": "Vehicle Speed & Gear State Machine",
        "scaling": "uint8",
        "role": "Speed floor threshold (multiplied by 4) below which vehicle is treated as stationary in routine 0x1FC18 (15 km/h at idle tapering to 0 km/h at 3000 RPM).",
        "units": "Speed Floor"
    },
    0x5A05C: {
        "semantic_name": "Gear Calculation Speed Hysteresis Delta vs Engine RPM",
        "category": "Vehicle Speed & Gear State Machine",
        "scaling": "uint8",
        "role": "Hysteresis delta (nominal 3 km/h) preventing gear calculation hunting between adjacent gears in routine 0x1FDF0.",
        "units": "km/h"
    },
    0x5CBD6: {
        "semantic_name": "Vehicle Speed Dwell / Sampling Rate Factor vs Engine RPM",
        "category": "Vehicle Speed & Sensor Filtering",
        "scaling": "uint8",
        "role": "Linear scale factor across RPM applied in sensor sampling pipeline 0x131C8 (outputs to RAM 0x80A5E4).",
        "units": "Scale Factor"
    },
    0x5E6B4: {
        "semantic_name": "Wheel Speed Slip Failsafe Value vs Engine RPM",
        "category": "Vehicle Speed & Sensor Filtering",
        "scaling": "uint8",
        "role": "Failsafe wheel speed substituted into RAM 0x808696 when wheel slip delta exceeds threshold in routine 0x136D8.",
        "units": "Speed Value"
    },
    0x5F96E: {
        "semantic_name": "Minimum Vehicle Speed Validation Threshold vs Engine RPM",
        "category": "Vehicle Speed & Sensor Filtering",
        "scaling": "uint8",
        "role": "Speed threshold (multiplied by 40) required for speed validation and cruise control gating in routine 0x137D0.",
        "units": "Speed Threshold"
    },
    0x556A4: {
        "semantic_name": "Dynamic Delta MAP Lag Filter Multiplier (Channel 1) vs Delta MAP",
        "category": "Vehicle Speed & Sensor Filtering",
        "scaling": "Percent128",
        "role": "Transient manifold pressure delta multiplier applied to sensor lag filter channel 1 (outputs to RAM 0x808932 in routine 0x14AF8).",
        "units": "% Multiplier"
    },
    0x50402: {
        "semantic_name": "Dynamic Delta MAP Lag Filter Multiplier (Channel 2) vs Delta MAP",
        "category": "Vehicle Speed & Sensor Filtering",
        "scaling": "Percent128",
        "role": "Transient manifold pressure delta multiplier applied to sensor lag filter channel 2 (outputs to RAM 0x808934 in routine 0x14AF8).",
        "units": "% Multiplier"
    },
    0x5BDB8: {
        "semantic_name": "Minimum VVT Advance Angle vs Vehicle Speed / Gear",
        "category": "MIVEC Cam Phasing: Dynamic Slew & Filtering",
        "scaling": "uint8",
        "role": "Minimum VVT cam advance angle floor across vehicle speed / gear axis evaluated in routine 0x30860 (outputs to RAM 0x8083BC).",
        "units": "Degrees Advance"
    },
    0x57274: {
        "semantic_name": "Maximum VVT Advance Authority vs Vehicle Speed / Gear",
        "category": "MIVEC Cam Phasing: Dynamic Slew & Filtering",
        "scaling": "uint8",
        "role": "Maximum VVT cam advance authority ceiling across vehicle speed / gear axis evaluated in routine 0x30860 (outputs to RAM 0x8083BA).",
        "units": "Authority %"
    }
}

# Update manifest
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

for item in manifest:
    addr = item["address"]
    if addr in cluster9_proven:
        meta = cluster9_proven[addr]
        item["semantic_name"] = meta["semantic_name"]
        item["semantic_category"] = meta["category"]
        item["scaling"] = meta["scaling"]
        item["role"] = meta["role"]
        item["units"] = meta["units"]
        item["confidence"] = "Tier 1: Proven & Fully Decoded"

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"[+] Updated manifest with {len(cluster9_proven)} Cluster 9 tables.")

def xml_escape(val):
    return saxutils.escape(str(val), {'"': "&quot;", "'": "&apos;"})

# Regenerate discovered_tables_decoded.xml
lines = [
    "<rom>",
    "    <!-- ================================================================= -->",
    "    <!-- EVO X SEMANTICALLY DECODED CALIBRATION TABLES EXTENSION           -->",
    "    <!-- Generated via Static M32R Machine Code & Decompiler Call-Tracing  -->",
    "    <!-- Truth-Preserved: Layered strictly over factory & Tephra XMLs      -->",
    "    <!-- ================================================================= -->",
    ""
]

for item in manifest:
    addr_val = item["address"]
    addr_hex = f"{addr_val:x}"
    item_type = item["type"]
    if "semantic_name" in item:
        sem_name = xml_escape(item["semantic_name"])
        cat_name = xml_escape(item["semantic_category"])
        sc_name = xml_escape(item.get("scaling", "Percent128"))
        role = xml_escape(item.get("role", ""))
        lines.append(f"    <!-- Role: {role} -->")
        lines.append(f'    <table name="{sem_name} (0x{addr_val:05X})" address="{addr_hex}" category="{cat_name}" type="{item_type}" scaling="{sc_name}"/>')
    else:
        cat = xml_escape(item["primary_subsystem"])
        axis_desc = xml_escape(item.get("axis_name") or item.get("axis_x_name") or "Raw")
        dest_desc = ""
        if item.get("primary_dest_ram"):
            dest_desc = " -> RAM " + xml_escape(item["primary_dest_ram"])
        conf = xml_escape(item["confidence"])
        conf_prefix = conf[:6]
        addr_h = item["address_hex"]
        name = f"[{conf_prefix}] {axis_desc} ({addr_h}){dest_desc}"
        calls = item["call_sites_count"]
        lines.append(f"    <!-- Confidence: {conf} | Call Sites: {calls} -->")
        lines.append(f'    <table name="{name}" address="{addr_hex}" category="Discovered: {cat}" type="{item_type}" scaling="Percent128"/>')

lines.append("</rom>")

with open(xml_path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"[+] Regenerated {xml_path} successfully!")
