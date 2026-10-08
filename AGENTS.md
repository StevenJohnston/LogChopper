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
- **Memory Layout vs GUI Rendering (`swapxy="true"`)**:
  - In raw M32R firmware, the 380 words are stored **column-major**: `offset = map_col * 19 + rpm_row`.
  - **The Transposition Anti-Pattern**: Slicing the binary memory by contiguous chunks (`scaled[m * 19 : (m + 1) * 19]`) yields 20 slices of 19 values. Emitting these directly as table rows creates a transposed **20 Rows × 19 Columns** matrix. When pasting into EcuFlash, the software immediately fails with a clipboard dimension mismatch.
  - **Mandatory Clipboard Format**: All paste blocks generated for `MAP based Load Calc` MUST be formatted as **19 lines (one line per RPM row) with 20 tab-separated values per line**:
    ```python
    for r in range(19):  # RPM rows
        row = [scaled_load[m * 19 + r] for m in range(20)]  # MAP columns
        print("\t".join(f"{x:.1f}" for x in row))
    ```

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
- **$100\text{ kPa}$ (Atmospheric Crossover)**: **Target Ratio = 1.00** *(0.98–1.02)*.
  - Natural neutral transition point between vacuum and positive boost gauge pressure.
- **$\ge 120\text{ kPa}$ (Boost / WOT)**: **Target Ratio = 0.80** *(0.80–0.85)*.
  - Pure Speed Density master ($MAPCalcs < MAFCalcs$). MAF sits 25% above MAP as headroom, preventing rapid spool boundary chatter.

### 3. Critical Safety Warning for Boost
- Under boost, the ECU indexes fuel and spark timing directly from $MAPCalcs$.
- **`MAP based Load Calc` MUST ALWAYS equal 100% of True Physical Load ($\text{Load}_{\text{true}}$)**.
- Achieve the 0.80 ratio by **setting MAF Scaling 25% higher than true load** ($MAF = 1.25 \times \text{Load}_{\text{true}}$).
- **NEVER** achieve 0.80 by deflating $MAPCalcs$ below actual cylinder charge, as this will artificially advance ignition timing under boost and induce severe knock/detonation.

