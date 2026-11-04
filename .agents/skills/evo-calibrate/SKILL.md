---
name: evo-calibrate
description: End-to-end Evo X (4B11T) pure Open-Loop telemetry classification, SQLite experience database diagnostics, anomaly episode investigation, state-space k-NN lookup, and multi-ROM calibration table synthesis. Invoke via /evo-calibrate <driver notes, symptoms, or constraints> or trigger whenever analyzing new drives, investigating drivability/knock/AFR/thermal/decel anomalies, rehydrating calibration_experience.db, or generating next-flash EcuFlash clipboard paste tables.
---

# Evo X Pure Open-Loop Diagnostic & Calibration Workflow (`/evo-calibrate`)

This skill orchestrates the multi-domain **100% Open-Loop** telemetry classifier (`46 diag_*` columns), the SQLite + state-space $k$-NN experience database (`tuning_tools/db/calibration_experience.db`), contiguous anomaly episode trace tools, and the multi-ROM secant/timing calibration suite for the **2013 Mitsubishi Lancer Evolution X (4B11T, Precision 8474, ID1300x, GSC S2, Full Race 3.5" intake, TephraMOD v3)**.

> [!NOTE]
> **100% Open-Loop Platform**: Closed-loop O2 feedback (`STFT` / `LTFT`) is permanently disabled on this ECU. Every diagnostic, classifier, and balancer measures true open-loop fueling error directly from transport-lag-aligned wideband `AFR / AFRMAP`, gated strictly on wideband validity (`10.08 < AFR < 18.42`, `>= 35s` post-crank heater warmup).

---

## 0. Incorporating the User Prompt & Symptom Investigation

When invoked with driver notes (e.g. `/evo-calibrate <additional thoughts>`), treat them as **primary diagnostic hypotheses and calibration constraints**:

1. **Extract Operating Coordinates & Conditions**:
   - Map any mentioned RPM, gear, boost/vacuum, throttle feel, coolant/ambient/heat-soak state, or time-of-drive notes directly into filters on `*_classified.csv` and `experience_query.py` (`--rpm`, `--map`, `--mafv`, `--mat`, `--vbatt`, `--gear`, `investigate --type`).
2. **Branch Diagnostics to Match the User's Focus**:
   - **Cold Weather / Warmup / Morning-vs-Afternoon AFR Shifts**:
     - Run `experience_query.py audit-thermal` and `audit-regressions` to decouple **Coolant Warmup (`ECT Fuel Comp #1/#2` `0x5ADB9`/`0x5AF31`)** vs **Manifold Heat-Soak (`Fuel Comp MAT vs MAP` `0x60FCD`, firmware gain `(raw + 384)/512`)** vs **Seasonal Outdoor `IAT` / `MAPCalcs` Charge Density**.
     - Trace cold-ECT misfuel episodes via `experience_query.py investigate --type COLD_ECT_MISFUEL`.
   - **MAF Flat-Lining / Spool Crossover / 1D Aliasing**:
     - Run `experience_query.py audit-maf-envelope` to check 130-bin curve monotonicity, flat-line slope kinks, unvisited bins (`N=0`), `MAF_MAP_ALIAS_CONFLICT` (`>= 2.74V` in vacuum vs boost), and `1.25x` Speed Density headroom.
   - **Part-Throttle Knock / Hesitation / Steady-Pedal Power Drop**:
     - Run `experience_query.py investigate --type KNOCK_GENUINE_TIMING` or `investigate --type STEADY_PEDAL_POWER_DROP` and `find-similar --rpm 3200 --map 115 --gear 3 --events-only`.
   - **Decel Lift-Off / Overrun Hang / Pops**:
     - Run `experience_query.py audit-health` (separating **Active Latest ROM** vs historical ROMs) and `investigate --type OVERRUN_FUEL_LEAKAGE`.
   - **Power / Boost Pull Check**:
     - Filter `diag_usable_for_dyno == 1` or `diag_operating_regime == 'WOT_BOOST'` to inspect `diag_wheel_hp`, `diag_wheel_tq`, `diag_aligned_afr`, `diag_idc_pct`, and `diag_in_vvt_error`.

---

## 1. Hard Safety & Output Rules (Non-Negotiable)

> [!CAUTION]
> **NEVER CREATE OR WRITE `.srf` OR `.bin` ROM FILES**:
> Never generate, modify, or save binary ROM files into `roms/` or anywhere else. Only output formatted **EcuFlash clipboard paste blocks** (and `.tsv` / `.txt` export files in `/tmp/` or artifacts) for manual copy-pasting into EcuFlash.

- **Chronological Association Rule**: A datalog recorded with timestamp $t$ where $\text{mtime}(\text{ROM}_N) \le t < \text{mtime}(\text{ROM}_{N+1})$ belongs strictly to $\text{ROM}_N$.
- **Unvisited MAF Bin & Non-Cumulative Boost Headroom Rule**:
  - Never apply cumulative per-flash multipliers to unvisited MAF bins (`N=0`), which creates artificial flat-line shelves.
  - Pure vacuum bins (`Idx <= 73`, `<= 2.85V`) calibrate strictly from unclamped vacuum frames (`MAP <= 105 kPa`, `MAFV <= 2.74V`). Boost bins (`Idx >= 74`, `>= 2.89V`) anchor non-cumulatively to `1.22x–1.32x` empirical boost `TrueLoad` airflow with smooth `V3.18` slope continuity.
- **Isolated Single-Count Knock Rule**:
  - An isolated knock inception of `1` (`KnockSum == 1`, `severity == 1.0`) occurring infrequently ($< 25\%$ of visits to that timing cell) **MUST be stored in `calibration_experience.db`** for historical tracking, **NOT retarded in the timing tables** (`0°` retard).
  - Apply `-1°` safety retard only when knock is confident/frequent ($\Delta\text{KnockSum} \ge 2$, $\ge 2$ inceptions in that cell, or $\ge 25\%$ cell visit frequency), and **never** retard timing for `BOV_FLUTTER` or `DRIVETRAIN_LASH`.
- **Mandatory Table Dimensions**:
  - `MAF Scaling Horizontal` (`0x5757A`): `1 × 130` cells.
  - `MAP based Load Calc #1` (`0x608AE`) & `#2` (`0x605AC`): **`19 RPM Rows × 20 MAP Columns`** (`380` cells), identical in both `#1` and `#2`.
  - `High Octane` (`0x55957`) & `Low Octane` (`0x55B59`) Timing: **`23 RPM Rows × 22 Load Columns`** (`506` signed `int8` cells, column-major in ROM), always synchronized with `--lower-only` (`0°` accidental advance).

Read [references/calibration_safeguards.md](references/calibration_safeguards.md) before modifying any fuel, airflow, thermal, or timing tables.

---

## 2. Step-by-Step Execution Pipeline

### Step 1: Discover, Classify & Rehydrate Telemetry
Run the bundled one-shot diagnostic runner to auto-discover the latest ROM, classify any new raw EvoScan logs with all **46 `diag_*` columns**, ingest them into `calibration_experience.db`, and run all 6 multi-domain audits:

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

### Step 2: Audit Trends, Regressions & Trace Anomaly Episodes
```bash
# 1. ROM progression, weather envelope, active-vs-historical DFCO status, Virtual Dyno & VVT
python3 tuning_tools/tools/experience_query.py audit-health

# 2. Inter-ROM bucket regressions & Same-ROM drive-to-drive consistency split (e.g. morning vs afternoon)
python3 tuning_tools/tools/experience_query.py audit-regressions

# 3. 130-bin MAF curve monotonicity/flat-line kink detector, 1D alias overlap & boost SD headroom ledger
python3 tuning_tools/tools/experience_query.py audit-maf-envelope

# 4. 3-Way Decoupled Thermal Audit (Within-drive ECT warmup vs Manifold MAT heat-soak vs Seasonal IAT)
python3 tuning_tools/tools/experience_query.py audit-thermal

# 5. Pure Open-Loop Injector Audit (AFR error across IPW pulse-width brackets & Vbatt latency)
python3 tuning_tools/tools/experience_query.py audit-injectors

# 6. Browse debounced anomaly episodes & inspect frame-by-frame telemetry traces
python3 tuning_tools/tools/experience_query.py investigate --limit 20
python3 tuning_tools/tools/experience_query.py investigate --episode-id <ID> --window-sec 2.5
python3 tuning_tools/tools/experience_query.py investigate --trace-latest

# 7. State-space k-NN vector lookup & Reverse-match
python3 tuning_tools/tools/experience_query.py find-similar --rpm 3200 --map 115 --mafv 2.60 --gear 3 --top-k 5
python3 tuning_tools/tools/experience_query.py find-similar --rpm 3200 --map 115 --events-only
python3 tuning_tools/tools/experience_query.py reverse-match --rpm 3000 --map 100 --metric min_afr_error --top-k 3
```

### Step 3: Custom Inspection of Enriched `*_classified.csv` Columns
Every classified CSV in `scans/*_classified.csv` contains **46 appended `diag_*` columns**. See [references/classified_columns_and_queries.md](references/classified_columns_and_queries.md) for the complete column dictionary, SQLite table schemas (`maf_bin_experience`, `thermal_summaries`, `anomaly_episodes`), and ready-to-run Python/SQLite recipes.

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
2. **Pre-Flash Forward Check (Unvisited-Bin Guard, Boost Headroom & Veto)**:
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
4. **Zero-Transcription-Error Rule & Parity Audit**:
   - **Never manually emit or retype 2D/3D table values from LLM memory.**
   - All clipboard paste blocks and report markdown MUST be populated by reading directly from the verified export files on disk (`.txt` / `.tsv`) and verified with `verify_calibration_buffers.py`.
