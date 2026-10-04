#!/usr/bin/env python3
import json
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REF_DIR = TOOLS_DIR.parent / "references"
manifest_path = REF_DIR / "unmapped_table_manifest.json"
xml_path = REF_DIR / "discovered_tables_decoded.xml"

cluster1_proven = {
    0x556B0: {
        "semantic_name": "Post-Start Warmup Fuel Enrichment (A/C ON) vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Master coolant-temperature-dependent fuel enrichment adder applied immediately following engine crank with A/C active. Ramps from 154 at -30°C down to 16 at operating temp.",
        "units": "Adder"
    },
    0x556BE: {
        "semantic_name": "Post-Start Initial Flare Fuel Enrichment vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Initial peak fuel enrichment adder applied during the first 1-2 seconds of start flare.",
        "units": "Adder"
    },
    0x571AE: {
        "semantic_name": "Warmup Fuel Enrichment Decay Interval vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Loop interval before post-start warmup fuel begins decaying. 255 loops in deep cold down to 19 loops at warm operating temperature.",
        "units": "Loops"
    },
    0x5BD64: {
        "semantic_name": "Secondary Warmup Fuel Enrichment Adder vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Secondary coolant temperature fuel enrichment adder applied across warmup stages.",
        "units": "Adder"
    },
    0x5BD72: {
        "semantic_name": "Secondary Warmup Fuel Decay Interval vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Loop interval governing decay of secondary warmup fuel enrichment.",
        "units": "Loops"
    },
    0x5BD80: {
        "semantic_name": "Individual Cylinder Cold Warmup Trim (Cylinder 1) vs ECT",
        "category": "Fuel: Per-Cylinder Trims",
        "scaling": "uint8",
        "role": "Cylinder 1 specific coolant-temperature fuel compensation trim during warmup (44 at cold down to 20 warm).",
        "units": "Trim"
    },
    0x5BD8E: {
        "semantic_name": "Individual Cylinder Cold Warmup Trim (Cylinder 2) vs ECT",
        "category": "Fuel: Per-Cylinder Trims",
        "scaling": "uint8",
        "role": "Cylinder 2 specific coolant-temperature fuel compensation trim during warmup (44 at cold down to 20 warm).",
        "units": "Trim"
    },
    0x5BD9C: {
        "semantic_name": "Individual Cylinder Cold Warmup Trim (Cylinder 3) vs ECT",
        "category": "Fuel: Per-Cylinder Trims",
        "scaling": "uint8",
        "role": "Cylinder 3 specific coolant-temperature fuel compensation trim during warmup (17 at cold down to 4 warm).",
        "units": "Trim"
    },
    0x5BDAA: {
        "semantic_name": "Individual Cylinder Cold Warmup Trim (Cylinder 4) vs ECT",
        "category": "Fuel: Per-Cylinder Trims",
        "scaling": "uint8",
        "role": "Cylinder 4 specific coolant-temperature fuel compensation trim during warmup (17 at cold down to 4 warm).",
        "units": "Trim"
    },
    0x571BC: {
        "semantic_name": "Post-Start Fuel Trim Hold Duration #1 vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Hold duration before transition from primary flare to steady-state warmup.",
        "units": "Loops"
    },
    0x571E4: {
        "semantic_name": "Post-Start Fuel Trim Hold Duration #2 vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Secondary stage hold duration for post-start fuel enrichment.",
        "units": "Loops"
    },
    0x571CA: {
        "semantic_name": "Post-Start Fuel Trim Decay Step Decrement vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Subtractive decrement subtracted from warmup enrichment per decay interval.",
        "units": "Step"
    },
    0x5BF52: {
        "semantic_name": "Auxiliary Warmup Fuel Enrichment Scaler #1 vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Auxiliary coolant temperature scaling factor for fast warmup control.",
        "units": "Scaler"
    },
    0x5BF6E: {
        "semantic_name": "Auxiliary Warmup Fuel Enrichment Scaler #2 vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Auxiliary coolant temperature scaling factor for fast warmup control.",
        "units": "Scaler"
    },
    0x5BF60: {
        "semantic_name": "Auxiliary Warmup Fuel Decay Step #1 vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Decay step decrement for auxiliary warmup fuel enrichment channel.",
        "units": "Step"
    },
    0x5BF7C: {
        "semantic_name": "Auxiliary Warmup Fuel Decay Step #2 vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Decay step decrement for auxiliary warmup fuel enrichment channel.",
        "units": "Step"
    },
    0x5BF8A: {
        "semantic_name": "Auxiliary Warmup Fuel Hold Timer #1 vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Hold timer interval before auxiliary decay begins.",
        "units": "Loops"
    },
    0x5BF98: {
        "semantic_name": "Auxiliary Warmup Fuel Hold Timer #2 vs ECT",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Hold timer interval before auxiliary decay begins.",
        "units": "Loops"
    },
    0x59EA0: {
        "semantic_name": "Post-Start Fuel Decay Step Threshold #1 (A/C ON) vs RPM",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Engine cycle decrement threshold for primary post-start fuel decay with A/C active (30 down to 23 cycles).",
        "units": "Engine Cycles"
    },
    0x59EBC: {
        "semantic_name": "Post-Start Fuel Decay Step Threshold #2 (A/C ON) vs RPM",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Secondary stage engine cycle decrement threshold with A/C active (20 down to 13 cycles).",
        "units": "Engine Cycles"
    },
    0x59EAE: {
        "semantic_name": "Post-Start Fuel Decay Step Threshold #1 (A/C OFF) vs RPM",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Engine cycle decrement threshold for primary post-start fuel decay with A/C OFF (30 down to 23 cycles).",
        "units": "Engine Cycles"
    },
    0x59ECA: {
        "semantic_name": "Post-Start Fuel Decay Step Threshold #2 (A/C OFF) vs RPM",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Secondary stage engine cycle decrement threshold with A/C OFF (20 down to 13 cycles).",
        "units": "Engine Cycles"
    },
    0x5BFA6: {
        "semantic_name": "Secondary Warmup Fuel Decay Threshold #1 vs RPM",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Engine cycle decrement threshold for secondary warmup fuel channel (23 cycles).",
        "units": "Engine Cycles"
    },
    0x5BFDE: {
        "semantic_name": "Secondary Warmup Fuel Decay Threshold #2 vs RPM",
        "category": "Fuel: Cold Start & Warmup Enrichments",
        "scaling": "uint8",
        "role": "Secondary stage decrement threshold for secondary warmup fuel channel (13 cycles).",
        "units": "Engine Cycles"
    },
    0x5BB3E: {
        "semantic_name": "Engine Cranking Fuel Pulse Width Ceiling vs RPM",
        "category": "Fuel: Cranking & Starting",
        "scaling": "uint8",
        "role": "Hard upper bound clamp on injector pulse width during starter cranking to prevent plug wetting and flooding.",
        "units": "Max IPW"
    },
    0x558E8: {
        "semantic_name": "Engine Start-Up / Run State Transition RPM Threshold",
        "category": "Fuel: Cranking & Starting",
        "scaling": "uint8",
        "role": "RPM threshold boundary separating starter-cranking injection logic from running-engine fuel calculation.",
        "units": "RPM Threshold"
    },
    0x558C0: {
        "semantic_name": "Engine Start Flare Fuel Taper Step vs RPM",
        "category": "Fuel: Cranking & Starting",
        "scaling": "uint8",
        "role": "Subtractive step decrement applied to post-crank fuel pulse width as RPM climbs through initial flare (20 down to 3).",
        "units": "Step"
    },
    0x558D4: {
        "semantic_name": "Engine Start Flare Decay Timer Interval vs RPM",
        "category": "Fuel: Cranking & Starting",
        "scaling": "uint8",
        "role": "Loop interval before start flare fuel taper steps are executed.",
        "units": "Loops"
    },
    0x5D4D4: {
        "semantic_name": "Closed Loop IPW Error Threshold High vs RPM",
        "category": "Fuel: Closed Loop Feedback",
        "scaling": "uint8",
        "role": "Upper bound error tolerance on closed-loop injector pulse width before setting correction flags.",
        "units": "Error %"
    },
    0x5D4E2: {
        "semantic_name": "Closed Loop IPW Error Threshold Low vs RPM",
        "category": "Fuel: Closed Loop Feedback",
        "scaling": "uint8",
        "role": "Lower bound error tolerance on closed-loop injector pulse width.",
        "units": "Error %"
    },
    0x60BFA: {
        "semantic_name": "Closed Loop STFT Fuel Trim Accumulator Update Rate vs RPM",
        "category": "Fuel: Closed Loop Feedback",
        "scaling": "uint8",
        "role": "Update frequency rate for closed-loop short term fuel trim (STFT) accumulation across RPM. Drops to 0 above 5000 RPM to lock out feedback.",
        "units": "Rate"
    }
}

# Update manifest
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

for item in manifest:
    addr = item["address"]
    if addr in cluster1_proven:
        meta = cluster1_proven[addr]
        item["semantic_name"] = meta["semantic_name"]
        item["semantic_category"] = meta["category"]
        item["scaling"] = meta["scaling"]
        item["role"] = meta["role"]
        item["units"] = meta["units"]
        item["confidence"] = "Tier 1: Proven & Fully Decoded"

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"[+] Updated manifest with {len(cluster1_proven)} Cluster 1 tables.")

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
