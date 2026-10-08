#!/usr/bin/env python3
import json
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REF_DIR = TOOLS_DIR.parent / "references"
manifest_path = REF_DIR / "unmapped_table_manifest.json"
xml_path = REF_DIR / "discovered_tables_decoded.xml"

cluster4_proven = {
    0x55000: {
        "semantic_name": "Load Low-Pass Lag Filter Multiplier vs Throttle Position / VSS",
        "category": "Load Calculation & Lag Filtering",
        "scaling": "Percent128",
        "role": "Applies a throttle-dependent multiplier to the base 3D load lag filter alpha. At low throttle (147 / 1.15x), increases filtering to smooth cruise jerkiness; at WOT (128 / 1.00x), minimizes lag for fast boost tracking.",
        "units": "% Multiplier"
    },
    0x5500C: {
        "semantic_name": "Load Low-Pass Lag Filter Multiplier vs Delta MAP",
        "category": "Load Calculation & Lag Filtering",
        "scaling": "Percent128",
        "role": "Scales the load filter alpha during rapid positive or negative manifold pressure transients.",
        "units": "% Multiplier"
    },
    0x57702: {
        "semantic_name": "Load Low-Pass Lag Filter Multiplier vs Engine RPM",
        "category": "Load Calculation & Lag Filtering",
        "scaling": "Percent128",
        "role": "RPM-dependent multiplier on the load filter alpha, ramping up from 78 at low RPM to 128 (1.000) at 3000 RPM.",
        "units": "% Multiplier"
    },
    0x611A2: {
        "semantic_name": "Dynamic Load Filter MIVEC RPM Correction Factor vs Engine RPM",
        "category": "Load Calculation & Lag Filtering",
        "scaling": "Percent128",
        "role": "Correction factor applied to the load filter alpha based on actual intake and exhaust MIVEC cam angles across engine RPM.",
        "units": "% Multiplier"
    },
    0x576E6: {
        "semantic_name": "Load Filter Baseline Upper Clamp vs Engine RPM",
        "category": "Load Calculation & Lag Filtering",
        "scaling": "uint8",
        "role": "Hard upper bound ceiling on the load filter coefficient across engine RPM.",
        "units": "raw"
    },
    0x57162: {
        "semantic_name": "Engine Load Calculation Base Fuel Multiplier vs Engine RPM",
        "category": "Fuel: Load-Based Fuel Calculation",
        "scaling": "Percent128",
        "role": "Base engine speed multiplier applied to calculated load before final pulse width derivation. 224 at low RPM down to 90 at high RPM.",
        "units": "% Multiplier"
    },
    0x503F8: {
        "semantic_name": "Boost Error Closed-Loop Derivative Gain (Kd) vs Engine RPM",
        "category": "Turbo Boost Control: Closed-Loop PID",
        "scaling": "Percent128",
        "role": "Derivative gain (Kd) in the closed-loop boost control PID routine, scaling wastegate response to rapid boost rate-of-change across RPM.",
        "units": "Gain"
    },
    0x5040E: {
        "semantic_name": "Boost Error Closed-Loop Proportional Gain (Kp) vs Engine RPM",
        "category": "Turbo Boost Control: Closed-Loop PID",
        "scaling": "uint8",
        "role": "Proportional gain (Kp) applied to boost error (Actual Boost vs Target Boost) across engine speed.",
        "units": "Gain"
    },
    0x5EFB6: {
        "semantic_name": "Wastegate Duty Cycle (WGDC) Downward Rate Filter vs Engine RPM",
        "category": "Turbo Boost Control: Closed-Loop PID",
        "scaling": "Percent128",
        "role": "Low-pass smoothing rate factor applied when reducing wastegate solenoid duty cycle to suppress boost oscillation and overshoot.",
        "units": "Filter Factor"
    },
    0x5C182: {
        "semantic_name": "Dynamic Target Boost Slew Rate Upper Bound vs Engine RPM",
        "category": "Turbo Boost Control: Target Boost",
        "scaling": "uint8",
        "role": "Upper slew rate limit on how fast Target Boost can ramp up during rapid turbo spool-up.",
        "units": "Slew Limit"
    },
    0x5C19C: {
        "semantic_name": "Dynamic Target Boost Slew Rate Filter Alpha vs Engine RPM",
        "category": "Turbo Boost Control: Target Boost",
        "scaling": "uint8",
        "role": "Filter smoothing factor applied to Target Boost rate-of-change during spool.",
        "units": "Alpha"
    },
    0x5C1B6: {
        "semantic_name": "Dynamic Target Boost Damping Factor vs Engine RPM",
        "category": "Turbo Boost Control: Target Boost",
        "scaling": "uint8",
        "role": "Damping factor preventing Target Boost overshoot during high-gear pulls.",
        "units": "Damping"
    },
    0x5C2E8: {
        "semantic_name": "Dynamic Target Boost Slew Rate Lower Bound vs Engine RPM",
        "category": "Turbo Boost Control: Target Boost",
        "scaling": "uint8",
        "role": "Lower slew rate floor on Target Boost ramping during spool.",
        "units": "Slew Limit"
    }
}

# Update manifest
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

for item in manifest:
    addr = item["address"]
    if addr in cluster4_proven:
        meta = cluster4_proven[addr]
        item["semantic_name"] = meta["semantic_name"]
        item["semantic_category"] = meta["category"]
        item["scaling"] = meta["scaling"]
        item["role"] = meta["role"]
        item["units"] = meta["units"]
        item["confidence"] = "Tier 1: Proven & Fully Decoded"

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"[+] Updated manifest with {len(cluster4_proven)} Cluster 4 tables.")

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
        sem_name = item["semantic_name"]
        cat_name = item["semantic_category"]
        sc_name = item.get("scaling", "Percent128")
        role = item.get("role", "")
        lines.append(f"    <!-- Role: {role} -->")
        lines.append(f'    <table name="{sem_name} (0x{addr_val:05X})" address="{addr_hex}" category="{cat_name}" type="{item_type}" scaling="{sc_name}"/>')
    else:
        cat = item["primary_subsystem"]
        axis_desc = item.get("axis_name") or item.get("axis_x_name") or "Raw"
        dest_desc = ""
        if item.get("primary_dest_ram"):
            dest_desc = " -> RAM " + item["primary_dest_ram"]
        conf = item["confidence"]
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
