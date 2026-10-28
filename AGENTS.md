# Evoman Project Instructions & Calibration Guidelines

## 1. Datalog & ROM Selection Rules

Whenever performing telemetry analysis, balancer simulation, fuel/load verification, or ROM differencing:

1. **Always Use the Latest Files**:
   - Inspect the `roms/` and `scans/` directories and prioritize the most recently modified files.
   - Do NOT select older legacy files (e.g. from 2022, 2023, or earlier 2026 runs) unless specifically asked by the user to perform historical analysis.

2. **Chronological Association Rule**:
   - **A datalog with a creation/modification timestamp falling between two ROM files ($ROM_N$ and $ROM_{N+1}$) belongs to the older of the two ROMs ($ROM_N$).**
   - Rationale: A log recorded after $ROM_N$ was written, but before $ROM_{N+1}$ was created/flashed, is telemetry demonstrating how $ROM_N$ performed on the car.
   - Once $ROM_{N+1}$ is written/flashed, any subsequent logs recorded after $ROM_{N+1}$ belong to $ROM_{N+1}$ until an even newer ROM is created.
   - Always verify timestamps (`ls -lt` or `os.path.getmtime`) before pairing a log with a ROM.

---

## 2. Platform & Hardware Configuration

- **Vehicle**: 2013 Mitsubishi Lancer Evolution X (USDM 5MT)
- **Engine**: 2.0L 4B11T DOHC MIVEC
- **Turbo**: Precision 8474
- **Intake**: Full Race 3.5" intake pipe
- **Fuel System**: Injector Dynamics ID1300x, 94 octane pump gas
- **Valvetrain**: GSC S2 camshafts with upgraded valve springs
- **ECU Patch**: TephraMOD v3 + RAX Fast Logging (Base ROM `59580004` / Patched `59580304`)

---

## 3. Toolchain & Disassembly Reference

All tools reside in `tuning_tools/tools/`:
- `log_analyzer.py`: Process EvoScan CSV datalogs with warm-engine filtering.
- `load_envelope_analyzer.py`: Diagnose MAF vs MAP load envelope clamping.
- `rom_differ.py`: Diff calibration ROMs and extract table multipliers.
- `rom_log_verifier.py`: Verify predicted vs actual empirical fueling gains across ROM flashes.
- `balancer_simulator.py`: Test LogChopper MAF/MAP balancing iterations.
- `mat_thermal_analyzer.py`: Decoupled MAT thermal drift analysis targeting Cold Witnessed Baseline AFR.
- `decompile_ecu.py`: Headless Ghidra decompilation of M32R firmware routines.
- `m32r_inspector.py`: M32R MCU disassembler, vector dumper, and symbol inspector.
- `export_ghidra_symbols.py`: Export symbol maps and Ghidra labeling scripts.
- `match_roms_and_logs.py`: Auto-match and sort latest ROMs and their associated chronological logs.
- `fill_log_afrmap.py`: Reconstruct and populate missing `AFRMAP` values in EvoScan CSV logs directly from the ROM's `High Octane Fuel Map` (`0x55027`).
- `multi_rom_secant_balancer.py`: Multi-ROM bracketed secant solver & anti-rectification balancer with dynamic exhaust transport-lag alignment, unclamped MAF filtering, 5-frame exhaust-window moving average, and post-smoothing bracket invariance.
- `timing_mivec_remapper.py`: Inverse-coordinate remapping of Ignition Timing (High/Low Octane) and MIVEC (Intake/Exhaust) targeting the V3.18 reference ROM with runtime `MAPCalcs` scaling (`K_MAP_RUNTIME = 1.090`), conservative lower-only safety mode, and `--filter-flutter-knock` integration.
- `bov_flutter_knock_detector.py`: Automated classifier that decouples mechanical BOV flutter / rapid cycling chatter knock from genuine in-cylinder ignition timing knock based on high-frequency airflow volatility and directional reversals.
- `datalog_classifier.py`: Multi-domain per-record telemetry classifier that enriches every datalog row with continuous stationarity confidence (0.0–1.0), operational regimes, knock root cause (BOV flutter vs timing knock vs lash), dynamic transport-lag-aligned AFR error, load clamping states, and subsystem usability flags.
- `ingest_experience.py`: Ingestion engine for `calibration_experience.db` (SQLite) indexing ROM tables (MAF, MAP Load Calc 1 & 2, High/Low Timing, Injector Scaling & Latency, MAT comp) and multi-dimensional performance summaries.
- `experience_query.py`: Calibration Experience Database query engine supporting forward validation / pre-flash veto ("Have we tried this value before?"), reverse diagnostic lookup ("When did this operating point run best?"), and multi-domain audits (injectors, thermal invariance, operational anomaly events).

---

## 4. Thermal Decoupling & Calibration Anti-Patterns

### 1. Thermal Decoupling (MAT Targets Cold Witnessed Baseline, NOT AFRMAP)
- **Principle**: The sole responsibility of `Fuel Compensation MAT vs MAP` (`0x60FCD`) is **Thermal Invariance** ($\frac{\partial \text{AFR}}{\partial \text{MAT}} = 0$). It ensures that a heat-soaked engine ($40^\circ\text{C}\text{--}60^\circ\text{C}+$) delivers the exact same AFR as the cold/ambient baseline ($20^\circ\text{C}$).
- **Anti-Pattern (Direct Target Coupling)**: Never trim MAT compensation cells directly to match `AFRMAP` (e.g. 14.70). Doing so cross-couples thermal multipliers with base air mass error, creating ghost offsets that destabilize fueling across varying weather conditions.
- **Workflow**:
  1. Calculate thermal drift relative to cold witnessed AFR: $\Delta_{\text{thermal}} = \frac{\text{AFR}_{\text{hot}}}{\text{AFR}_{\text{cold\_witnessed}}}$.
  2. Adjust MAT cells to eliminate $\Delta_{\text{thermal}}$, achieving thermal invariance.
  3. Any residual global error between cold baseline AFR and `AFRMAP` (14.70) must be resolved at the root via **MAF Scaling** and **MAP based Load Calc** (LogChopper).

### 2. EcuFlash Table Architecture & swapxy Column-Major Reality
- In EcuFlash XML, `Fuel Compensation MAT vs MAP` uses `swapxy="true"`.
- This causes EcuFlash to read the 70 bytes as **column-major**: `offset = map_col * 7 + mat_row`.
- **True EcuFlash GUI Grid (Cold-to-Hot top-to-bottom)**:
  - Row 0: $-10^\circ\text{C}$ ($14^\circ\text{F}$) -> Factory is **100.0% across all MAP readings**.
  - Row 1: $5^\circ\text{C}$ ($41^\circ\text{F}$) -> Factory is **100.0% across all MAP readings**.
  - Row 2: $20^\circ\text{C}$ ($68^\circ\text{F}$) -> Factory ranges 106.1% (vacuum) down to 100.0% (boost).
  - Row 3: $40^\circ\text{C}$ ($104^\circ\text{F}$) -> Factory ranges 109.0% down to 100.0%.
  - Row 4: $60^\circ\text{C}$ ($140^\circ\text{F}$) -> Factory ranges 113.1% down to 100.0%.
  - Row 5: $80^\circ\text{C}$ ($176^\circ\text{F}$) -> Factory ranges 115.0% down to 100.0%.
  - Row 6: $100^\circ\text{C}$ ($212^\circ\text{F}$) -> Factory ranges 117.0% down to 100.0%.
- In factory calibration, compensation **increases with temperature** in vacuum to account for charge heating, wall wetting, and manifold pressure dynamics.
- **Strict 2D Monotonicity Rule**:
  - **Cold Baseline Floor (Rows 0 & 1)**: Row 0 ($-10^\circ\text{C}$) and Row 1 ($5^\circ\text{C}$) MUST remain locked at **100.0% across all MAP columns**.
  - **With Temperature (down rows)**: $Mult(r+1, c) \ge Mult(r, c)$. Compensation must strictly increase (or stay flat) as temperature rises. Never introduce temperature dips down a column.
  - **With Vacuum (across columns from boost to vacuum)**: $Mult(r, c) \ge Mult(r, c+1)$. Compensation must strictly increase with vacuum (taper monotonically down toward $100.0\%$ in boost). Never introduce vacuum dips across a row.
  - **Zero Dips Mandate**: Any non-monotonic dip creates artificial thermal pockets, causing unpredictable AFR swings across weather and driving conditions.
- ROM 11 over-inflated Rows 3–6 (up to 124%), causing the 5% rich drift at noon. Trimming Rows 3–6 back toward a smooth, monotonic curve eliminates the heat-soak rich drift.

### 3. EcuFlash 3D Table GUI Grid Orientation Standards (RPM Rows vs MAP/Load Columns)
- **Universal EcuFlash Convention**: In EcuFlash, all 3D engine tables (`MAP based Load Calc #1 & #2`, `High Octane Fuel Map`, `High Octane Timing Map`, `MIVEC Intake/Exhaust`, etc.) display:
  - **Vertical Rows = Engine RPM**
  - **Horizontal Columns = MAP / Load (or TPS / Airflow)**
- **MAP based Load Calc Architecture (`0x608AE` / `0x605AC`)**:
  - **Rows**: **19 RPM Rows** (`500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000 RPM`).
  - **Columns**: **20 MAP Columns** (`13.7, 22.1, 35.6, 49.0, 62.5, 75.9, 89.4, 102.8, 116.3, 129.7, 143.2, 156.6, 170.1, 183.5, 197.0, 210.4, 223.9, 237.4, 250.8, 304.6 kPa`).
  - **Grid Size**: Exactly **19 Rows × 20 Columns = 380 Cells**.
- **Memory Layout vs GUI Rendering (`swapxy="true"`) & `#1 / #2` Table Parity**:
  - In raw M32R firmware, the 380 words are stored **column-major**: `offset = map_col * 19 + rpm_row`.
  - **The Transposition Anti-Pattern**: Slicing the binary memory by contiguous chunks (`scaled[m * 19 : (m + 1) * 19]`) yields 20 slices of 19 values. Emitting these directly as table rows creates a transposed **20 Rows × 19 Columns** matrix. When pasting into EcuFlash, the software immediately fails with a clipboard dimension mismatch.
  - **Mandatory Clipboard Format**: All paste blocks generated for `MAP based Load Calc` MUST be formatted as **19 lines (one line per RPM row) with 20 tab-separated values per line**:
    ```python
    for r in range(19):  # RPM rows
        row = [scaled_load[m * 19 + r] for m in range(20)]  # MAP columns
        print("\t".join(f"{x:.1f}" for x in row))
    ```
  - **Dual-Table `#1` (`0x608AE`) & `#2` (`0x605AC`) Parity Rule**: The ECU blends `MAP based Load Calc #1 - Hot/Interpolated` (`0x608AE`) and `MAP based Load Calc #2 - Cold/Interpolated` (`0x605AC`). Always verify that `#1` and `#2` are identical in the ROM (`rom_differ.py` and `timing_mivec_remapper.py` check both addresses), and instruct the user to paste the `19 × 20` block into **BOTH** `#1` and `#2` in EcuFlash.

---

## 5. Load Clamping, Speed Density Envelope & Balanced AFR Targeting

> [!IMPORTANT]
> **MANDATORY READING WHEN TARGETING AFR OR SCALING LOAD TABLES**:
> Before adjusting fueling, scaling MAF, or retuning `MAP based Load Calc` tables, you **MUST READ**:
> [`tuning_tools/references/load_clamping_and_afr_targeting_guide.md`](file:///Users/steven/Library/CloudStorage/GoogleDrive-stevenjohnston.ca@gmail.com/My%20Drive/Evoman/tuning_tools/references/load_clamping_and_afr_targeting_guide.md)

### 1. The Core Targeting Principle: Target AFR = AFRMAP via Load Calculations
- **The Fuel Map is Sacred**: The `High Octane Fuel Map` (`0x55027` / `0x57508`) defines the target AFR ($AFRMAP$) across the entire operating range. **Never modify the fuel map to compensate for airflow model errors.**
- **Targeting Rule**: We plan and calibrate strictly to target $\text{AFR} = AFRMAP$ by adjusting the sensor load calculation tables:
  - **In Vacuum ($\le 80\text{ kPa}$)**: `MAF Scaling Horizontal` is the fuel master, calibrated so actual $\text{AFR} = AFRMAP$ ($14.70$).
  - **In Boost ($\ge 120\text{ kPa}$)**: `MAP based Load Calc` is the **Speed Density VE table** and fuel master. Trimming `MAP based Load Calc` to match actual cylinder charge directly delivers $\text{AFR} = AFRMAP$ while ensuring ignition timing indexes true physical load.
- **The Dual-Table Balancing Rule (Never Scale Unilaterally)**:
  - MAF Scaling and `MAP based Load Calc` must be adjusted in tandem to maintain exact envelope balance and respect crossover points.
  - In vacuum, the ECU calculates load as $\text{ChosenCalc} = \min(MAFCalcs, MAPCalcs)$. Raising only MAF causes immediate ceiling clamping to MAPCalcs, neutralizing fuel delivery. Raising only MAP in vacuum injects zero fuel because MAF is master.

### 2. The 3-Tier Target Ratio Ramp ($\frac{MAPCalcs}{MAFCalcs}$)
To prevent chronic vacuum clamping while ensuring clean transition to Speed Density in boost without boundary chatter:
- **$\le 80\text{ kPa}$ (Vacuum / Cruise / Idle)**: **Target Ratio = 1.20** *(1.18–1.22)*.
  - Absorbs the $\pm 18\%$ dynamic scatter caused by GSC S2 camshafts. Keeps ceiling clamping $< 5\%$, allowing pure MAF fuel and spark control.
- **$100\text{ kPa}$ (Atmospheric Crossover)**: **Target Ratio = 1.00** *(0.98–1.02)* (**with `1.06x` Anti-Rectification Ceiling at `Col 7 = 102.8 kPa`**, see Safeguard #5 below).
- **$\ge 120\text{ kPa}$ (Boost / WOT)**: **Target Ratio = 0.80** *(0.80–0.85)*.
  - Pure Speed Density master ($MAPCalcs < MAFCalcs$). MAF sits 25% above MAP as headroom, preventing rapid spool boundary chatter.

### 3. Critical Safety Warning for Boost
- Under boost, the ECU indexes fuel and spark timing directly from $MAPCalcs$.
- **`MAP based Load Calc` MUST ALWAYS equal 100% of True Physical Load ($\text{Load}_{\text{true}}$)**.
- Achieve the 0.80 ratio by **setting MAF Scaling 25% higher than true load** ($MAF = 1.25 \times \text{Load}_{\text{true}}$).
- **NEVER** achieve 0.80 by deflating $MAPCalcs$ below actual cylinder charge, as this will artificially advance ignition timing under boost and induce severe knock/detonation.

### 4. Mandatory Structural Safeguards & Multi-ROM Secant Process (`multi_rom_secant_balancer.py`)
1. **Cross-Regime MAF Bin Isolation (`<= 2.85V` vs `>= 2.89V`)**:
   - MAF voltage bins `Idx 35–73` (`1.37V–2.85V`, `5–102 g/s`) are shared between mid/high-RPM vacuum (`3,000–5,000 RPM` at `50–100 kPa`, where `MAFCalcs` is the active fuel master) and low-RPM spool (`100–130 kPa`).
   - **Never** apply the boost headroom multiplier ($1 / R(\text{MAP})$) to `Idx <= 73` using `MAP > 100 kPa` spool samples, as doing so inflates `2.00V–2.85V` and forces high-RPM vacuum rich. Calibrate `Idx <= 73` strictly from $\text{MAP} \le 105\text{ kPa}$ samples. Only pure boost bins (`Idx >= 74`, `>= 2.89V`) carry the $1.25\times$ ($1 / 0.80$) Speed Density headroom.
2. **Unclamped MAF Filtering (`MAPCalcs >= 0.99 * MAFCalcs`)**:
   - Because the wideband O2 sensor averages exhaust gas over a `~0.25s` (`5-frame`) mixing window while `MAFCalcs` has cycle-to-cycle GSC S2 cam pulsation ($\pm 8\%$), computing $\frac{\min(\text{MAFCalcs}_t, \text{MAPCalcs}_t) \times \overline{\text{AFR\_ERR}}}{\text{MAFCalcs}_t}$ on *clamped* frames (`MAPCalcs < MAFCalcs`) divides by clipped upper pulsation peaks of `MAFCalcs` and introduces a fake `-3% to -5%` rich bias in `Idx 60–67` (`2.35V–2.62V`).
   - **Rule**: Accumulate pure MAF bins (`Idx <= 73`, `MAP <= 105 kPa`) strictly from **unclamped frames** (`MAPCalcs >= 0.99 * MAFCalcs`), where $C_{\text{MAF}} = \text{AFR\_ERR}$ directly with zero $\min(\cdot, \cdot)$ rectification bias.
3. **Multi-ROM Bracketed Secant Solver with Post-Smoothing Bracket Invariance**:
   - Whenever sequential flashes (`ROM N-2`, `ROM N-1`, `ROM N`) bracket `1.0000` at MAF bin $i$ (one flash rich $e_{\text{rich}} < 1.0$, one flash lean $e_{\text{lean}} > 1.0$), solve for the zero-error value via linear secant root-finding:
     $$M_i^* = M_{i,\text{curr}} + \text{conf}_i \cdot \text{clamp}\left(\frac{1.0 - e_{\text{curr}}}{e_{\text{prev}} - e_{\text{curr}}}, 0.15, 0.85\right) \cdot (M_{i,\text{prev}} - M_{i,\text{curr}})$$
   - Even after 3-point multiplier smoothing across `Idx 36–72`, clamp every bracketed bin strictly inside $[M_{\text{lean}} + 0.10\Delta M, M_{\text{rich}} - 0.10\Delta M]$ so neighbor smoothing can never push a bin outside its empirically tested `[Lean, Rich]` boundary. Where all flashes lie on the same side of `1.0000`, apply `0.45` damping (since empirical AFR gain on ID1300x + 3.5" intake is `1.5x–1.8x`).
4. **Exhaust-Window-Matched `TrueLoad` & Crossover Anti-Rectification Guard (`Col 6 = 89.4 kPa`, `Col 7 = 102.8 kPa`)**:
   - Compute `TrueLoad` for `MAP based Load Calc` using a **5-frame (`~0.25s`) moving average** of `ChosenCalc` and `MAPCalcs` ($\overline{\text{TrueLoad}}_i = \overline{\text{ChosenCalc}}_{i-2..i+2} \times \text{AFR\_ERR}_{i+\text{lag}}$) aligned by dynamic exhaust transport delay $\Delta t = \text{clamp}\left(\frac{0.35}{\sqrt{\max(0.3, \text{RPM} \times \text{MAP} / 100000)}}, 0.10\text{s}, 0.45\text{s}\right)$, with stationary idle down-weighted (`w = 0.05`).
   - Because `Idx <= 73` (`<= 2.85V`) has no `1.25x` boost headroom, `MAFCalcs` sits at `~1.00 × TrueLoad` with $\pm 8\%$ pulsation across `90–115 kPa` (`2.35V–2.68V`). By Jensen's Inequality ($\mathbb{E}[\min(X,Y)] = \mu - \frac{\sigma}{\sqrt{\pi}} < \mu$), setting `MAPCalcs == TrueLoad` (`Ratio = 1.00`) at `102.8 kPa` causes $\min(\text{MAFCalcs}, \text{MAPCalcs})$ to clip every upward MAF peak while passing every downward trough—clamping up to `87%` of crossover frames, starving fuel (`15.1–15.5 AFR`), and advancing spark into knock at `105–115 kPa`.
   - **Rule**: Target **`1.20 × TrueLoad_5frame`** in vacuum (`Cols 2–5`: `35.6–75.9 kPa`), **`1.14 × TrueLoad_5frame`** at `Col 6 (89.4 kPa)` (`~70–75%` load), and **`1.06 × TrueLoad_5frame`** at `Col 7 (102.8 kPa)` (`~81–85%` load, aligned with `V3.18`). In positive boost (`Col 8 = 116.3 kPa`, `Col 9 = 129.7 kPa`), **never deflate `MAP based Load Calc` below the knock-free `ROM 25` / `V3.18` floor (`~100.0%` at `116.3 kPa`, `~115.2%` at `129.7 kPa`) based on rich transient spool samples (`AFRErr < 1.0`)**.
5. **3D VE RPM Slope Preservation & No Low-Voltage Idle Shelf**:
   - Never flatten `MAP based Load Calc` vertically across RPM above `2,000 RPM`; always preserve a non-decreasing VE curve along `V3.18`'s RPM slope.
   - Never inflate `Idx 31–38` (`1.21V–1.49V`) above the physical warm `50 kPa` idle curve (`~4.9–5.2 g/s` at `1.41V–1.45V`, `Idx 36–37`).

---

## 6. Load Shift Timing & MIVEC Synchronization (Conservative Rule)

Whenever `MAF Scaling Horizontal` or `MAP based Load Calc` tables are recalculated (e.g. via LogChopper, balancer iterations, or wideband AFR targeting), the ECU's calculated engine load coordinates shift across the operating range. Because the ECU indexes Ignition Timing and MIVEC directly from this calculated load, the delivered spark advance and cam phase angles will drift away from the vehicle's safe dyno calibration (`V3.18.srf`).

### Mandatory Recalculation Rule & Runtime `MAPCalcs` Scaling (`K_MAP_RUNTIME = 1.090`)
1. **Whenever MAF or MAP load calculation tables are modified, you MUST recalculate the Ignition Timing tables using `tuning_tools/tools/timing_mivec_remapper.py`.**
2. **Runtime `MAPCalcs` Coordinate Scaling**: Raw `MAP based Load Calc` table values (`x / 163.84`) are multiplied in the ECU by `(256 + rom[0x5494C]) / 256 = 1.05078` and by intake air density compensation (`~1.037` nominal), yielding runtime `MAPCalcs ≈ 1.090 × TableValue`. `timing_mivec_remapper.py` applies `K_MAP_RUNTIME = 1.090` so `LOAD_TIMING_AXIS` (`0–320%`) maps to the true manifold pressure operating point.

### Conservative Mode Mandate (`--lower-only`), Knock Inception & BOV Flutter Decoupling
When synchronizing timing tables following MAF/MAP updates, **always run with the conservative lower-only rule**:
$$Timing_{\text{safe}}(r, c) = \min(Timing_{\text{current}}(r, c), Timing_{\text{remapped}}(r, c))$$
$$LowTiming_{\text{safe}}(r, c) = \min(LowTiming_{\text{current}}(r, c), Timing_{\text{safe}}(r, c) - 1)$$

- **Zero Accidental Advance**: Never introduce added timing advance when compensating for airflow/load recalculations. Any cell where the remapped timing is higher than current calibration must be held at the current value (0° advance added).
- **Knock Inception Filtering ($\Delta \text{KnockSum} > 0$)**: The ECU's `KnockSum` channel is a rolling decay accumulator. Only transition frames where `KnockSum` increases ($\Delta \text{KnockSum} > 0$) represent genuine knock inception. Decay frames must never contaminate downstream cells as the engine sweeps across RPM and load.
- **BOV Flutter Knock Decoupling (`bov_flutter_knock_detector.py` / `--filter-flutter-knock`)**:
  - Under part-throttle spool (`TPS 25%–55%`, `MAP 95–135 kPa`), high charge pipe pressure against a partially open throttle body can cause the BOV to rapidly cycle / flutter open and closed (5–15 Hz).
  - This cycling creates **acoustic valve impact chatter** and **violent airflow reversion oscillations** ($\Delta MAFV \ge 0.28\text{V}$, multiple directional reversals), which register as false knock or transient airflow slosh.
  - This is a pneumatic/hardware boundary condition that **cannot be tuned around via ignition timing**. Never retard ignition timing for BOV flutter events! Run `bov_flutter_knock_detector.py` to isolate them, address BOV spring preload or reference plumbing, and pass `--filter-flutter-knock` to `timing_mivec_remapper.py`.
- **Direct Knock-Corridor Safety Retard & Isolated Single-Count Confidence Rule**:
  - **Isolated Single Count (KnockSum = 1)**: If a datalog records an isolated knock count of 1 that does not repeat or occur frequently across cell visits (< 25% frequency / not a majority), it must be logged and stored in `calibration_experience.db` for historical tracking, but **held unchanged in the ignition timing tables** (0° retard applied).
  - **Frequent / Confident Detonation**: Apply an explicit `-1°` safety retard to cells in `High Octane` and `Low Octane` Timing (on top of `--lower-only`) only when knock is confident and frequent (e.g. multi-count detonation spike $\Delta\text{KnockSum} \ge 2$, repeated knock across multiple independent passes, or high visit frequency $\ge 25\%$).
- **Boost Protection**: Boost cells ($\ge 120\%$ Load) retain their safe existing timing floors without running extra advance.
- **Command Reference**:
  ```bash
  # Run the full Multi-ROM Bracketed Secant & Anti-Rectification Balancer:
  python3 tuning_tools/tools/multi_rom_secant_balancer.py \
    --target-rom "roms/<LATEST_ROM>.srf" --logs scans/<LATEST_LOG1>.csv scans/<LATEST_LOG2>.csv \
    --prev-rom1 "roms/<PREV_ROM1>.srf" --prev-logs1 scans/<PREV_LOG1>.csv \
    --prev-rom2 "roms/<PREV_ROM2>.srf" --prev-logs2 scans/<PREV_LOG2>.csv \
    --export-dir /tmp/next_rom_exports

  # Diagnose Knock Events (Classify BOV Flutter vs True Timing Knock):
  python3 tuning_tools/tools/bov_flutter_knock_detector.py scans/<LATEST_LOG1>.csv scans/<LATEST_LOG2>.csv

  # Synchronize Timing (--lower-only) with BOV Flutter Filter active:
  python3 tuning_tools/tools/timing_mivec_remapper.py \
    --target-rom "roms/<LATEST_ROM>.srf" \
    --maf-table /tmp/next_rom_exports/new_maf_scaling.tsv \
    --map-table /tmp/next_rom_exports/new_map_load_calc.tsv \
    --knock-logs scans/<LATEST_LOG1>.csv scans/<LATEST_LOG2>.csv \
    --filter-flutter-knock \
    --paste-timing --lower-only
  ```


