#!/usr/bin/env python3
"""
experience_query.py - Calibration Experience Database Query, Audit, Investigation & Veto Engine

Provides forward validation (pre-flash sanity check/veto), state-space k-NN vector search,
reverse diagnostic lookup, anomaly episode trace investigation, and multi-domain pure Open-Loop
health audits against the rehydrated SQLite experience database (tuning_tools/db/calibration_experience.db):

Modes:
  1. forward-check      : Pre-flash veto, unvisited-bin guard, secant bracket root, & MAF boost headroom check.
  2. reverse-match      : Which historical ROM performed best at this (RPM, MAP, MAT, Gear) point?
  3. find-similar       : State-space k-NN similarity search across regimes or anomaly episodes/events.
  4. audit-injectors    : Pure Open-Loop AFR error vs IPW (Scaling vs Deadtime) & Vbatt latency audit.
  5. audit-thermal      : 3-Way Decoupled Thermal Audit (Within-Drive ECT vs Manifold MAT Heat-Soak vs Seasonal IAT).
  6. audit-maf-envelope : 130-bin MAF curve monotonicity/flat-line kink audit + 1D MAF/MAP aliasing & boost headroom ledger.
  7. audit-regressions  : Inter-ROM bucket regression detector + Intra-ROM drive-to-drive consistency split.
  8. investigate        : Contiguous anomaly episode browser & frame-by-frame telemetry trace inspector.
  9. audit-events       : Operational anomaly episodes & events ledger (Genuine knock w/ 1-count rule, flutter, overrun).
 10. audit-health       : Chronological ROM progression, weather envelope, DFCO overrun status, Virtual Dyno & VVT.
"""

import argparse
import csv
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


def _table_exists(cur, name):
    cur.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?;", (name,))
    return cur.fetchone() is not None


def _column_exists(cur, table, col):
    cur.execute(f"PRAGMA table_info({table});")
    return any(r[1] == col for r in cur.fetchall())


def run_forward_check(db_path, table_name, axis_x, axis_y, proposed_val, tolerance_pct=5.0):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 78)
    print(f"  FORWARD TABLE CHECK: {table_name.upper()} @ X={axis_x}, Y={axis_y}")
    print(f"  Proposed Value: {proposed_val}")
    print("=" * 78)

    if table_name == "maf_scaling":
        x_tol, y_tol = 0.04, 1.0
    elif table_name == "injector_latency":
        x_tol, y_tol = 0.8, 1.0
    elif table_name in ("ect_fuel_comp_1", "ect_fuel_comp_2"):
        x_tol, y_tol = 10.0, 8.0
    elif table_name in ("fuel_comp_mat_vs_map", "fuel_comp_mat_vs_map_gui"):
        x_tol, y_tol = 15.0, 12.0
    else:
        x_tol, y_tol = 8.0, 300.0

    cur.execute("""
    SELECT r.rom_id, r.rom_name, t.row_idx, t.col_idx, t.axis_x, t.axis_y, t.cell_value
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

    by_rom = {}
    for rom_id, rom_name, row_idx, col_idx, ax, ay, cell_val in rom_cells:
        d = abs(ax - axis_x) + abs(ay - axis_y) * 0.001
        if rom_id not in by_rom or d < by_rom[rom_id][0]:
            by_rom[rom_id] = (d, rom_id, rom_name, row_idx, col_idx, ax, ay, cell_val)

    has_maf_exp = _table_exists(cur, "maf_bin_experience")
    has_quasi_exp = has_maf_exp and _column_exists(cur, "maf_bin_experience", "quasi_vac_samples")
    has_map_exp = _table_exists(cur, "map_cell_experience")
    print("\n[+] Historical ROM Calibration Values & Pure Open-Loop Telemetry:")
    history_data = []
    total_maf_unc = 0
    total_maf_quasi = 0
    total_maf_als = 0
    total_maf_bst = 0
    total_map_samples = 0
    total_map_weight = 0.0
    boost_true_gs_vals = []
    v318_gs_at_bin = None
    v318_map_at_cell = None
    latest_cell_val = None
    matched_row_idx = None
    matched_col_idx = None

    for _, rom_id, rom_name, row_idx, col_idx, ax, ay, cell_val in by_rom.values():
        matched_row_idx = row_idx
        matched_col_idx = col_idx
        latest_cell_val = cell_val
        if "V3.18" in rom_name:
            v318_gs_at_bin = cell_val
            v318_map_at_cell = cell_val
        if table_name == "maf_scaling" and has_maf_exp:
            if has_quasi_exp:
                cur.execute("""
                SELECT COALESCE(SUM(unclamped_vac_samples), 0),
                       CASE WHEN SUM(unclamped_vac_samples) > 0
                            THEN SUM(unclamped_vac_samples * avg_unclamped_afr_err) / SUM(unclamped_vac_samples)
                            ELSE 1.0 END,
                       COALESCE(SUM(quasi_vac_samples), 0),
                       CASE WHEN SUM(quasi_vac_samples) > 0
                            THEN SUM(quasi_vac_samples * avg_quasi_afr_err) / SUM(quasi_vac_samples)
                            ELSE 1.0 END,
                       COALESCE(SUM(alias_vac_samples), 0),
                       COALESCE(SUM(boost_sd_samples), 0),
                       CASE WHEN SUM(boost_sd_samples) > 0
                            THEN SUM(boost_sd_samples * avg_boost_map_to_maf) / SUM(boost_sd_samples)
                            ELSE 0.0 END,
                       CASE WHEN SUM(boost_sd_samples) > 0
                            THEN SUM(boost_sd_samples * avg_boost_true_gs) / SUM(boost_sd_samples)
                            ELSE 0.0 END
                FROM maf_bin_experience
                WHERE rom_id = ? AND bin_idx = ?;
                """, (rom_id, col_idx))
                unc_n, unc_err, quasi_n, quasi_err, als_n, bst_n, bst_rat, bst_tgs = cur.fetchone()
            else:
                cur.execute("""
                SELECT COALESCE(SUM(unclamped_vac_samples), 0),
                       CASE WHEN SUM(unclamped_vac_samples) > 0
                            THEN SUM(unclamped_vac_samples * avg_unclamped_afr_err) / SUM(unclamped_vac_samples)
                            ELSE 1.0 END,
                       COALESCE(SUM(alias_vac_samples), 0),
                       COALESCE(SUM(boost_sd_samples), 0),
                       CASE WHEN SUM(boost_sd_samples) > 0
                            THEN SUM(boost_sd_samples * avg_boost_map_to_maf) / SUM(boost_sd_samples)
                            ELSE 0.0 END,
                       CASE WHEN SUM(boost_sd_samples) > 0
                            THEN SUM(boost_sd_samples * avg_boost_true_gs) / SUM(boost_sd_samples)
                            ELSE 0.0 END
                FROM maf_bin_experience
                WHERE rom_id = ? AND bin_idx = ?;
                """, (rom_id, col_idx))
                unc_n, unc_err, als_n, bst_n, bst_rat, bst_tgs = cur.fetchone()
                quasi_n, quasi_err = 0, 1.0

            total_maf_unc += unc_n
            total_maf_quasi += quasi_n
            total_maf_als += als_n
            total_maf_bst += bst_n
            if bst_n > 0 and bst_tgs > 0:
                boost_true_gs_vals.append(bst_tgs)

            eff_vac_n = unc_n if unc_n > 0 else quasi_n
            eff_vac_err = unc_err if unc_n > 0 else quasi_err
            err_pct = (eff_vac_err - 1.0) * 100.0
            history_data.append({
                "rom_id": rom_id, "rom_name": rom_name, "cell_val": cell_val,
                "sample_count": eff_vac_n, "steady_count": unc_n,
                "afr": 14.7 * eff_vac_err, "afrmap": 14.7, "err_pct": err_pct,
                "als_n": als_n, "bst_n": bst_n, "bst_rat": bst_rat, "bst_tgs": bst_tgs,
            })
            if unc_n > 0:
                unc_str = f"{(unc_err - 1.0) * 100.0:+5.2f}% (N={unc_n:>4})"
            elif quasi_n > 0:
                unc_str = f"{(quasi_err - 1.0) * 100.0:+5.2f}% (Q={quasi_n:>4})"
            else:
                unc_str = "No Unclamped Vac"
            bst_str = f" | BoostSD N={bst_n:>3} (MAP/MAF={bst_rat:.2f}, True={bst_tgs:.1f}g/s)" if bst_n > 0 else ""
            als_str = f" | AliasN={als_n}" if als_n > 0 else ""
            print(f"  - ROM {rom_id:2d} ({rom_name[:30]:<30}) [Bin {col_idx:3d} @ {ax:.3f}V]: {cell_val:7.2f} g/s | {unc_str}{als_str}{bst_str}")
            continue

        if table_name in ("map_load_calc_1", "map_load_calc_2") and has_map_exp:
            cur.execute("""
            SELECT COALESCE(SUM(sample_count), 0),
                   COALESCE(SUM(weight_sum), 0.0),
                   CASE WHEN SUM(weight_sum) > 0
                        THEN SUM(weight_sum * avg_true_over_mapc) / SUM(weight_sum)
                        ELSE 1.0 END,
                   CASE WHEN SUM(weight_sum) > 0
                        THEN SUM(weight_sum * avg_afr_error) / SUM(weight_sum)
                        ELSE 1.0 END
            FROM map_cell_experience
            WHERE rom_id = ? AND row_idx = ? AND col_idx = ?;
            """, (rom_id, row_idx, col_idx))
            m_n, m_ws, m_tom, m_err = cur.fetchone()
            total_map_samples += m_n
            total_map_weight += m_ws
            err_pct = (m_err - 1.0) * 100.0
            history_data.append({
                "rom_id": rom_id, "rom_name": rom_name, "cell_val": cell_val,
                "sample_count": m_n, "steady_count": int(round(m_ws)),
                "afr": 14.7 * m_err, "afrmap": 14.7, "err_pct": err_pct,
                "tom": m_tom, "ws": m_ws,
            })
            if m_n > 0:
                m_str = f"Err={err_pct:+5.2f}% | True/MAPC={m_tom:.3f}x | TrueVE={cell_val * m_tom:5.1f}% (N={m_n:>4}, W={m_ws:5.1f})"
            else:
                m_str = "No Cell Telemetry (N=0)"
            print(f"  - ROM {rom_id:2d} ({rom_name[:28]:<28}) [R{row_idx:02d}:{ay:4.0f}RPM x C{col_idx:02d}:{ax:5.1f}kPa]: {cell_val:5.1f}% | {m_str}")
            continue

        if table_name == "maf_scaling":
            cur.execute("""
            SELECT SUM(sample_count), SUM(steady_sample_count), AVG(avg_afr), AVG(avg_afrmap),
                   AVG(avg_afr_error), SUM(knock_count_genuine), SUM(knock_count_flutter)
            FROM regime_summaries
            WHERE rom_id = ? AND ABS(mafv_bucket - ?) <= 0.06 AND usable_maf_count > 0
            """, (rom_id, ax))
        elif table_name in ("map_load_calc_1", "map_load_calc_2"):
            cur.execute("""
            SELECT SUM(sample_count), SUM(steady_sample_count), AVG(avg_afr), AVG(avg_afrmap),
                   AVG(avg_afr_error), SUM(knock_count_genuine), SUM(knock_count_flutter)
            FROM regime_summaries
            WHERE rom_id = ? AND ABS(map_bucket - ?) <= 12.0 AND ABS(rpm_bucket - ?) <= 350 AND usable_ve_count > 0
            """, (rom_id, ax, ay))
        elif table_name in ("ect_fuel_comp_1", "ect_fuel_comp_2"):
            cur.execute("""
            SELECT SUM(sample_count), SUM(steady_count), AVG(avg_afr), AVG(avg_afrmap),
                   AVG(avg_afr_error), 0, 0
            FROM thermal_summaries
            WHERE rom_id = ? AND ABS(ect_bucket - ?) <= 12
            """, (rom_id, ay))
        elif table_name in ("fuel_comp_mat_vs_map", "fuel_comp_mat_vs_map_gui"):
            cur.execute("""
            SELECT SUM(sample_count), SUM(steady_count), AVG(avg_afr), AVG(avg_afrmap),
                   AVG(avg_afr_error), 0, 0
            FROM thermal_summaries
            WHERE rom_id = ? AND ABS(mat_bucket - ?) <= 12 AND ABS(map_bucket - ?) <= 15.0
            """, (rom_id, ay, ax))
        else:
            cur.execute("""
            SELECT SUM(sample_count), SUM(steady_sample_count), AVG(avg_afr), AVG(avg_afrmap),
                   AVG(avg_afr_error), SUM(knock_count_genuine), SUM(knock_count_flutter)
            FROM regime_summaries
            WHERE rom_id = ? AND ABS(rpm_bucket - ?) <= 350
            """, (rom_id, ay))

        perf = cur.fetchone()
        cnt = perf[0] or 0
        steady_cnt = perf[1] or 0
        afr = perf[2] or 0.0
        afrmap = perf[3] or 14.7
        err = perf[4] or 1.0
        err_pct = (err - 1.0) * 100.0
        history_data.append({
            "rom_id": rom_id, "rom_name": rom_name, "cell_val": cell_val,
            "sample_count": cnt, "steady_count": steady_cnt,
            "afr": afr, "afrmap": afrmap, "err_pct": err_pct,
        })
        err_str = f"{err_pct:+5.2f}%" if cnt > 0 else "No Logs"
        afr_str = f"{afr:5.2f}" if cnt > 0 else "  N/A"
        print(f"  - ROM {rom_id:2d} ({rom_name[:34]:<34}): Val = {cell_val:7.2f} | AFR = {afr_str} | Err = {err_str} | Samples = {cnt:>5}")

    tested_rich = [h for h in history_data if h["sample_count"] >= 8 and h["err_pct"] < -1.5]
    tested_lean = [h for h in history_data if h["sample_count"] >= 8 and h["err_pct"] > +1.5]

    print("\n[+] Empirical Target & Veto Assessment:")
    hazard_found = False

    if table_name == "maf_scaling" and has_maf_exp:
        if total_maf_unc == 0 and total_maf_quasi == 0 and total_maf_bst == 0:
            base_ref = latest_cell_val if latest_cell_val else (v318_gs_at_bin or proposed_val)
            cush_lo = round(base_ref * 1.05, 2)
            cush_hi = round(min(655.35, base_ref * 1.10), 2)
            print("  [*] UNVISITED MAF BIN (N=0 across fleet): Shape-Preserving Interpolation + 5%..10% Safety Cushion Active.")
            print(f"      Latest ROM Value = {base_ref:.2f} g/s | V3.18 Ref = {v318_gs_at_bin or 0.0:.2f} g/s")
            print(f"      Recommended Unvisited +5%..+10% Cushion Band: [{cush_lo:.2f} .. {cush_hi:.2f}] g/s (more fuel, less spark advance)")
            if matched_col_idx is not None and matched_col_idx >= 74 and proposed_val < base_ref - 0.05:
                print(f"  [!] VETO WARNING: Proposed {proposed_val:.2f} g/s reduces an unvisited boost MAF bin below {base_ref:.2f} g/s!")
                hazard_found = True
        elif total_maf_unc == 0 and total_maf_quasi > 0:
            print(f"  [*] Quasi-Steady Vacuum Coverage Active: Strict steady N=0, Steady-Pedal Unclamped Q={total_maf_quasi} samples available.")
        if axis_x <= 2.86 and v318_gs_at_bin and proposed_val > v318_gs_at_bin * 1.14:
            print(f"  [!] VETO WARNING (Safeguard #1): Proposed {proposed_val:.2f} g/s in shared vacuum/spool bin (<=2.86V) exceeds V3.18 ({v318_gs_at_bin:.2f} g/s) by +{(proposed_val / v318_gs_at_bin - 1.0) * 100.0:.1f}%!")
            print("      Shared bins Idx <= 73 must NEVER carry 1.25x boost SD headroom (causes high-RPM vacuum richness & IMAPCalcs spool bog).")
            hazard_found = True
        if axis_x >= 2.89 and boost_true_gs_vals:
            mean_tgs = sum(boost_true_gs_vals) / len(boost_true_gs_vals)
            tgt_headroom = mean_tgs * 1.25
            print("  [*] Boost Speed Density Headroom Check (Volts >= 2.89V):")
            print(f"      Empirical True Boost Airflow = {mean_tgs:.1f} g/s -> 1.25x SD Headroom Target = {tgt_headroom:.1f} g/s")
            if proposed_val < mean_tgs * 1.15:
                print(f"  [!] VETO WARNING: Proposed {proposed_val:.2f} g/s is < 1.15x True Boost Airflow ({mean_tgs * 1.15:.1f} g/s) -> BOOST_MAF_UNDERCUT risk!")
                hazard_found = True
            elif proposed_val > mean_tgs * 1.38:
                print(f"  [!] VETO WARNING: Proposed {proposed_val:.2f} g/s is > 1.38x True Boost Airflow -> Transient IMAPCalcs spool rich bog risk!")
                hazard_found = True

    if table_name in ("map_load_calc_1", "map_load_calc_2") and has_map_exp:
        is_vis_cell = (total_map_samples >= 3 and total_map_weight >= 0.5)
        if not is_vis_cell:
            base_ref = latest_cell_val if latest_cell_val else (v318_map_at_cell or proposed_val)
            v318_ref = v318_map_at_cell if v318_map_at_cell else base_ref
            cush_lo = round(max(base_ref, v318_ref * 1.05), 1)
            cush_hi = round(max(base_ref * 1.05, v318_ref * 1.15), 1)
            print(f"  [*] UNVISITED MAP CELL (Fleet N={total_map_samples}, W={total_map_weight:.2f} < 0.50): Interpolation + 5%..10% Safety Cushion Rule Applies.")
            print(f"      Latest ROM Value = {base_ref:.1f}% | V3.18 Ref = {v318_ref:.1f}% | Proposed = {proposed_val:.1f}% ({proposed_val - base_ref:+.1f}%)")
            print(f"      Expected Unvisited Safety Cushion Range: >= {cush_lo:.1f}% (typically {cush_lo:.1f}%..{cush_hi:.1f}% for extra fuel & conservative spark)")
            if proposed_val < base_ref - 0.1:
                print(f"  [!] VETO WARNING: Proposed {proposed_val:.1f}% reduces an UNVISITED MAP cell below current {base_ref:.1f}% (would advance spark & lean out fuel)!")
                hazard_found = True
        else:
            print(f"  [*] VISITED MAP CELL (Fleet N={total_map_samples}, W={total_map_weight:.1f}): Governed strictly by empirical wideband telemetry (0% unvisited tax).")

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
        print("  [+] PASS: No repeat failure or envelope hazard detected for proposed value.")

    print("=" * 78)
    conn.close()


def run_reverse_match(db_path, rpm, map_kpa, mat=None, gear=None, target_metric="min_afr_error", top_k=3):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 78)
    print(f"  REVERSE DIAGNOSTIC LOOKUP (PURE OPEN-LOOP): RPM={rpm:.0f}, MAP={map_kpa:.1f} kPa"
          + (f", MAT={mat:.0f}°C" if mat is not None else "")
          + (f", Gear={gear}" if gear else ""))
    print(f"  Target Optimization: {target_metric.upper()}")
    print("=" * 78)

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
        "envelope_balance": "mean_clamping ASC, mean_abs_err ASC",
        "trim_balance": "mean_clamping ASC, mean_abs_err ASC",
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
        AVG((s.avg_afr_error - 1.0) * 100.0) as mean_err_pct,
        SUM(s.knock_count_genuine) as total_knock_gen,
        SUM(s.knock_count_flutter) as total_knock_flut,
        AVG(s.clamping_rate) as mean_clamping,
        AVG(s.avg_rom_maf_gs) as mean_rom_maf,
        AVG(s.avg_rom_map_ve_load) as mean_rom_ve,
        AVG(s.avg_rom_mat_comp_mult) as mean_rom_mat,
        AVG(s.avg_rom_ect_comp_pct) as mean_rom_ect,
        AVG(s.avg_rom_timing_high) as mean_rom_tim,
        AVG(s.avg_ect_c) as mean_ect,
        AVG(s.avg_iat_c) as mean_iat,
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

    print(f"\n[+] Top {len(top_roms)} Historical ROMs Achieving Best Open-Loop Operating Results:")
    for rank, row in enumerate(top_roms, 1):
        (rom_id, rom_name, samples, steady, afr, afrmap, abs_err, err_pct,
         k_gen, k_flut, clamp, rom_maf, rom_ve, rom_mat, rom_ect, rom_tim, m_ect, m_iat, p_whp, m_idc) = row
        print(f"\n  #{rank}. ROM {rom_id} - {rom_name}:")
        print(f"      Witnessed AFR       : {afr:.2f} vs AFRMAP {afrmap:.2f} (Err: {err_pct:+.2f}%, Abs: {abs_err:.2f} AFR)")
        print(f"      Thermal & Envelope  : ECT={m_ect:.1f}°C | IAT={m_iat:.1f}°C | Clamping Rate: {clamp:.1f}% | IDC: {m_idc:.1f}%")
        print(f"      Knock Inceptions    : Genuine = {k_gen}, BOV Flutter = {k_flut} | Peak WHP in zone = {p_whp:.1f}")
        print(f"      Precomputed Lookups : MAF={rom_maf:.1f} g/s | MAP VE={rom_ve:.1f}% | MAT Mult={rom_mat:.2f}% | ECT Comp={rom_ect:.1f}% | HiTim={rom_tim:.1f}°")
        print(f"      Sample Evidence     : {samples} frames ({steady} steady)")

    print("\n" + "=" * 78)
    conn.close()


def run_find_similar(db_path, rpm, map_kpa, mafv=None, mat=None, vbatt=None, gear=None, top_k=5, events_only=False):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 78)
    print("  STATE-SPACE k-NN SIMILARITY SEARCH (VECTOR RETRIEVAL)")
    print(f"  Target: RPM={rpm:.0f}, MAP={map_kpa:.1f} kPa"
          + (f", MAFV={mafv:.3f}V" if mafv is not None else "")
          + (f", MAT={mat:.1f}°C" if mat is not None else "")
          + (f", Vbatt={vbatt:.1f}V" if vbatt is not None else "")
          + (f", Gear={gear}" if gear else ""))
    print("=" * 78)

    if events_only and _table_exists(cur, "anomaly_episodes"):
        cur.execute("""
        SELECT
            ep.episode_id, ep.log_id, ep.rom_id, r.rom_name, ep.episode_type,
            ep.start_sec, ep.end_sec, ep.frame_count, ep.gear,
            ep.rpm_start, ep.rpm_end, ep.map_mean, ep.mafv_mean,
            ep.ect_c, ep.iat_c, ep.mat_c, ep.afr_worst, ep.afrmap_mean,
            ep.peak_severity, ep.root_cause, ep.confidence
        FROM anomaly_episodes ep
        JOIN roms r ON ep.rom_id = r.rom_id
        """)
        ep_rows = cur.fetchall()
        if ep_rows:
            scored = []
            for row in ep_rows:
                (epid, lid, rid, rname, etype, ssec, esec, fcnt, r_gear,
                 rpm_s, rpm_e, r_map, r_mafv, r_ect, r_iat, r_mat, afr_w, afrmap, sev, cause, conf) = row
                if gear and str(r_gear) != str(gear):
                    continue
                r_rpm = 0.5 * (rpm_s + rpm_e)
                d_sq = ((r_rpm - rpm) / 800.0) ** 2 + ((r_map - map_kpa) / 25.0) ** 2
                if mafv is not None and r_mafv is not None:
                    d_sq += ((r_mafv - mafv) / 0.4) ** 2
                if mat is not None and r_mat is not None:
                    d_sq += ((r_mat - mat) / 15.0) ** 2
                dist = math.sqrt(d_sq)
                sim_pct = 100.0 / (1.0 + dist)
                scored.append((dist, sim_pct, row))

            scored.sort(key=lambda x: x[0])
            print(f"\n[+] Nearest {min(top_k, len(scored))} Contiguous Anomaly Episodes (use `investigate --episode-id ID` to trace):")
            for rank, (dist, sim_pct, r) in enumerate(scored[:top_k], 1):
                (epid, lid, rid, rname, etype, ssec, esec, fcnt, r_gear,
                 rpm_s, rpm_e, r_map, r_mafv, r_ect, r_iat, r_mat, afr_w, afrmap, sev, cause, conf) = r
                print(f"\n  #{rank}. [Episode #{epid}] Similarity: {sim_pct:5.1f}% | {etype} ({cause})")
                print(f"      ROM {rid}: {rname[:40]} | Log {lid} @ t={ssec:.2f}..{esec:.2f}s ({fcnt} frames, Gear {r_gear})")
                print(f"      State   : {rpm_s:.0f}->{rpm_e:.0f} RPM | {r_map:.1f} kPa | MAFV={r_mafv:.3f}V | ECT={r_ect:.0f}°C IAT={r_iat:.0f}°C MAT={r_mat:.0f}°C")
                print(f"      Outcome : Worst AFR={afr_w:.2f} (Tgt {afrmap:.2f}) | Peak Severity={sev:.2f} | Conf={conf:.2f}")
            print("\n" + "=" * 78)
            conn.close()
            return

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
    else:
        gear_clause = "WHERE s.dominant_gear = ?" if gear else ""
        gear_params = [str(gear)] if gear else []
        cur.execute(f"""
        SELECT
            s.summary_id, s.log_id, s.rom_id, r.rom_name, s.regime,
            s.rpm_bucket, s.map_bucket, s.mafv_bucket, s.mat_bucket, s.vbatt_bucket,
            s.sample_count, s.steady_sample_count, s.avg_afr, s.avg_afrmap,
            s.avg_afr_error, s.avg_ect_c, s.avg_iat_c, s.clamping_rate,
            s.knock_count_genuine, s.knock_count_flutter, s.avg_timing,
            s.dominant_gear, s.avg_rom_maf_gs, s.avg_rom_map_ve_load,
            s.avg_rom_mat_comp_mult, s.avg_rom_ect_comp_pct, s.avg_rom_timing_high, s.max_wheel_hp, s.avg_idc_pct
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
        print(f"\n[+] Top {min(top_k, len(scored))} Nearest Historical Open-Loop Operating States:")
        for rank, (dist, sim_pct, r) in enumerate(scored[:top_k], 1):
            (sid, lid, rid, rname, regime, r_rpm, r_map, r_mafv, r_mat, r_vbatt,
             samples, steady, avg_afr, afrmap, err, r_ect, r_iat, clamp, k_gen, k_flut, timing,
             dom_gear, rom_maf, rom_ve, rom_mat, rom_ect, rom_tim, max_whp, idc) = r
            err_pct = (err - 1.0) * 100.0
            print(f"\n  #{rank}. Similarity: {sim_pct:5.1f}% (Dist: {dist:.2f}) | Regime: {regime} | Gear: {dom_gear}")
            print(f"      ROM {rid}: {rname[:42]} (Log {lid})")
            print(f"      State Coordinates: {r_rpm:5.0f} RPM | {r_map:5.1f} kPa | MAFV={r_mafv:5.3f}V | ECT={r_ect:4.0f}°C IAT={r_iat:3.0f}°C MAT={r_mat:2d}°C | Vbatt={r_vbatt:4.1f}V")
            print(f"      Precomputed ROM  : MAF={rom_maf:5.1f} g/s | MAP VE={rom_ve:5.1f}% | MAT Mult={rom_mat:6.2f}% | ECT Comp={rom_ect:5.1f}% | HiTim={rom_tim:4.1f}°")
            print(f"      Open-Loop Fuel   : AFR={avg_afr:5.2f} (Tgt {afrmap:5.2f}, Err {err_pct:+5.2f}%) | IDC={idc:4.1f}% | WHP={max_whp:5.1f}")
            print(f"      Spark & Clamping : Timing={timing:4.1f}° | GenKnock={k_gen} | FlutKnock={k_flut} | Clamp={clamp:4.1f}% | N={samples} ({steady} steady)")

    print("\n" + "=" * 78)
    conn.close()


def run_audit_injectors(db_path):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 84)
    print("       PURE OPEN-LOOP INJECTOR DYNAMICS (ID1300x SCALING vs LATENCY AUDIT)")
    print("=" * 84)

    cur.execute("""
    SELECT r.rom_id, r.rom_name
    FROM roms r
    JOIN datalogs d ON r.rom_id = d.rom_id
    GROUP BY r.rom_id
    ORDER BY r.file_mtime DESC
    LIMIT 1;
    """)
    latest_rom = cur.fetchone()
    latest_rom_id = latest_rom[0] if latest_rom else None

    # Part A: Open-Loop AFR Error vs IPW Pulse-Width Bracket (Latest ROM + Fleet)
    if latest_rom_id is not None:
        cur.execute("""
        SELECT COALESCE(SUM(usable_injector_count), 0)
        FROM regime_summaries
        WHERE rom_id = ? AND usable_injector_count > 0
          AND avg_ect_c >= 80.0 AND regime = 'STEADY_IDLE' AND map_bucket <= 52.0;
        """, (latest_rom_id,))
        base_idle_n = (cur.fetchone() or [0])[0]
        idle_map_clause = "AND NOT (regime = 'STEADY_IDLE' AND map_bucket > 52.0)" if base_idle_n >= 15 else ""

        cur.execute(f"""
        SELECT
            CASE
                WHEN avg_ipw_ms <= 1.60 THEN '1. Idle/Min IPW (<=1.6ms)'
                WHEN avg_ipw_ms <= 2.20 THEN '2. Light Cruise (1.6-2.2ms)'
                WHEN avg_ipw_ms <= 3.20 THEN '3. Mid Load     (2.2-3.2ms)'
                ELSE                         '4. High Load    (>3.2ms)'
            END AS ipw_band,
            SUM(usable_injector_count) AS inj_n,
            SUM(usable_injector_count * avg_ipw_ms) / SUM(usable_injector_count) AS mean_ipw,
            SUM(usable_injector_count * avg_afr) / SUM(usable_injector_count) AS mean_afr,
            SUM(usable_injector_count * avg_afrmap) / SUM(usable_injector_count) AS mean_tgt,
            SUM(usable_injector_count * avg_afr_error) / SUM(usable_injector_count) AS mean_err
        FROM regime_summaries
        WHERE rom_id = ? AND usable_injector_count > 0
          AND avg_ect_c >= 80.0 AND regime IN ('STEADY_IDLE', 'STEADY_CRUISE')
          {idle_map_clause}
        GROUP BY ipw_band
        HAVING inj_n >= 15
        ORDER BY ipw_band ASC;
        """, (latest_rom_id,))
        ipw_rows = cur.fetchall()
        if ipw_rows:
            print(f"\n[+] Part A: Latest ROM ({latest_rom[1][-28:]}) Open-Loop AFR Error vs Pulse Width (Warm >=80°C, Base-Load Steady):")
            print("  IPW Operating Bracket       | Clean N | Mean IPW | Witnessed AFR | Target | Open-Loop Err")
            print("  " + "-" * 80)
            for band, inj_n, mipw, mafr, mtgt, merr in ipw_rows:
                print(f"  {band:<27} | {inj_n:>7,} | {mipw:5.2f} ms |    {mafr:6.2f}     | {mtgt:6.2f} |   {(merr - 1.0) * 100.0:+6.2f}%")
            if len(ipw_rows) >= 2:
                low_ipw_err = (ipw_rows[0][5] - 1.0) * 100.0
                high_ipw_err = (ipw_rows[-1][5] - 1.0) * 100.0
                skew = low_ipw_err - high_ipw_err
                print(f"\n  Low-vs-High IPW Deadtime Skew: {skew:+.2f}% (Low IPW {low_ipw_err:+.2f}% vs High IPW {high_ipw_err:+.2f}%)")
                if abs(skew) >= 4.0:
                    print("  [!] Note: Strong 1/IPW skew at <=1.6ms indicates low-flow MAF idle bins (1.37-1.55V) or Injector Latency offset.")
                else:
                    print("  [+] PASS: Open-loop fueling linearity across pulse widths is well-balanced (<4% 1/IPW skew).")

        # Idle Manifold-Load Stratification (~50 kPa Base Idle vs >=55 kPa Accessory/A/C Load Idle)
        cur.execute("""
        SELECT
            CASE WHEN map_bucket <= 52.0 THEN 'Base Idle (<=52 kPa)'
                 ELSE 'Elevated / Accessory Idle (>=55 kPa)' END AS idle_tier,
            SUM(sample_count) AS n,
            SUM(sample_count * avg_ipw_ms) / SUM(sample_count) AS mipw,
            SUM(sample_count * mafv_bucket) / SUM(sample_count) AS mmafv,
            SUM(sample_count * avg_afr) / SUM(sample_count) AS mafr,
            SUM(sample_count * avg_afr_error) / SUM(sample_count) AS merr
        FROM regime_summaries
        WHERE rom_id = ? AND avg_ect_c >= 80.0 AND regime = 'STEADY_IDLE'
        GROUP BY idle_tier
        HAVING n >= 15
        ORDER BY idle_tier ASC;
        """, (latest_rom_id,))
        idle_tiers = cur.fetchall()
        if len(idle_tiers) >= 2:
            print("\n  [*] Idle Manifold-Load Stratification (Decoupling Accessory/MAF Load from Injector Latency):")
            for itier, in_cnt, iipw, imafv, iafr, ierr in idle_tiers:
                print(f"      - {itier:<36}: N={in_cnt:>5,} | IPW={iipw:4.2f}ms | MAFV~{imafv:4.2f}V | AFR={iafr:5.2f} ({(ierr - 1.0) * 100.0:+5.2f}%)")
            tier_shift = (idle_tiers[-1][5] - idle_tiers[0][5]) * 100.0
            if abs(tier_shift) >= 3.0:
                print(f"      [!] IDLE LOAD ANOMALY: Elevated-MAP idle shifts {tier_shift:+.2f}% vs base ~50 kPa idle at HIGHER pulse width ({idle_tiers[-1][2]:.2f}ms)!")
                print(f"          Root Cause: MAF Scaling around ~{idle_tiers[-1][3]:.2f}V under accessory/A/C/alternator load — NOT Injector Latency.")

    # Part B: Open-Loop AFR Error vs Battery Voltage at Low IPW (<= 2.2 ms)
    cur.execute("""
    SELECT
        vbatt_bucket,
        SUM(usable_injector_count) as inj_samples,
        SUM(usable_injector_count * (avg_afr_error - 1.0) * 100.0) / SUM(usable_injector_count) as mean_ol_err_pct,
        SUM(usable_injector_count * avg_ipw_ms) / SUM(usable_injector_count) as mean_ipw,
        AVG(avg_rom_latency_ms) as mean_lat
    FROM regime_summaries
    WHERE usable_injector_count > 0
      AND avg_ect_c >= 80.0 AND regime IN ('STEADY_IDLE', 'STEADY_CRUISE')
      AND avg_ipw_ms <= 2.2
    GROUP BY vbatt_bucket
    HAVING inj_samples >= 15
    ORDER BY vbatt_bucket ASC;
    """)
    volt_rows = cur.fetchall()

    if not volt_rows:
        print("\n[*] Single alternator voltage band recorded (~14.2V); insufficient Vbatt spread for multi-point slope test.")
    else:
        print("\n[+] Part B: Open-Loop AFR Sensitivity vs Battery Voltage (Warm Steady, IPW <= 2.2ms):")
        print("  Vbatt Bucket | Clean N | Open-Loop AFR Err | Mean IPW | ROM Latency")
        print("  " + "-" * 68)
        for v_b, samples, ol_err, ipw, lat in volt_rows:
            print(f"    {v_b:5.1f}V      | {samples:>7,} |     {ol_err:+7.2f}%      | {ipw:5.2f} ms |   {lat:5.3f} ms")
        if len(volt_rows) >= 2:
            errs = [r[2] for r in volt_rows]
            span = max(errs) - min(errs)
            print(f"  Voltage Open-Loop AFR Span: {span:.2f}%")
            if span > 4.0:
                print("  [!] DIAGNOSIS: Open-loop AFR shifts across battery voltage -> inspect Injector Latency (0x556D0).")

    cur.execute("""
    SELECT r.rom_id, r.rom_name, t.cell_value
    FROM rom_tables t
    JOIN roms r ON t.rom_id = r.rom_id
    WHERE t.table_name = 'fuel_injector_scaling'
    ORDER BY r.file_mtime DESC
    LIMIT 6;
    """)
    scale_rows = cur.fetchall()
    if scale_rows:
        print("\n[+] Part C: Injector Scaling History (Recent ROMs):")
        for r_id, r_name, scale in scale_rows:
            print(f"  - ROM {r_id:2d} ({r_name[-36:]:<36}): {scale:.1f} cc/min")

    print("=" * 84)
    conn.close()


def run_audit_thermal(db_path):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 88)
    print("     3-WAY DECOUPLED THERMAL AUDIT (ECT WARMUP vs MAT HEAT-SOAK vs SEASONAL IAT)")
    print("=" * 88)

    if not _table_exists(cur, "thermal_summaries"):
        print("[!] thermal_summaries table missing. Run `ingest_experience.py --rehydrate` first.")
        conn.close()
        return

    # Part A: Within-Drive ECT Warmup Isolation (>90s post-crank, ECT < 80C vs Warm >= 82C in SAME log_id)
    cur.execute("""
    WITH warm_ref AS (
        SELECT log_id, map_bucket,
               SUM(sample_count) AS warm_n,
               SUM(sample_count * avg_afr_error) / SUM(sample_count) AS warm_err
        FROM thermal_summaries
        WHERE thermal_regime IN ('COLD_AMBIENT_STEADY', 'WARM_AMBIENT_STEADY')
          AND ect_bucket >= 85
          AND map_bucket BETWEEN 35.0 AND 80.0
        GROUP BY log_id, map_bucket
        HAVING warm_n >= 20
    )
    SELECT
        r.rom_id,
        r.rom_name,
        c.ect_bucket,
        SUM(c.sample_count) AS cold_n,
        SUM(c.sample_count * c.avg_rom_ect_comp) / SUM(c.sample_count) AS rom_ect_pct,
        SUM(c.sample_count * c.avg_afr_error) / SUM(c.sample_count) AS raw_cold_err,
        SUM(c.sample_count * (c.avg_afr_error / w.warm_err)) / SUM(c.sample_count) AS rel_to_warm
    FROM thermal_summaries c
    JOIN warm_ref w ON c.log_id = w.log_id AND c.map_bucket = w.map_bucket
    JOIN roms r ON c.rom_id = r.rom_id
    WHERE c.thermal_regime = 'WARMUP_ECT_ACTIVE'
      AND c.ect_bucket <= 75
      AND c.map_bucket BETWEEN 35.0 AND 80.0
    GROUP BY r.rom_id, c.ect_bucket
    HAVING cold_n >= 15
    ORDER BY r.file_mtime DESC, c.ect_bucket ASC;
    """)
    ect_rows = cur.fetchall()
    print("\n[+] Part A: Within-Drive Coolant Warmup Isolation (`ECT Fuel Comp #1/#2` 0x5ADB9/0x5AF31, >90s Post-Start):")
    if not ect_rows:
        print("  [*] No drives contain both >90s cold-ECT warmup (<80°C) and fully warm (>=85°C) steady vacuum segments.")
    else:
        print("  ROM | ECT Bucket | Samples | ROM ECT Comp% | Raw Cold AFR Err | Within-Drive vs Warm (>=85°C)")
        print("  " + "-" * 82)
        latest_ect_rid = ect_rows[0][0]
        latest_worst_bias = 0.0
        for rid, rname, ect_b, cn, ect_pct, raw_e, rel_e in ect_rows:
            rel_pct = (rel_e - 1.0) * 100.0
            raw_pct = (raw_e - 1.0) * 100.0
            if rid == latest_ect_rid and abs(rel_pct) > abs(latest_worst_bias):
                latest_worst_bias = rel_pct
            print(f"  {rid:3d} |   ~{ect_b:2d}°C    | {cn:>7,} |    {ect_pct:6.2f}%    |     {raw_pct:+6.2f}%      |          {rel_pct:+6.2f}%")
        if latest_worst_bias <= -4.0:
            print(f"  [!] ACTIVE ROM {latest_ect_rid} DIAGNOSIS: Cold coolant (`ECT < 80°C`) runs {latest_worst_bias:+.1f}% RICHER than warm baseline on the SAME drive!")
            print("      Root Cause: `ECT Fuel Compensation #1/#2` (0x5ADB9 / 0x5AF31) over-enriches ID1300x injectors at 34-70°C ECT.")
        elif latest_worst_bias >= 4.0:
            print(f"  [!] ACTIVE ROM {latest_ect_rid} DIAGNOSIS: Cold coolant (`ECT < 80°C`) runs {latest_worst_bias:+.1f}% LEANER than warm baseline -> increase `ECT Fuel Comp`!")
        else:
            print(f"  [+] PASS (Active ROM {latest_ect_rid}): Warmup `ECT` enrichment tracks within +/-4% of fully warm fueling.")

    # Part B: Manifold Heat-Soak, Underhood IAT Soak & Hot-Start Vapor Isolation
    cur.execute("""
    SELECT
        thermal_regime,
        mat_bucket,
        SUM(sample_count) AS n,
        SUM(sample_count * avg_iat_mat_delta) / SUM(sample_count) AS mean_split,
        SUM(sample_count * avg_rom_mat_comp) / SUM(sample_count) AS fw_mat_mult,
        SUM(sample_count * avg_afr) / SUM(sample_count) AS mean_afr,
        SUM(sample_count * avg_afr_error) / SUM(sample_count) AS mean_err
    FROM thermal_summaries
    WHERE thermal_regime IN (
        'COLD_AMBIENT_STEADY', 'WARM_AMBIENT_STEADY',
        'HEATSOAK_FLUSH_SPLIT', 'HEATSOAK_IDLE_SOAK',
        'UNDERHOOD_IAT_HEATSOAK', 'POST_HOT_START_RAIL_SOAK'
    )
      AND ect_bucket >= 75
      AND map_bucket BETWEEN 35.0 AND 80.0
    GROUP BY thermal_regime, mat_bucket
    HAVING n >= 20
    ORDER BY thermal_regime, mat_bucket ASC;
    """)
    mat_rows = cur.fetchall()
    print("\n[+] Part B: Manifold Heat-Soak, Underhood IAT Soak & Hot-Start Vapor Isolation (`0x60FCD` FW Mult = (raw+384)/512):")
    if not mat_rows:
        print("  [*] Insufficient warm steady vacuum frames to evaluate manifold heat-soak split.")
    else:
        print("  Thermal Regime           | MAT Bucket | Samples | MAT-IAT Split | FW MAT Mult | AFR   | Open-Loop Err")
        print("  " + "-" * 86)
        has_vapor_soak = False
        for treg, mat_b, n, split_c, fw_mult, mafr, merr in mat_rows:
            if treg == "POST_HOT_START_RAIL_SOAK":
                has_vapor_soak = True
            print(f"  {treg:<24} |   ~{mat_b:2d}°C    | {n:>7,} |   {split_c:+5.1f}°C     |   {fw_mult:6.2f}%   | {mafr:5.2f} |   {(merr - 1.0) * 100.0:+6.2f}%")
        if has_vapor_soak:
            print("  [*] Safeguard: `POST_HOT_START_RAIL_SOAK` is stationary fuel-rail vapor purge — NEVER enrich `MAT vs MAP` (0x60FCD) for it!")

    # Part C: Seasonal Ambient IAT & Runtime MAPCalcs Density Multiplier
    cur.execute("""
    SELECT
        iat_bucket,
        SUM(sample_count) AS n,
        SUM(sample_count * avg_emp_map_density) / SUM(sample_count) AS emp_k_map,
        SUM(sample_count * avg_afr_error) / SUM(sample_count) AS vac_afr_err
    FROM thermal_summaries
    WHERE thermal_regime IN ('COLD_AMBIENT_STEADY', 'WARM_AMBIENT_STEADY')
      AND ect_bucket >= 85
      AND map_bucket BETWEEN 35.0 AND 90.0
    GROUP BY iat_bucket
    HAVING n >= 25
    ORDER BY iat_bucket ASC;
    """)
    iat_rows = cur.fetchall()
    print("\n[+] Part C: Seasonal Outdoor `IAT` Tracking & Empirical `MAPCalcs / ROM_MAP_Table` Density Gain (Unsoaked Only):")
    if not iat_rows:
        print("  [*] Insufficient multi-weather steady warm samples across IAT buckets.")
    else:
        print("  Outdoor IAT | Samples | Empirical K_MAP_RUNTIME (Nominal 1.090) | Warm Vacuum AFR Err")
        print("  " + "-" * 78)
        for iat_b, n, k_emp, verr in iat_rows:
            k_delta = (k_emp / 1.090 - 1.0) * 100.0
            print(f"    ~{iat_b:3d}°C    | {n:>7,} |       {k_emp:6.4f}x ({k_delta:+5.2f}% vs 1.090)       |      {(verr - 1.0) * 100.0:+6.2f}%")

    # Part D: Active ROM Static `Fuel Comp MAT vs MAP` (0x60FCD) Envelope & Monotonicity Audit
    cur.execute("SELECT rom_id, rom_name FROM roms ORDER BY file_mtime DESC LIMIT 1;")
    lat_rom = cur.fetchone()
    if lat_rom:
        l_rid, l_rname = lat_rom
        cur.execute("""
        SELECT row_idx, col_idx, axis_y, axis_x, cell_value
        FROM rom_tables
        WHERE rom_id = ? AND table_name = 'fuel_comp_mat_vs_map_gui'
        ORDER BY row_idx ASC, col_idx ASC;
        """, (l_rid,))
        mat_cells = cur.fetchall()
        if mat_cells:
            grid = {}
            mat_axes, map_axes = {}, {}
            for r_i, c_i, ay, ax, val in mat_cells:
                grid[(r_i, c_i)] = val
                mat_axes[r_i] = ay
                map_axes[c_i] = ax
            mat_issues = []
            for r_i in (0, 1):
                for c_i in map_axes:
                    v = grid.get((r_i, c_i), 100.0)
                    if abs(v - 100.0) > 0.15:
                        mat_issues.append(f"Cold floor violation at MAT={mat_axes[r_i]:.0f}°C, MAP={map_axes[c_i]:.1f} kPa: {v:.1f}% != 100.0%")
            for r_i in sorted(mat_axes):
                for c_i in sorted(map_axes):
                    v = grid[(r_i, c_i)]
                    if (r_i + 1, c_i) in grid and grid[(r_i + 1, c_i)] < v - 0.05:
                        mat_issues.append(f"Temp dip at MAP={map_axes[c_i]:.1f} kPa: {mat_axes[r_i]:.0f}°C ({v:.1f}%) > {mat_axes[r_i+1]:.0f}°C ({grid[(r_i+1, c_i)]:.1f}%)")
                    if (r_i, c_i + 1) in grid and grid[(r_i, c_i + 1)] > v + 0.05:
                        mat_issues.append(f"Vacuum/boost taper inversion at MAT={mat_axes[r_i]:.0f}°C: {map_axes[c_i]:.1f} kPa ({v:.1f}%) < {map_axes[c_i+1]:.1f} kPa ({grid[(r_i, c_i+1)]:.1f}%)")
                    if mat_axes[r_i] >= 40.0 and map_axes[c_i] >= 129.0 and v > 102.5:
                        fw_g = ((v * 1.28) + 384.0) / 512.0 * 100.0
                        mat_issues.append(f"Positive-boost MAT over-enrichment at {mat_axes[r_i]:.0f}°C x {map_axes[c_i]:.1f} kPa: GUI={v:.1f}% (FW={fw_g:.2f}% vs 100.0% factory)")
            for r_i in sorted(mat_axes):
                if 40.0 <= mat_axes[r_i] <= 60.0 and (r_i, 1) in grid and (r_i, 3) in grid:
                    v_22 = grid[(r_i, 1)]
                    v_49 = grid[(r_i, 3)]
                    if (v_22 - v_49) >= 7.5 or v_49 >= 118.0:
                        mat_issues.append(
                            f"Warm vacuum wall-wetting over-enrichment at {mat_axes[r_i]:.0f}°C: "
                            f"22.1 kPa={v_22:.1f}%, 49.0 kPa={v_49:.1f}% (steep +{v_22 - v_49:.1f}% step drives hot overrun/vacuum richness)"
                        )
            print(f"\n[+] Part D: Static `Fuel Comp MAT vs MAP` (`0x60FCD`) Envelope Audit on ROM {l_rid} ({l_rname[-28:]}):")
            if not mat_issues:
                print("  [+] PASS: Cold floor locked (100%), strictly 2D monotonic, zero boost or vacuum over-enrichment.")
            else:
                for iss in mat_issues[:8]:
                    print(f"  [!] {iss}")

    print("=" * 88)
    conn.close()


def run_audit_maf_envelope(db_path):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 96)
    print("       MAF CURVE MONOTONICITY, FLAT-LINE KINK DETECTOR & 1D ALIAS / BOOST HEADROOM AUDIT")
    print("=" * 96)

    cur.execute("SELECT rom_id, rom_name FROM roms WHERE rom_name LIKE '%V3.18%' LIMIT 1;")
    v318_row = cur.fetchone()
    cur.execute("""
    SELECT r.rom_id, r.rom_name
    FROM roms r
    ORDER BY r.file_mtime DESC
    LIMIT 2;
    """)
    recent_roms = cur.fetchall()
    if not recent_roms:
        print("[*] No ROMs indexed.")
        conn.close()
        return

    latest_id, latest_name = recent_roms[0]
    v318_id = v318_row[0] if v318_row else latest_id

    def fetch_maf(rid):
        cur.execute("SELECT col_idx, axis_x, cell_value FROM rom_tables WHERE rom_id=? AND table_name='maf_scaling' ORDER BY col_idx ASC;", (rid,))
        return {r[0]: (r[1], r[2]) for r in cur.fetchall()}

    maf_lat = fetch_maf(latest_id)
    maf_318 = fetch_maf(v318_id)

    # Detect non-monotonic steps, symmetric shelves, one-sided ramp-to-shelf cliffs & Safeguard #1 shared-bin boost inflation
    kinks = []
    shared_inflations = []
    for i in range(34, 105):
        if i not in maf_lat or (i - 1) not in maf_lat or (i + 1) not in maf_lat:
            continue
        d_curr = maf_lat[i][1] - maf_lat[i - 1][1]
        d_prev = maf_lat[i - 1][1] - maf_lat.get(i - 2, maf_lat[i - 1])[1]
        d_next = maf_lat[i + 1][1] - maf_lat[i][1]
        ref_slope = 0.5 * (max(0.01, d_prev) + max(0.01, d_next))
        max_adj = max(d_prev, d_next)
        if d_curr <= 0.0:
            kinks.append((i, maf_lat[i][0], maf_lat[i - 1][1], maf_lat[i][1], d_curr, "NON_MONOTONIC_INVERSION"))
        elif ref_slope >= 0.80 and d_curr < 0.35 * ref_slope:
            kinks.append((i, maf_lat[i][0], maf_lat[i - 1][1], maf_lat[i][1], d_curr, f"FLAT_LINE_SHELF (step {d_curr:+.2f} vs neighbor avg {ref_slope:+.2f} g/s)"))
        elif max_adj >= 2.50 and d_curr < 0.40 * max_adj:
            kinks.append((i, maf_lat[i][0], maf_lat[i - 1][1], maf_lat[i][1], d_curr, f"RAMP_TO_SHELF_CLIFF (step {d_curr:+.2f} vs adjacent {max_adj:+.2f} g/s)"))

        if 38 <= i <= 73 and i in maf_318 and (i - 1) in maf_318:
            gs318 = maf_318[i][1]
            d318 = gs318 - maf_318[i - 1][1]
            ratio_318 = maf_lat[i][1] / max(0.1, gs318)
            if ratio_318 >= 1.14 or (d318 >= 2.0 and d_curr > 2.20 * d318):
                shared_inflations.append((i, maf_lat[i][0], gs318, maf_lat[i][1], ratio_318, d_curr, d318))

    print(f"\n[+] Curve Geometry & Safeguard #1 Shared-Bin Audit on Latest ROM {latest_id} ({latest_name}):")
    if kinks:
        for idx, v, prev_gs, curr_gs, d_gs, reason in kinks:
            print(f"  [!] Bin {idx:3d} ({v:.3f}V): {prev_gs:.2f} -> {curr_gs:.2f} g/s (Δ={d_gs:+.2f} g/s) | {reason}")
    else:
        print("  [+] PASS: MAF curve is strictly monotonic and free of flat-line / ramp-to-shelf kinks across Idx 34..104.")
    if shared_inflations:
        for idx, v, gs318, curr_gs, rat, d_curr, d318 in shared_inflations:
            print(
                f"  [!] SAFEGUARD #1 SHARED-BIN BOOST INFLATION at Bin {idx:3d} ({v:.3f}V <= 2.854V): "
                f"{curr_gs:.2f} g/s = {rat:.3f}x V3.18 ({gs318:.2f} g/s, step {d_curr:+.2f} vs V3.18 {d318:+.2f} g/s)"
            )
        print("      -> Shared vacuum/spool bins (Idx <= 73) must NOT carry 1.25x SD boost headroom; inflates high-RPM vacuum & causes RICH_SPOOL_BOG.")

    if _table_exists(cur, "maf_bin_experience"):
        has_quasi = _column_exists(cur, "maf_bin_experience", "quasi_vac_samples")
        if has_quasi:
            cur.execute("""
            SELECT
                bin_idx,
                SUM(unclamped_vac_samples) AS unc_n,
                CASE WHEN SUM(unclamped_vac_samples) > 0
                     THEN SUM(unclamped_vac_samples * avg_unclamped_afr_err) / SUM(unclamped_vac_samples)
                     ELSE 1.0 END AS unc_err,
                SUM(quasi_vac_samples) AS quasi_n,
                CASE WHEN SUM(quasi_vac_samples) > 0
                     THEN SUM(quasi_vac_samples * avg_quasi_afr_err) / SUM(quasi_vac_samples)
                     ELSE 1.0 END AS quasi_err,
                SUM(alias_vac_samples) AS als_n,
                CASE WHEN SUM(alias_vac_samples) > 0
                     THEN SUM(alias_vac_samples * avg_alias_afr_err) / SUM(alias_vac_samples)
                     ELSE 1.0 END AS als_err,
                SUM(boost_sd_samples) AS bst_n,
                CASE WHEN SUM(boost_sd_samples) > 0
                     THEN SUM(boost_sd_samples * avg_boost_map_to_maf) / SUM(boost_sd_samples)
                     ELSE 0.0 END AS bst_rat,
                CASE WHEN SUM(boost_sd_samples) > 0
                     THEN SUM(boost_sd_samples * avg_boost_true_gs) / SUM(boost_sd_samples)
                     ELSE 0.0 END AS bst_tgs
            FROM maf_bin_experience
            WHERE rom_id = ?
            GROUP BY bin_idx;
            """, (latest_id,))
            exp_lat = {r[0]: r[1:] for r in cur.fetchall()}

            cur.execute("""
            SELECT
                bin_idx,
                SUM(unclamped_vac_samples) AS unc_n,
                SUM(quasi_vac_samples) AS quasi_n,
                SUM(alias_vac_samples) AS als_n,
                SUM(boost_sd_samples) AS bst_n,
                CASE WHEN SUM(boost_sd_samples) > 0
                     THEN SUM(boost_sd_samples * avg_boost_true_gs) / SUM(boost_sd_samples)
                     ELSE 0.0 END AS bst_tgs
            FROM maf_bin_experience
            GROUP BY bin_idx;
            """)
            exp_all = {r[0]: r[1:] for r in cur.fetchall()}
        else:
            cur.execute("""
            SELECT
                bin_idx,
                SUM(unclamped_vac_samples) AS unc_n,
                CASE WHEN SUM(unclamped_vac_samples) > 0
                     THEN SUM(unclamped_vac_samples * avg_unclamped_afr_err) / SUM(unclamped_vac_samples)
                     ELSE 1.0 END AS unc_err,
                0 AS quasi_n,
                1.0 AS quasi_err,
                SUM(alias_vac_samples) AS als_n,
                CASE WHEN SUM(alias_vac_samples) > 0
                     THEN SUM(alias_vac_samples * avg_alias_afr_err) / SUM(alias_vac_samples)
                     ELSE 1.0 END AS als_err,
                SUM(boost_sd_samples) AS bst_n,
                CASE WHEN SUM(boost_sd_samples) > 0
                     THEN SUM(boost_sd_samples * avg_boost_map_to_maf) / SUM(boost_sd_samples)
                     ELSE 0.0 END AS bst_rat,
                CASE WHEN SUM(boost_sd_samples) > 0
                     THEN SUM(boost_sd_samples * avg_boost_true_gs) / SUM(boost_sd_samples)
                     ELSE 0.0 END AS bst_tgs
            FROM maf_bin_experience
            WHERE rom_id = ?
            GROUP BY bin_idx;
            """, (latest_id,))
            exp_lat = {r[0]: r[1:] for r in cur.fetchall()}

            cur.execute("""
            SELECT
                bin_idx,
                SUM(unclamped_vac_samples) AS unc_n,
                0 AS quasi_n,
                SUM(alias_vac_samples) AS als_n,
                SUM(boost_sd_samples) AS bst_n,
                CASE WHEN SUM(boost_sd_samples) > 0
                     THEN SUM(boost_sd_samples * avg_boost_true_gs) / SUM(boost_sd_samples)
                     ELSE 0.0 END AS bst_tgs
            FROM maf_bin_experience
            GROUP BY bin_idx;
            """)
            exp_all = {r[0]: r[1:] for r in cur.fetchall()}

        kink_set = {k[0] for k in kinks}
        shared_inf_set = {s[0] for s in shared_inflations}
        print(f"\n[+] Bin-by-Bin MAF Experience & Crossover/Boost Envelope (Idx 35..84, Latest ROM {latest_id}; N=Strict Steady, Q=Steady-Pedal Quasi):")
        print("  Idx | Volts  | V3.18  | Latest | ΔStep | Unclamped Vac (Lat) | Alias L/F | Boost SD (Fleet True*1.25) | Diagnostic Status")
        print("  " + "-" * 119)
        for idx in range(35, 85):
            if idx not in maf_lat:
                continue
            v, gs = maf_lat[idx]
            gs318 = maf_318.get(idx, (v, gs))[1]
            step = gs - maf_lat[idx - 1][1] if (idx - 1) in maf_lat else 0.0
            unc_n, unc_err, quasi_n, quasi_err, als_n, als_err, bst_n, bst_rat, bst_tgs = exp_lat.get(
                idx, (0, 1.0, 0, 1.0, 0, 1.0, 0, 0.0, 0.0)
            )
            all_unc, all_quasi, all_als, all_bst, all_tgs = exp_all.get(idx, (0, 0, 0, 0, 0.0))

            if unc_n > 0:
                unc_s = f"N={unc_n:>4} ({(unc_err - 1.0) * 100:+5.1f}%)"
            elif quasi_n > 0:
                unc_s = f"Q={quasi_n:>4} ({(quasi_err - 1.0) * 100:+5.1f}%)"
            elif all_unc > 0:
                unc_s = f"N=   0 (Fleet {all_unc:>4})"
            elif all_quasi > 0:
                unc_s = f"Q=   0 (FltQ  {all_quasi:>4})"
            else:
                unc_s = "N=   0              "
            als_s = f"{als_n:>3}/{all_als:<4}"
            tgs_ref = bst_tgs if bst_n >= 3 else all_tgs
            bst_s = f"N={all_bst:>4} (1.25x={tgs_ref * 1.25:5.1f})" if all_bst > 0 else "N=   0              "

            flags = []
            if idx in kink_set:
                flags.append("SHELF_KINK!")
            if idx in shared_inf_set:
                flags.append("SHARED_BOOST_INFL!")
            if all_unc == 0 and all_quasi == 0 and all_bst == 0:
                flags.append("UNVISITED")
            if (als_n + all_als) > 0 and all_bst > 0:
                flags.append("1D_ALIAS_OVERLAP")
            if idx >= 74 and tgs_ref > 0:
                if gs < tgs_ref * 1.15:
                    flags.append("UNDERCUT_RISK!")
                else:
                    flags.append("SD_HEADROOM_OK")
            elif idx <= 73:
                if unc_n >= 10:
                    flags.append("PURE_VAC_ACTIVE")
                elif quasi_n >= 8:
                    flags.append("QUASI_VAC_ACTIVE")

            status_s = ", ".join(flags) if flags else "TRANSITION"
            print(f"  {idx:3d} | {v:5.3f}V | {gs318:6.2f} | {gs:6.2f} | {step:+5.2f} | {unc_s:<19} | {als_s} | {bst_s:<26} | {status_s}")

        # Part C: Fleet Coverage & Unvisited Interpolation (+5%..+10% Safety Cushion) Summary
        vis_vac_maf = [i for i in range(35, 74) if exp_all.get(i, (0, 0, 0, 0, 0.0))[0] >= 5]
        unvis_vac_maf = [i for i in range(35, 74) if i not in vis_vac_maf]
        vis_bst_maf = [i for i in range(74, 130) if exp_all.get(i, (0, 0, 0, 0, 0.0))[3] >= 5]
        unvis_bst_maf = [i for i in range(74, 130) if i not in vis_bst_maf]
        print(f"\n[+] Part C: Unvisited MAF Bin & MAP Load Calc Cell Coverage (+5%..+10% Safety Cushion Audit):")
        print(
            f"  - MAF Scaling Active Bins (Idx 35..129): {len(vis_vac_maf) + len(vis_bst_maf)}/95 Visited | "
            f"{len(unvis_vac_maf) + len(unvis_bst_maf)}/95 Unvisited "
            f"(Shared Vac/Spool Idx <=73 unvisited: {unvis_vac_maf}; Boost Idx >=74 unvisited: Idx {min(unvis_bst_maf) if unvis_bst_maf else 'None'}..{max(unvis_bst_maf) if unvis_bst_maf else 'None'})"
        )
        if _table_exists(cur, "map_cell_experience"):
            cur.execute("""
            SELECT row_idx, col_idx, SUM(sample_count), SUM(weight_sum)
            FROM map_cell_experience
            GROUP BY row_idx, col_idx
            HAVING SUM(sample_count) >= 3 AND SUM(weight_sum) >= 0.5;
            """)
            vis_map_set = {(r[0], r[1]) for r in cur.fetchall() if r[1] >= 1}
            vac_vis = sum(1 for (r, m) in vis_map_set if 1 <= m <= 5)
            crs_vis = sum(1 for (r, m) in vis_map_set if 6 <= m <= 7)
            bst_vis = sum(1 for (r, m) in vis_map_set if 8 <= m <= 19)
            print(
                f"  - MAP based Load Calc Active Cells (Col 1..19): {len(vis_map_set)}/361 Visited | "
                f"{361 - len(vis_map_set)}/361 Unvisited -> Interpolated + 5%..10% Safety Cushion "
                f"(Vac: {vac_vis}/95 vis, Crossover: {crs_vis}/38 vis, Boost: {bst_vis}/228 vis)"
            )

    print("=" * 96)
    conn.close()


def run_audit_regressions(db_path):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 92)
    print("      CALIBRATION REGRESSION & INTRA-ROM DRIVE-TO-DRIVE CONSISTENCY AUDIT")
    print("=" * 92)

    cur.execute("""
    SELECT r.rom_id, r.rom_name, COUNT(d.log_id) AS lcnt
    FROM roms r
    JOIN datalogs d ON r.rom_id = d.rom_id
    GROUP BY r.rom_id
    HAVING lcnt >= 1
    ORDER BY r.file_mtime DESC
    LIMIT 2;
    """)
    logged_roms = cur.fetchall()
    if not logged_roms:
        print("[*] Insufficient logged ROMs to run regression comparison.")
        conn.close()
        return

    curr_id, curr_name, curr_logs = logged_roms[0]

    # Part A: Inter-ROM Regressions (Latest ROM vs Previous Logged ROM)
    if len(logged_roms) >= 2:
        prev_id, prev_name, _ = logged_roms[1]
        cur.execute("""
        WITH curr_b AS (
            SELECT regime, rpm_bucket, map_bucket,
                   SUM(sample_count) AS n,
                   SUM(sample_count * avg_afr_error) / SUM(sample_count) AS err,
                   SUM(knock_count_genuine) AS gk
            FROM regime_summaries
            WHERE rom_id = ? AND avg_ect_c >= 80.0
              AND regime IN ('STEADY_IDLE', 'STEADY_CRUISE', 'SPOOL_RAMP', 'WOT_BOOST')
            GROUP BY regime, rpm_bucket, map_bucket
            HAVING n >= 15
        ),
        prev_b AS (
            SELECT regime, rpm_bucket, map_bucket,
                   SUM(sample_count) AS n,
                   SUM(sample_count * avg_afr_error) / SUM(sample_count) AS err,
                   SUM(knock_count_genuine) AS gk
            FROM regime_summaries
            WHERE rom_id = ? AND avg_ect_c >= 80.0
              AND regime IN ('STEADY_IDLE', 'STEADY_CRUISE', 'SPOOL_RAMP', 'WOT_BOOST')
            GROUP BY regime, rpm_bucket, map_bucket
            HAVING n >= 15
        )
        SELECT c.regime, c.rpm_bucket, c.map_bucket,
               p.n, p.err, p.gk,
               c.n, c.err, c.gk,
               (ABS(c.err - 1.0) - ABS(p.err - 1.0)) * 100.0 AS worsen_pct
        FROM curr_b c
        JOIN prev_b p ON c.regime = p.regime AND c.rpm_bucket = p.rpm_bucket AND c.map_bucket = p.map_bucket
        WHERE (ABS(c.err - 1.0) - ABS(p.err - 1.0)) >= 0.025 OR c.gk > p.gk
        ORDER BY worsen_pct DESC
        LIMIT 12;
        """, (curr_id, prev_id))
        reg_rows = cur.fetchall()
        print(f"\n[+] Part A: Inter-ROM Regressions — ROM {curr_id} ({curr_name[-24:]}) vs ROM {prev_id} ({prev_name[-24:]}):")
        if not reg_rows:
            print("  [+] PASS: Zero operating buckets worsened by >=2.5% AFR error or genuine knock vs previous ROM!")
        else:
            print("  Regime           | RPM  | MAP   | Prev Err (N)      | Latest Err (N)    | |Err| Delta | Knock P->C")
            print("  " + "-" * 88)
            for reg, rpm_b, map_b, pn, perr, pgk, cn, cerr, cgk, wpct in reg_rows:
                print(f"  {reg:<16} | {rpm_b:4d} | {map_b:5.0f} | {(perr - 1) * 100:+6.2f}% ({pn:>4}) | {(cerr - 1) * 100:+6.2f}% ({cn:>4}) |  {wpct:+6.2f}%    |   {pgk} -> {cgk}")

    # Part B: Intra-ROM Drive-to-Drive Consistency Split (Same ROM, Different Drives / Temps)
    cur.execute("""
    SELECT log_id, log_name, min_ect_c, max_ect_c, mean_iat_c, mean_mat_c
    FROM datalogs
    WHERE rom_id = ?
    ORDER BY log_time ASC;
    """, (curr_id,))
    curr_log_list = cur.fetchall()
    if len(curr_log_list) >= 2:
        l1 = curr_log_list[0]
        l2 = curr_log_list[-1]
        print(f"\n[+] Part B: Same-ROM Drive-to-Drive Split on ROM {curr_id} ({l1[1]} vs {l2[1]}):")
        print(f"    Drive A ({l1[1]}): ECT {l1[2]:.0f}..{l1[3]:.0f}°C | Mean IAT={l1[4]:.1f}°C | Mean MAT={l1[5]:.1f}°C")
        print(f"    Drive B ({l2[1]}): ECT {l2[2]:.0f}..{l2[3]:.0f}°C | Mean IAT={l2[4]:.1f}°C | Mean MAT={l2[5]:.1f}°C")

        cur.execute("""
        WITH da AS (
            SELECT regime, rpm_bucket, map_bucket,
                   SUM(sample_count) AS n,
                   SUM(sample_count * avg_afr_error) / SUM(sample_count) AS err,
                   SUM(sample_count * avg_ect_c) / SUM(sample_count) AS ect,
                   SUM(sample_count * avg_iat_c) / SUM(sample_count) AS iat
            FROM regime_summaries
            WHERE log_id = ? AND avg_ect_c >= 80.0 AND regime IN ('STEADY_IDLE', 'STEADY_CRUISE', 'TRANSIENT_CRUISE')
            GROUP BY regime, rpm_bucket, map_bucket
            HAVING n >= 12
        ),
        db AS (
            SELECT regime, rpm_bucket, map_bucket,
                   SUM(sample_count) AS n,
                   SUM(sample_count * avg_afr_error) / SUM(sample_count) AS err,
                   SUM(sample_count * avg_ect_c) / SUM(sample_count) AS ect,
                   SUM(sample_count * avg_iat_c) / SUM(sample_count) AS iat
            FROM regime_summaries
            WHERE log_id = ? AND avg_ect_c >= 80.0 AND regime IN ('STEADY_IDLE', 'STEADY_CRUISE', 'TRANSIENT_CRUISE')
            GROUP BY regime, rpm_bucket, map_bucket
            HAVING n >= 12
        )
        SELECT a.regime, a.rpm_bucket, a.map_bucket,
               a.err, a.ect, a.iat,
               b.err, b.ect, b.iat,
               (b.err - a.err) * 100.0 AS shift_pct
        FROM da a
        JOIN db b ON a.regime = b.regime AND a.rpm_bucket = b.rpm_bucket AND a.map_bucket = b.map_bucket
        WHERE ABS(b.err - a.err) >= 0.030
        ORDER BY ABS(b.err - a.err) DESC
        LIMIT 10;
        """, (l1[0], l2[0]))
        splits = cur.fetchall()
        if not splits:
            print("  [+] PASS: Drive A and Drive B agree within <3.0% across all matched RPM/MAP buckets!")
        else:
            print("  Regime           | RPM  | MAP  | Drive A Err (ECT/IAT)     | Drive B Err (ECT/IAT)     | B - A Shift")
            print("  " + "-" * 90)
            for reg, rpm_b, map_b, ea, ecta, iata, eb, ectb, iatb, spct in splits:
                print(f"  {reg:<16} | {rpm_b:4d} | {map_b:4.0f} | {(ea - 1) * 100:+6.2f}% ({ecta:3.0f}°/{iata:2.0f}°C)   | {(eb - 1) * 100:+6.2f}% ({ectb:3.0f}°/{iatb:2.0f}°C)   |   {spct:+6.2f}%")

    print("=" * 92)
    conn.close()


def run_investigate(db_path, episode_id=None, ep_type=None, root_cause=None, rom_id=None, trace_latest=False, window_sec=2.5, limit=20):
    conn = get_conn(db_path)
    cur = conn.cursor()

    if not _table_exists(cur, "anomaly_episodes"):
        print("[!] anomaly_episodes table not found. Run `ingest_experience.py --rehydrate` first.")
        conn.close()
        return

    if trace_latest and episode_id is None:
        clauses, params = [], []
        if ep_type:
            clauses.append("ep.episode_type = ?")
            params.append(ep_type)
        if root_cause:
            clauses.append("ep.root_cause = ?")
            params.append(root_cause)
        if rom_id is not None:
            clauses.append("ep.rom_id = ?")
            params.append(rom_id)
        wsql = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        cur.execute(f"""
        SELECT ep.episode_id
        FROM anomaly_episodes ep
        JOIN datalogs d ON ep.log_id = d.log_id
        {wsql}
        ORDER BY d.log_time DESC, ep.peak_severity DESC
        LIMIT 1;
        """, params)
        r = cur.fetchone()
        if r:
            episode_id = r[0]

    if episode_id is None:
        print("\n" + "=" * 124)
        print("                       CONTIGUOUS ANOMALY EPISODES BROWSER (`investigate --episode-id <ID>`)")
        print("=" * 124)
        clauses, params = [], []
        if ep_type:
            clauses.append("ep.episode_type = ?")
            params.append(ep_type)
        if root_cause:
            clauses.append("ep.root_cause = ?")
            params.append(root_cause)
        if rom_id is not None:
            clauses.append("ep.rom_id = ?")
            params.append(rom_id)
        wsql = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        params.append(limit)
        cur.execute(f"""
        SELECT ep.episode_id, ep.rom_id, r.rom_name, d.log_name, ep.episode_type,
               ep.start_sec, ep.end_sec, ep.frame_count, ep.gear,
               ep.rpm_start, ep.rpm_end, ep.map_mean, ep.ect_c, ep.iat_c, ep.mat_c,
               ep.afr_worst, ep.afrmap_mean, ep.peak_severity, ep.root_cause
        FROM anomaly_episodes ep
        JOIN roms r ON ep.rom_id = r.rom_id
        JOIN datalogs d ON ep.log_id = d.log_id
        {wsql}
        ORDER BY d.log_time DESC, ep.start_sec ASC
        LIMIT ?;
        """, params)
        rows = cur.fetchall()
        if not rows:
            print("[*] No matching anomaly episodes found.")
            conn.close()
            return
        print("  EpID | ROM | Log Timestamp       | Window (s)      | Type                     | Root Cause                   | G  | RPM         | MAP   | AFR/Tgt     | Sev")
        print("  " + "-" * 150)
        for row in rows:
            (eid, rid, rname, lname, etype, ssec, esec, fcnt, gear,
             rpms, rpme, mapm, ect, iat, mat, afrw, afrm, sev, cause) = row
            short_log = lname.replace("EvoScanDataLog_", "").replace(".csv", "")
            g_str = gear[:2] if gear != "IDLE_STATIONARY" else "ID"
            print(f"  {eid:4d} | {rid:3d} | {short_log:<19} | {ssec:6.1f}..{esec:<6.1f}s | {etype:<24} | {cause:<28} | {g_str:<2} | {rpms:4.0f}->{rpme:<4.0f} | {mapm:5.1f} | {afrw:5.2f}/{afrm:<5.2f} | {sev:5.1f}")
        print("=" * 124)
        conn.close()
        return

    # Detailed Frame-by-Frame Trace for episode_id
    cur.execute("""
    SELECT ep.episode_id, ep.rom_id, r.rom_name, d.log_name, d.classified_csv_path,
           ep.episode_type, ep.start_row, ep.end_row, ep.start_sec, ep.end_sec,
           ep.frame_count, ep.gear, ep.rpm_start, ep.rpm_end, ep.map_mean, ep.mafv_mean,
           ep.ect_c, ep.iat_c, ep.mat_c, ep.afr_worst, ep.afrmap_mean,
           ep.peak_severity, ep.root_cause, ep.detail_json
    FROM anomaly_episodes ep
    JOIN roms r ON ep.rom_id = r.rom_id
    JOIN datalogs d ON ep.log_id = d.log_id
    WHERE ep.episode_id = ?;
    """, (episode_id,))
    ep = cur.fetchone()
    conn.close()
    if not ep:
        print(f"[!] Episode ID {episode_id} not found.")
        return

    (eid, rid, rname, lname, cpath, etype, srow, erow, ssec, esec,
     fcnt, gear, rpms, rpme, mapm, mafvm, ect, iat, mat, afrw, afrm, sev, cause, djson) = ep

    print("\n" + "=" * 116)
    print(f"  EPISODE #{eid} TELEMETRY TRACE: {etype} (Root Cause: {cause})")
    print(f"  ROM {rid}: {rname} | Log: {lname}")
    print(f"  Window: t={ssec:.2f}s..{esec:.2f}s (Rows {srow}..{erow}, {fcnt} frames) | Gear: {gear} | Temps: ECT={ect:.1f}°C, IAT={iat:.1f}°C, MAT={mat:.1f}°C")
    print(f"  Summary: RPM {rpms:.0f}->{rpme:.0f} | Mean MAP={mapm:.1f} kPa (MAFV={mafvm:.3f}V) | Worst AFR={afrw:.2f} vs Tgt {afrm:.2f} | Peak Sev={sev:.2f}")
    if djson and djson != "{}":
        print(f"  Metadata: {djson}")
    print("=" * 116)

    if not cpath or not os.path.exists(cpath):
        print(f"[!] Classified CSV not found on disk: {cpath}")
        return

    with open(cpath, "r", encoding="latin1") as f:
        rows = list(csv.DictReader(f))

    t_min = ssec - window_sec
    t_max = esec + window_sec
    trace_rows = [
        (idx, r) for idx, r in enumerate(rows)
        if t_min <= float(r.get("LogEntrySeconds") or 0.0) <= t_max
    ]
    # Subsample cleanly if trace exceeds 60 rows while always preserving [srow..erow]
    if len(trace_rows) > 65:
        step = max(1, len(trace_rows) // 50)
        trace_rows = [
            (idx, r) for k, (idx, r) in enumerate(trace_rows)
            if (srow <= idx <= erow) or (k % step == 0)
        ]

    print("  Mark |   Time  |  RPM  | G  |  TPS |  MAP  | MAFV  | MAFC/MAPC/IMAP  | Raw->Algn/Tgt AFR |  IPW | Tim/HiT | Knk | Regime / State")
    print("  " + "-" * 126)
    for idx, r in trace_rows:
        mark = ">>>" if srow <= idx <= erow else "   "
        t = float(r.get("LogEntrySeconds") or 0.0)
        rpm_v = float(r.get("RPM") or 0.0)
        g_v = (r.get("diag_gear") or "?")[:2]
        tps_v = float(r.get("TPS") or 0.0)
        map_v = float(r.get("MAP") or 0.0)
        mafv_v = float(r.get("MAF") or 0.0)
        mafc_v = float(r.get("MAFCalcs") or 0.0)
        mapc_v = float(r.get("MAPCalcs") or 0.0)
        imap_v = float(r.get("IMAPCalcs") or mapc_v)
        afr_raw = float(r.get("AFR") or 0.0)
        afr_alg = float(r.get("diag_aligned_afr") or afr_raw)
        afr_tgt = float(r.get("AFRMAP") or 14.7)
        ipw_v = float(r.get("IPW") or 0.0)
        tim_v = float(r.get("TimingAdv") or 0.0)
        hit_v = float(r.get("diag_rom_timing_high") or 0.0)
        knk_v = float(r.get("KnockSum") or 0.0)
        st_lbl = f"{r.get('diag_operating_regime', '')}/{r.get('diag_thermal_regime', '')}"
        print(
            f"  {mark}  | {t:6.2f}s | {rpm_v:5.0f} | {g_v:<2} | {tps_v:4.1f} | {map_v:5.1f} | {mafv_v:5.3f} | "
            f"{mafc_v:4.0f}/{mapc_v:4.0f}/{imap_v:4.0f} | {afr_raw:4.1f}->{afr_alg:4.1f}/{afr_tgt:4.1f} | "
            f"{ipw_v:4.2f} | {tim_v:3.0f}/{hit_v:<3.0f} | {knk_v:3.0f} | {st_lbl[:30]}"
        )
    print("=" * 116)


def run_audit_events(db_path):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 96)
    print("               OPERATIONAL ANOMALY EPISODES & EVENTS LEDGER AUDIT")
    print("=" * 96)

    cur.execute("""
    SELECT r.rom_id, r.rom_name
    FROM roms r
    JOIN datalogs d ON r.rom_id = d.rom_id
    GROUP BY r.rom_id
    ORDER BY r.file_mtime DESC
    LIMIT 1;
    """)
    lat_rom = cur.fetchone()

    if _table_exists(cur, "anomaly_episodes"):
        if lat_rom:
            lat_id, lat_name = lat_rom
            cur.execute("""
            SELECT episode_type, root_cause, COUNT(*), SUM(frame_count), AVG(peak_severity), MAX(peak_severity)
            FROM anomaly_episodes
            WHERE rom_id = ?
            GROUP BY episode_type, root_cause
            ORDER BY COUNT(*) DESC, MAX(peak_severity) DESC;
            """, (lat_id,))
            lat_eps = cur.fetchall()
            print(f"\n[+] Part A: Active Latest ROM {lat_id} ({lat_name[-28:]}) Contiguous Anomaly Episodes:")
            if not lat_eps:
                print("  [+] CLEAN: Zero anomaly episodes recorded on Active Latest ROM!")
            else:
                for etype, cause, ecnt, fcnt, asev, msev in lat_eps:
                    print(f"  - {etype:<24} | {cause:<30} : {ecnt:>3} eps ({fcnt:>4} frames) | Mean Sev: {asev:5.1f} | Max: {msev:5.1f}")

        cur.execute("""
        SELECT episode_type, COUNT(*), SUM(frame_count), AVG(peak_severity), MAX(peak_severity)
        FROM anomaly_episodes
        GROUP BY episode_type
        ORDER BY COUNT(*) DESC;
        """)
        ep_summary = cur.fetchall()
        if ep_summary:
            print("\n[+] Part B: All-ROM Historical Fleet Episode Ledger (use `investigate` to inspect traces):")
            for etype, ecnt, fcnt, asev, msev in ep_summary:
                print(f"  - {etype:<26}: {ecnt:>4} episodes ({fcnt:>5} frames) | Mean Peak Sev: {asev:6.2f} | Max: {msev:6.2f}")

    cur.execute("""
    SELECT event_type, COUNT(*), AVG(severity), MAX(severity)
    FROM operational_events
    GROUP BY event_type
    ORDER BY COUNT(*) DESC;
    """)
    rows = cur.fetchall()

    if not rows:
        print("\n[*] No frame-level operational anomaly events logged in database.")
        conn.close()
        return

    print("\n[+] Part C: Frame-Level Operational Event Counts (All Logged ROMs):")
    for etype, cnt, avg_sev, max_sev in rows:
        print(f"  - {etype:<26}: {cnt:>4} events | Mean Severity: {avg_sev:5.2f} | Max: {max_sev:5.2f}")

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
        print(f"  [{short_rom:<16}] t={t:6.1f}s | {etype:<24} | G{gear:<2} | {rpm:5.0f} RPM | {kpa:5.1f} kPa | AFR={afr:4.1f}/{afrmap:4.1f} | Sev={sev:4.1f}")

    print("=" * 96)
    conn.close()


def run_audit_health(db_path):
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 96)
    print("       MULTI-DOMAIN POWERTRAIN HEALTH, WEATHER ENVELOPE, DFCO & VIRTUAL DYNO PROGRESSION")
    print("=" * 96)

    cur.execute("""
    SELECT
        r.rom_id, r.rom_name,
        COUNT(DISTINCT d.log_id) as logs_cnt,
        COALESCE(SUM(d.total_records), 0) as total_frames,
        COALESCE(MAX(d.peak_whp), 0.0) as max_whp,
        COALESCE(MAX(d.peak_wtq), 0.0) as max_wtq,
        COALESCE(SUM(d.decel_cut_frames), 0) as dfco_cuts,
        COALESCE(SUM(d.decel_leak_frames), 0) as dfco_leaks,
        COALESCE(MIN(CASE WHEN d.total_records > 0 THEN d.min_ect_c END), 0.0) as min_ect,
        COALESCE(AVG(CASE WHEN d.total_records > 0 THEN d.mean_iat_c END), 0.0) as mean_iat,
        COALESCE(SUM(d.episode_count), 0) as ep_cnt
    FROM roms r
    LEFT JOIN datalogs d ON r.rom_id = d.rom_id
    GROUP BY r.rom_id
    ORDER BY r.file_mtime ASC;
    """)
    rom_rows = cur.fetchall()

    print("\n[+] Chronological ROM Calibration Progression (Pure Open-Loop, Sample-Weighted):")
    print("  ROM | Name                     | Logs | Frames  | MinECT/IAT | Cruise Err | Clamp% | GenK/Flut | DFCO Cut/Leak | EpCnt | WHP/WTQ")
    print("  " + "-" * 128)
    latest_logged_rom_id = None
    for rid, rname, lcnt, frames, whp, wtq, cuts, leaks, min_ect, mean_iat, ep_cnt in rom_rows:
        if lcnt > 0:
            latest_logged_rom_id = rid
        cur.execute("""
        SELECT
            SUM(CASE WHEN regime = 'STEADY_CRUISE' AND avg_ect_c >= 80.0 THEN sample_count * (avg_afr_error - 1.0) * 100.0 ELSE 0.0 END)
                / NULLIF(SUM(CASE WHEN regime = 'STEADY_CRUISE' AND avg_ect_c >= 80.0 THEN sample_count ELSE 0 END), 0),
            SUM(CASE WHEN map_bucket <= 80.0 AND regime IN ('STEADY_IDLE', 'STEADY_CRUISE', 'TRANSIENT_CRUISE') THEN sample_count * clamping_rate ELSE 0.0 END)
                / NULLIF(SUM(CASE WHEN map_bucket <= 80.0 AND regime IN ('STEADY_IDLE', 'STEADY_CRUISE', 'TRANSIENT_CRUISE') THEN sample_count ELSE 0 END), 0),
            COALESCE(SUM(knock_count_genuine), 0),
            COALESCE(SUM(knock_count_flutter), 0)
        FROM regime_summaries
        WHERE rom_id = ?;
        """, (rid,))
        srow = cur.fetchone()
        c_err = srow[0] if srow and srow[0] is not None else 0.0
        clamp = srow[1] if srow and srow[1] is not None else 0.0
        gk = srow[2] if srow else 0
        fk = srow[3] if srow else 0
        short_name = rname[-24:] if len(rname) > 24 else rname
        err_s = f"{c_err:+6.2f}%" if lcnt > 0 else "   N/A "
        clamp_s = f"{clamp:5.1f}%" if lcnt > 0 else "  N/A "
        temp_s = f"{min_ect:3.0f}°/{mean_iat:2.0f}°C" if lcnt > 0 else "   N/A   "
        print(f"  {rid:3d} | {short_name:<24} | {lcnt:4d} | {frames:7,d} |  {temp_s} |   {err_s}  | {clamp_s} | {gk:4d}/{fk:<4d} | {cuts:6,d}/{leaks:<5,d} | {ep_cnt:5d} | {whp:5.1f}/{wtq:<5.1f}")

    # Decel Overrun Fuel Leakage Hotspots — Separate Latest ROM vs Historical ROMs!
    if latest_logged_rom_id is not None:
        cur.execute("""
        SELECT dominant_gear, rpm_bucket, map_bucket, SUM(decel_leak_count) as leaks, AVG(avg_ipw_ms), AVG(avg_afr)
        FROM regime_summaries
        WHERE rom_id = ? AND decel_leak_count > 0
        GROUP BY dominant_gear, rpm_bucket, map_bucket
        ORDER BY leaks DESC
        LIMIT 5;
        """, (latest_logged_rom_id,))
        latest_leaks = cur.fetchall()
        if latest_leaks:
            print(f"\n[!] Active Latest ROM ({latest_logged_rom_id}) Overrun Decel Fuel Leakage Hotspots:")
            for gear, rpm_b, map_b, leaks, ipw, afr in latest_leaks:
                print(f"  - Gear {gear:<2} | ~{rpm_b:4d} RPM @ {map_b:4.0f} kPa : {leaks:4d} frames (Mean IPW={ipw:.2f}ms, AFR={afr:.1f})")
        else:
            print(f"\n[+] Active Latest ROM ({latest_logged_rom_id}) DFCO Overrun Status: CLEAN (0 sustained overrun injector leak frames).")

    cur.execute("""
    SELECT AVG(ABS(avg_in_vvt_err)), AVG(ABS(avg_ex_vvt_err))
    FROM regime_summaries
    WHERE regime IN ('STEADY_CRUISE', 'WOT_BOOST', 'SPOOL_RAMP');
    """)
    vvt = cur.fetchone()
    if vvt and vvt[0] is not None:
        print(f"[+] MIVEC Cam Phaser Tracking Error (Mean Abs): Intake = {vvt[0]:.2f}° | Exhaust = {vvt[1]:.2f}°")

    print("=" * 96)
    conn.close()


def run_audit_timing(db_path):
    """Dedicated Ignition Timing & Historical Knock-Corridor Audit (`Lets improve timing` queries)."""
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 96)
    print("       IGNITION TIMING DELIVERY, LOAD-SHIFT DELTA & HISTORICAL KNOCK CORRIDOR AUDIT")
    print("=" * 96)

    cur.execute("""
    SELECT r.rom_id, r.rom_name
    FROM roms r
    JOIN datalogs d ON r.rom_id = d.rom_id
    GROUP BY r.rom_id
    ORDER BY r.file_mtime DESC
    LIMIT 1;
    """)
    lat = cur.fetchone()
    if not lat:
        print("[*] No logged ROMs found.")
        conn.close()
        return
    lat_id, lat_name = lat

    cur.execute("""
    SELECT regime, rpm_bucket, map_bucket,
           SUM(sample_count) AS n,
           SUM(sample_count * avg_timing) / SUM(sample_count) AS act_tim,
           SUM(sample_count * avg_rom_timing_high) / SUM(sample_count) AS hi_tim,
           SUM(sample_count * avg_rom_timing_retard) / SUM(sample_count) AS tim_delta,
           SUM(sample_count * avg_afr) / SUM(sample_count) AS mafr,
           SUM(knock_count_genuine) AS gk,
           SUM(knock_count_flutter) AS fk
    FROM regime_summaries
    WHERE rom_id = ? AND avg_ect_c >= 80.0
      AND regime IN ('STEADY_CRUISE', 'SPOOL_RAMP', 'WOT_BOOST')
    GROUP BY regime, rpm_bucket, map_bucket
    HAVING n >= 15
    ORDER BY map_bucket DESC, rpm_bucket ASC
    LIMIT 24;
    """, (lat_id,))
    t_rows = cur.fetchall()
    print(f"\n[+] Part A: Active ROM {lat_id} ({lat_name[-28:]}) Warm Spark Delivery (High-Load & Cruise):")
    if t_rows:
        print("  Regime           | RPM  | MAP   | Samples | Actual Spark | ROM HighOct | Act-HiOct | AFR   | GenK/Flut")
        print("  " + "-" * 96)
        for reg, rpm_b, map_b, n, act_t, hi_t, t_del, mafr, gk, fk in t_rows:
            print(f"  {reg:<16} | {rpm_b:4d} | {map_b:5.0f} | {n:>7,} |    {act_t:5.1f}°    |    {hi_t:5.1f}°   |  {t_del:+5.1f}°   | {mafr:5.2f} |  {gk:2d} / {fk:<2d}")

    cur.execute("""
    SELECT rpm_bucket, map_bucket,
           SUM(sample_count) AS total_n,
           SUM(knock_count_genuine) AS gk,
           SUM(knock_count_flutter) AS fk,
           SUM(sample_count * avg_timing) / SUM(sample_count) AS mean_tim,
           COUNT(DISTINCT rom_id) AS rom_cnt
    FROM regime_summaries
    GROUP BY rpm_bucket, map_bucket
    HAVING gk > 0 OR fk > 0
    ORDER BY gk DESC, fk DESC, map_bucket DESC;
    """)
    k_cells = cur.fetchall()
    print("\n[+] Part B: Fleet-Wide Knock Corridor Map (Genuine Timing Knock vs Mechanical BOV Flutter):")
    if not k_cells:
        print("  [+] Zero knock events recorded across fleet.")
    else:
        print("  RPM  | MAP   | Fleet Frames | Genuine Knock (Rate%)   | BOV Flutter | Mean Spark | ROMs")
        print("  " + "-" * 86)
        for rpm_b, map_b, tot_n, gk, fk, m_tim, r_cnt in k_cells:
            rate = (gk / max(1, tot_n)) * 100.0
            print(f"  {rpm_b:4d} | {map_b:5.0f} | {tot_n:>12,} | {gk:4d} ({rate:6.2f}% of frames) | {fk:>11} |   {m_tim:5.1f}°   |  {r_cnt:2d}")

    print("=" * 96)
    conn.close()


def run_audit_shifts(db_path):
    """Dedicated Shift Quality, Rev-Hang, Post-Shift Bog/Lean & Drivetrain Slip Audit."""
    conn = get_conn(db_path)
    cur = conn.cursor()

    print("\n" + "=" * 96)
    print("          SHIFT QUALITY, REV-HANG, POST-SHIFT FUELING & DRIVETRAIN SLIP AUDIT")
    print("=" * 96)

    cur.execute("""
    SELECT r.rom_id, r.rom_name,
           SUM(CASE WHEN s.regime = 'SHIFT_TRANSITION' THEN s.sample_count ELSE 0 END) AS sh_frames,
           SUM(CASE WHEN s.regime = 'SHIFT_TRANSITION' THEN s.sample_count * s.avg_rpm_accel ELSE 0.0 END)
               / NULLIF(SUM(CASE WHEN s.regime = 'SHIFT_TRANSITION' THEN s.sample_count ELSE 0 END), 0) AS sh_rpms,
           SUM(CASE WHEN s.regime = 'SHIFT_TRANSITION' THEN s.sample_count * s.avg_dbw_cut ELSE 0.0 END)
               / NULLIF(SUM(CASE WHEN s.regime = 'SHIFT_TRANSITION' THEN s.sample_count ELSE 0 END), 0) AS sh_dbw
    FROM roms r
    JOIN regime_summaries s ON r.rom_id = s.rom_id
    GROUP BY r.rom_id
    HAVING sh_frames > 0
    ORDER BY r.file_mtime DESC
    LIMIT 6;
    """)
    sh_roms = cur.fetchall()
    if sh_roms:
        print("\n[+] Part A: Recent ROM Shift Transition Dynamics (`SHIFT_TRANSITION` Regime):")
        print("  ROM | Name                         | Shift Frames | Mean Shift dRPM/dt | Mean APP-TPS Cut")
        print("  " + "-" * 88)
        for rid, rname, sh_n, sh_rpms, sh_dbw in sh_roms:
            print(f"  {rid:3d} | {rname[-28:]:<28} | {sh_n:>12,} |    {sh_rpms or 0.0:+8.1f} RPM/s  |     {sh_dbw or 0.0:+5.1f}%")

    if _table_exists(cur, "anomaly_episodes"):
        cur.execute("""
        SELECT ep.episode_id, ep.rom_id, d.log_name, ep.episode_type, ep.root_cause,
               ep.start_sec, ep.end_sec, ep.gear, ep.rpm_start, ep.rpm_end,
               ep.map_mean, ep.afr_worst, ep.afrmap_mean, ep.peak_severity
        FROM anomaly_episodes ep
        JOIN datalogs d ON ep.log_id = d.log_id
        WHERE ep.episode_type IN ('SHIFT_ANOMALY', 'DRIVETRAIN_SLIP_OR_SPIN')
           OR ep.root_cause IN ('POST_SHIFT_OR_TIP_IN_LEAN', 'POST_SHIFT_RICH_SPOOL', 'DECEL_DBW_DASHPOT_HOLD')
        ORDER BY d.log_time DESC, ep.start_sec ASC
        LIMIT 25;
        """)
        sh_eps = cur.fetchall()
        print("\n[+] Part B: Recent Shift, Post-Shift, Dashpot & Slip/Spin Episodes:")
        if not sh_eps:
            print("  [+] CLEAN: Zero shift rev-hang, post-shift bog/hesitation, or slip/spin episodes detected.")
        else:
            print("  EpID | ROM | Log Timestamp       | Window (s)      | Cause                        | G  | RPM         | AFR/Tgt     | Sev")
            print("  " + "-" * 124)
            for eid, rid, lname, etype, cause, ssec, esec, gear, rpms, rpme, mapm, afrw, afrm, sev in sh_eps:
                short_log = lname.replace("EvoScanDataLog_", "").replace(".csv", "")
                g_str = gear[:2] if gear != "IDLE_STATIONARY" else "ID"
                print(f"  {eid:4d} | {rid:3d} | {short_log:<19} | {ssec:6.1f}..{esec:<6.1f}s | {cause:<28} | {g_str:<2} | {rpms:4.0f}->{rpme:<4.0f} | {afrw:5.2f}/{afrm:<5.2f} | {sev:5.1f}")

    print("=" * 96)
    conn.close()


def main():
    parser = argparse.ArgumentParser(description="Calibration Experience Database Query, Audit, Investigation & Veto Engine")
    parser.add_argument("--db", default=DEFAULT_DB_PATH, help=f"Path to SQLite database (default: {DEFAULT_DB_PATH})")
    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    # 1. forward-check
    p_fwd = subparsers.add_parser("forward-check", help="Pre-flash sanity check, unvisited-bin guard & veto")
    p_fwd.add_argument("--table", required=True, help="Table name (maf_scaling, map_load_calc_1, ect_fuel_comp_1, fuel_comp_mat_vs_map, injector_latency)")
    p_fwd.add_argument("--axis-x", type=float, required=True, help="X Axis coordinate (Volts, MAP kPa, Load %%, Vbatt)")
    p_fwd.add_argument("--axis-y", type=float, default=0.0, help="Y Axis coordinate (RPM, MAT °C, ECT °C)")
    p_fwd.add_argument("--proposed", type=float, required=True, help="Proposed table cell value to test")
    p_fwd.add_argument("--tolerance-pct", type=float, default=5.0, help="Veto warning proximity tolerance (default: 5.0%%)")

    # 2. reverse-match
    p_rev = subparsers.add_parser("reverse-match", help="Reverse diagnostic search: find best historical ROM for operating point")
    p_rev.add_argument("--rpm", type=float, required=True, help="Engine RPM target")
    p_rev.add_argument("--map", type=float, required=True, help="Manifold pressure MAP kPa target")
    p_rev.add_argument("--mat", type=float, help="Optional MAT °C")
    p_rev.add_argument("--gear", help="Optional Gear filter (1, 2, 3, 4, 5, IDLE_STATIONARY)")
    p_rev.add_argument("--metric", default="min_afr_error", choices=["min_afr_error", "zero_knock", "envelope_balance", "trim_balance", "max_whp"])
    p_rev.add_argument("--top-k", type=int, default=3, help="Number of winning ROMs to display (default: 3)")

    # 3. find-similar
    p_sim = subparsers.add_parser("find-similar", help="State-space k-NN search: find nearest operating states or anomaly episodes")
    p_sim.add_argument("--rpm", type=float, required=True, help="Engine RPM target")
    p_sim.add_argument("--map", type=float, required=True, help="Manifold pressure MAP kPa target")
    p_sim.add_argument("--mafv", type=float, help="Optional MAF Sensor Voltage target (e.g. 2.50V)")
    p_sim.add_argument("--mat", type=float, help="Optional MAT °C")
    p_sim.add_argument("--vbatt", type=float, help="Optional Battery Voltage (e.g. 14.1V)")
    p_sim.add_argument("--gear", help="Optional Gear filter (1, 2, 3, 4, 5)")
    p_sim.add_argument("--top-k", type=int, default=5, help="Number of nearest neighbors to return (default: 5)")
    p_sim.add_argument("--events-only", action="store_true", help="Search contiguous anomaly episodes instead of steady regimes")

    # 4. audit-injectors
    subparsers.add_parser("audit-injectors", help="Pure Open-Loop AFR error vs IPW (Scaling vs Deadtime) & Vbatt latency audit")

    # 5. audit-thermal
    subparsers.add_parser("audit-thermal", help="3-Way Decoupled Thermal Audit (Within-drive ECT vs Manifold MAT vs Seasonal IAT)")

    # 6. audit-maf-envelope
    subparsers.add_parser("audit-maf-envelope", help="130-bin MAF monotonicity/flat-line kink audit + 1D aliasing & boost headroom ledger")

    # 7. audit-regressions
    subparsers.add_parser("audit-regressions", help="Inter-ROM bucket regressions + Intra-ROM drive-to-drive consistency split")

    # 8. investigate
    p_inv = subparsers.add_parser("investigate", help="Browse anomaly episodes or print frame-by-frame telemetry trace around an episode")
    p_inv.add_argument("--episode-id", type=int, help="Episode ID to trace frame-by-frame from classified CSV")
    p_inv.add_argument("--type", dest="ep_type", help="Filter by episode_type (e.g. SHIFT_ANOMALY, COLD_ECT_MISFUEL, KNOCK_GENUINE_TIMING)")
    p_inv.add_argument("--root-cause", dest="root_cause", help="Filter by specific root_cause (e.g. POST_SHIFT_RICH_BOG, CROSSOVER_CLAMP_RECTIFICATION)")
    p_inv.add_argument("--rom-id", type=int, help="Filter by ROM ID")
    p_inv.add_argument("--trace-latest", action="store_true", help="Automatically trace the highest-severity episode on the latest drive")
    p_inv.add_argument("--window-sec", type=float, default=2.5, help="Context seconds before/after episode in trace (default: 2.5s)")
    p_inv.add_argument("--limit", type=int, default=20, help="Max episodes to list in browser mode (default: 20)")

    # 9. audit-events
    subparsers.add_parser("audit-events", help="Inspect all recorded anomaly episodes & frame events (Active ROM + Fleet)")

    # 10. audit-health (and alias audit-decel)
    subparsers.add_parser("audit-health", help="ROM progression, weather envelope, DFCO overrun status, Virtual Dyno WHP/WTQ & VVT")
    subparsers.add_parser("audit-decel", help="Alias for audit-health focusing on DFCO overrun fuel cuts vs injector leaks")

    # 11. audit-timing & audit-shifts
    subparsers.add_parser("audit-timing", help="Ignition spark delivery vs ROM High Octane Timing & fleet-wide knock corridor audit")
    subparsers.add_parser("audit-shifts", help="Shift quality, rev-hang, post-shift fueling bog/lean & drivetrain slip/spin audit")

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
    elif args.subcommand == "audit-maf-envelope":
        run_audit_maf_envelope(args.db)
    elif args.subcommand == "audit-regressions":
        run_audit_regressions(args.db)
    elif args.subcommand == "investigate":
        run_investigate(args.db, args.episode_id, args.ep_type, args.root_cause, args.rom_id, args.trace_latest, args.window_sec, args.limit)
    elif args.subcommand == "audit-events":
        run_audit_events(args.db)
    elif args.subcommand in ("audit-health", "audit-decel"):
        run_audit_health(args.db)
    elif args.subcommand == "audit-timing":
        run_audit_timing(args.db)
    elif args.subcommand == "audit-shifts":
        run_audit_shifts(args.db)


if __name__ == "__main__":
    main()
