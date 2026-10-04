#!/usr/bin/env python3
"""
update_cluster11_metadata.py - Update Cluster 11 (6 Tables) Metadata & Regenerate XML
RAX Fast Logging & Smart EC Electronic Boost Control
"""

import json
import xml.sax.saxutils as saxutils
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REF_DIR = TOOLS_DIR.parent / "references"
manifest_path = REF_DIR / "unmapped_table_manifest.json"
xml_path = REF_DIR / "discovered_tables_decoded.xml"

cluster11_proven = {
    0x563D0: {
        "semantic_name": "Smart EC Electronic Boost Control WGDC Baseline Duty Adder vs Engine RPM",
        "category": "Boost Control: Smart EC & RAX Electronics",
        "scaling": "uint8",
        "role": "Progressive duty cycle adder (22 ramping to 160) applied to base wastegate duty cycle in routine 0x02C1D0 (outputs to RAM 0x808BC0) to maintain boost against wastegate blow-open.",
        "units": "Duty %"
    },
    0x56520: {
        "semantic_name": "Smart EC Boost Target Multiplier (Normal Mode) vs Engine RPM",
        "category": "Boost Control: Smart EC & RAX Electronics",
        "scaling": "uint8",
        "role": "Primary boost target ceiling multiplier evaluated in routine 0x02C718 (outputs to RAM 0x808C76/0x808C78); clamps low RPM to 24 before uncapping to 255.",
        "units": "Target Factor"
    },
    0x5A4B4: {
        "semantic_name": "RAX Barometric Pressure Wastegate Duty Compensation vs Engine RPM",
        "category": "Boost Control: Smart EC & RAX Electronics",
        "scaling": "uint8",
        "role": "Barometric pressure compensation trim evaluated in routine 0x02BD78 (outputs to RAM 0x8087BA) preceding RAX IAT/Baro BWGDC subroutines.",
        "units": "Duty Trim"
    },
    0x5CD40: {
        "semantic_name": "Smart EC Boost Target Multiplier (Alternate Mode 1 / High Boost) vs Engine RPM",
        "category": "Boost Control: Smart EC & RAX Electronics",
        "scaling": "uint8",
        "role": "Alternate boost target multiplier evaluated in routine 0x02C708 (outputs to RAM 0x808C76/0x808C78) for high boost / alternate map switching.",
        "units": "Target Factor"
    },
    0x5CD54: {
        "semantic_name": "Smart EC Boost Target Multiplier (Alternate Mode 2 / Low Boost) vs Engine RPM",
        "category": "Boost Control: Smart EC & RAX Electronics",
        "scaling": "uint8",
        "role": "Alternate boost target multiplier evaluated in routine 0x02C710 (outputs to RAM 0x808C76/0x808C78) for valet / low boost map switching.",
        "units": "Target Factor"
    },
    0x6025C: {
        "semantic_name": "RAX Fast Logging Telemetry Bandwidth Window vs Throttle Position / VSS",
        "category": "RAX Fast Logging & Telemetry",
        "scaling": "Percent128",
        "role": "High-speed Mode 23 telemetry sample window factor across TPS and vehicle speed evaluated in routine 0x02B5C8 (outputs to RAM 0x8096AE).",
        "units": "% Multiplier"
    }
}

# Update manifest
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

for item in manifest:
    addr = item["address"]
    if addr in cluster11_proven:
        meta = cluster11_proven[addr]
        item["semantic_name"] = meta["semantic_name"]
        item["semantic_category"] = meta["category"]
        item["scaling"] = meta["scaling"]
        item["role"] = meta["role"]
        item["units"] = meta["units"]
        item["confidence"] = "Tier 1: Proven & Fully Decoded"

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"[+] Updated manifest with {len(cluster11_proven)} Cluster 11 tables.")

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
