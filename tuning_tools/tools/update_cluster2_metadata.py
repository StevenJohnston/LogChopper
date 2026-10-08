#!/usr/bin/env python3
import json
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REF_DIR = TOOLS_DIR.parent / "references"
manifest_path = REF_DIR / "unmapped_table_manifest.json"
xml_path = REF_DIR / "discovered_tables_decoded.xml"

cluster2_proven = {
    0x57066: {
        "semantic_name": "Open Loop Load Low Throttle Switch Threshold vs TPS",
        "category": "Fuel: Open Loop Fueling Triggers",
        "scaling": "Percent128",
        "role": "Governs the engine load threshold required to transition from closed loop (14.7 AFR) to open loop enrichment under low/partial throttle tip-in.",
        "units": "Load %"
    },
    0x57072: {
        "semantic_name": "Open Loop Load High Throttle Switch Threshold vs TPS",
        "category": "Fuel: Open Loop Fueling Triggers",
        "scaling": "Percent128",
        "role": "Governs the engine load threshold required to enter open loop enrichment under aggressive throttle openings.",
        "units": "Load %"
    },
    0x57138: {
        "semantic_name": "High RPM Fuel Target Enrichment Multiplier #1 vs RPM",
        "category": "Fuel: Target AFR Enrichments",
        "scaling": "Percent128",
        "role": "Applies a multiplicative top-end fuel enrichment scaler above 5000 RPM (scales up to +7% additional fuel on high-load pulls).",
        "units": "% Multiplier"
    },
    0x5714C: {
        "semantic_name": "High RPM Fuel Target Enrichment Multiplier #2 vs RPM",
        "category": "Fuel: Target AFR Enrichments",
        "scaling": "Percent128",
        "role": "Secondary high-RPM enrichment multiplier applied to channel 2 / alternate maps.",
        "units": "% Multiplier"
    },
    0x5719A: {
        "semantic_name": "Post-Start Warmup Fuel Enrichment Scaling vs RPM",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "Percent128",
        "role": "Scales the base coolant-temperature warmup enrichment adder across engine RPM (currently 128 / 1.000 neutral across all bins).",
        "units": "% Multiplier"
    },
    0x5AD72: {
        "semantic_name": "Cold-Start Target AFR Enrichment Floor Clamp (A/C ON) vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "Percent128",
        "role": "Enforces a rich target AFR ceiling when ECT is cold with A/C compressor active (prevents cold lean surge during warm-up).",
        "units": "%"
    },
    0x5AD80: {
        "semantic_name": "Cold-Start Target AFR Enrichment Floor Clamp (A/C OFF) vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "Percent128",
        "role": "Enforces a rich target AFR ceiling when ECT is cold with A/C compressor OFF.",
        "units": "%"
    },
    0x5AD8E: {
        "semantic_name": "Fuel Enrichment Transient Delay Threshold vs RPM",
        "category": "Fuel: Transient Fueling",
        "scaling": "uint8",
        "role": "Governs cycle delay and state transition threshold before open-loop enrichment multiplier takes effect.",
        "units": "raw"
    },
    0x5BFB4: {
        "semantic_name": "Post-Start Warmup Fuel Decay Interval #1 vs RPM",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Engine cycle decrement interval for primary warmup fuel enrichment. Decreases from 30 to 23 cycles as RPM increases to accelerate decay.",
        "units": "Engine Cycles"
    },
    0x5BFEC: {
        "semantic_name": "Post-Start Warmup Fuel Decay Interval #2 vs RPM",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Secondary stage engine cycle decrement interval for primary warmup fuel enrichment (20 down to 13 cycles).",
        "units": "Engine Cycles"
    },
    0x5BFD0: {
        "semantic_name": "Post-Start Warmup Fuel Decay Interval #1 (Alternate) vs RPM",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Engine cycle decrement interval for warmup fuel enrichment under alternate state conditions.",
        "units": "Engine Cycles"
    },
    0x5C008: {
        "semantic_name": "Post-Start Warmup Fuel Decay Interval #2 (Alternate) vs RPM",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Secondary stage decrement interval for alternate warmup mode.",
        "units": "Engine Cycles"
    },
    0x5BFC2: {
        "semantic_name": "Secondary Warmup Fuel Decay Interval #1 vs RPM",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Engine cycle decrement interval for secondary thermal enrichment channel (23 cycles).",
        "units": "Engine Cycles"
    },
    0x5BFFA: {
        "semantic_name": "Secondary Warmup Fuel Decay Interval #2 vs RPM",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Secondary stage decrement interval for secondary thermal enrichment channel (13 cycles).",
        "units": "Engine Cycles"
    }
}

with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

for item in manifest:
    addr = item["address"]
    if addr in cluster2_proven:
        meta = cluster2_proven[addr]
        item["semantic_name"] = meta["semantic_name"]
        item["semantic_category"] = meta["category"]
        item["scaling"] = meta["scaling"]
        item["role"] = meta["role"]
        item["units"] = meta["units"]
        item["confidence"] = "Tier 1: Proven & Fully Decoded"

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print("[+] Updated unmapped_table_manifest.json with Cluster 2 metadata.")

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
    if addr_val in cluster2_proven:
        meta = cluster2_proven[addr_val]
        sem_name = meta["semantic_name"]
        cat_name = meta["category"]
        sc_name = meta["scaling"]
        role = meta["role"]
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
