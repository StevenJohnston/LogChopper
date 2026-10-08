#!/usr/bin/env python3
"""
update_cluster12_metadata.py - Update Cluster 12 (44 Tables) Metadata & Regenerate XML
Peripheral Diagnostics, EVAP Purge, Secondary O2, Radiator Fans, Misfire Detection & Chassis Dynamics
"""

import json
import xml.sax.saxutils as saxutils
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
REF_DIR = TOOLS_DIR.parent / "references"
manifest_path = REF_DIR / "unmapped_table_manifest.json"
xml_path = REF_DIR / "discovered_tables_decoded.xml"

cluster12_proven = {
    # Subsystem 1: EVAP Purge & Tank Pressure
    0x57D48: {
        "semantic_name": "EVAP Canister Purge Solenoid Baseline Duty vs Purge Airflow",
        "category": "Emissions: EVAP Purge & Vapor Control",
        "scaling": "Percent128",
        "role": "Nominal baseline PWM duty cycle (nominal 64 / 50%) applied to EVAP canister purge solenoid in routine 0x03B0C0 (outputs to RAM 0x80A3EF).",
        "units": "Duty %"
    },
    0x5C16E: {
        "semantic_name": "EVAP Purge Solenoid Flow Scale Multiplier vs Purge Airflow",
        "category": "Emissions: EVAP Purge & Vapor Control",
        "scaling": "uint8",
        "role": "Progressive flow scale multiplier (20 ramping to 30) applied to canister purge volume in routine 0x03D3A4 (outputs to RAM 0x80A578).",
        "units": "Scale Multiplier"
    },
    0x5C85C: {
        "semantic_name": "EVAP Purge Solenoid Minimum Flow Clamp vs Purge Airflow",
        "category": "Emissions: EVAP Purge & Vapor Control",
        "scaling": "uint8",
        "role": "Minimum purge flow threshold floor below which purge is inhibited in routine 0x03D408 (outputs to RAM 0x80A578).",
        "units": "Flow Clamp"
    },
    0x5C302: {
        "semantic_name": "EVAP Small Leak Diagnostic Pressure Delta Lower Threshold vs Tank Pressure",
        "category": "Emissions: EVAP OBD-II Leak Monitor",
        "scaling": "uint8",
        "role": "Lower differential pressure trip threshold for 0.020 inch small leak detection (P0442) in routine 0x03D89C.",
        "units": "Delta Pressure"
    },
    0x5C316: {
        "semantic_name": "EVAP Small Leak Diagnostic Pressure Delta Upper Threshold vs Tank Pressure",
        "category": "Emissions: EVAP OBD-II Leak Monitor",
        "scaling": "uint8",
        "role": "Upper differential pressure abort ceiling for small leak diagnostic test in routine 0x03D8B0 (outputs to RAM 0x80A5A2).",
        "units": "Delta Pressure"
    },
    0x5C32A: {
        "semantic_name": "EVAP Gross Leak Diagnostic Evacuation Pressure Lower Bound vs Tank Pressure",
        "category": "Emissions: EVAP OBD-II Leak Monitor",
        "scaling": "uint8",
        "role": "Vacuum pull-down threshold lower bound required for gross leak check (P0455) in routine 0x03D8F8.",
        "units": "Vacuum Threshold"
    },
    0x5C33E: {
        "semantic_name": "EVAP Gross Leak Diagnostic Evacuation Pressure Upper Bound vs Tank Pressure",
        "category": "Emissions: EVAP OBD-II Leak Monitor",
        "scaling": "uint8",
        "role": "Vacuum pull-down ceiling abort clamp for gross leak check in routine 0x03D90C (outputs to RAM 0x80A5A2).",
        "units": "Vacuum Ceiling"
    },

    # Subsystem 2: Secondary O2 & Catalyst Thermal Model
    0x5722E: {
        "semantic_name": "Rear O2 Sensor Heater PWM Duty (Warm Engine) vs Engine RPM",
        "category": "Emissions: Catalyst & Rear O2 Heater",
        "scaling": "uint8",
        "role": "PWM duty cycle for secondary oxygen sensor heater (255 at idle tapering to 96 at higher RPM) in routine 0x047A5C (outputs to RAM 0x809172).",
        "units": "Duty PWM"
    },
    0x57246: {
        "semantic_name": "Rear O2 Sensor Heater PWM Duty (Cold Warmup) vs Engine RPM",
        "category": "Emissions: Catalyst & Rear O2 Heater",
        "scaling": "uint8",
        "role": "PWM duty cycle for secondary O2 heater during cold engine warmup (255 tapering to 32) in routine 0x047A50 (outputs to RAM 0x809174).",
        "units": "Duty PWM"
    },
    0x5725E: {
        "semantic_name": "Catalytic Converter Light-Off Temperature Target Multiplier vs Engine RPM",
        "category": "Emissions: Catalyst & Rear O2 Heater",
        "scaling": "Percent128",
        "role": "Target thermal model multiplier for catalytic converter rapid warmup in routine 0x04775C (outputs to RAM 0x80918E).",
        "units": "% Multiplier"
    },
    0x57C24: {
        "semantic_name": "Secondary O2 Sensor Rationality Voltage Threshold vs Engine RPM",
        "category": "Emissions: Catalyst & Rear O2 Heater",
        "scaling": "uint8",
        "role": "Rationality voltage threshold floor for catalyst efficiency monitor (P0420) in routine 0x047768 (outputs to RAM 0x809190).",
        "units": "Sensor Voltage"
    },
    0x57212: {
        "semantic_name": "Catalytic Converter Transient Thermal Lag Filter vs Delta MAP",
        "category": "Emissions: Catalyst & Rear O2 Heater",
        "scaling": "uint8",
        "role": "First-order thermal inertia lag filter damping coefficient during transient manifold pressure changes in routine 0x049660 (outputs to RAM 0x8091EC).",
        "units": "Lag Coefficient"
    },

    # Subsystem 3: Radiator Cooling Fan PWM Control
    0x5E638: {
        "semantic_name": "Radiator Cooling Fan PWM Duty (Low-Speed Target) vs Fast ECT",
        "category": "Cooling System: Radiator Fan PWM Control",
        "scaling": "uint8",
        "role": "Engine cooling fan low-speed PWM duty curve evaluated across fast coolant temperature in routine 0x076A78 (outputs to RAM 0x8081E4).",
        "units": "Fan PWM %"
    },
    0x5E646: {
        "semantic_name": "Radiator Cooling Fan PWM Duty (High-Speed Target) vs Fast ECT",
        "category": "Cooling System: Radiator Fan PWM Control",
        "scaling": "uint8",
        "role": "Engine cooling fan high-speed PWM duty curve evaluated across fast coolant temperature in routine 0x076B3C (outputs to RAM 0x8081E8).",
        "units": "Fan PWM %"
    },

    # Subsystem 4: Misfire Detection & Alternator Regulator
    0x5A34A: {
        "semantic_name": "Crankshaft Misfire Inhibit RPM Boundary vs Engine RPM",
        "category": "Diagnostics: Misfire Detection & Crank Speed",
        "scaling": "uint8",
        "role": "Engine speed boundary threshold below which misfire detection is masked in routine 0x08830C (outputs to RAM 0x80AABE).",
        "units": "RPM Boundary"
    },
    0x5A35E: {
        "semantic_name": "Crankshaft Misfire Acceleration Window Low-Limit vs Engine RPM",
        "category": "Diagnostics: Misfire Detection & Crank Speed",
        "scaling": "uint8",
        "role": "Lower acceleration variance floor for crank tooth time windowing in routine 0x084C88 (outputs to RAM 0x80A3BA).",
        "units": "Window Floor"
    },
    0x5A36A: {
        "semantic_name": "Crankshaft Misfire Roughness Normalization Multiplier vs Segment Time",
        "category": "Diagnostics: Misfire Detection & Crank Speed",
        "scaling": "Percent128",
        "role": "Crankshaft tooth segment time normalization multiplier in routine 0x084E88 (outputs to RAM 0x80A39A).",
        "units": "% Multiplier"
    },
    0x5A378: {
        "semantic_name": "Crankshaft Misfire Sector 1 Rationality Threshold vs Segment Time",
        "category": "Diagnostics: Misfire Detection & Crank Speed",
        "scaling": "uint8",
        "role": "Cylinder firing sector 1 tooth time deviation rationality threshold (56 to 71) evaluated in routine 0x084E70.",
        "units": "Threshold"
    },
    0x5A386: {
        "semantic_name": "Crankshaft Misfire Sector 2 Rationality Threshold vs Segment Time",
        "category": "Diagnostics: Misfire Detection & Crank Speed",
        "scaling": "uint8",
        "role": "Cylinder firing sector 2 tooth time deviation rationality threshold (87 to 110) in routine 0x084E78 (outputs to RAM 0x80A39A).",
        "units": "Threshold"
    },
    0x5A394: {
        "semantic_name": "Crankshaft Misfire Sector 3 Rationality Threshold vs Segment Time",
        "category": "Diagnostics: Misfire Detection & Crank Speed",
        "scaling": "uint8",
        "role": "Cylinder firing sector 3 tooth time deviation rationality threshold (77 to 97) in routine 0x084E80 (outputs to RAM 0x80A39A).",
        "units": "Threshold"
    },
    0x5A3A2: {
        "semantic_name": "Crankshaft Misfire Acceleration Window High-Limit vs Engine RPM",
        "category": "Diagnostics: Misfire Detection & Crank Speed",
        "scaling": "uint8",
        "role": "Upper acceleration variance ceiling for misfire diagnostic monitoring in routine 0x084CD8 (outputs to RAM 0x8097C6).",
        "units": "Window Ceiling"
    },
    0x5A3AC: {
        "semantic_name": "Crankshaft Wheel Tooth Pitch Correction Factor vs Segment Time",
        "category": "Diagnostics: Misfire Detection & Crank Speed",
        "scaling": "Percent128",
        "role": "Mechanical reluctor wheel manufacturing tooth-pitch variation correction factor in routine 0x087754 (nominal 143).",
        "units": "Correction Factor"
    },
    0x5A3C2: {
        "semantic_name": "Cylinder 1/4 Misfire Roughness Trip Ceiling vs Engine RPM",
        "category": "Diagnostics: Misfire Detection & Crank Speed",
        "scaling": "uint8",
        "role": "Roughness integration trip ceiling (100 tapering to 70) for Cylinders 1 and 4 in routine 0x08637C (outputs to RAM 0x80AAC9).",
        "units": "Roughness Limit"
    },
    0x5A3D0: {
        "semantic_name": "Cylinder 2/3 Misfire Roughness Trip Ceiling vs Engine RPM",
        "category": "Diagnostics: Misfire Detection & Crank Speed",
        "scaling": "uint8",
        "role": "Roughness integration trip ceiling (150 baseline) for Cylinders 2 and 3 in routine 0x086410 (outputs to RAM 0x80A3BC).",
        "units": "Roughness Limit"
    },
    0x5A3DE: {
        "semantic_name": "Crankshaft Misfire Filter Damping Factor vs Segment Time",
        "category": "Diagnostics: Misfire Detection & Crank Speed",
        "scaling": "uint8",
        "role": "Low-pass filter damping factor (59 baseline) applied to tooth segment velocity in routine 0x084C1C (outputs to RAM 0x80A69F).",
        "units": "Damping Factor"
    },
    0x60018: {
        "semantic_name": "Smart Alternator FR Terminal Target Voltage vs Engine RPM",
        "category": "Electrical: Alternator Regulation & Battery",
        "scaling": "uint8",
        "role": "Alternator field regulation target voltage curve across RPM evaluated in routine 0x088F84 (outputs to RAM 0x804B06).",
        "units": "Voltage Target"
    },
    0x60028: {
        "semantic_name": "Smart Alternator FR Terminal Minimum Field Duty vs Engine RPM",
        "category": "Electrical: Alternator Regulation & Battery",
        "scaling": "uint8",
        "role": "Minimum field coil PWM duty cycle floor across engine speed in routine 0x088F90 (outputs to RAM 0x804B08).",
        "units": "Duty Floor %"
    },
    0x60038: {
        "semantic_name": "Smart Alternator FR Terminal Maximum Field Duty vs Engine RPM",
        "category": "Electrical: Alternator Regulation & Battery",
        "scaling": "uint8",
        "role": "Maximum field coil PWM duty cycle ceiling across engine speed in routine 0x088F9C (outputs to RAM 0x804B0A).",
        "units": "Duty Ceiling %"
    },
    0x5F95E: {
        "semantic_name": "Battery Current Sensor Diagnostic Rationality Filter vs Battery Current",
        "category": "Electrical: Alternator Regulation & Battery",
        "scaling": "uint8",
        "role": "Battery current sensor diagnostic threshold (65 to 90) evaluated in routine 0x0990C0 (outputs to RAM 0x8087C6).",
        "units": "Current Filter"
    },

    # Subsystem 5: Chassis Dynamics, CAN Gateway & S-AWC Sensor Conditioning
    0x63C58: {
        "semantic_name": "Longitudinal G-Sensor Deadband Filter vs Raw Acceleration",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "uint8",
        "role": "Deadband noise rejection threshold (8 to 10) for longitudinal G-sensor in routine 0x06CF2C (outputs to RAM 0x809D24).",
        "units": "Deadband"
    },
    0x63C6C: {
        "semantic_name": "Longitudinal G-Sensor Linearization Curve vs Raw Acceleration",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "uint8",
        "role": "Linearization scaling curve (78 to 108) applied to longitudinal G-sensor in routine 0x06D2D0 (outputs to RAM 0x8086A2).",
        "units": "Scaled G"
    },
    0x63C76: {
        "semantic_name": "Yaw Rate Sensor Gain Scale Factor vs Raw Sensor Value",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "Percent128",
        "role": "Gain scale factor (142 down to 128 / 1.00x) applied to yaw rate sensor in routine 0x06D304 (outputs to RAM 0x804DBE).",
        "units": "% Multiplier"
    },
    0x64122: {
        "semantic_name": "Yaw Rate Sensor Thermal Drift Offset vs Raw Sensor Value",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "uint8",
        "role": "Zero-point thermal drift compensation offset curve (249 down to 239) in routine 0x06EAE4 (outputs to RAM 0x809E68).",
        "units": "Offset"
    },
    0x6424E: {
        "semantic_name": "Vehicle Dynamics CAN Gateway Transmit Rate vs Dynamics State",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "uint8",
        "role": "CAN bus frame broadcast scheduling rate (nominal 255) for chassis dynamics in routine 0x06FD34 (outputs to RAM 0x809F9C).",
        "units": "Tx Rate"
    },
    0x645AC: {
        "semantic_name": "S-AWC Longitudinal Torque Request Scale vs Acceleration",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "Percent128",
        "role": "Torque request scale factor (nominal 128 / 1.00x) broadcast to S-AWC ACD controller in routine 0x070C64 (outputs to RAM 0x80A008).",
        "units": "% Multiplier"
    },
    0x645CC: {
        "semantic_name": "S-AWC Center Differential Pre-Torque Factor vs Acceleration",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "Percent128",
        "role": "Center differential pre-lock torque multiplier (nominal 96 / 0.75x) broadcast to ACD in routine 0x070CC8 (outputs to RAM 0x80A00C).",
        "units": "% Multiplier"
    },
    0x645EC: {
        "semantic_name": "Chassis Roll Compensation Offset vs Acceleration",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "uint8",
        "role": "Body roll angle compensation offset (0 to 79) evaluated in routine 0x06D3B8 (outputs to RAM 0x808BB8).",
        "units": "Roll Offset"
    },
    0x645FA: {
        "semantic_name": "Vehicle Dynamics Failsafe State Trigger Floor vs Dynamics State",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "uint8",
        "role": "Chassis stability failsafe trip floor evaluated in routine 0x06EDCC (outputs to RAM 0x809F64).",
        "units": "Floor"
    },
    0x64DAC: {
        "semantic_name": "Steering Wheel Angle Rate Scale Factor vs Raw Steering Input",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "Percent128",
        "role": "Steering wheel angular velocity scale factor (nominal 128 / 1.00x) in routine 0x073478 (outputs to RAM 0x80A1E0).",
        "units": "% Multiplier"
    },
    0x64DCC: {
        "semantic_name": "Steering Wheel Angle Sensor CAN Heartbeat Timeout Limit",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "uint8",
        "role": "CAN bus watchdog timeout limit (255) for steering angle sensor (SAS) in routine 0x072940 (outputs to RAM 0x80A21C).",
        "units": "Timeout"
    },
    0x64DE0: {
        "semantic_name": "Lateral G-Sensor Deadband Filter vs Raw Acceleration",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "uint8",
        "role": "Deadband noise rejection threshold (8 to 10) for lateral G-sensor in routine 0x071118.",
        "units": "Deadband"
    },
    0x64DF4: {
        "semantic_name": "Lateral G-Sensor Linearization Curve vs Raw Acceleration",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "uint8",
        "role": "Linearization scaling curve (78 to 108) applied to lateral G-sensor in routine 0x0713C8 (outputs to RAM 0x80A1BC).",
        "units": "Scaled G"
    },
    0x64DFE: {
        "semantic_name": "Steering Angle Yaw Rate Compensation Gain vs Raw Sensor Value",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "Percent128",
        "role": "Steering angle cross-compensation gain for yaw rate (142 down to 128) in routine 0x0713F0 (outputs to RAM 0x80A088).",
        "units": "% Multiplier"
    },
    0x64F68: {
        "semantic_name": "Lateral G-Sensor Thermal Drift Offset vs Raw Sensor Value",
        "category": "Chassis Dynamics & S-AWC Gateway",
        "scaling": "uint8",
        "role": "Zero-point thermal drift compensation offset curve (249 down to 239) for lateral G in routine 0x071D0C (outputs to RAM 0x80A178).",
        "units": "Offset"
    }
}

# Update manifest
with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

for item in manifest:
    addr = item["address"]
    if addr in cluster12_proven:
        meta = cluster12_proven[addr]
        item["semantic_name"] = meta["semantic_name"]
        item["semantic_category"] = meta["category"]
        item["scaling"] = meta["scaling"]
        item["role"] = meta["role"]
        item["units"] = meta["units"]
        item["confidence"] = "Tier 1: Proven & Fully Decoded"

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"[+] Updated manifest with {len(cluster12_proven)} Cluster 12 tables.")

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
