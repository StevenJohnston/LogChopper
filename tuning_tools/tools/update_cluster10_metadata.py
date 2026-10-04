#!/usr/bin/env python3
"""
update_cluster10_metadata.py - Update Cluster 10 (34 Tables) Metadata & Regenerate XML
Automatic Transmission / TC-SST Communication, Torque Reduction & Diagnostics
"""

import json
import xml.sax.saxutils as saxutils
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REF_DIR = TOOLS_DIR.parent / "references"
manifest_path = REF_DIR / "unmapped_table_manifest.json"
xml_path = REF_DIR / "discovered_tables_decoded.xml"

cluster10_proven = {
    0x5647A: {
        "semantic_name": "TC-SST Dual Clutch Engagement Slew Multiplier vs Engine RPM",
        "category": "Transmission: TC-SST Dual Clutch Control",
        "scaling": "Percent128",
        "role": "Engagement slew rate multiplier applied to both Clutch 1 (RAM 0x808BC2) and Clutch 2 (RAM 0x808BC4) during shift handover.",
        "units": "% Multiplier"
    },
    0x56534: {
        "semantic_name": "TCM CAN Communication Timeout Recovery Multiplier vs Engine RPM",
        "category": "Transmission: CAN Communication & Diagnostics",
        "scaling": "uint8",
        "role": "Recovery multiplier applied to TCM CAN communication watchdog timer in routine 0x0A4E68 (outputs to RAM 0x808BCE).",
        "units": "Recovery Factor"
    },
    0x5662E: {
        "semantic_name": "Transmission Driver Demand Torque Multiplier vs Throttle Position / VSS",
        "category": "Transmission: Torque Request Arbitration",
        "scaling": "uint8",
        "role": "Driver demand torque curve across TPS and vehicle speed evaluated in routine 0x0A0A04 (outputs to RAM 0x8088DA).",
        "units": "% Torque"
    },
    0x56646: {
        "semantic_name": "Transmission Secondary Load Filter Damping Factor vs Engine Load",
        "category": "Transmission: Torque Request Arbitration",
        "scaling": "Percent128",
        "role": "Secondary load filter damping coefficient evaluated in routine 0x0A0A34 (outputs to RAM 0x808870).",
        "units": "% Damping"
    },
    0x5665C: {
        "semantic_name": "Transmission Auxiliary Idle Speed Offset vs Engine RPM",
        "category": "Transmission: Idle & Drivability Compensation",
        "scaling": "uint8",
        "role": "Auxiliary idle speed offset added during in-gear transmission load in routine 0x0A6958 (outputs to RAM 0x804618).",
        "units": "RPM Offset"
    },
    0x5666C: {
        "semantic_name": "Transmission Gear 1 Upshift RPM Threshold vs Engine RPM",
        "category": "Transmission: Shift Schedule Maps",
        "scaling": "uint8",
        "role": "Upshift engine speed threshold for Gear 1 evaluated in shift scheduling routine 0x0A7408.",
        "units": "RPM Threshold"
    },
    0x5667C: {
        "semantic_name": "Transmission Gear 2 Upshift RPM Threshold vs Engine RPM",
        "category": "Transmission: Shift Schedule Maps",
        "scaling": "uint8",
        "role": "Upshift engine speed threshold for Gear 2 evaluated in shift scheduling routine 0x0A73F4.",
        "units": "RPM Threshold"
    },
    0x5668C: {
        "semantic_name": "Transmission Gear 3 Upshift RPM Threshold vs Engine RPM",
        "category": "Transmission: Shift Schedule Maps",
        "scaling": "uint8",
        "role": "Upshift engine speed threshold for Gear 3 evaluated in shift scheduling routine 0x0A73E0.",
        "units": "RPM Threshold"
    },
    0x5669C: {
        "semantic_name": "Transmission Gear 4 Upshift RPM Threshold vs Engine RPM",
        "category": "Transmission: Shift Schedule Maps",
        "scaling": "uint8",
        "role": "Upshift engine speed threshold for Gear 4 evaluated in shift scheduling routine 0x0A73CC.",
        "units": "RPM Threshold"
    },
    0x566AC: {
        "semantic_name": "Transmission Gear 1 Target Load / Airflow Threshold vs Target Load",
        "category": "Transmission: Shift Schedule Maps",
        "scaling": "uint8",
        "role": "Target engine load threshold for Gear 1 upshift gating evaluated in routine 0x0A7324.",
        "units": "Load Threshold"
    },
    0x566BC: {
        "semantic_name": "Transmission Gear 2 Target Load / Airflow Threshold vs Target Load",
        "category": "Transmission: Shift Schedule Maps",
        "scaling": "uint8",
        "role": "Target engine load threshold for Gear 2 upshift gating evaluated in routine 0x0A7310.",
        "units": "Load Threshold"
    },
    0x566CC: {
        "semantic_name": "Transmission Gear 3 Target Load / Airflow Threshold vs Target Load",
        "category": "Transmission: Shift Schedule Maps",
        "scaling": "uint8",
        "role": "Target engine load threshold for Gear 3 upshift gating evaluated in routine 0x0A72FC.",
        "units": "Load Threshold"
    },
    0x566DC: {
        "semantic_name": "Transmission Gear 4 Target Load / Airflow Threshold vs Target Load",
        "category": "Transmission: Shift Schedule Maps",
        "scaling": "uint8",
        "role": "Target engine load threshold for Gear 4 upshift gating evaluated in routine 0x0A72E8.",
        "units": "Load Threshold"
    },
    0x566EC: {
        "semantic_name": "Transmission In-Gear Idle Load Compensation Factor vs Engine RPM",
        "category": "Transmission: Idle & Drivability Compensation",
        "scaling": "uint8",
        "role": "In-gear engine load compensation factor evaluated in routine 0x0A6924 (outputs to RAM 0x808646).",
        "units": "Load Factor"
    },
    0x56BCE: {
        "semantic_name": "Transmission Turbine Shaft Speed Ratio Minimum Limit vs Engine RPM",
        "category": "Transmission: Rationality & Diagnostics",
        "scaling": "uint8",
        "role": "Lower rationality limit for turbine to engine speed ratio in routine 0x0A45A0 (outputs to RAM 0x80913A).",
        "units": "Speed Ratio"
    },
    0x56BDC: {
        "semantic_name": "Transmission Input Shaft Speed Sensor Rationality Low Floor vs Engine RPM",
        "category": "Transmission: Rationality & Diagnostics",
        "scaling": "uint8",
        "role": "Lower speed sensor diagnostic floor evaluated in routine 0x0A4588 (outputs to RAM 0x808646).",
        "units": "Sensor Low Floor"
    },
    0x56BEA: {
        "semantic_name": "Transmission Turbine Shaft Speed Ratio Maximum Limit vs Engine RPM",
        "category": "Transmission: Rationality & Diagnostics",
        "scaling": "uint8",
        "role": "Upper rationality limit for turbine to engine speed ratio in routine 0x0A45A8 (outputs to RAM 0x80913A).",
        "units": "Speed Ratio"
    },
    0x56BF8: {
        "semantic_name": "Transmission Input Shaft Speed Sensor Rationality High Ceiling vs Engine RPM",
        "category": "Transmission: Rationality & Diagnostics",
        "scaling": "uint8",
        "role": "Upper speed sensor diagnostic ceiling evaluated in routine 0x0A4590 (outputs to RAM 0x808646).",
        "units": "Sensor High Ceiling"
    },
    0x57266: {
        "semantic_name": "Transmission Fluid Temperature Diagnostic Trip Threshold vs Engine RPM",
        "category": "Transmission: Rationality & Diagnostics",
        "scaling": "uint8",
        "role": "Fluid temperature over-temp diagnostic trip threshold evaluated in routine 0x0A5F8C (outputs to RAM 0x808C10).",
        "units": "Temp Threshold"
    },
    0x57BAA: {
        "semantic_name": "Reverse Gear Inhibit Engine Torque Threshold vs Engine RPM",
        "category": "Transmission: Torque Request Arbitration",
        "scaling": "uint8",
        "role": "Maximum allowed engine torque during reverse gear engagement evaluated in routine 0x0AA96C (outputs to RAM 0x808848).",
        "units": "Torque Ceiling"
    },
    0x59E92: {
        "semantic_name": "Transmission CAN Heartbeat Rate Filter Multiplier vs Engine RPM",
        "category": "Transmission: CAN Communication & Diagnostics",
        "scaling": "Percent128",
        "role": "CAN bus message scheduling multiplier for engine-to-transmission heartbeat packets in routine 0x0A0850 (outputs to RAM 0x808BB2).",
        "units": "% Multiplier"
    },
    0x5ACE2: {
        "semantic_name": "TC-SST Clutch 1 Torque Reduction Minimum Floor vs Engine RPM",
        "category": "Transmission: TC-SST Dual Clutch Control",
        "scaling": "uint8",
        "role": "Minimum engine torque limit floor during Clutch 1 (Gears 1/3/5) shift handover in routine 0x0AB964 (outputs to RAM 0x80852E).",
        "units": "Torque Floor"
    },
    0x5ACEE: {
        "semantic_name": "TC-SST Clutch 1 Dynamic Shift Torque Reduction Limit vs Engine RPM",
        "category": "Transmission: TC-SST Dual Clutch Control",
        "scaling": "uint8",
        "role": "Dynamic torque reduction ceiling clamp enforced during Clutch 1 engagement in routine 0x0AB99C (outputs to RAM 0x80852E).",
        "units": "Torque Limit"
    },
    0x5ACFA: {
        "semantic_name": "TC-SST Clutch 2 Slip Target / Pre-Engagement Limit vs Engine RPM",
        "category": "Transmission: TC-SST Dual Clutch Control",
        "scaling": "uint8",
        "role": "Clutch 2 (Gears 2/4/6) slip speed / pre-engagement target clamp evaluated in routine 0x0ABA90 (outputs to RAM 0x808BCC).",
        "units": "Slip Target"
    },
    0x5AD06: {
        "semantic_name": "TC-SST Clutch 2 Torque Reduction Minimum Floor vs Engine RPM",
        "category": "Transmission: TC-SST Dual Clutch Control",
        "scaling": "uint8",
        "role": "Minimum engine torque limit floor during Clutch 2 (Gears 2/4/6) shift handover in routine 0x0ABAD0 (outputs to RAM 0x808530).",
        "units": "Torque Floor"
    },
    0x5AD12: {
        "semantic_name": "TC-SST Clutch 2 Dynamic Shift Torque Reduction Limit vs Engine RPM",
        "category": "Transmission: TC-SST Dual Clutch Control",
        "scaling": "uint8",
        "role": "Dynamic torque reduction ceiling clamp enforced during Clutch 2 engagement in routine 0x0ABB08 (outputs to RAM 0x808530).",
        "units": "Torque Limit"
    },
    0x5AD1E: {
        "semantic_name": "Shift Mode A Engine Torque Scale Factor vs Engine RPM",
        "category": "Transmission: Shift Schedule Maps",
        "scaling": "Percent128",
        "role": "Engine torque scaling factor applied during Shift Program Mode A in routine 0x0AB6FC (nominal 128 / 1.00x).",
        "units": "% Multiplier"
    },
    0x5AD2A: {
        "semantic_name": "Shift Mode A Shift Completion Torque Ramp Rate vs Engine RPM",
        "category": "Transmission: Shift Schedule Maps",
        "scaling": "uint8",
        "role": "Torque restore ramp rate following upshift completion in Shift Program Mode A evaluated in routine 0x0AB70C.",
        "units": "Ramp Rate"
    },
    0x5AD36: {
        "semantic_name": "Shift Mode B Engine Torque Scale Factor vs Engine RPM",
        "category": "Transmission: Shift Schedule Maps",
        "scaling": "Percent128",
        "role": "Engine torque scaling factor applied during Shift Program Mode B (Sport / S-Sport) in routine 0x0AB7BC (nominal 128 / 1.00x).",
        "units": "% Multiplier"
    },
    0x5AD42: {
        "semantic_name": "Shift Mode B Shift Completion Torque Ramp Rate vs Engine RPM",
        "category": "Transmission: Shift Schedule Maps",
        "scaling": "uint8",
        "role": "Torque restore ramp rate following upshift completion in Shift Program Mode B evaluated in routine 0x0AB7CC.",
        "units": "Ramp Rate"
    },
    0x5AD4E: {
        "semantic_name": "TC-SST Clutch 1 Slip Target / Pre-Engagement Limit vs Engine RPM",
        "category": "Transmission: TC-SST Dual Clutch Control",
        "scaling": "uint8",
        "role": "Clutch 1 (Gears 1/3/5) slip speed / pre-engagement target clamp evaluated in routine 0x0AB924 (outputs to RAM 0x808BCA).",
        "units": "Slip Target"
    },
    0x5AD5A: {
        "semantic_name": "Shift Mode A Pre-Shift Torque Floor vs Engine RPM",
        "category": "Transmission: Shift Schedule Maps",
        "scaling": "uint8",
        "role": "Engine torque floor enforced prior to shift initiation under Shift Program Mode A in routine 0x0AB6EC.",
        "units": "Torque Floor"
    },
    0x5AD66: {
        "semantic_name": "Shift Mode B Pre-Shift Torque Floor vs Engine RPM",
        "category": "Transmission: Shift Schedule Maps",
        "scaling": "uint8",
        "role": "Engine torque floor enforced prior to shift initiation under Shift Program Mode B in routine 0x0AB7AC.",
        "units": "Torque Floor"
    },
    0x60048: {
        "semantic_name": "TCM Shift Lockout / Gear Protection Speed Floor vs Engine RPM",
        "category": "Transmission: Rationality & Diagnostics",
        "scaling": "uint8",
        "role": "Minimum engine speed floor for shift lockout protection evaluated in routine 0x0A1794 (outputs to RAM 0x80905E).",
        "units": "Speed Floor"
    }
}

# Update manifest
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

for item in manifest:
    addr = item["address"]
    if addr in cluster10_proven:
        meta = cluster10_proven[addr]
        item["semantic_name"] = meta["semantic_name"]
        item["semantic_category"] = meta["category"]
        item["scaling"] = meta["scaling"]
        item["role"] = meta["role"]
        item["units"] = meta["units"]
        item["confidence"] = "Tier 1: Proven & Fully Decoded"

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"[+] Updated manifest with {len(cluster10_proven)} Cluster 10 tables.")

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
