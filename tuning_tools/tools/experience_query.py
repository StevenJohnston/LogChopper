#!/usr/bin/env python3
"""
experience_query.py - Calibration Experience Database Query, Audit & Veto Engine

Provides forward validation (pre-flash sanity check/veto), state-space k-NN vector search,
reverse diagnostic lookup, and multi-domain health audits against the rehydrated SQLite
experience database (tuning_tools/db/calibration_experience.db):

Modes:
  1. forward-check   : "Have we set this table cell near this value before? Did it run rich or lean?"
  2. reverse-match   : "Which historical ROM performed best at this (RPM, MAP, MAT, Gear) point?"
  3. find-similar    : State-space k-NN similarity search across regimes or anomaly events.
  4. audit-injectors : Fuel trim drift across battery voltages and IPW (Scaling vs Latency).
  5. audit-thermal   : Steady-cruise AFR invariance across MAT + precomputed MAT table multipliers.
  6. audit-events    : Operational anomaly ledger (Genuine knock w/ 1-count rule, flutter, overrun leaks).
  7. audit-health    : ROM-by-ROM progression, DFCO overrun fuel leakage hotspots, Virtual Dyno WHP/WTQ,
                       IDC headroom, and MIVEC VVT tracking accuracy.
"""

import argparse
import json
import math
import os
import sqlite3
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(SCRIPT_DIR, "..", "db", "calibration_experience.db")


def get_conn(db_path):
    if not os.path.exists(db_path):
        sys.exit(f"Database not found: {db_path}. Please run ingest_experience.py --rehydrate first.")
    return sqlite3.connect(db_path)


def run_forward_check(db_path, table_name, axis_x, axis_y, proposed_val, tolerance_pct=5.0):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 72)
    print(f"  FORWARD TABLE CHECK: {table_name.upper()} @ X={axis_x}, Y={axis_y}")
    print(f"  Proposed Value: {proposed_val}")
    print("=" * 72)

    x_tol = 0.06 if table_name == "maf_scaling" else (0.8 if table_name == "injector_latency" else 8.0)
    y_tol = 300.0 if table_name in ("map_load_calc_1", "map_load_calc_2", "high_octane_timing", "low_octane_timing") else 12.0

    cur.execute("""
    SELECT r.rom_id, r.rom_name, t.axis_x, t.axis_y, t.cell_value
    FROM rom_tables t
    JOIN roms r ON t.rom_id = r.rom_id
    WHERE t.table_name = ?
      AND ABS(t.axis_x - ?) <= ?
      AND ABS(t.axis_y - ?) <= ?
    ORDER BY r.file_mtime ASC;
    """, (table_name, axis_x, x_tol, axis_y, y_tol))
    rom_cells = cur.fetchall()

    if not rom_cells:
        print(f"[*] No historical records found for table '{table_name}' near X={axis_x}, Y={axis_y}.")
        conn.close()
        return

    # Deduplicate to closest coordinate per ROM
    by_rom = {}
    for rom_id, rom_name, ax, ay, cell_val in rom_cells:
        d = abs(ax - axis_x) + abs(ay - axis_y) * 0.001
        if rom_id not in by_rom or d < by_rom[rom_id][0]:
            by_rom[rom_id] = (d, rom_id, rom_name, ax, ay, cell_val)

    print("\n[+] Historical ROM Calibration Values & Empirical Telemetry:")
    history_data = []
    for _, rom_id, rom_name, ax, ay, cell_val in by_rom.values():
        if table_name == "maf_scaling":
            cur.execute("""
            SELECT SUM(sample_count), SUM(steady_sample_count), AVG(avg_afr), AVG(avg_afrmap),
                   AVG(avg_afr_error), AVG(avg_total_trim), SUM(knock_count_genuine), SUM(knock_count_flutter)
            FROM regime_summaries
            WHERE rom_id = ? AND ABS(mafv_bucket - ?) <= 0.06 AND usable_maf_count > 0
            """, (rom_id, ax))
        elif table_name in ("map_load_calc_1", "map_load_calc_2"):
            cur.execute("""
            SELECT SUM(sample_count), SUM(steady_sample_count), AVG(avg_afr), AVG(avg_afrmap),
                   AVG(avg_afr_error), AVG(avg_total_trim), SUM(knock_count_genuine), SUM(knock_count_flutter)
            FROM regime_summaries
            WHERE rom_id = ? AND ABS(map_bucket - ?) <= 12.0 AND ABS(rpm_bucket - ?) <= 350 AND usable_ve_count > 0
            """, (rom_id, ax, ay))
        else:
            cur.execute("""
            SELECT SUM(sample_count), SUM(steady_sample_count), AVG(avg_afr), AVG(avg_afrmap),
                   AVG(avg_afr_error), AVG(avg_total_trim), SUM(knock_count_genuine), SUM(knock_count_flutter)
            FROM regime_summaries
            WHERE rom_id = ? AND ABS(rpm_bucket - ?) <= 350
            """, (rom_id, ay))

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
        print(f"  - ROM {rom_id:2d} ({rom_name[:36]:<36}): Val = {cell_val:7.2f} | AFR = {afr_str} | Err = {err_str} | Samples = {cnt:>5}")

    tested_rich = [h for h in history_data if h["sample_count"] >= 10 and h["err_pct"] < -1.5]
    tested_lean = [h for h in history_data if h["sample_count"] >= 10 and h["err_pct"] > +1.5]

    print("\n[+] Empirical Target & Veto Assessment:")
    hazard_found = False

    for h in tested_rich:
        if h["cell_val"] != 0:
            diff_pct = abs(proposed_val - h["cell_val"]) / abs(h["cell_val"]) * 100.0
            if diff_pct <= tolerance_pct:
                print(f"  [!] VETO WARNING: Proposed {proposed_val} is within {diff_pct:.1f}% of {h['rom_name']} ({h['cell_val']}), which ran {h['err_pct']:+.1f}% RICH!")
                hazard_found = True

    for h in tested_lean:
        if h["cell_val"] != 0:
            diff_pct = abs(proposed_val - h["cell_val"]) / abs(h["cell_val"]) * 100.0
            if diff_pct <= tolerance_pct:
                print(f"  [!] VETO WARNING: Proposed {proposed_val} is within {diff_pct:.1f}% of {h['rom_name']} ({h['cell_val']}), which ran {h['err_pct']:+.1f}% LEAN!")
                hazard_found = True

    if tested_rich and tested_lean:
        best_rich = min(tested_rich, key=lambda x: abs(x["err_pct"]))
        best_lean = min(tested_lean, key=lambda x: abs(x["err_pct"]))
        v_lean, v_rich = best_lean["cell_val"], best_rich["cell_val"]
        e_lean, e_rich = best_lean["err_pct"], best_rich["err_pct"]
        if abs(e_rich - e_lean) > 0.1:
            frac = (0.0 - e_lean) / (e_rich - e_lean)
            opt_val = v_lean + frac * (v_rich - v_lean)
            print("\n  [*] BRACKETED SECANT ROOT FOUND:")
            print(f"      Lean Bracket : {best_lean['rom_name']} (Val: {v_lean:.2f}, Err: {e_lean:+.2f}%)")
            print(f"      Rich Bracket : {best_rich['rom_name']} (Val: {v_rich:.2f}, Err: {e_rich:+.2f}%)")
            print(f"      Suggested Optimal Zero-Error Value: {opt_val:.2f}")

    if not hazard_found:
        print("  [+] PASS: No repeat failure hazard detected for proposed value.")

    print("=" * 72)
    conn.close()


def run_reverse_match(db_path, rpm, map_kpa, mat=None, gear=None, target_metric="min_afr_error", top_k=3):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 72)
    print(f"  REVERSE DIAGNOSTIC LOOKUP: RPM={rpm:.0f}, MAP={map_kpa:.1f} kPa"
          + (f", MAT={mat:.0f}°C" if mat is not None else "")
          + (f", Gear={gear}" if gear else ""))
    print(f"  Target Optimization: {target_metric.upper()}")
    print("=" * 72)

    clauses = ["ABS(s.rpm_bucket - ?) <= 350", "ABS(s.map_bucket - ?) <= 15.0", "s.regime != 'DFCO'"]
    params = [rpm, map_kpa]
    if mat is not None:
        clauses.append("ABS(s.mat_bucket - ?) <= 12")
        params.append(mat)
    if gear:
        clauses.append("s.dominant_gear = ?")
        params.append(str(gear))

    order_sql = {
        "min_afr_error": "mean_abs_err ASC",
        "zero_knock": "total_knock_gen ASC, mean_abs_err ASC",
        "trim_balance": "ABS(mean_trim) ASC, mean_abs_err ASC",
        "max_whp": "peak_whp DESC, total_knock_gen ASC",
    }.get(target_metric, "mean_abs_err ASC")

    where_sql = " AND ".join(clauses)
    params.append(top_k)

    cur.execute(f"""
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
        AVG(s.clamping_rate) as mean_clamping,
        AVG(s.avg_rom_maf_gs) as mean_rom_maf,
        AVG(s.avg_rom_map_ve_load) as mean_rom_ve,
        AVG(s.avg_rom_mat_comp_mult) as mean_rom_mat,
        AVG(s.avg_rom_timing_high) as mean_rom_tim,
        MAX(s.max_wheel_hp) as peak_whp,
        AVG(s.avg_idc_pct) as mean_idc
    FROM regime_summaries s
    JOIN roms r ON s.rom_id = r.rom_id
    WHERE {where_sql}
    GROUP BY s.rom_id
    HAVING total_samples >= 5
    ORDER BY {order_sql}
    LIMIT ?;
    """, params)

    top_roms = cur.fetchall()
    if not top_roms:
        print(f"[*] No datalogs found matching operating point (RPM ~{rpm}, MAP ~{map_kpa} kPa).")
        conn.close()
        return

    print(f"\n[+] Top {len(top_roms)} Historical ROMs Achieving Best Operating Results:")
    for rank, row in enumerate(top_roms, 1):
        (rom_id, rom_name, samples, steady, afr, afrmap, abs_err, trim,
         k_gen, k_flut, clamp, rom_maf, rom_ve, rom_mat, rom_tim, p_whp, m_idc) = row
        print(f"\n  #{rank}. ROM {rom_id} - {rom_name}:")
        print(f"      Witnessed AFR       : {afr:.2f} (Target AFRMAP: {afrmap:.2f}, Abs Error: {abs_err:.2f})")
        print(f"      Fuel Trim ST+LT     : {trim:+.1f}% | Clamping Rate: {clamp:.1f}% | IDC: {m_idc:.1f}%")
        print(f"      Knock Inceptions    : Genuine = {k_gen}, BOV Flutter = {k_flut} | Peak WHP in zone = {p_whp:.1f}")
        print(f"      Precomputed Lookups : MAF = {rom_maf:.1f} g/s | MAP VE = {rom_ve:.1f}% | MAT Comp = {rom_mat:.2f}% | HiTiming = {rom_tim:.1f}°")
        print(f"      Sample Evidence     : {samples} frames ({steady} steady)")

    print("\n" + "=" * 72)
    conn.close()


def run_find_similar(db_path, rpm, map_kpa, mafv=None, mat=None, vbatt=None, gear=None, top_k=5, events_only=False):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 72)
    print("  STATE-SPACE k-NN SIMILARITY SEARCH (VECTOR RETRIEVAL)")
    print(f"  Target: RPM={rpm:.0f}, MAP={map_kpa:.1f} kPa"
          + (f", MAFV={mafv:.3f}V" if mafv is not None else "")
          + (f", MAT={mat:.1f}°C" if mat is not None else "")
          + (f", Vbatt={vbatt:.1f}V" if vbatt is not None else "")
          + (f", Gear={gear}" if gear else ""))
    print("=" * 72)

    if events_only:
        cur.execute("""
        SELECT
            e.event_id, e.log_id, e.rom_id, r.rom_name, e.event_type,
            e.time_sec, e.rpm, e.map_kpa, e.mafv, e.mat_c, e.vbatt,
            e.afr, e.afrmap, e.classification, e.confidence, e.severity, e.detail_json
        FROM operational_events e
        JOIN roms r ON e.rom_id = r.rom_id
        """)
        rows = cur.fetchall()
        if not rows:
            print("[*] No operational anomaly events recorded in database.")
            conn.close()
            return

        scored = []
        for row in rows:
            eid, lid, rid, rname, etype, tsec, r_rpm, r_map, r_mafv, r_mat, r_vbatt, afr, afrmap, cls, conf, sev, djson = row
            if gear:
                try:
                    meta = json.loads(djson or "{}")
                    if str(meta.get("gear")) != str(gear):
                        continue
                except Exception:
                    pass
            d_sq = ((r_rpm - rpm) / 800.0) ** 2 + ((r_map - map_kpa) / 25.0) ** 2
            if mafv is not None and r_mafv is not None:
                d_sq += ((r_mafv - mafv) / 0.4) ** 2
            if mat is not None and r_mat is not None:
                d_sq += ((r_mat - mat) / 15.0) ** 2
            if vbatt is not None and r_vbatt is not None:
                d_sq += ((r_vbatt - vbatt) / 1.0) ** 2
            dist = math.sqrt(d_sq)
            sim_pct = 100.0 / (1.0 + dist)
            scored.append((dist, sim_pct, row))

        scored.sort(key=lambda x: x[0])
        print(f"\n[+] Nearest {min(top_k, len(scored))} Operational Anomaly Events:")
        for rank, (dist, sim_pct, r) in enumerate(scored[:top_k], 1):
            eid, lid, rid, rname, etype, tsec, r_rpm, r_map, r_mafv, r_mat, r_vbatt, afr, afrmap, cls, conf, sev, djson = r
            print(f"\n  #{rank}. Similarity: {sim_pct:5.1f}% (Dist: {dist:.2f}) | {etype} ({cls})")
            print(f"      ROM {rid}: {rname[:42]} | Log ID {lid} @ t={tsec:.1f}s")
            print(f"      Operating State : {r_rpm:5.0f} RPM | {r_map:5.1f} kPa | MAFV={r_mafv:.3f}V | MAT={r_mat:.1f}°C")
            print(f"      Outcome         : AFR={afr:4.1f} (Target {afrmap:4.1f}) | Severity={sev:.1f} | Conf={conf:.2f}")
            if djson and djson != "{}":
                print(f"      Context Details : {djson}")
    else:
        gear_clause = "WHERE s.dominant_gear = ?" if gear else ""
        gear_params = [str(gear)] if gear else []
        cur.execute(f"""
        SELECT
            s.summary_id, s.log_id, s.rom_id, r.rom_name, s.regime,
            s.rpm_bucket, s.map_bucket, s.mafv_bucket, s.mat_bucket, s.vbatt_bucket,
            s.sample_count, s.steady_sample_count, s.avg_afr, s.avg_afrmap,
            s.avg_afr_error, s.avg_total_trim, s.clamping_rate,
            s.knock_count_genuine, s.knock_count_flutter, s.avg_timing,
            s.dominant_gear, s.avg_rom_maf_gs, s.avg_rom_map_ve_load,
            s.avg_rom_mat_comp_mult, s.avg_rom_timing_high, s.max_wheel_hp, s.avg_idc_pct
        FROM regime_summaries s
        JOIN roms r ON s.rom_id = r.rom_id
        {gear_clause}
        """, gear_params)
        rows = cur.fetchall()
        if not rows:
            print("[*] No matching regime performance summaries recorded in database.")
            conn.close()
            return

        scored = []
        for row in rows:
            r_rpm, r_map, r_mafv, r_mat, r_vbatt = row[5], row[6], row[7], row[8], row[9]
            d_sq = ((r_rpm - rpm) / 800.0) ** 2 + ((r_map - map_kpa) / 25.0) ** 2
            if mafv is not None and r_mafv is not None:
                d_sq += ((r_mafv - mafv) / 0.4) ** 2
            if mat is not None and r_mat is not None:
                d_sq += ((r_mat - mat) / 15.0) ** 2
            if vbatt is not None and r_vbatt is not None:
                d_sq += ((r_vbatt - vbatt) / 1.0) ** 2
            dist = math.sqrt(d_sq)
            sim_pct = 100.0 / (1.0 + dist)
            scored.append((dist, sim_pct, row))

        scored.sort(key=lambda x: (round(x[0], 4), -x[2][11], -x[2][10], -x[2][2]))
        print(f"\n[+] Top {min(top_k, len(scored))} Nearest Historical Operating States:")
        for rank, (dist, sim_pct, r) in enumerate(scored[:top_k], 1):
            (sid, lid, rid, rname, regime, r_rpm, r_map, r_mafv, r_mat, r_vbatt,
             samples, steady, avg_afr, afrmap, err, trim, clamp, k_gen, k_flut, timing,
             dom_gear, rom_maf, rom_ve, rom_mat, rom_tim, max_whp, idc) = r
            err_pct = (err - 1.0) * 100.0
            print(f"\n  #{rank}. Similarity: {sim_pct:5.1f}% (Dist: {dist:.2f}) | Regime: {regime} | Gear: {dom_gear}")
            print(f"      ROM {rid}: {rname[:42]} (Log {lid})")
            print(f"      State Coordinates: {r_rpm:5.0f} RPM | {r_map:5.1f} kPa | MAFV={r_mafv:5.3f}V | MAT={r_mat:2d}°C | Vbatt={r_vbatt:4.1f}V")
            print(f"      Precomputed ROM  : MAF={rom_maf:5.1f} g/s | MAP VE={rom_ve:5.1f}% | MAT Mult={rom_mat:6.2f}% | HiTim={rom_tim:4.1f}°")
            print(f"      Fuel & Power     : AFR={avg_afr:5.2f} (Tgt {afrmap:5.2f}, Err {err_pct:+5.2f}%) | Trim={trim:+5.1f}% | IDC={idc:4.1f}% | WHP={max_whp:5.1f}")
            print(f"      Spark & Clamping : Timing={timing:4.1f}° | GenKnock={k_gen} | FlutKnock={k_flut} | Clamp={clamp:4.1f}% | N={samples} ({steady} steady)")

    print("\n" + "=" * 72)
    conn.close()


def run_audit_injectors(db_path):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 72)
    print("           INJECTOR DYNAMICS & VOLTAGE LATENCY AUDIT")
    print("=" * 72)

    cur.execute("""
    SELECT
        vbatt_bucket,
        SUM(sample_count) as total_samples,
        AVG(avg_total_trim) as mean_trim,
        AVG(avg_ipw_ms) as mean_ipw,
        AVG(avg_rom_latency_ms) as mean_lat
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
        print("  Vbatt Bucket | Samples | Mean Total Trim | Mean IPW | ROM Latency")
        print("  " + "-" * 66)
        for v_b, samples, trim, ipw, lat in volt_rows:
            print(f"    {v_b:5.1f}V      | {samples:>7,} | {trim:+10.2f}%     | {ipw:5.2f} ms |   {lat:5.3f} ms")

        trims = [r[2] for r in volt_rows]
        trim_span = max(trims) - min(trims)
        print(f"\n  Voltage Trim Disparity Span: {trim_span:.2f}%")
        if trim_span > 4.0:
            print("  [!] DIAGNOSIS: Significant fuel trim drift across battery voltages detected!")
            print("      Action: Adjust 'Injector Battery Voltage Latency Compensation' (0x556d0).")
        else:
            print("  [+] PASS: Injector latency compensation is well-balanced across electrical load.")

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
            print(f"  - ROM {r_id:2d} ({r_name[:40]:<40}): {scale:.1f} cc/min")

    print("=" * 72)
    conn.close()


def run_audit_thermal(db_path):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 72)
    print("        THERMAL INVARIANCE & MAT HEAT-SOAK AUDIT")
    print("=" * 72)

    cur.execute("""
    SELECT
        mat_bucket,
        SUM(sample_count) as total_samples,
        AVG(avg_afr) as mean_afr,
        AVG(avg_afrmap) as mean_afrmap,
        AVG(avg_afr_error) as mean_error,
        AVG(avg_rom_mat_comp_mult) as mean_mat_mult
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
        print("  MAT Temp | Samples | Witnessed AFR | Target AFRMAP | ROM MAT Mult | Thermal Error")
        print("  " + "-" * 78)
        for mat_b, samples, afr, afrmap, err, mat_mult in mat_rows:
            err_pct = (err - 1.0) * 100.0
            print(f"    {mat_b:3d}°C  | {samples:>7,} | {afr:8.2f}      | {afrmap:8.2f}      |   {mat_mult:6.2f}%    | {err_pct:+8.2f}%")

        if len(mat_rows) >= 2:
            cold_err = (mat_rows[0][4] - 1.0) * 100.0
            hot_err = (mat_rows[-1][4] - 1.0) * 100.0
            drift = hot_err - cold_err
            print(f"\n  Thermal Drift Gradient: {drift:+.2f}% from {mat_rows[0][0]}°C to {mat_rows[-1][0]}°C.")
            if abs(drift) > 4.0:
                print("  [!] DIAGNOSIS: Heat-soak drift detected across ambient/intake temperatures!")
                print("      Action: Calibrate 'Fuel Compensation MAT vs MAP' (0x60fcd) toward cold witnessed baseline.")
            else:
                print("  [+] PASS: Thermal invariance satisfied (AFR remains stable across MAT).")

    print("=" * 72)
    conn.close()


def run_audit_events(db_path):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 72)
    print("           OPERATIONAL ANOMALY EVENTS LEDGER AUDIT")
    print("=" * 72)

    cur.execute("""
    SELECT event_type, COUNT(*), AVG(severity), MAX(severity)
    FROM operational_events
    GROUP BY event_type
    ORDER BY COUNT(*) DESC;
    """)
    rows = cur.fetchall()

    if not rows:
        print("[*] No operational anomaly events logged in database.")
        conn.close()
        return

    print("\n[+] Recorded Anomaly Event Counts:")
    for etype, cnt, avg_sev, max_sev in rows:
        print(f"  - {etype:<25}: {cnt:>4} events | Mean Severity: {avg_sev:5.2f} | Max: {max_sev:5.2f}")

    # Knock Confidence Rule Breakdown (Isolated 1-count vs Multi-count / Repeated)
    cur.execute("""
    SELECT r.rom_name, e.rpm, e.map_kpa, e.severity, e.detail_json, d.log_name
    FROM operational_events e
    JOIN roms r ON e.rom_id = r.rom_id
    JOIN datalogs d ON e.log_id = d.log_id
    WHERE e.event_type = 'KNOCK_GENUINE_TIMING'
    ORDER BY e.event_id ASC;
    """)
    gen_knocks = cur.fetchall()
    if gen_knocks:
        single_cnt = sum(1 for g in gen_knocks if g[3] <= 1.0)
        multi_cnt = sum(1 for g in gen_knocks if g[3] >= 2.0)
        print(f"\n[+] Genuine Knock Confidence Breakdown ({len(gen_knocks)} total):")
        print(f"  - Isolated 1-Count Inceptions (logged for tracking, hold 0° if <25% visit rate): {single_cnt}")
        print(f"  - High-Severity Multi-Count Inceptions (delta_knock >= 2, mandatory -1° retard) : {multi_cnt}")

    print("\n[+] Most Recent 15 Operational Events:")
    cur.execute("""
    SELECT r.rom_name, d.log_name, e.time_sec, e.event_type, e.rpm, e.map_kpa, e.mafv,
           e.afr, e.afrmap, e.severity, e.confidence, e.detail_json
    FROM operational_events e
    JOIN roms r ON e.rom_id = r.rom_id
    JOIN datalogs d ON e.log_id = d.log_id
    ORDER BY d.log_time DESC, e.time_sec DESC
    LIMIT 15;
    """)
    for row in cur.fetchall():
        rname, lname, t, etype, rpm, kpa, mafv, afr, afrmap, sev, conf, djson = row
        short_rom = rname[-16:] if len(rname) > 16 else rname
        gear = "?"
        try:
            gear = json.loads(djson or "{}").get("gear", "?")
        except Exception:
            pass
        print(f"  [{short_rom:<16}] t={t:6.1f}s | {etype:<22} | G{gear:<2} | {rpm:5.0f} RPM | {kpa:5.1f} kPa | AFR={afr:4.1f}/{afrmap:4.1f} | Sev={sev:4.1f}")

    print("=" * 72)
    conn.close()


def run_audit_health(db_path):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 88)
    print("       MULTI-DOMAIN POWERTRAIN HEALTH, DFCO OVERRUN & VIRTUAL DYNO PROGRESSION")
    print("=" * 88)

    cur.execute("""
    SELECT
        r.rom_id, r.rom_name,
        COUNT(DISTINCT d.log_id) as logs_cnt,
        COALESCE(SUM(d.total_records), 0) as total_frames,
        COALESCE(MAX(d.peak_whp), 0.0) as max_whp,
        COALESCE(MAX(d.peak_wtq), 0.0) as max_wtq,
        COALESCE(SUM(d.decel_cut_frames), 0) as dfco_cuts,
        COALESCE(SUM(d.decel_leak_frames), 0) as dfco_leaks
    FROM roms r
    LEFT JOIN datalogs d ON r.rom_id = d.rom_id
    GROUP BY r.rom_id
    ORDER BY r.file_mtime ASC;
    """)
    rom_rows = cur.fetchall()

    print("\n[+] Chronological ROM Calibration Progression:")
    print("  ROM | Name                       | Logs | Frames  | Cruise Err | Clamp% | GenK | FlutK | DFCO Cut/Leak | Peak WHP/WTQ | Max IDC")
    print("  " + "-" * 118)
    for rid, rname, lcnt, frames, whp, wtq, cuts, leaks in rom_rows:
        cur.execute("""
        SELECT
            AVG(CASE WHEN regime = 'STEADY_CRUISE' THEN (avg_afr_error - 1.0) * 100.0 END),
            AVG(CASE WHEN map_bucket <= 80.0 THEN clamping_rate END),
            COALESCE(SUM(knock_count_genuine), 0),
            COALESCE(SUM(knock_count_flutter), 0),
            COALESCE(MAX(avg_idc_pct), 0.0)
        FROM regime_summaries
        WHERE rom_id = ?;
        """, (rid,))
        srow = cur.fetchone()
        c_err = srow[0] if srow and srow[0] is not None else 0.0
        clamp = srow[1] if srow and srow[1] is not None else 0.0
        gk = srow[2] if srow else 0
        fk = srow[3] if srow else 0
        midc = srow[4] if srow else 0.0
        short_name = rname[-26:] if len(rname) > 26 else rname
        err_s = f"{c_err:+6.2f}%" if lcnt > 0 else "   N/A "
        clamp_s = f"{clamp:5.1f}%" if lcnt > 0 else "  N/A "
        print(f"  {rid:3d} | {short_name:<26} | {lcnt:4d} | {frames:7,d} |   {err_s}  | {clamp_s} | {gk:4d} | {fk:5d} | {cuts:6,d}/{leaks:<5,d} | {whp:5.1f}/{wtq:<5.1f} | {midc:5.1f}%")

    # Decel Overrun Fuel Leakage Hotspots
    cur.execute("""
    SELECT dominant_gear, rpm_bucket, map_bucket, SUM(decel_leak_count) as leaks, AVG(avg_ipw_ms), AVG(avg_afr)
    FROM regime_summaries
    WHERE decel_leak_count > 0
    GROUP BY dominant_gear, rpm_bucket, map_bucket
    ORDER BY leaks DESC
    LIMIT 8;
    """)
    leak_rows = cur.fetchall()
    if leak_rows:
        print("\n[+] Overrun Decel Fuel Leakage Hotspots (Closed Pedal > 1.25s in Gear, Warm, RPM >= 1900):")
        for gear, rpm_b, map_b, leaks, ipw, afr in leak_rows:
            print(f"  - Gear {gear:<2} | ~{rpm_b:4d} RPM @ {map_b:4.0f} kPa : {leaks:4d} frames (Mean IPW={ipw:.2f}ms, AFR={afr:.1f})")
    else:
        print("\n[+] Overrun Decel Fuel Cut (DFCO): Clean across all drives (zero sustained overrun injector leaks).")

    # MIVEC VVT Tracking Check
    cur.execute("""
    SELECT AVG(ABS(avg_in_vvt_err)), AVG(ABS(avg_ex_vvt_err))
    FROM regime_summaries
    WHERE regime IN ('STEADY_CRUISE', 'WOT_BOOST', 'SPOOL_RAMP');
    """)
    vvt = cur.fetchone()
    if vvt and vvt[0] is not None:
        print(f"\n[+] MIVEC Cam Phaser Tracking Error (Mean Abs): Intake = {vvt[0]:.2f}° | Exhaust = {vvt[1]:.2f}°")

    print("=" * 88)
    conn.close()


def main():
    parser = argparse.ArgumentParser(description="Calibration Experience Database Query, Audit & Veto Engine")
    parser.add_argument("--db", default=DEFAULT_DB_PATH, help=f"Path to SQLite database (default: {DEFAULT_DB_PATH})")
    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    # 1. forward-check
    p_fwd = subparsers.add_parser("forward-check", help="Pre-flash sanity check & veto for proposed table values")
    p_fwd.add_argument("--table", required=True, help="Table name (e.g. maf_scaling, map_load_calc_1, injector_latency)")
    p_fwd.add_argument("--axis-x", type=float, required=True, help="X Axis coordinate (e.g. Volts, MAP kPa, Vbatt)")
    p_fwd.add_argument("--axis-y", type=float, default=0.0, help="Y Axis coordinate (e.g. RPM, MAT °C)")
    p_fwd.add_argument("--proposed", type=float, required=True, help="Proposed table cell value to test")
    p_fwd.add_argument("--tolerance-pct", type=float, default=5.0, help="Veto warning proximity tolerance (default: 5.0%%)")

    # 2. reverse-match
    p_rev = subparsers.add_parser("reverse-match", help="Reverse diagnostic search: find best historical ROM for operating point")
    p_rev.add_argument("--rpm", type=float, required=True, help="Engine RPM target")
    p_rev.add_argument("--map", type=float, required=True, help="Manifold pressure MAP kPa target")
    p_rev.add_argument("--mat", type=float, help="Optional MAT °C")
    p_rev.add_argument("--gear", help="Optional Gear filter (1, 2, 3, 4, 5, IDLE_STATIONARY)")
    p_rev.add_argument("--metric", default="min_afr_error", choices=["min_afr_error", "zero_knock", "trim_balance", "max_whp"])
    p_rev.add_argument("--top-k", type=int, default=3, help="Number of winning ROMs to display (default: 3)")

    # 3. find-similar
    p_sim = subparsers.add_parser("find-similar", help="State-space k-NN search: find nearest operating states or events")
    p_sim.add_argument("--rpm", type=float, required=True, help="Engine RPM target")
    p_sim.add_argument("--map", type=float, required=True, help="Manifold pressure MAP kPa target")
    p_sim.add_argument("--mafv", type=float, help="Optional MAF Sensor Voltage target (e.g. 2.50V)")
    p_sim.add_argument("--mat", type=float, help="Optional MAT °C")
    p_sim.add_argument("--vbatt", type=float, help="Optional Battery Voltage (e.g. 13.8V)")
    p_sim.add_argument("--gear", help="Optional Gear filter (1, 2, 3, 4, 5)")
    p_sim.add_argument("--top-k", type=int, default=5, help="Number of nearest neighbors to return (default: 5)")
    p_sim.add_argument("--events-only", action="store_true", help="Search operational anomaly events ledger instead of regimes")

    # 4. audit-injectors
    subparsers.add_parser("audit-injectors", help="Analyze trims vs battery voltage and pulse width for latency/scaling tuning")

    # 5. audit-thermal
    subparsers.add_parser("audit-thermal", help="Analyze AFR drift across MAT temperatures for heat-soak comp tuning")

    # 6. audit-events
    subparsers.add_parser("audit-events", help="Inspect all recorded anomaly events (knock, flutter, overrun leaks)")

    # 7. audit-health (and alias audit-decel)
    subparsers.add_parser("audit-health", help="ROM-by-ROM progression, DFCO overrun fuel leakage, Virtual Dyno WHP/WTQ, IDC & VVT")
    subparsers.add_parser("audit-decel", help="Alias for audit-health focusing on DFCO overrun fuel cuts vs injector leaks")

    args = parser.parse_args()

    if args.subcommand == "forward-check":
        run_forward_check(args.db, args.table, args.axis_x, args.axis_y, args.proposed, args.tolerance_pct)
    elif args.subcommand == "reverse-match":
        run_reverse_match(args.db, args.rpm, args.map, args.mat, args.gear, args.metric, args.top_k)
    elif args.subcommand == "find-similar":
        run_find_similar(args.db, args.rpm, args.map, args.mafv, args.mat, args.vbatt, args.gear, args.top_k, args.events_only)
    elif args.subcommand == "audit-injectors":
        run_audit_injectors(args.db)
    elif args.subcommand == "audit-thermal":
        run_audit_thermal(args.db)
    elif args.subcommand == "audit-events":
        run_audit_events(args.db)
    elif args.subcommand in ("audit-health", "audit-decel"):
        run_audit_health(args.db)


if __name__ == "__main__":
    main()
