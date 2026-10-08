#!/usr/bin/env python3
import json
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REF_DIR = TOOLS_DIR.parent / "references"
manifest_path = REF_DIR / "unmapped_table_manifest.json"
xml_path = REF_DIR / "discovered_tables_decoded.xml"

cluster3_proven = {
    0x60EB4: {
        "semantic_name": "Tip-In Accel Enrichment Multiplier vs Delta MAP",
        "category": "Fuel: Transient Acceleration Enrichment",
        "scaling": "Percent128",
        "role": "Scales acceleration enrichment pulse width based on rapid positive manifold pressure spikes (Delta MAP). Centered at 128 (1.000); ramps up to 137 (+7%) on hard throttle stab.",
        "units": "% Multiplier"
    },
    0x60EC0: {
        "semantic_name": "Tip-In Accel Enrichment RPM Taper vs Engine RPM",
        "category": "Fuel: Transient Acceleration Enrichment",
        "scaling": "Percent128",
        "role": "RPM-dependent gain scaling for tip-in acceleration enrichment. Tapers gain down to 87 (-32%) at low RPM to prevent rich bogging and bucking, reaching 128 (100%) above 3000 RPM.",
        "units": "% Multiplier"
    },
    0x5CC68: {
        "semantic_name": "Tip-In Accel Enrichment Base Pulse vs Throttle Angle",
        "category": "Fuel: Transient Acceleration Enrichment",
        "scaling": "uint8",
        "role": "Base transient fuel mass added per cylinder as a function of throttle angle delta. Multiplied by Delta MAP and RPM taper.",
        "units": "raw IPW"
    },
    0x5CC54: {
        "semantic_name": "Tip-In Accel Enrichment Load Floor Clamp vs Engine Load",
        "category": "Fuel: Transient Acceleration Enrichment",
        "scaling": "Percent128",
        "role": "Lower bound clamp on acceleration enrichment fuel mass based on engine load.",
        "units": "Load %"
    },
    0x5AA9C: {
        "semantic_name": "Tip-In Throttle Transient Detection Threshold vs TPS / VSS",
        "category": "Drive-by-Wire: Transient Throttle",
        "scaling": "Percent128",
        "role": "Rate-of-change threshold required to set transient acceleration state flag (0x80888E bit 1), triggering tip-in enrichment and DBW torque management.",
        "units": "% / sec"
    },
    0x5AAB8: {
        "semantic_name": "DBW Throttle Acceleration Damping Ceiling #1 (High Load) vs RPM",
        "category": "Drive-by-Wire: Transient Throttle",
        "scaling": "uint8",
        "role": "Upper slew-rate clamp on throttle plate movement during rapid tip-in under high load (prevents drivetrain snatch).",
        "units": "Slew Limit"
    },
    0x5AACC: {
        "semantic_name": "DBW Throttle Acceleration Damping Ceiling #2 (Low Load) vs RPM",
        "category": "Drive-by-Wire: Transient Throttle",
        "scaling": "uint8",
        "role": "Upper slew-rate clamp on throttle plate movement during partial throttle tip-in under low load.",
        "units": "Slew Limit"
    },
    0x5AAE0: {
        "semantic_name": "DBW Throttle Acceleration Damping Floor #1 (High Load) vs RPM",
        "category": "Drive-by-Wire: Transient Throttle",
        "scaling": "uint8",
        "role": "Lower slew-rate clamp on throttle plate movement during high-load throttle events.",
        "units": "Slew Limit"
    },
    0x5AAF4: {
        "semantic_name": "DBW Throttle Acceleration Damping Floor #2 (Low Load) vs RPM",
        "category": "Drive-by-Wire: Transient Throttle",
        "scaling": "uint8",
        "role": "Lower slew-rate clamp on throttle plate movement during low-load throttle events.",
        "units": "Slew Limit"
    },
    0x5C352: {
        "semantic_name": "DBW Throttle Transient Load Filter Factor vs Engine Load",
        "category": "Drive-by-Wire: Transient Throttle",
        "scaling": "Percent128",
        "role": "Governs the alpha smoothing factor applied to engine load when calculating DBW throttle target angles during transients.",
        "units": "Filter Factor"
    },
    0x50CC6: {
        "semantic_name": "DBW Throttle Transient Slew Derivative Damper vs Engine Load",
        "category": "Drive-by-Wire: Transient Throttle",
        "scaling": "Percent128",
        "role": "Damping multiplier applied to throttle rate-of-change to suppress intake resonance and flutter on rapid throttle stabs.",
        "units": "Damper %"
    },
    0x59A4C: {
        "semantic_name": "Manifold Pressure Sensor Filter Lag Factor vs MAP",
        "category": "Intake & Manifold Pressure Filtering",
        "scaling": "uint8",
        "role": "Dynamic discrete lag filter applied to raw MAP sensor signal. High filtering in vacuum (14 ticks) to smooth idle pulsations; zero filtering in boost (0 ticks) for fast spool response.",
        "units": "Filter Ticks"
    },
    0x5F9D0: {
        "semantic_name": "Wall-Wetting Puddle Retention Factor vs Throttle Angle",
        "category": "Fuel: Wall-Wetting & Port Dynamics",
        "scaling": "Percent128",
        "role": "Fraction of fuel that puddles on the intake port walls vs dynamic throttle angle. Decreases as throttle opens due to increased air velocity.",
        "units": "Puddle %"
    },
    0x5FF96: {
        "semantic_name": "Transient Load Slew Clamp vs Engine Load",
        "category": "Intake & Manifold Pressure Filtering",
        "scaling": "uint8",
        "role": "Clamps the maximum allowable change in calculated engine load per ECU task cycle during rapid spool or tip-in.",
        "units": "Load Delta"
    },
    0x5CCB0: {
        "semantic_name": "Engine RPM Derivative Lag Filter Factor vs Engine RPM",
        "category": "Sensor Filtering: Engine Speed",
        "scaling": "Percent128",
        "role": "Low-pass derivative filter applied to engine RPM acceleration calculations to suppress noise from cam overlap vibrations.",
        "units": "Filter Factor"
    },
    0x5D25E: {
        "semantic_name": "Transient MAP Prediction Primary Decay vs RPM (Gear 1-2)",
        "category": "Speed Density: Transient MAP Prediction",
        "scaling": "uint8",
        "role": "Decay rate of predicted manifold pressure during rapid throttle lifts in low gears (prevents boost spike calculation errors).",
        "units": "Decay Rate"
    },
    0x5D26A: {
        "semantic_name": "Transient MAP Prediction Secondary Decay vs RPM (Gear 3+)",
        "category": "Speed Density: Transient MAP Prediction",
        "scaling": "uint8",
        "role": "Decay rate of predicted manifold pressure during rapid throttle lifts in higher gears.",
        "units": "Decay Rate"
    },
    0x5D252: {
        "semantic_name": "Transient MAP Prediction Lower Bound vs RPM",
        "category": "Speed Density: Transient MAP Prediction",
        "scaling": "uint8",
        "role": "Minimum allowable floor for predicted manifold pressure on throttle tip-out.",
        "units": "kPa"
    },
    0x5D2E6: {
        "semantic_name": "Transient Throttle Slew Limit vs RPM (Gear 1-2)",
        "category": "Drive-by-Wire: Transient Throttle",
        "scaling": "uint8",
        "role": "Limits the maximum rate of throttle blade opening in 1st and 2nd gears to avoid sudden torque shock.",
        "units": "Slew Limit"
    },
    0x5D2F2: {
        "semantic_name": "Transient Throttle Slew Limit vs RPM (Gear 3+)",
        "category": "Drive-by-Wire: Transient Throttle",
        "scaling": "uint8",
        "role": "Limits throttle blade opening rate in 3rd gear and higher.",
        "units": "Slew Limit"
    },
    0x5F750: {
        "semantic_name": "Transient MAP Prediction Primary Decay (Alt Mode) vs RPM",
        "category": "Speed Density: Transient MAP Prediction",
        "scaling": "uint8",
        "role": "Alternate mode decay rate of predicted manifold pressure on rapid throttle transitions.",
        "units": "Decay Rate"
    },
    0x5F744: {
        "semantic_name": "Transient MAP Prediction Lower Bound (Alt Mode) vs RPM",
        "category": "Speed Density: Transient MAP Prediction",
        "scaling": "uint8",
        "role": "Alternate mode floor for predicted manifold pressure.",
        "units": "kPa"
    },
    0x5F83C: {
        "semantic_name": "Transient Throttle Slew Limit (Alt Mode) vs RPM",
        "category": "Drive-by-Wire: Transient Throttle",
        "scaling": "uint8",
        "role": "Alternate mode throttle opening slew rate limit.",
        "units": "Slew Limit"
    },
    0x5EF3A: {
        "semantic_name": "Manifold Pressure Filter Alpha Coefficient vs Engine Load",
        "category": "Intake & Manifold Pressure Filtering",
        "scaling": "Percent128",
        "role": "Alpha weight blending filtered manifold pressure with instantaneous sensor readings as a function of engine load.",
        "units": "Weight %"
    },
    0x5EC42: {
        "semantic_name": "Dynamic Delta MAP Accel Filter Decay Rate vs Engine RPM",
        "category": "Intake & Manifold Pressure Filtering",
        "scaling": "Percent128",
        "role": "Governs how rapidly Delta MAP acceleration spikes decay back to steady-state across engine RPM.",
        "units": "Decay %"
    },
    0x5EC4C: {
        "semantic_name": "Dynamic Delta MAP Acceleration Multiplier vs Delta MAP",
        "category": "Intake & Manifold Pressure Filtering",
        "scaling": "Percent128",
        "role": "Non-linear sensitivity gain applied to rate-of-change in manifold pressure during throttle stabs.",
        "units": "% Gain"
    }
}

# Update manifest
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

for item in manifest:
    addr = item["address"]
    if addr in cluster3_proven:
        meta = cluster3_proven[addr]
        item["semantic_name"] = meta["semantic_name"]
        item["semantic_category"] = meta["category"]
        item["scaling"] = meta["scaling"]
        item["role"] = meta["role"]
        item["units"] = meta["units"]
        item["confidence"] = "Tier 1: Proven & Fully Decoded"

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"[+] Updated manifest with {len(cluster3_proven)} Cluster 3 tables.")

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
