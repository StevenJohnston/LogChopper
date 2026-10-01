#!/usr/bin/env python3
"""
export_ghidra_symbols.py - Evo X ECU XML to Ghidra & IDA Symbol Exporter

Parses EcuFlash / RomRaider XML definitions (base and vehicle specific)
and generates:
1. A Ghidra Python script (for Ghidra Script Manager / headless analysis)
2. A CSV symbol table (address, name, type, units, dimensions)
3. An IDA Pro Python script (.py)

This allows reverse-engineers to load a raw 1MB Evo X ROM into Ghidra/IDA
and instantly have all 500+ calibration tables, axes, and RAM addresses labeled.
"""

import sys
import os
import re
import csv
import xml.etree.ElementTree as ET
from pathlib import Path


def clean_symbol_name(name: str) -> str:
    """Sanitize table/symbol name for use as a programming identifier/label."""
    # Remove unwanted special characters, replace spaces with underscores
    clean = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    clean = re.sub(r'_+', '_', clean).strip('_')
    if clean and clean[0].isdigit():
        clean = "tbl_" + clean
    return clean or "symbol"


def parse_xml_definitions(xml_paths):
    """Parse multiple XML files and extract tables, scalings, and memory symbols."""
    scalings = {}
    tables = {}
    ram_addresses = {}

    for path in xml_paths:
        if not os.path.exists(path):
            continue
        try:
            tree = ET.parse(path)
            root = tree.getroot()
        except Exception as e:
            print(f"[-] Error parsing {path}: {e}", file=sys.stderr)
            continue

        # Extract scalings
        for sc in root.findall(".//scaling"):
            sc_name = sc.attrib.get("name")
            if sc_name:
                scalings[sc_name] = {
                    "units": sc.attrib.get("units", ""),
                    "storagetype": sc.attrib.get("storagetype", "uint8"),
                    "endian": sc.attrib.get("endian", "big"),
                    "toexpr": sc.attrib.get("toexpr", ""),
                }

        # Extract tables
        for tbl in root.findall(".//table"):
            name = tbl.attrib.get("name")
            addr_str = tbl.attrib.get("address")
            if not addr_str:
                continue

            try:
                addr = int(addr_str, 16)
            except ValueError:
                continue

            scaling_name = tbl.attrib.get("scaling", "")
            sc_info = scalings.get(scaling_name, {})

            # Table type / dimensions
            sub_tables = tbl.findall("table")
            dims = []
            for sub in sub_tables:
                sub_name = sub.attrib.get("name", "Axis")
                sub_addr_str = sub.attrib.get("address")
                sub_elements = sub.attrib.get("elements")
                if sub_addr_str:
                    try:
                        sub_addr = int(sub_addr_str, 16)
                        # Add sub-table (axis) as its own symbol
                        sub_sym = f"{name}_{sub_name}_Axis"
                        if sub_addr not in tables:
                            tables[sub_addr] = {
                                "name": sub_sym,
                                "type": "Axis",
                                "scaling": sub.attrib.get("scaling", ""),
                                "units": "",
                                "storagetype": "uint16",
                                "raw_name": f"{name} ({sub_name} Axis)"
                            }
                    except ValueError:
                        pass
                dims.append(sub_name)

            table_type = f"{len(dims)}D Map" if dims else "Parameter/1D"
            tables[addr] = {
                "name": name,
                "type": table_type,
                "scaling": scaling_name,
                "units": sc_info.get("units", ""),
                "storagetype": sc_info.get("storagetype", "uint8"),
                "raw_name": name,
            }

    return scalings, tables


def generate_ghidra_script(tables, output_path):
    """Generate a Ghidra Python script to create labels and bookmarks."""
    lines = [
        "# Ghidra Auto-Symbol Importer for Mitsubishi Evo X (M32R) ROM",
        "# Generated automatically from EcuFlash XML definitions",
        "# Run via Ghidra Script Manager: Script Manager -> Run",
        "",
        "from ghidra.program.model.symbol import SourceType",
        "from ghidra.program.model.data import ByteDataType, WordDataType, DWordDataType",
        "",
        "listing = currentProgram.getListing()",
        "sym_table = currentProgram.getSymbolTable()",
        "dt_manager = currentProgram.getDataTypeManager()",
        "",
        "symbols = ["
    ]

    for addr in sorted(tables.keys()):
        info = tables[addr]
        label = clean_symbol_name(info["name"])
        raw_name = info["raw_name"].replace('"', '\\"')
        units = info["units"]
        stype = info["storagetype"]
        comment = f"{raw_name} [{info['type']}] ({units})".strip()
        lines.append(f'    (0x{addr:06X}, "{label}", "{comment}", "{stype}"),')

    lines.extend([
        "]",
        "",
        "count = 0",
        "for addr_int, label, comment, stype in symbols:",
        "    try:",
        "        addr = toAddr(addr_int)",
        "        sym_table.createLabel(addr, label, SourceType.USER_DEFINED)",
        "        setPlateComment(addr, comment)",
        "        count += 1",
        "    except Exception as e:",
        "        print('Failed to label 0x%X: %s' % (addr_int, e))",
        "",
        "print('Successfully created %d Evo X symbols in Ghidra.' % count)",
    ])

    with open(output_path, "w") as f:
        f.write("\n".join(lines) + "\n")
    print(f"[+] Ghidra script generated: {output_path}")


def generate_ghidra_java_script(tables, output_path):
    """Generate a native Ghidra Java script to create labels and plate comments."""
    lines = [
        "// Ghidra Auto-Symbol Importer for Mitsubishi Evo X (M32R) ROM",
        "// @category Automotive.EvoX",
        "// @keybinding",
        "// @menupath Tools.EvoX.ImportSymbols",
        "// @toolbar",
        "",
        "import ghidra.app.script.GhidraScript;",
        "import ghidra.program.model.symbol.SourceType;",
        "import ghidra.program.model.symbol.SymbolTable;",
        "import ghidra.program.model.address.Address;",
        "",
        "public class GhidraImportEvo10Symbols extends GhidraScript {",
        "    private static class SymbolDef {",
        "        long addr;",
        "        String label;",
        "        String comment;",
        "        SymbolDef(long a, String l, String c) {",
        "            this.addr = a;",
        "            this.label = l;",
        "            this.comment = c;",
        "        }",
        "    }",
        "",
        "    @Override",
        "    public void run() throws Exception {",
        "        SymbolTable symTable = currentProgram.getSymbolTable();",
        "        SymbolDef[] symbols = new SymbolDef[] {",
    ]

    for addr in sorted(tables.keys()):
        info = tables[addr]
        label = clean_symbol_name(info["name"])
        raw_name = info["raw_name"].replace('"', '\\"')
        units = info["units"]
        comment = f"{raw_name} [{info['type']}] ({units})".strip().replace('"', '\\"')
        lines.append(f'            new SymbolDef(0x{addr:X}L, "{label}", "{comment}"),')

    lines.extend([
        "        };",
        "",
        "        int count = 0;",
        "        for (SymbolDef s : symbols) {",
        "            try {",
        "                Address target = toAddr(s.addr);",
        "                if (target != null) {",
        "                    symTable.createLabel(target, s.label, SourceType.USER_DEFINED);",
        "                    setPlateComment(target, s.comment);",
        "                    count++;",
        "                }",
        "            } catch (Exception ex) {",
        "                // Skip if address outside loaded image",
        "            }",
        "        }",
        '        println("Successfully created " + count + " Evo X symbols and labels.");',
        "    }",
        "}",
    ])

RAM_SYMBOLS = {
    0x008087C6: {"name": "RAM_Load_Timing", "raw_name": "Engine Load (Timing Pipeline)", "type": "RAM/Variable", "storagetype": "uint16", "units": "Load %"},
    0x008087C0: {"name": "RAM_Load_Calculated", "raw_name": "Engine Load (Calculated Airflow/Load)", "type": "RAM/Variable", "storagetype": "uint16", "units": "Load %"},
    0x00808798: {"name": "RAM_Engine_RPM", "raw_name": "Engine RPM", "type": "RAM/Variable", "storagetype": "uint16", "units": "RPM"},
    0x0080879F: {"name": "RAM_Engine_RPM_Low", "raw_name": "Raw Engine RPM Low Byte", "type": "RAM/Variable", "storagetype": "uint8", "units": "raw"},
    0x008045BD: {"name": "RAM_Engine_RPM_High", "raw_name": "Raw Engine RPM High Byte", "type": "RAM/Variable", "storagetype": "uint8", "units": "raw"},
    0x00808A5B: {"name": "RAM_Ignition_Timing_Advance", "raw_name": "Ignition Timing Advance", "type": "RAM/Variable", "storagetype": "int8", "units": "degrees"},
    0x00808A9F: {"name": "RAM_Knock_Sum", "raw_name": "Knock Sum Accumulator", "type": "RAM/Variable", "storagetype": "uint8", "units": "counts"},
    0x0080AA7F: {"name": "RAM_Knock_Base", "raw_name": "Knock Sensor Noise Floor / Base", "type": "RAM/Variable", "storagetype": "uint8", "units": "raw"},
    0x0080AA7B: {"name": "RAM_Knock_Variance", "raw_name": "Knock Sensor Variance", "type": "RAM/Variable", "storagetype": "uint8", "units": "raw"},
    0x0080AA81: {"name": "RAM_Knock_Delta", "raw_name": "Knock Sensor Delta Change", "type": "RAM/Variable", "storagetype": "uint8", "units": "raw"},
    0x00808A77: {"name": "RAM_Knock_Dynamics", "raw_name": "Knock Dynamics State", "type": "RAM/Variable", "storagetype": "uint8", "units": "raw"},
    0x00808131: {"name": "RAM_Knock_Flag", "raw_name": "Knock Detected Flag", "type": "RAM/Variable", "storagetype": "uint8", "units": "flag"},
    0x00808949: {"name": "RAM_Target_AFR_AFRMAP", "raw_name": "Target AFR (Open Loop Cell)", "type": "RAM/Variable", "storagetype": "uint8", "units": "AFR"},
    0x0080894C: {"name": "RAM_Current_Target_AFR", "raw_name": "Current Active Target AFR", "type": "RAM/Variable", "storagetype": "uint16", "units": "AFR"},
    0x0080AB80: {"name": "RAM_Injector_Pulse_Width_IPW", "raw_name": "Final Injector Pulse Width (IPW)", "type": "RAM/Variable", "storagetype": "uint16", "units": "ms*10"},
    0x008088EC: {"name": "RAM_STFT", "raw_name": "Short Term Fuel Trim (STFT)", "type": "RAM/Variable", "storagetype": "int8", "units": "%"},
    0x008088FD: {"name": "RAM_LTFT_InUse", "raw_name": "Long Term Fuel Trim In-Use", "type": "RAM/Variable", "storagetype": "int8", "units": "%"},
    0x00804573: {"name": "RAM_LTFT_Idle", "raw_name": "Long Term Fuel Trim (Idle Domain)", "type": "RAM/Variable", "storagetype": "int8", "units": "%"},
    0x00804575: {"name": "RAM_LTFT_Cruise", "raw_name": "Long Term Fuel Trim (Cruise Domain)", "type": "RAM/Variable", "storagetype": "int8", "units": "%"},
    0x0080876A: {"name": "RAM_Manifold_Absolute_Pressure_MAP", "raw_name": "Manifold Absolute Pressure (MAP)", "type": "RAM/Variable", "storagetype": "uint16", "units": "kPa"},
    0x0080AB45: {"name": "RAM_Barometric_Pressure", "raw_name": "Atmospheric Barometric Pressure", "type": "RAM/Variable", "storagetype": "uint8", "units": "kPa"},
    0x00808BB7: {"name": "RAM_WGDC_Active", "raw_name": "Active Wastegate Duty Cycle (WGDC)", "type": "RAM/Variable", "storagetype": "uint8", "units": "%"},
    0x00808BB5: {"name": "RAM_WGDC_Correction", "raw_name": "Wastegate Duty Cycle Correction", "type": "RAM/Variable", "storagetype": "int8", "units": "%"},
    0x008085D8: {"name": "RAM_Boost_Error", "raw_name": "Boost Error (Target - Actual)", "type": "RAM/Variable", "storagetype": "int16", "units": "psi/load"},
    0x008085D6: {"name": "RAM_Boost_Error_RAX_Logged", "raw_name": "Boost Error (RAX Mod Address)", "type": "RAM/Variable", "storagetype": "int16", "units": "psi/load"},
    0x00808FCC: {"name": "RAM_MAF_Voltage_ADC", "raw_name": "Mass Air Flow Sensor Input Voltage (ADC)", "type": "RAM/Variable", "storagetype": "uint16", "units": "Volts ADC"},
    0x008087F3: {"name": "RAM_MAF_Frequency_Hz", "raw_name": "Mass Air Flow Sensor Frequency (Hz)", "type": "RAM/Variable", "storagetype": "uint16", "units": "Hz"},
    0x00808FDE: {"name": "RAM_MAFCalcs_Load", "raw_name": "Airflow Calculated Load (MAFCalcs)", "type": "RAM/Variable", "storagetype": "uint16", "units": "Load %"},
    0x0080880A: {"name": "RAM_MAPCalcs_Load", "raw_name": "Manifold-Pressure Calculated Load (MAPCalcs)", "type": "RAM/Variable", "storagetype": "uint16", "units": "Load %"},
    0x00808812: {"name": "RAM_IMAPCalcs_Load", "raw_name": "Interpolated Manifold Load (IMAPCalcs)", "type": "RAM/Variable", "storagetype": "uint16", "units": "Load %"},
    0x00808FE2: {"name": "RAM_ChosenCalc_Load", "raw_name": "Selected Final Engine Load (ChosenCalc)", "type": "RAM/Variable", "storagetype": "uint16", "units": "Load %"},
    0x00808749: {"name": "RAM_TPS_Throttle_Position", "raw_name": "Drive-By-Wire Throttle Position (TPS)", "type": "RAM/Variable", "storagetype": "uint8", "units": "%"},
    0x00809645: {"name": "RAM_APP_Pedal_Position", "raw_name": "Accelerator Pedal Position (APP)", "type": "RAM/Variable", "storagetype": "uint8", "units": "%"},
    0x008086A3: {"name": "RAM_IAT_Intake_Air_Temp", "raw_name": "Intake Air Temperature (IAT)", "type": "RAM/Variable", "storagetype": "uint8", "units": "Celsius"},
    0x00808687: {"name": "RAM_ECT_Engine_Coolant_Temp", "raw_name": "Engine Coolant Temperature (ECT)", "type": "RAM/Variable", "storagetype": "uint8", "units": "Celsius"},
    0x008086A9: {"name": "RAM_MAT_Manifold_Air_Temp", "raw_name": "Manifold Air Temperature (MAT)", "type": "RAM/Variable", "storagetype": "uint8", "units": "Celsius"},
    0x0080883B: {"name": "RAM_Vehicle_Speed_VSS", "raw_name": "Vehicle Speed Sensor (VSS)", "type": "RAM/Variable", "storagetype": "uint8", "units": "km/h"},
    0x0080873F: {"name": "RAM_Battery_Voltage", "raw_name": "ECU Battery Voltage", "type": "RAM/Variable", "storagetype": "uint8", "units": "Volts"},
    0x00809566: {"name": "RAM_InVVT_Target", "raw_name": "Intake MIVEC Cam Phasing Target", "type": "RAM/Variable", "storagetype": "uint16", "units": "degrees"},
    0x00809572: {"name": "RAM_ExVVT_Target", "raw_name": "Exhaust MIVEC Cam Phasing Target", "type": "RAM/Variable", "storagetype": "uint16", "units": "degrees"},
    0x0080959E: {"name": "RAM_InVVT_Actual", "raw_name": "Intake MIVEC Cam Phasing Actual", "type": "RAM/Variable", "storagetype": "uint16", "units": "degrees"},
    0x008095AA: {"name": "RAM_ExVVT_Actual", "raw_name": "Exhaust MIVEC Cam Phasing Actual", "type": "RAM/Variable", "storagetype": "uint16", "units": "degrees"},
    0x0080459F: {"name": "RAM_Octane_Level", "raw_name": "Octane Level %", "type": "RAM/Variable", "storagetype": "uint8", "units": "%"},
    0x00805018: {"name": "RAM_TephraMOD_Active_Map", "raw_name": "TephraMOD v3 Active Map Number", "type": "RAM/Variable", "storagetype": "uint8", "units": "map index"},
    0x00805075: {"name": "RAM_Fuel_Tank_Pressure", "raw_name": "Fuel Tank Pressure Volts", "type": "RAM/Variable", "storagetype": "uint8", "units": "Volts"},
    0x00805083: {"name": "RAM_Flex_Fuel_Percent", "raw_name": "TephraMOD Flex Fuel Ethanol Content %", "type": "RAM/Variable", "storagetype": "uint8", "units": "%"},
    0x008086B9: {"name": "RAM_Rear_O2_Sensor", "raw_name": "Secondary Oxygen Sensor (Bank 1 Sensor 2)", "type": "RAM/Variable", "storagetype": "uint8", "units": "Volts ADC"},
    0x008051A8: {"name": "RAM_RAX_B_Dat", "raw_name": "RAX Fast Logging Packet B (Load, IPW, AFRMAP, O2-2)", "type": "RAM/Buffer", "storagetype": "uint32", "units": "packed bitfield"},
    0x008051AC: {"name": "RAM_RAX_A_Dat", "raw_name": "RAX Fast Logging Packet A (STFT, LTFT InUse, LTFT Idle, LTFT Cruise)", "type": "RAM/Buffer", "storagetype": "uint32", "units": "packed bitfield"},
    0x008051B0: {"name": "RAM_RAX_C_Dat", "raw_name": "RAX Fast Logging Packet C (Load Timing, Timing Adv, Knock Sum, RPM)", "type": "RAM/Buffer", "storagetype": "uint32", "units": "packed bitfield"},
    0x008051B4: {"name": "RAM_RAX_D_Dat", "raw_name": "RAX Fast Logging Packet D (MAP, Baro, Active WGDC, MAF Volts)", "type": "RAM/Buffer", "storagetype": "uint32", "units": "packed bitfield"},
    0x008051B8: {"name": "RAM_RAX_E_Dat", "raw_name": "RAX Fast Logging Packet E (InVVT Tgt, ExVVT Tgt, InVVT Act, ExVVT Act)", "type": "RAM/Buffer", "storagetype": "uint32", "units": "packed bitfield"},
    0x008051BC: {"name": "RAM_RAX_F_Dat", "raw_name": "RAX Fast Logging Packet F (TPS, APP, IAT, WGDC Corr)", "type": "RAM/Buffer", "storagetype": "uint32", "units": "packed bitfield"},
    0x008051C0: {"name": "RAM_RAX_G_Dat", "raw_name": "RAX Fast Logging Packet G (Speed, Battery, ECT, MAT)", "type": "RAM/Buffer", "storagetype": "uint32", "units": "packed bitfield"},
    0x008087F8: {"name": "RAM_Load_Filter_Lag_Alpha", "raw_name": "First-Order Load Lag Filter Alpha", "type": "RAM/Variable", "storagetype": "uint16", "units": "0..256"},
    0x008087FC: {"name": "RAM_Load_Filtered_Target", "raw_name": "Filtered Target Engine Load", "type": "RAM/Variable", "storagetype": "uint16", "units": "Load %"},
    0x00808FBE: {"name": "RAM_MAF_Airflow_Clamped", "raw_name": "MAF Airflow Clamped", "type": "RAM/Variable", "storagetype": "uint16", "units": "g/s"},
    0x00808FC0: {"name": "RAM_MAF_Airflow_Interpolated", "raw_name": "MAF Airflow Interpolated", "type": "RAM/Variable", "storagetype": "uint16", "units": "g/s"},
    0x00808FC4: {"name": "RAM_MAF_Airflow_Sum", "raw_name": "MAF Airflow Sample Accumulator", "type": "RAM/Variable", "storagetype": "uint32", "units": "sum"},
    0x00808FC8: {"name": "RAM_MAF_Airflow_Samples", "raw_name": "MAF Airflow Sample Counter", "type": "RAM/Variable", "storagetype": "uint16", "units": "count"},
    0x00808FD2: {"name": "RAM_MAF_Cycle_Avg_Airflow", "raw_name": "MAF Cycle-Averaged Airflow", "type": "RAM/Variable", "storagetype": "uint16", "units": "g/s"},
    0x00808FDC: {"name": "RAM_MAFCalcs_Acc", "raw_name": "MAF Calculated Load Accumulator (32-bit)", "type": "RAM/Variable", "storagetype": "uint32", "units": "Load % * 65536"},
    0x00808FE0: {"name": "RAM_ChosenCalc_Acc", "raw_name": "Chosen Load Accumulator (32-bit)", "type": "RAM/Variable", "storagetype": "uint32", "units": "Load % * 65536"},
    0x0080A8F4: {"name": "RAM_Transient_TPS_State", "raw_name": "Transient Throttle State Flags", "type": "RAM/Variable", "storagetype": "uint16", "units": "bitmask"},
    0x0080A8F6: {"name": "RAM_Transient_TPS_Blend_Weight", "raw_name": "Transient Throttle Blend Weight", "type": "RAM/Variable", "storagetype": "uint16", "units": "0..256"},
    0x0080A8FA: {"name": "RAM_Transient_TPS_Countdown", "raw_name": "Transient Throttle Countdown", "type": "RAM/Variable", "storagetype": "uint16", "units": "cycles"},
    0x0080A8FC: {"name": "RAM_MAP_Load_Calc_Table3", "raw_name": "MAP Load Calc Table #3 Interpolated", "type": "RAM/Variable", "storagetype": "uint16", "units": "Load %"},
    0x0080A8FE: {"name": "RAM_MAP_Load_Calc_Cold", "raw_name": "MAP Load Calc Cold Interpolated", "type": "RAM/Variable", "storagetype": "uint16", "units": "Load %"},
    0x0080A900: {"name": "RAM_MAP_Load_Calc_Hot", "raw_name": "MAP Load Calc Hot Interpolated", "type": "RAM/Variable", "storagetype": "uint16", "units": "Load %"},
    0x00808816: {"name": "RAM_MAP_3D_Table_Interpolated", "raw_name": "Blended 3D MAP Surface Load (Tables 1, 2, 3)", "type": "RAM/Variable", "storagetype": "uint16", "units": "Load %"},
    0x008051C4: {"name": "RAM_RAX_H_Dat", "raw_name": "RAX Fast Logging Packet H (MAPCalcs, IMAPCalcs, MAFCalcs, ChosenCalc)", "type": "RAM/Buffer", "storagetype": "uint32", "units": "packed bitfield"},
}


def generate_ghidra_java_script(tables, output_path):
    """Generate a native Ghidra Java script to create labels and plate comments."""
    lines = [
        "// Ghidra Auto-Symbol Importer for Mitsubishi Evo X (M32R) ROM",
        "// @category Automotive.EvoX",
        "// @keybinding",
        "// @menupath Tools.EvoX.ImportSymbols",
        "// @toolbar",
        "",
        "import ghidra.app.script.GhidraScript;",
        "import ghidra.program.model.symbol.SourceType;",
        "import ghidra.program.model.symbol.SymbolTable;",
        "import ghidra.program.model.address.Address;",
        "import ghidra.program.model.mem.Memory;",
        "",
        "public class GhidraImportEvo10Symbols extends GhidraScript {",
        "    private static class SymbolDef {",
        "        long addr;",
        "        String label;",
        "        String comment;",
        "        SymbolDef(long a, String l, String c) {",
        "            this.addr = a;",
        "            this.label = l;",
        "            this.comment = c;",
        "        }",
        "    }",
        "",
        "    @Override",
        "    public void run() throws Exception {",
        "        SymbolTable symTable = currentProgram.getSymbolTable();",
        "        Memory mem = currentProgram.getMemory();",
        "",
        "        // Ensure INTERNAL_RAM block is created in Ghidra memory map",
        "        try {",
        "            Address ramBase = toAddr(0x00800000L);",
        "            if (mem.getBlock(ramBase) == null) {",
        "                mem.createUninitializedBlock(\"INTERNAL_RAM\", ramBase, 0x10000L, false);",
        '                println("[+] Created INTERNAL_RAM block (0x00800000 - 0x0080FFFF) in Ghidra memory map.");',
        "            }",
        "        } catch (Exception ex) {",
        '            println("[-] RAM block initialization notice: " + ex.getMessage());',
        "        }",
        "",
        "        SymbolDef[] symbols = new SymbolDef[] {",
    ]

    for addr in sorted(tables.keys()):
        info = tables[addr]
        label = clean_symbol_name(info["name"])
        raw_name = info["raw_name"].replace('"', '\\"')
        units = info["units"]
        comment = f"{raw_name} [{info['type']}] ({units})".strip().replace('"', '\\"')
        lines.append(f'            new SymbolDef(0x{addr:X}L, "{label}", "{comment}"),')

    lines.extend([
        "        };",
        "",
        "        int count = 0;",
        "        for (SymbolDef s : symbols) {",
        "            try {",
        "                Address target = toAddr(s.addr);",
        "                if (target != null) {",
        "                    symTable.createLabel(target, s.label, SourceType.USER_DEFINED);",
        "                    setPlateComment(target, s.comment);",
        "                    count++;",
        "                }",
        "            } catch (Exception ex) {",
        "                // Skip if address outside loaded image",
        "            }",
        "        }",
        '        println("Successfully created " + count + " Evo X symbols and labels.");',
        "    }",
        "}",
    ])

    with open(output_path, "w") as f:
        f.write("\n".join(lines) + "\n")
    print(f"[+] Ghidra Java script generated: {output_path}")


def generate_csv(tables, output_path):
    """Generate a CSV symbol map."""
    with open(output_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Address_Hex", "Address_Int", "Label", "Raw_Name", "Type", "StorageType", "Units"])
        for addr in sorted(tables.keys()):
            info = tables[addr]
            writer.writerow([
                f"0x{addr:06X}",
                addr,
                clean_symbol_name(info["name"]),
                info["raw_name"],
                info["type"],
                info["storagetype"],
                info["units"],
            ])
    print(f"[+] CSV symbol map generated: {output_path}")


def main():
    base_dir = Path(__file__).resolve().parent.parent.parent
    xml_dir = base_dir / "XMLs for AI"
    xml_files = [
        xml_dir / "evo10base.xml",
        xml_dir / "59580004 2013 USDM Lancer Evolution X 5MT.xml",
        xml_dir / "59580004 RAX3 Patch.xml",
        xml_dir / "TephraMOD-59580304.xml",
    ]

    # Include discovered unmapped tables if present
    ref_dir = Path(__file__).resolve().parent.parent / "references"
    disc_xml = ref_dir / "discovered_unmapped_tables.xml"
    if disc_xml.exists():
        xml_files.append(disc_xml)

    out_dir = ref_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"[*] Parsing XML definitions...")
    scalings, tables = parse_xml_definitions(xml_files)

    # Merge RAM symbols from reverse lookup
    for r_addr, r_info in RAM_SYMBOLS.items():
        tables[r_addr] = r_info

    print(f"[*] Found {len(tables)} calibration tables, axes, and RAM addresses.")

    ghidra_py_out = out_dir / "ghidra_import_evo10_symbols.py"
    ghidra_java_out = out_dir / "GhidraImportEvo10Symbols.java"
    csv_out = out_dir / "evo10_symbols.csv"

    generate_ghidra_script(tables, ghidra_py_out)
    generate_ghidra_java_script(tables, ghidra_java_out)
    generate_csv(tables, csv_out)
    print("[+] All symbols exported successfully.")


if __name__ == "__main__":
    main()

