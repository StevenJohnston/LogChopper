#!/usr/bin/env python3
import json
import xml.sax.saxutils as saxutils
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REF_DIR = TOOLS_DIR.parent / "references"
manifest_path = REF_DIR / "unmapped_table_manifest.json"
xml_path = REF_DIR / "discovered_tables_decoded.xml"

cluster6_proven = {
    0x5BDF4: {
        "semantic_name": "Intake MIVEC Cam Lag / Slew Filter Alpha vs Throttle Position / VSS",
        "category": "MIVEC Cam Phasing: Dynamic Slew & Filtering",
        "scaling": "uint8",
        "role": "Low-pass filter alpha and slew rate factor applied to commanded Intake VVT Cam Angle across throttle position / vehicle speed. Controls intake cam advance response speed.",
        "units": "Alpha / 256"
    },
    0x5BE0C: {
        "semantic_name": "Exhaust MIVEC Cam Lag / Slew Filter Alpha vs Throttle Position / VSS",
        "category": "MIVEC Cam Phasing: Dynamic Slew & Filtering",
        "scaling": "uint8",
        "role": "Low-pass filter alpha and slew rate factor applied to commanded Exhaust VVT Cam Angle across throttle position / vehicle speed. Heavily damped (0.03-0.12) to prevent exhaust pulse reversion.",
        "units": "Alpha / 256"
    },
    0x5BE18: {
        "semantic_name": "Intake MIVEC Cam Filter Alpha (Decel Cut) vs Engine RPM",
        "category": "MIVEC Cam Phasing: Dynamic Slew & Filtering",
        "scaling": "uint8",
        "role": "Fixed engine speed filter alpha applied to Intake VVT cam angle while Decel Fuel Cut (DFCO) is active (routine 0x2525C).",
        "units": "Alpha / 256"
    },
    0x5BE00: {
        "semantic_name": "Exhaust MIVEC Cam Filter Alpha (Decel Cut) vs Engine RPM",
        "category": "MIVEC Cam Phasing: Dynamic Slew & Filtering",
        "scaling": "uint8",
        "role": "Fixed engine speed filter alpha applied to Exhaust VVT cam angle while Decel Fuel Cut (DFCO) is active (routine 0x2525C).",
        "units": "Alpha / 256"
    },
    0x5BE24: {
        "semantic_name": "Intake MIVEC Cam Angle Dynamic Blend Weight vs Engine RPM",
        "category": "MIVEC Cam Phasing: Dynamic Slew & Filtering",
        "scaling": "uint8",
        "role": "Engine speed interpolation weight blending between decel intake cam alpha and active-throttle intake cam alpha (ramps 0 to 255 from idle to high RPM).",
        "units": "Weight / 255"
    },
    0x5BE34: {
        "semantic_name": "Intake MIVEC Cam Angle Dynamic Filter Alpha vs Throttle Position / VSS",
        "category": "MIVEC Cam Phasing: Dynamic Slew & Filtering",
        "scaling": "uint8",
        "role": "Dynamic throttle-dependent intake cam filter alpha blended via routine 0x2525C during active driving conditions.",
        "units": "Alpha / 256"
    },
    0x5BE4C: {
        "semantic_name": "Exhaust MIVEC Cam Angle Dynamic Blend Weight vs Engine RPM",
        "category": "MIVEC Cam Phasing: Dynamic Slew & Filtering",
        "scaling": "uint8",
        "role": "Engine speed interpolation weight blending between decel exhaust cam alpha and active-throttle exhaust cam alpha (ramps 0 to 255 from idle to high RPM).",
        "units": "Weight / 255"
    },
    0x5BE40: {
        "semantic_name": "Exhaust MIVEC Cam Angle Dynamic Filter Alpha vs Throttle Position / VSS",
        "category": "MIVEC Cam Phasing: Dynamic Slew & Filtering",
        "scaling": "uint8",
        "role": "Dynamic throttle-dependent exhaust cam filter alpha blended via routine 0x2525C during active driving conditions.",
        "units": "Alpha / 256"
    },
    0x563C6: {
        "semantic_name": "DBW Idle Airflow Offset vs Engine RPM",
        "category": "Drive-by-Wire: Idle Airflow Control",
        "scaling": "uint8",
        "role": "RPM-dependent airflow adder / trim applied to base idle airflow target (routine 0x270E8 / 0x27BA0).",
        "units": "Airflow Offset"
    },
    0x5CC48: {
        "semantic_name": "DBW Idle Airflow Multiplier vs Delta MAP",
        "category": "Drive-by-Wire: Idle Airflow Control",
        "scaling": "Percent128",
        "role": "Transient manifold pressure delta multiplier applied to DBW idle target airflow during rapid throttle / load transitions (centered at 128 / 1.00x).",
        "units": "% Multiplier"
    },
    0x5CC3A: {
        "semantic_name": "DBW Idle Airflow Anti-Stall Multiplier vs Engine RPM",
        "category": "Drive-by-Wire: Idle Airflow Control",
        "scaling": "Percent128",
        "role": "Engine speed anti-stall airflow multiplier. Steps up to 1.55x (+55% airflow) below 700 RPM to catch undershooting idle, tapering to 1.00x at operating speed.",
        "units": "% Multiplier"
    },
    0x5C9BE: {
        "semantic_name": "DBW Throttle Dashpot Airflow Decay Rate vs Engine RPM",
        "category": "Drive-by-Wire: Idle Airflow Control",
        "scaling": "Percent128",
        "role": "Multiplicative rate factor governing how quickly throttle dashpot airflow decays back to base target when lifting off the throttle to idle.",
        "units": "Decay Rate"
    }
}

# Update manifest
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

for item in manifest:
    addr = item["address"]
    if addr in cluster6_proven:
        meta = cluster6_proven[addr]
        item["semantic_name"] = meta["semantic_name"]
        item["semantic_category"] = meta["category"]
        item["scaling"] = meta["scaling"]
        item["role"] = meta["role"]
        item["units"] = meta["units"]
        item["confidence"] = "Tier 1: Proven & Fully Decoded"

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"[+] Updated manifest with {len(cluster6_proven)} Cluster 6 tables.")

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
