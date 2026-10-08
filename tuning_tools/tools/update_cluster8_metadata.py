#!/usr/bin/env python3
import json
import xml.sax.saxutils as saxutils
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REF_DIR = TOOLS_DIR.parent / "references"
manifest_path = REF_DIR / "unmapped_table_manifest.json"
xml_path = REF_DIR / "discovered_tables_decoded.xml"

cluster8_proven = {
    0x5057A: {
        "semantic_name": "Primary Wastegate Duty Cycle (WGDC) Baseline Feedforward vs Engine RPM",
        "category": "Turbo Boost Control: Solenoid Duty",
        "scaling": "uint8",
        "role": "Baseline feedforward duty cycle curve for primary boost bleed solenoid across engine RPM (outputs to RAM 0x80970C in routine 0x17E9C). Ramps to peak at 4000 RPM spool.",
        "units": "Duty Raw"
    },
    0x5058E: {
        "semantic_name": "Secondary Wastegate Duty Cycle (WGDC) Baseline Offset vs Engine RPM",
        "category": "Turbo Boost Control: Solenoid Duty",
        "scaling": "uint8",
        "role": "Alternative baseline duty cycle offset curve for secondary boost solenoid across engine RPM (outputs to RAM 0x80970E in routine 0x17E9C).",
        "units": "Duty Raw"
    },
    0x61258: {
        "semantic_name": "Secondary Wastegate Solenoid WGDC Downward Rate Filter vs Engine RPM",
        "category": "Turbo Boost Control: Closed-Loop PID",
        "scaling": "Percent128",
        "role": "Low-pass smoothing rate factor applied when reducing secondary wastegate solenoid duty cycle to suppress boost spike oscillation (routine 0x16EB4).",
        "units": "Filter Factor"
    },
    0x5AC32: {
        "semantic_name": "Knock Retard Authority Ceiling Clamp vs Engine RPM",
        "category": "Ignition Timing: Knock Retard & Control",
        "scaling": "uint8",
        "role": "Upper ceiling clamp on maximum allowed dynamic knock retard across engine RPM (outputs to RAM 0x80A468 in routine 0x17414).",
        "units": "Timing Clamp"
    },
    0x561FC: {
        "semantic_name": "Ignition Timing High-Load / Boost Transition Threshold vs Engine RPM",
        "category": "Ignition Timing: Mode Switching & Triggers",
        "scaling": "uint8",
        "role": "Engine load switching curve across RPM evaluated in routine 0x200B0 that triggers transition of ignition timing logic from cruise mode to boosted operation.",
        "units": "Load %"
    },
    0x5ADA6: {
        "semantic_name": "Maximum Ignition Timing Advance Clamp vs Throttle Position / VSS",
        "category": "Ignition Timing: Limits & Safety Clamps",
        "scaling": "uint8",
        "role": "Dynamic maximum spark advance ceiling clamp enforced during active driving in routine 0x206F0, preventing over-advance on throttle tip-in.",
        "units": "Timing Degrees"
    },
    0x56158: {
        "semantic_name": "Base Ignition Advance Load Multiplier vs Engine Load",
        "category": "Ignition Timing: Base Calculation",
        "scaling": "Percent128",
        "role": "Load-dependent scaling multiplier applied to base ignition advance calculation in routine 0x20B88 (nominal 128 / 1.00x).",
        "units": "% Multiplier"
    }
}

# Update manifest
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

for item in manifest:
    addr = item["address"]
    if addr in cluster8_proven:
        meta = cluster8_proven[addr]
        item["semantic_name"] = meta["semantic_name"]
        item["semantic_category"] = meta["category"]
        item["scaling"] = meta["scaling"]
        item["role"] = meta["role"]
        item["units"] = meta["units"]
        item["confidence"] = "Tier 1: Proven & Fully Decoded"

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"[+] Updated manifest with {len(cluster8_proven)} Cluster 8 tables.")

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
