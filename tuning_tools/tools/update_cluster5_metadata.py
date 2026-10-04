#!/usr/bin/env python3
import json
import xml.sax.saxutils as saxutils
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REF_DIR = TOOLS_DIR.parent / "references"
manifest_path = REF_DIR / "unmapped_table_manifest.json"
xml_path = REF_DIR / "discovered_tables_decoded.xml"

cluster5_proven = {
    0x5D644: {
        "semantic_name": "Decel Fuel Cut (DFCO) RPM Reactivation Delay Trigger Threshold vs Engine RPM",
        "category": "Fuel: Decel Fuel Cut-Off (DFCO)",
        "scaling": "uint8",
        "role": "Engine speed threshold below which the DFCO injector reactivation delay down-counter is armed.",
        "units": "RPM / raw"
    },
    0x5D656: {
        "semantic_name": "Decel Fuel Cut (DFCO) RPM Recovery Threshold Lower Bound vs Engine RPM",
        "category": "Fuel: Decel Fuel Cut-Off (DFCO)",
        "scaling": "uint8",
        "role": "Lower boundary of the engine speed interpolation window for restoring injector pulses during deceleration.",
        "units": "RPM / raw"
    },
    0x5D668: {
        "semantic_name": "Decel Fuel Cut (DFCO) RPM Recovery Threshold Upper Bound vs Engine RPM",
        "category": "Fuel: Decel Fuel Cut-Off (DFCO)",
        "scaling": "uint8",
        "role": "Upper boundary of the engine speed interpolation window for restoring injector pulses during deceleration.",
        "units": "RPM / raw"
    },
    0x5D67A: {
        "semantic_name": "Decel Fuel Cut (DFCO) Injector Reactivation Delay Cycles vs Engine RPM",
        "category": "Fuel: Decel Fuel Cut-Off (DFCO)",
        "scaling": "uint8",
        "role": "Number of ECU loop cycles (multiplied by 4) to delay injector reactivation after RPM falls below the recovery trigger.",
        "units": "Cycles"
    },
    0x57D68: {
        "semantic_name": "Decel Fuel Cut (DFCO) Cut-Off Lower Hysteresis Threshold vs Engine RPM",
        "category": "Fuel: Decel Fuel Cut-Off (DFCO)",
        "scaling": "uint8",
        "role": "Lower engine speed hysteresis threshold for the master DFCO latch (bit 0x80 of RAM 0x808878). RPM dropping below this clears fuel cut.",
        "units": "RPM / raw"
    },
    0x57D7A: {
        "semantic_name": "Decel Fuel Cut (DFCO) Cut-Off Upper Hysteresis Threshold vs Engine RPM",
        "category": "Fuel: Decel Fuel Cut-Off (DFCO)",
        "scaling": "uint8",
        "role": "Upper engine speed hysteresis threshold for the master DFCO latch (bit 0x80 of RAM 0x808878). RPM rising above this arms fuel cut.",
        "units": "RPM / raw"
    },
    0x5A5E4: {
        "semantic_name": "Overboost Fuel Cut Load Offset vs Engine RPM",
        "category": "Fuel: Boost Limiter & Fuel Cut",
        "scaling": "uint8",
        "role": "Engine-speed-dependent load offset added to base fuel cut load ceiling (RAM 0x80A7EA) in routine 0x1C29C before triggering overboost fuel cut.",
        "units": "Load %"
    },
    0x5F604: {
        "semantic_name": "Decel Fuel Cut Load Inhibit Ceiling vs Engine RPM",
        "category": "Fuel: Decel Fuel Cut-Off (DFCO)",
        "scaling": "uint8",
        "role": "Engine load threshold (divided by 4) above which decel fuel cut is inhibited and injector firing is forced ON.",
        "units": "Load % / 4"
    },
    0x5F736: {
        "semantic_name": "Decel Fuel Cut Injector Recovery Delay Cycles vs Engine RPM",
        "category": "Fuel: Decel Fuel Cut-Off (DFCO)",
        "scaling": "uint8",
        "role": "Loop counter loaded into RAM 0x80A950 upon fuel cut activation, decremented each loop upon recovery before fuel delivery resumes.",
        "units": "Cycles"
    },
    0x555EE: {
        "semantic_name": "High-Speed Fuel Cut Recovery RPM Threshold (A/C Active) vs Engine RPM",
        "category": "Fuel: High-Speed & Decel Fuel Cut",
        "scaling": "uint8",
        "role": "High-speed recovery engine speed threshold evaluated in routine 0x1D340 when A/C accessory load is engaged (RAM 0x808646 bit 0x20).",
        "units": "RPM / raw"
    },
    0x55606: {
        "semantic_name": "High-Speed Fuel Cut Recovery RPM Threshold (A/C Inactive) vs Engine RPM",
        "category": "Fuel: High-Speed & Decel Fuel Cut",
        "scaling": "uint8",
        "role": "High-speed recovery engine speed threshold evaluated in routine 0x1D340 when A/C is inactive.",
        "units": "RPM / raw"
    },
    0x5571A: {
        "semantic_name": "Decel Fuel Cut Recovery Pulse Width Multiplier vs Engine RPM",
        "category": "Fuel: Decel Fuel Cut Recovery",
        "scaling": "Percent128",
        "role": "Multiplier applied to calculated injection pulse width during transition out of decel fuel cut (routine 0x2463C / 0x24718) to smooth engine re-engagement.",
        "units": "% Multiplier"
    },
    0x55832: {
        "semantic_name": "Decel Fuel Cut Vehicle Speed Threshold (In-Gear) vs Throttle Angle",
        "category": "Fuel: Decel Fuel Cut Thresholds",
        "scaling": "uint8",
        "role": "Minimum vehicle speed threshold required to maintain decel fuel cut when in-gear, preventing low-speed driveline bucking.",
        "units": "km/h / raw"
    },
    0x571D8: {
        "semantic_name": "Decel Fuel Cut Vehicle Speed Threshold (Neutral / Clutch Depressed) vs Throttle Angle",
        "category": "Fuel: Decel Fuel Cut Thresholds",
        "scaling": "uint8",
        "role": "Minimum vehicle speed threshold required to maintain decel fuel cut when neutral or clutch is depressed.",
        "units": "km/h / raw"
    },
    0x57BC4: {
        "semantic_name": "Decel Fuel Cut Reactivation Delay Timer vs Fast ECT",
        "category": "Fuel: Decel Fuel Cut Timers",
        "scaling": "uint8",
        "role": "Coolant-temperature-dependent delay duration (multiplied by 20 ticks) enforced before fuel delivery is restored upon exiting DFCO.",
        "units": "Ticks (x20)"
    },
    0x60EEE: {
        "semantic_name": "Decel Fuel Cut Dynamic Load Threshold vs Engine Load",
        "category": "Fuel: Decel Fuel Cut-Off (DFCO)",
        "scaling": "uint8",
        "role": "Dynamic filtered load threshold evaluated in routine 0x1AFB4 establishing the entry load floor for decel fuel cut.",
        "units": "Load %"
    }
}

# Update manifest
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

for item in manifest:
    addr = item["address"]
    if addr in cluster5_proven:
        meta = cluster5_proven[addr]
        item["semantic_name"] = meta["semantic_name"]
        item["semantic_category"] = meta["category"]
        item["scaling"] = meta["scaling"]
        item["role"] = meta["role"]
        item["units"] = meta["units"]
        item["confidence"] = "Tier 1: Proven & Fully Decoded"

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"[+] Updated manifest with {len(cluster5_proven)} Cluster 5 tables.")

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
