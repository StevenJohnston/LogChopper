#!/usr/bin/env python3
import json
import xml.sax.saxutils as saxutils
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REF_DIR = TOOLS_DIR.parent / "references"
manifest_path = REF_DIR / "unmapped_table_manifest.json"
xml_path = REF_DIR / "discovered_tables_decoded.xml"

cluster7_proven = {
    0x57350: {
        "semantic_name": "Idle Ignition Timing Retard Authority Multiplier vs Throttle Position / VSS",
        "category": "Ignition Timing: Idle Stability & Retard",
        "scaling": "Percent128",
        "role": "Authority taper multiplier governing idle ignition timing retard as throttle opens. Full authority (128 / 1.00x) at 0% TPS, tapering down to 0 at higher throttle to release idle spark control.",
        "units": "% Multiplier"
    },
    0x56196: {
        "semantic_name": "Idle Ignition Spark Retard Load Enable Ceiling vs Engine Load",
        "category": "Ignition Timing: Idle Stability & Retard",
        "scaling": "uint8",
        "role": "Engine load threshold (88-96% load) above which closed-loop idle ignition retard is deactivated.",
        "units": "Load %"
    },
    0x60ECE: {
        "semantic_name": "Idle Ignition Spark Retard Rate Multiplier (In-Gear) vs Engine RPM",
        "category": "Ignition Timing: Idle Stability & Retard",
        "scaling": "Percent128",
        "role": "Engine speed rate multiplier scaling idle spark retard response while transmission is in-gear (routine 0x2125C).",
        "units": "% Multiplier"
    },
    0x60EDE: {
        "semantic_name": "Idle Ignition Spark Retard Rate Multiplier (Neutral) vs Engine RPM",
        "category": "Ignition Timing: Idle Stability & Retard",
        "scaling": "Percent128",
        "role": "Engine speed rate multiplier scaling idle spark retard response while transmission is in neutral (routine 0x2125C).",
        "units": "% Multiplier"
    },
    0x561DA: {
        "semantic_name": "Base Idle Ignition Timing Multiplier vs Engine RPM",
        "category": "Ignition Timing: Idle Stability & Retard",
        "scaling": "Percent128",
        "role": "RPM multiplier applied to base idle ignition timing in the main spark arbitration routine (0x02FD94). Nominal 128 (1.00x).",
        "units": "% Multiplier"
    },
    0x56210: {
        "semantic_name": "1st-Gear Idle / Coast Ignition Timing Retard vs Engine RPM",
        "category": "Ignition Timing: Coast & Transient Retard",
        "scaling": "uint8",
        "role": "Engine-speed-dependent spark retard applied in 1st gear / low speed coast to prevent driveline shudder and bucking.",
        "units": "Timing Retard"
    },
    0x57C4C: {
        "semantic_name": "Gear 2-5 Idle / Coast Ignition Timing Retard vs Engine RPM",
        "category": "Ignition Timing: Coast & Transient Retard",
        "scaling": "uint8",
        "role": "Engine-speed-dependent spark retard applied during high-gear deceleration and coasting for smooth driveline overrun.",
        "units": "Timing Retard"
    },
    0x5621A: {
        "semantic_name": "Dynamic Coast Ignition Retard RPM Correction Factor vs Engine RPM",
        "category": "Ignition Timing: Coast & Transient Retard",
        "scaling": "Percent128",
        "role": "Correction factor scaling dynamic coast ignition retard across engine RPM in routine 0x202BC.",
        "units": "% Multiplier"
    },
    0x56222: {
        "semantic_name": "Dynamic Coast Ignition Retard Manifold Pressure Multiplier vs Delta MAP",
        "category": "Ignition Timing: Coast & Transient Retard",
        "scaling": "Percent128",
        "role": "Transient manifold pressure delta multiplier applied to dynamic coast ignition retard during rapid throttle lifts.",
        "units": "% Multiplier"
    },
    0x58CC8: {
        "semantic_name": "Minimum Ignition Timing Retard Floor Offset vs Engine RPM",
        "category": "Ignition Timing: Limits & Safety Clamps",
        "scaling": "uint8",
        "role": "Safety floor offset limiting maximum allowed timing retard during rapid throttle and boost transitions (routine 0x21E9C).",
        "units": "Offset"
    }
}

# Update manifest
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

for item in manifest:
    addr = item["address"]
    if addr in cluster7_proven:
        meta = cluster7_proven[addr]
        item["semantic_name"] = meta["semantic_name"]
        item["semantic_category"] = meta["category"]
        item["scaling"] = meta["scaling"]
        item["role"] = meta["role"]
        item["units"] = meta["units"]
        item["confidence"] = "Tier 1: Proven & Fully Decoded"

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"[+] Updated manifest with {len(cluster7_proven)} Cluster 7 tables.")

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
