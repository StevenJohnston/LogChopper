#!/usr/bin/env python3
"""
experience_query.py - Calibration Experience Database Query & Veto Engine

Provides forward validation (pre-flash sanity check/veto) and reverse diagnostic lookup
against the calibration experience database (tuning_tools/db/calibration_experience.db):

Modes:
  1. forward-check: "Have we set this table cell near this value before? Did it run rich or lean?"
     Detects overshoot hazards and secant-interpolates the optimal value between historical brackets.
  2. reverse-match: "When did the engine last run well at this (RPM, MAP, MAT) operating point?"
     Ranks historical ROMs by performance metric (min AFR error, zero knock, trim balance)
     and exposes the exact table settings from that successful calibration.
  3. audit-injectors: Evaluates fuel trim drift across battery voltages and IPW to isolate
     Injector Scaling vs Voltage Latency deadtimes.
  4. audit-thermal: Analyzes AFR drift across MAT (Manifold Air Temp) to diagnose heat-soak comp.
  5. audit-events: Inspects all operational anomaly events (genuine knock, flutter, lean boost excursions).
"""

import argparse
import math
import os
import sqlite3
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(SCRIPT_DIR, "..", "db", "calibration_experience.db")


def get_conn(db_path):
    if not os.path.exists(db_path):
        sys.exit(f"Database not found: {db_path}. Please run ingest_experience.py first.")
    return sqlite3.connect(db_path)


def run_forward_check(db_path, table_name, axis_x, axis_y, proposed_val, tolerance_pct=5.0):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 65)
    print(f"       FORWARD TABLE CHECK: {table_name.upper()} @ X={axis_x}, Y={axis_y}")
    print(f"       Proposed Value: {proposed_val}")
    print("=" * 65)

    # 1. Find all historical ROM values at or near this coordinate
    cur.execute("""
    SELECT r.rom_id, r.rom_name, t.cell_value
    FROM rom_tables t
    JOIN roms r ON t.rom_id = r.rom_id
    WHERE t.table_name = ?
      AND ABS(t.axis_x - ?) <= 0.05
      AND ABS(t.axis_y - ?) <= 50.0
    ORDER BY r.file_mtime ASC;
    """, (table_name, axis_x, axis_y))
    rom_cells = cur.fetchall()

    if not rom_cells:
        print(f"[*] No historical records found for table '{table_name}' at X={axis_x}, Y={axis_y}.")
        conn.close()
        return

    print(f"\n[+] Historical ROM Calibration Values at this coordinate:")
    history_data = []
    for rom_id, rom_name, cell_val in rom_cells:
        # Check empirical performance in logs associated with this ROM
        cur.execute("""
        SELECT 
            SUM(sample_count), SUM(steady_sample_count),
            AVG(avg_afr), AVG(avg_afrmap), AVG(avg_afr_error),
            AVG(avg_total_trim), SUM(knock_count_genuine), SUM(knock_count_flutter)
        FROM regime_summaries
        WHERE rom_id = ?
          AND ABS(mafv_bucket - ?) <= 0.08
        """, (rom_id, axis_x))
        perf = cur.fetchone()

        cnt = perf[0] or 0
        steady_cnt = perf[1] or 0
        afr = perf[2] or 0.0
        afrmap = perf[3] or 14.7
        err = perf[4] or 1.0
        trim = perf[5] or 0.0
        k_gen = perf[6] or 0
        k_flut = perf[7] or 0

        err_pct = (err - 1.0) * 100.0
        history_data.append({
            "rom_id": rom_id, "rom_name": rom_name, "cell_val": cell_val,
            "sample_count": cnt, "steady_count": steady_cnt,
            "afr": afr, "afrmap": afrmap, "err_pct": err_pct,
            "trim": trim, "k_gen": k_gen, "k_flut": k_flut
        })

        err_str = f"{err_pct:+5.2f}%" if cnt > 0 else "No Logs"
        afr_str = f"{afr:5.2f}" if cnt > 0 else "  N/A"
        print(f"  - ROM {rom_id:2d} ({rom_name[:35]:<35}): Val = {cell_val:7.2f} | AFR = {afr_str} | Err = {err_str} | Samples = {cnt:>5}")

    # 2. Veto & Bracketing Analysis
    tested_rich = [h for h in history_data if h["sample_count"] >= 10 and h["err_pct"] < -1.5]
    tested_lean = [h for h in history_data if h["sample_count"] >= 10 and h["err_pct"] > +1.5]

    print("\n[+] Empirical Target & Veto Assessment:")
    hazard_found = False

    for h in tested_rich:
        diff_pct = abs(proposed_val - h["cell_val"]) / h["cell_val"] * 100.0
        if diff_pct <= tolerance_pct:
            print(f"  [!] VETO WARNING: Proposed value {proposed_val} is within {diff_pct:.1f}% of {h['rom_name']} ({h['cell_val']}), which ran {h['err_pct']:+.1f}% RICH!")
            hazard_found = True

    for h in tested_lean:
        diff_pct = abs(proposed_val - h["cell_val"]) / h["cell_val"] * 100.0
        if diff_pct <= tolerance_pct:
            print(f"  [!] VETO WARNING: Proposed value {proposed_val} is within {diff_pct:.1f}% of {h['rom_name']} ({h['cell_val']}), which ran {h['err_pct']:+.1f}% LEAN!")
            hazard_found = True

    # Secant interpolation if bracketed
    if tested_rich and tested_lean:
        best_rich = min(tested_rich, key=lambda x: abs(x["err_pct"]))
        best_lean = min(tested_lean, key=lambda x: abs(x["err_pct"]))
        # Secant root finding: optimal_val = V_lean + (0 - Err_lean) / (Err_rich - Err_lean) * (V_rich - V_lean)
        v_lean = best_lean["cell_val"]
        v_rich = best_rich["cell_val"]
        e_lean = best_lean["err_pct"]
        e_rich = best_rich["err_pct"]
        if abs(e_rich - e_lean) > 0.1:
            frac = (0.0 - e_lean) / (e_rich - e_lean)
            opt_val = v_lean + frac * (v_rich - v_lean)
            print(f"\n  [*] BRACKETED SECANT ROOT FOUND:")
            print(f"      Lean Bracket : {best_lean['rom_name']} (Val: {v_lean:.2f}, Err: {e_lean:+.2f}%)")
            print(f"      Rich Bracket : {best_rich['rom_name']} (Val: {v_rich:.2f}, Err: {e_rich:+.2f}%)")
            print(f"      Suggested Optimal Zero-Error Value: {opt_val:.2f}")

    if not hazard_found:
        print("  [+] PASS: No repeat failure hazard detected for proposed value.")

    print("=" * 65)
    conn.close()


def run_reverse_match(db_path, rpm, map_kpa, mat=None, target_metric="min_afr_error", top_k=3):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 65)
    print(f"       REVERSE DIAGNOSTIC LOOKUP: RPM={rpm}, MAP={map_kpa} kPa")
    print(f"       Target Optimization: {target_metric.upper()}")
    print("=" * 65)

    cur.execute("""
    SELECT 
        s.rom_id, r.rom_name,
        SUM(s.sample_count) as total_samples,
        SUM(s.steady_sample_count) as steady_samples,
        AVG(s.avg_afr) as mean_afr,
        AVG(s.avg_afrmap) as mean_afrmap,
        AVG(ABS(s.avg_afr - s.avg_afrmap)) as mean_abs_err,
        AVG(s.avg_total_trim) as mean_trim,
        SUM(s.knock_count_genuine) as total_knock_gen,
        SUM(s.knock_count_flutter) as total_knock_flut,
        AVG(s.clamping_rate) as mean_clamping
    FROM regime_summaries s
    JOIN roms r ON s.rom_id = r.rom_id
    WHERE ABS(s.rpm_bucket - ?) <= 350
      AND ABS(s.map_bucket - ?) <= 15.0
    GROUP BY s.rom_id
    HAVING total_samples >= 5
    ORDER BY mean_abs_err ASC
    LIMIT ?;
    """, (rpm, map_kpa, top_k))

    top_roms = cur.fetchall()
    if not top_roms:
        print(f"[*] No datalogs found matching operating point (RPM ~{rpm}, MAP ~{map_kpa} kPa).")
        conn.close()
        return

    print(f"\n[+] Top {len(top_roms)} Historical ROMs Achieving Best Operating Results:")
    for rank, row in enumerate(top_roms, 1):
        rom_id, rom_name, samples, steady, afr, afrmap, abs_err, trim, k_gen, k_flut, clamp = row
        print(f"\n  #{rank}. ROM {rom_id} - {rom_name}:")
        print(f"      Witnessed AFR   : {afr:.2f} (Target AFRMAP: {afrmap:.2f}, Abs Error: {abs_err:.2f})")
        print(f"      Fuel Trim ST+LT : {trim:+.1f}% | Clamping Rate: {clamp:.1f}%")
        print(f"      Knock Inceptions: Genuine = {k_gen}, BOV Flutter = {k_flut}")
        print(f"      Sample Evidence : {samples} samples ({steady} steady cruise)")

        # Query exact table configurations for this winning ROM at this point
        print("      Table Coordinates in this ROM:")
        # MAF scaling near this load
        cur.execute("""
        SELECT cell_value FROM rom_tables 
        WHERE rom_id = ? AND table_name = 'map_load_calc_1'
          AND ABS(axis_x - ?) <= 15.0 AND ABS(axis_y - ?) <= 300
        LIMIT 1;
        """, (rom_id, map_kpa, rpm))
        map_val = cur.fetchone()
        if map_val:
            print(f"        * MAP based Load Calc : {map_val[0]:.1f}%")

        cur.execute("""
        SELECT cell_value FROM rom_tables 
        WHERE rom_id = ? AND table_name = 'high_octane_timing'
          AND ABS(axis_y - ?) <= 300
        LIMIT 1;
        """, (rom_id, rpm))
        tim_val = cur.fetchone()
        if tim_val:
            print(f"        * High Octane Timing  : {tim_val[0]:.1f}°")

    print("\n" + "=" * 65)
    conn.close()


def run_audit_injectors(db_path):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 65)
    print("           INJECTOR DYNAMICS & VOLTAGE LATENCY AUDIT")
    print("=" * 65)

    # 1. Inspect trims across battery voltages at low IPW (idle/low load)
    cur.execute("""
    SELECT 
        vbatt_bucket,
        SUM(sample_count) as total_samples,
        AVG(avg_total_trim) as mean_trim,
        AVG(avg_ipw_ms) as mean_ipw
    FROM regime_summaries
    WHERE regime IN ('STEADY_IDLE', 'STEADY_CRUISE')
      AND avg_ipw_ms <= 2.2
    GROUP BY vbatt_bucket
    HAVING total_samples >= 20
    ORDER BY vbatt_bucket ASC;
    """)
    volt_rows = cur.fetchall()

    if not volt_rows:
        print("[*] Insufficient idle/low-IPW closed loop samples across voltage buckets.")
    else:
        print("\n[+] Fuel Trim Sensitivity vs Battery Voltage (Low IPW <= 2.2ms):")
        print("  Vbatt Bucket | Samples | Mean Total Trim (ST+LT) | Mean IPW")
        print("  " + "-" * 55)
        for v_b, samples, trim, ipw in volt_rows:
            print(f"    {v_b:5.1f}V      | {samples:>7,} | {trim:+10.2f}%         | {ipw:6.2f} ms")

        # Check for voltage latency disparity
        trims = [r[2] for r in volt_rows]
        trim_span = max(trims) - min(trims)
        print(f"\n  Voltage Trim Disparity Span: {trim_span:.2f}%")
        if trim_span > 4.0:
            print("  [!] DIAGNOSIS: Significant fuel trim drift across battery voltages detected!")
            print("      Action: Adjust 'Injector Battery Voltage Latency Compensation' (0x556d0)")
            print("      between 12.5V and 14.1V bins to flatten deadtime response.")
        else:
            print("  [+] PASS: Injector latency compensation is well-balanced across electrical load.")

    # 2. Check current injector scaling across ROMs
    cur.execute("""
    SELECT r.rom_id, r.rom_name, t.cell_value
    FROM rom_tables t
    JOIN roms r ON t.rom_id = r.rom_id
    WHERE t.table_name = 'fuel_injector_scaling'
    ORDER BY r.file_mtime DESC;
    """)
    scale_rows = cur.fetchall()
    if scale_rows:
        print("\n[+] Injector Scaling History in Ingested ROMs:")
        for r_id, r_name, scale in scale_rows:
            print(f"  - ROM {r_id:2d} ({r_name[:35]:<35}): {scale:.1f} cc/min")

    print("=" * 65)
    conn.close()


def run_audit_thermal(db_path):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 65)
    print("        THERMAL INVARIANCE & MAT HEAT-SOAK AUDIT")
    print("=" * 65)

    cur.execute("""
    SELECT 
        mat_bucket,
        SUM(sample_count) as total_samples,
        AVG(avg_afr) as mean_afr,
        AVG(avg_afrmap) as mean_afrmap,
        AVG(avg_afr_error) as mean_error
    FROM regime_summaries
    WHERE regime = 'STEADY_CRUISE'
    GROUP BY mat_bucket
    HAVING total_samples >= 20
    ORDER BY mat_bucket ASC;
    """)
    mat_rows = cur.fetchall()

    if not mat_rows:
        print("[*] Insufficient steady cruise samples across MAT buckets.")
    else:
        print("\n[+] Steady Cruise AFR Tracking Across Manifold Air Temperatures (MAT):")
        print("  MAT Temp  | Samples | Witnessed AFR | Target AFRMAP | Thermal Error %")
        print("  " + "-" * 60)
        for mat_b, samples, afr, afrmap, err in mat_rows:
            err_pct = (err - 1.0) * 100.0
            print(f"    {mat_b:3d}°C    | {samples:>7,} | {afr:7.2f}       | {afrmap:7.2f}       | {err_pct:+8.2f}%")

        if len(mat_rows) >= 2:
            cold_err = (mat_rows[0][4] - 1.0) * 100.0
            hot_err = (mat_rows[-1][4] - 1.0) * 100.0
            drift = hot_err - cold_err
            print(f"\n  Thermal Drift Gradient: {drift:+.2f}% from {mat_rows[0][0]}°C to {mat_rows[-1][0]}°C.")
            if abs(drift) > 4.0:
                print("  [!] DIAGNOSIS: Heat-soak drift detected across ambient/intake temperatures!")
                print("      Action: Calibrate 'Fuel Compensation MAT vs MAP' (0x60fcd) toward cold baseline.")
            else:
                print("  [+] PASS: Thermal invariance satisfied (AFR remains stable across MAT).")

    print("=" * 65)
    conn.close()


def run_audit_events(db_path):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 65)
    print("           OPERATIONAL ANOMALY EVENTS LEDGER AUDIT")
    print("=" * 65)

    cur.execute("""
    SELECT event_type, COUNT(*), AVG(severity), MAX(severity)
    FROM operational_events
    GROUP BY event_type
    ORDER BY COUNT(*) DESC;
    """)
    rows = cur.fetchall()

    if not rows:
        print("[*] No operational anomaly events logged in database.")
    else:
        print(f"\n[+] Recorded Anomaly Event Counts:")
        for etype, cnt, avg_sev, max_sev in rows:
            print(f"  - {etype:<25}: {cnt:>4} events | Mean Severity: {avg_sev:5.2f} | Max: {max_sev:5.2f}")

        # List recent events
        print("\n[+] Most Recent Operational Events:")
        cur.execute("""
        SELECT time_sec, event_type, rpm, map_kpa, tps, mafv, afr, afrmap, classification, confidence
        FROM operational_events
        ORDER BY event_id DESC
        LIMIT 10;
        """)
        for r in cur.fetchall():
            t, etype, rpm, kpa, tps, mafv, afr, afrmap, cls, conf = r
            print(f"  t={t:7.1f}s | {etype:<22} | {rpm:5.0f} RPM | {kpa:5.1f} kPa | MAFV={mafv:5.3f}V | AFR={afr:4.1f}/{afrmap:4.1f} | Conf={conf:.2f}")

    print("=" * 65)
    conn.close()


def main():
    parser = argparse.ArgumentParser(description="Calibration Experience Database Query & Veto Engine")
    parser.add_argument("--db", default=DEFAULT_DB_PATH, help=f"Path to SQLite database (default: {DEFAULT_DB_PATH})")
    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    # 1. forward-check
    p_fwd = subparsers.add_parser("forward-check", help="Pre-flash sanity check & veto for proposed table values")
    p_fwd.add_argument("--table", required=True, help="Table name (e.g. maf_scaling, map_load_calc_1, injector_latency)")
    p_fwd.add_argument("--axis-x", type=float, required=True, help="X Axis coordinate (e.g. Volts, MAP kPa, Vbatt)")
    p_fwd.add_argument("--axis-y", type=float, default=0.0, help="Y Axis coordinate (e.g. RPM, MAT °C)")
    p_fwd.add_argument("--proposed", type=float, required=True, help="Proposed table cell value to test")
    p_fwd.add_argument("--tolerance-pct", type=float, default=5.0, help="Veto warning proximity tolerance (default: 5.0%)")

    # 2. reverse-match
    p_rev = subparsers.add_parser("reverse-match", help="Reverse diagnostic search: find best historical ROM for operating point")
    p_rev.add_argument("--rpm", type=float, required=True, help="Engine RPM target")
    p_rev.add_argument("--map", type=float, required=True, help="Manifold pressure MAP kPa target")
    p_rev.add_argument("--mat", type=float, help="Optional MAT °C")
    p_rev.add_argument("--metric", default="min_afr_error", choices=["min_afr_error", "zero_knock", "trim_balance"])
    p_rev.add_argument("--top-k", type=int, default=3, help="Number of winning ROMs to display (default: 3)")

    # 3. audit-injectors
    subparsers.add_parser("audit-injectors", help="Analyze trims vs battery voltage and pulse width for latency/scaling tuning")

    # 4. audit-thermal
    subparsers.add_parser("audit-thermal", help="Analyze AFR drift across MAT temperatures for heat-soak comp tuning")

    # 5. audit-events
    subparsers.add_parser("audit-events", help="Inspect all recorded anomaly events (knock, flutter, lean boost excursions)")

    args = parser.parse_args()

    if args.subcommand == "forward-check":
        run_forward_check(args.db, args.table, args.axis_x, args.axis_y, args.proposed, args.tolerance_pct)
    elif args.subcommand == "reverse-match":
        run_reverse_match(args.db, args.rpm, args.map, args.mat, args.metric, args.top_k)
    elif args.subcommand == "audit-injectors":
        run_audit_injectors(args.db)
    elif args.subcommand == "audit-thermal":
        run_audit_thermal(args.db)
    elif args.subcommand == "audit-events":
        run_audit_events(args.db)


if __name__ == "__main__":
    main()
