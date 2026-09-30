#!/usr/bin/env python3
"""
rom_log_verifier.py - Verifies the physical and mathematical transfer functions between
two sequential ROM flashes and their corresponding datalogs.
Measures the predictability of MAFCalcs and the empirical fueling response gain.
"""

import argparse
import csv
import json
import math
import os
import struct
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MAP_FILE = os.path.join(SCRIPT_DIR, "..", "references", "ecu_memory_map.json")

def load_rom_maf(path):
    header_len = 328 if path.lower().endswith(".srf") else 0
    with open(path, "rb") as f:
        f.seek(header_len)
        d = f.read()
    raw = struct.unpack(">130H", d[0x5757a:0x5757a+260])
    raw_v = struct.unpack(">130H", d[0x61fd0:0x61fd0+260])
    maf = [r / 100.0 for r in raw]
    volts = [round(r * 5.0 / 1023.0, 3) for r in raw_v]
    return volts, maf

def load_log_cells(log_path, volts_axis):
    with open(log_path, "r", encoding="latin1") as f:
        rows = list(csv.DictReader(f))
    grid = {}
    for r in rows:
        try:
            ipw = float(r["IPW"])
            ect = float(r["ECT"])
            maf_v = float(r["MAF"])
            rpm = float(r["RPM"])
            mafc = float(r["MAFCalcs"])
            afr = float(r["AFR"])
            dtps = abs(float(r.get("TPS", 0)) - float(r.get("APP", 0)))
            if ipw > 0 and ect > 75.0 and rpm > 600 and maf_v > 1.2 and mafc > 0:
                v_bin = round(maf_v * 50) / 50.0 # nearest 0.02V
                rpm_bin = round(rpm / 50.0) * 50 # nearest 50 RPM
                key = (v_bin, rpm_bin)
                if key not in grid: grid[key] = []
                grid[key].append({"mafc": mafc, "afr": afr, "maf_v": maf_v, "rpm": rpm})
        except (ValueError, KeyError):
            pass
            
    summary = {}
    for k, v in grid.items():
        if len(v) >= 5:
            summary[k] = {
                "mafc": sum(x["mafc"] for x in v) / len(v),
                "afr": sum(x["afr"] for x in v) / len(v),
                "count": len(v)
            }
    return summary

def verify_transition(rom_old, rom_new, log_old, log_new):
    volts, m_old = load_rom_maf(rom_old)
    _, m_new = load_rom_maf(rom_new)
    
    g_old = load_log_cells(log_old, volts)
    g_new = load_log_cells(log_new, volts)
    
    print(f"================ FLASH TRANSITION VERIFICATION ================")
    print(f"Base: {os.path.basename(rom_old)} -> Log: {os.path.basename(log_old)}")
    print(f"Next: {os.path.basename(rom_new)} -> Log: {os.path.basename(log_new)}")
    
    matches = []
    response_gains = []
    
    for key, d_old in g_old.items():
        if key in g_new:
            v, rpm = key
            d_new = g_new[key]
            v_idx = min(range(len(volts)), key=lambda i: abs(volts[i] - v))
            
            val_old = m_old[v_idx]
            val_new = m_new[v_idx]
            
            if val_old > 0 and abs(val_new - val_old) > 0.005:
                factor = val_new / val_old
                t_pct = (val_new - val_old) / val_old * 100
                
                mafc_old = d_old["mafc"]
                mafc_pred = mafc_old * factor
                mafc_act = d_new["mafc"]
                
                pred_err = abs(mafc_act - mafc_pred)
                pred_err_pct = pred_err / mafc_act * 100
                
                afr_o = d_old["afr"]
                afr_n = d_new["afr"]
                dafr_pct = (afr_n - afr_o) / afr_o * 100
                gain = - dafr_pct / t_pct
                
                matches.append({
                    "volt": v, "rpm": rpm, "factor": factor, "table_pct": t_pct,
                    "mafc_old": mafc_old, "mafc_pred": mafc_pred, "mafc_act": mafc_act,
                    "pred_err_pct": pred_err_pct, "afr_old": afr_o, "afr_new": afr_n,
                    "gain": gain
                })
                if abs(t_pct) >= 0.2:
                    response_gains.append(gain)
                    
    print(f"\nTotal Matched Operating Cells with Modified MAF: {len(matches)}")
    if matches:
        print("Volt   | RPM  | Table Factor | Old Load% | Pred Load% | Act Log Load% | Pred Error | AFR Old -> New | Response Gain")
        for m in matches[:15]:
            print(f"{m['volt']:.2f}V | {m['rpm']:4d} | {m['factor']:12.4f} | {m['mafc_old']:9.2f}% | {m['mafc_pred']:10.2f}% | {m['mafc_act']:13.2f}% | {m['pred_err_pct']:9.2f}% | {m['afr_old']:5.2f} -> {m['afr_new']:5.2f} | {m['gain']:11.2f}x")
            
        avg_err = sum(m["pred_err_pct"] for m in matches) / len(matches)
        print(f"\nAverage MAFCalcs Prediction Error: {avg_err:.2f}%")
        
        if response_gains:
            filtered_gains = [g for g in response_gains if -10.0 <= g <= 10.0]
            if filtered_gains:
                avg_gain = sum(filtered_gains) / len(filtered_gains)
                print(f"Empirical AFR Response Gain (-dAFR% / dTable%): {avg_gain:.2f}x (1% table change yields ~{avg_gain:.1f}% AFR shift)")

def main():
    parser = argparse.ArgumentParser(description="Verify ROM flash transition against matched logs")
    parser.add_argument("rom_old", help="Base ROM file (.srf/.bin)")
    parser.add_argument("rom_new", help="Updated ROM file (.srf/.bin)")
    parser.add_argument("log_old", help="Base datalog CSV")
    parser.add_argument("log_new", help="Updated datalog CSV")
    args = parser.parse_args()
    
    verify_transition(args.rom_old, args.rom_new, args.log_old, args.log_new)

if __name__ == "__main__":
    main()
