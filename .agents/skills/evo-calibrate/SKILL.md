---
name: evo-calibrate
description: End-to-end Evo X (4B11T) telemetry classification, SQLite experience database diagnostics, state-space k-NN lookup, and multi-ROM calibration table synthesis. Invoke via /evo-calibrate <driver notes, symptoms, or constraints> or trigger whenever analyzing new drives, investigating drivability/knock/AFR/decel symptoms, rehydrating calibration_experience.db, or generating next-flash EcuFlash clipboard paste tables.
---

# Evo X Diagnostic & Calibration Workflow (`/evo-calibrate`)

This skill orchestrates the multi-domain telemetry classifier, the SQLite + state-space $k$-NN experience database (`tuning_tools/db/calibration_experience.db`), and the multi-ROM secant/timing calibration suite for the **2013 Mitsubishi Lancer Evolution X (4B11T, Precision 8474, ID1300x, GSC S2, TephraMOD v3)**.

---

## 0. Incorporating the User Prompt & Additional Thoughts

When invoked with additional text (e.g. `/evo-calibrate <additional thoughts>`), treat the user's notes as **primary diagnostic hypotheses and calibration constraints**:

1. **Extract Operating Coordinates & Conditions**:
   - Map any mentioned RPM, gear, boost/vacuum, throttle feel, ambient/heat-soak state, or time-of-drive notes directly into filters on `*_classified.csv` and `experience_query.py` (`--rpm`, `--map`, `--mafv`, `--mat`, `--vbatt`, `--gear`).
2. **Branch Diagnostics to Match the User's Focus**:
   - **Part-Throttle Knock / Hesitation** *(e.g. "felt a knock or stutter around 3,200 RPM in 3rd gear")*:
     - Query `experience_query.py audit-events` and `find-similar --rpm 3200 --map 115 --gear 3 --events-only`.
     - Verify `diag_knock_class` (`GENUINE_TIMING` vs `BOV_FLUTTER` vs `DRIVETRAIN_LASH`) and `diag_load_clamping_state` (`CROSSOVER_TRANSITION` / `VACUUM_CEILING_CLAMPED`).
   - **Decel Lift-Off / Overrun Hang / Pops** *(e.g. "injectors seem to stay open when coasting down in gear")*:
     - Run `experience_query.py audit-health` and inspect `diag_decel_fuel_status` (`CUT_ACTIVE`, `DFCO_ENTRY_DELAY`, `DFCO_LOW_RPM_RESUME`, `UNEXPECTED_FUELING`, `COAST_NEUTRAL`).
   - **Hot Restart / Ambient Swing / Idle Trim Drift** *(e.g. "idled lean after sitting hot for 20 mins")*:
     - Run `audit-thermal` and `audit-injectors`; compare `diag_rom_mat_comp_mult` and `diag_rom_latency_ms` against `diag_aligned_afr_error` and `diag_total_fuel_trim`.
   - **Power / Boost Pull Check** *(e.g. "did two 3rd gear pulls, how did power and boost AFR look?")*:
     - Filter `diag_usable_for_dyno == 1` or `diag_operating_regime == 'WOT_BOOST'` to inspect `diag_wheel_hp`, `diag_wheel_tq`, `diag_aligned_afr`, `diag_idc_pct`, and `diag_in_vvt_error`.
   - **Explicit Calibration Constraints** *(e.g. "keep boost VE untouched, only clean up highway cruise" or "ignore first 3 minutes")*:
     - Honor all user scope locks when proposing clipboard paste buffers, while still verifying load-envelope ratios and conservative `--lower-only` timing safety.

---

## 1. Hard Safety & Output Rules (Non-Negotiable)

> [!CAUTION]
> **NEVER CREATE OR WRITE `.srf` OR `.bin` ROM FILES**:
> Never generate, modify, or save binary ROM files into `roms/` or anywhere else. Only output formatted **EcuFlash clipboard paste blocks** (and `.tsv` / `.txt` export files in `/tmp/` or artifacts) for manual copy-pasting into EcuFlash.

- **Chronological Association Rule**: A datalog recorded with timestamp $t$ where $\text{mtime}(\text{ROM}_N) \le t < \text{mtime}(\text{ROM}_{N+1})$ belongs strictly to $\text{ROM}_N$.
- **Isolated Single-Count Knock Rule**:
  - An isolated knock inception of `1` (`KnockSum == 1`, `severity == 1.0`) occurring infrequently ($< 25\%$ of visits to that timing cell) **MUST be stored in `calibration_experience.db`** for historical tracking, **NOT retarded in the timing tables** (`0°` retard).
  - Apply `-1°` safety retard only when knock is confident/frequent ($\Delta\text{KnockSum} \ge 2$, $\ge 2$ inceptions in that cell, or $\ge 25\%$ cell visit frequency), and **never** retard timing for `BOV_FLUTTER` or `DRIVETRAIN_LASH`.
- **Mandatory Table Dimensions**:
  - `MAF Scaling Horizontal` (`0x5757A`): `1 × 130` cells.
  - `MAP based Load Calc #1` (`0x608AE`) & `#2` (`0x605AC`): **`19 RPM Rows × 20 MAP Columns`** (`380` cells), identical in both `#1` and `#2`.
  - `High Octane` (`0x55957`) & `Low Octane` (`0x55757`) Timing: **`23 RPM Rows × 22 Load Columns`** (`506` cells), always synchronized with `--lower-only` (`0°` accidental advance).

Read [references/calibration_safeguards.md](references/calibration_safeguards.md) before modifying any fuel, airflow, MAT, or timing tables.

---

## 2. Step-by-Step Execution Pipeline

### Step 1: Discover, Classify & Ingest Telemetry
Run the bundled one-shot diagnostic runner to auto-discover the latest ROM, classify any new raw EvoScan logs with all **34 `diag_*` columns** (including precomputed ROM table lookups), ingest them into `calibration_experience.db`, and print the multi-domain health audit:

```bash
python3 .agents/skills/evo-calibrate/scripts/run_evo_diagnostic.py
```

Or invoke the core ingestion/rehydration tools directly:
```bash
# Incremental: classify & ingest specific new raw logs against their chronologically matched ROM
python3 tuning_tools/tools/ingest_experience.py \
  --roms "roms/<LATEST_ROM>.srf" \
  --auto-classify-logs "scans/<NEW_LOG_1>.csv" "scans/<NEW_LOG_2>.csv"

# Full Rehydration: rebuild calibration_experience.db cleanly from Oct 22 onward (post-exhaust-leak)
python3 tuning_tools/tools/ingest_experience.py --rehydrate --since-date 2026-10-22
```

### Step 2: Query the Experience Database & State-Space $k$-NN Search
```bash
# 1. ROM-by-ROM progression, DFCO overrun fuel leaks, Virtual Dyno WHP/WTQ, IDC & MIVEC tracking
python3 tuning_tools/tools/experience_query.py audit-health

# 2. Anomaly ledger (Genuine knock w/ 1-count assessment, BOV flutter, overrun leaks, lean boost)
python3 tuning_tools/tools/experience_query.py audit-events

# 3. Thermal invariance across MAT & injector deadtime across Vbatt
python3 tuning_tools/tools/experience_query.py audit-thermal
python3 tuning_tools/tools/experience_query.py audit-injectors

# 4. State-space k-NN vector lookup for similar historical operating states or events
python3 tuning_tools/tools/experience_query.py find-similar --rpm 3200 --map 115 --mafv 2.60 --gear 3 --top-k 5
python3 tuning_tools/tools/experience_query.py find-similar --rpm 3200 --map 115 --events-only

# 5. Reverse-match: find which past ROM achieved minimal AFR error or zero knock at an operating point
python3 tuning_tools/tools/experience_query.py reverse-match --rpm 3000 --map 100 --metric min_afr_error --top-k 3
```

### Step 3: Custom Inspection of Enriched `*_classified.csv` Columns
Every classified CSV in `scans/*_classified.csv` contains **34 appended `diag_*` columns**, including:
- **Precomputed ROM Table Lookups** (`diag_rom_maf_gs`, `diag_rom_map_ve_load`, `diag_rom_mat_comp_mult`, `diag_rom_timing_high`, `diag_rom_timing_low`, `diag_rom_timing_retard_total`, `diag_rom_latency_ms`, `diag_rom_afrmap`)
- **Drivetrain, Overrun & Virtual Dyno** (`diag_gear`, `diag_shift_active`, `diag_decel_fuel_status`, `diag_smooth_speed_kmh`, `diag_smooth_accel_g`, `diag_wheel_hp`, `diag_wheel_tq`, `diag_usable_for_dyno`)
- **Actuator Health & Regimes** (`diag_in_vvt_error`, `diag_ex_vvt_error`, `diag_dbw_throttle_cut`, `diag_idc_pct`, `diag_steady_confidence`, `diag_operating_regime`, `diag_knock_class`, `diag_load_clamping_state`, `diag_aligned_afr`, `diag_aligned_afr_error`, `diag_usable_for_maf`, `diag_usable_for_ve`, `diag_usable_for_injector`, `diag_rejection_reason`)

See [references/classified_columns_and_queries.md](references/classified_columns_and_queries.md) for the complete column dictionary and ready-to-run Python/SQLite recipes to test any user hypothesis.

### Step 4: Synthesize Next-Flash Tables, Pre-Flash Veto & Timing Sync
When proposing calibration changes for the next flash:

1. **Multi-ROM Bracketed Secant Fuel & Load Balancing**:
   ```bash
   python3 tuning_tools/tools/multi_rom_secant_balancer.py \
     --target-rom "roms/<LATEST_ROM>.srf" --logs scans/<LATEST_LOG1>.csv scans/<LATEST_LOG2>.csv \
     --prev-rom1 "roms/<PREV_ROM1>.srf" --prev-logs1 scans/<PREV_LOG1>.csv \
     --prev-rom2 "roms/<PREV_ROM2>.srf" --prev-logs2 scans/<PREV_LOG2>.csv \
     --export-dir /tmp/next_rom_exports
   ```
2. **Pre-Flash Forward Check (Veto Repeat Overshoots)**:
   ```bash
   python3 tuning_tools/tools/experience_query.py forward-check \
     --table maf_scaling --axis-x 2.50 --proposed 73.5
   python3 tuning_tools/tools/experience_query.py forward-check \
     --table map_load_calc_1 --axis-x 102.8 --axis-y 3000 --proposed 83.2
   ```
3. **Conservative Timing Synchronization (`--lower-only` + `--filter-flutter-knock` + `0.25` Knock Frequency Floor)**:
   ```bash
   python3 tuning_tools/tools/timing_mivec_remapper.py \
     --target-rom "roms/<LATEST_ROM>.srf" \
     --maf-table /tmp/next_rom_exports/new_maf_scaling.tsv \
     --map-table /tmp/next_rom_exports/new_map_load_calc.tsv \
     --knock-logs scans/<LATEST_LOG1>.csv scans/<LATEST_LOG2>.csv \
     --filter-flutter-knock \
     --min-knock-frequency 0.25 \
     --paste-timing --lower-only
   ```
4. **Deliver Clipboard Paste Buffers**:
   - Verify row/column dimensions programmatically (`1×130` MAF, `19×20` MAP `#1 & #2`, `23×22` High/Low Timing) before presenting tab-separated paste blocks to the user.
