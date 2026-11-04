# Mandatory Evo X (4B11T) Pure Open-Loop Calibration Safeguards Checklist

Before outputting any EcuFlash clipboard paste buffers, verify every single safeguard below:

## 1. Zero ROM Binary Creation & Pure Open-Loop Rules
- **NEVER** create, overwrite, or output `.srf` or `.bin` files in `roms/` or anywhere else. Output calibration updates strictly as tab-separated clipboard blocks (and `/tmp/*.tsv` files).
- **100% Open-Loop Wideband Gating**: Closed-loop (`STFT`/`LTFT`) is permanently disabled. Never filter for `abs(STFT) > 0` or add trims to AFR error. Exclude wideband heater warmup (`< 35s` after cold crank) and rail-clipped wideband frames (`AFR <= 10.08` or `AFR >= 18.42`).

## 2. EcuFlash Grid Orientation & Table Parity
- **`MAF Scaling Horizontal` (`0x5757A`)**: `1 × 130` values (g/s).
  - Never inflate idle/low-voltage bins (`Idx 31–38`, `1.21V–1.49V`) above the physical warm `50 kPa` idle curve (`~4.9–5.2 g/s` at `1.41V–1.45V`).
  - **No Unvisited-Bin Ratcheting / No Flat-Line Shelves**: Never multiply unvisited bins (`N=0`) by per-flash factors. Enforce smooth 1st-derivative slope continuity along `V3.18` across `Idx 73–95` and run `experience_query.py audit-maf-envelope` to verify zero flat-line kinks.
- **`MAP based Load Calc #1` (`0x608AE`) & `#2` (`0x605AC`)**:
  - **19 RPM Rows × 20 MAP Columns** (`380` cells, stored column-major `m * 19 + r` in ROM).
  - Paste the identical `19 × 20` block into **BOTH** `#1 - Hot/Interpolated` and `#2 - Cold/Interpolated`.
  - Preserve non-decreasing VE along `V3.18`'s RPM slope above `2,000 RPM` and never deflate positive boost (`116.3–129.7 kPa`) below the knock-free `ROM 25` / `V3.18` floor (`~100.0%` at `116.3 kPa`, `~115.2%` at `129.7 kPa`).
- **`High Octane` (`0x55957`) & `Low Octane` (`0x55B59`) Timing**:
  - **23 RPM Rows × 22 Load Columns** (`506` signed `int8` cells, stored column-major `l * 23 + r` in ROM).
  - Always run `timing_mivec_remapper.py` with `K_MAP_RUNTIME = 1.090` and `--lower-only` so zero accidental timing advance is ever introduced (`Timing_new <= Timing_curr`), and `LowTiming <= HighTiming - 1`.

## 3. Load Envelope, 1D MAF Aliasing & Anti-Rectification Rules
- **Sacred Fuel Map**: Never edit `High Octane Fuel Map` (`0x55027`) to fix airflow errors. Target `AFR = AFRMAP` via `MAF Scaling` (vacuum master) and `MAP based Load Calc` (boost Speed Density master).
- **3-Tier Ratio Ramp (`MAPCalcs / MAFCalcs`)**:
  - Vacuum (`<= 80 kPa`): **`1.20x`** (`1.18–1.22`) so `MAFCalcs` governs cleanly with `< 5%` ceiling clamping.
  - Crossover (`89.4 kPa` Col 6 / `102.8 kPa` Col 7): **`1.14x`** at `89.4 kPa` and **`1.06x`** at `102.8 kPa` to prevent Jensen's Inequality $\min(\text{MAFCalcs}, \text{MAPCalcs})$ peak-clipping lean-out.
  - Boost (`>= 120 kPa`): **`0.80x`** achieved by placing `MAF Scaling` (`Idx >= 74`, `>= 2.89V`) non-cumulatively at **`1.22x–1.32x` empirical Boost `TrueLoad`** while keeping `MAP based Load Calc == 100% TrueLoad`.
- **1D MAF vs MAP Aliasing Guard (`2.74V–2.88V`)**:
  - High-RPM vacuum (`5,000+ RPM @ 85–100 kPa`) and mid-RPM boost (`3,200 RPM @ 135 kPa`) share the same 1D MAF voltages (`~2.74V–2.88V`). Calibrate `Idx <= 73` strictly from unclamped vacuum frames with `MAFV <= 2.74V`; never let light-throttle high-RPM pulls deflate boost Speed Density headroom above `2.85V`, and avoid excessive (`> 1.38x`) boost MAF inflation that leaks into transient spool via `IMAPCalcs`.

## 4. Knock Confidence & BOV Flutter Decoupling
- **BOV Flutter (`BOV_FLUTTER`)**: High-frequency charge-pipe reversion (`ΔMAFV >= 0.25V`, multiple reversals at part-throttle `90–140 kPa`). Never pull ignition timing for flutter—pass `--filter-flutter-knock`.
- **Isolated Single-Count Knock (`KnockSum == 1`)**: Store in `calibration_experience.db` (`operational_events` / `anomaly_episodes`) for monitoring, and **hold ignition timing unchanged (`0°` retard)** when `< 25%` visit frequency (`--min-knock-frequency 0.25`).
- **Frequent / Multi-Count Knock**: Apply `-1°` safety retard only when $\Delta\text{KnockSum} \ge 2$, $\ge 2$ knock inceptions occur in that cell, or visit knock frequency $\ge 25\%$.

## 5. 3-Way Decoupled Thermal Calibration (`ECT` vs `MAT` vs `IAT`)
- **Coolant Warmup (`ECT Fuel Compensation #1` `0x5ADB9` & `#2` `0x5AF31`)**: `9 ECT Rows [-32..82°C] × 41 Load Cols [10..320%]` (`swapxy="true"`, `Percent128 = raw / 1.28`). Governs cold-engine warmup (`ECT < 77°C`) and locks at `100.0%` at `77–82°C`. Diagnose strictly by comparing `WARMUP_ECT_ACTIVE` (`>90s` post-crank) against fully warm `>= 85°C` within the **same drive** (`audit-thermal` Part A).
- **Manifold Heat-Soak (`Fuel Compensation MAT vs MAP` `0x60FCD`)**: `7 MAT Rows × 10 MAP Cols` (`swapxy="true"`). Note firmware 4:1 attenuation: ECU multiplies IPW by `(raw + 384) / 512` (so a `4%` EcuFlash `Percent128` GUI edit produces a `1%` actual fuel change!). Targets **Thermal Invariance** (`HEATSOAK_FLUSH_SPLIT` vs unsoaked baseline), NOT `AFRMAP` directly, with strict 2D monotonicity and Rows 0–1 (`-10°C`, `5°C`) locked at `100.0%`.
- **Seasonal Outdoor `IAT`**: Note that `MAFCalcs` is temperature-invariant while `MAPCalcs` scales with charge density (`~1.13x` at `8°C` vs `~1.07x` at `28°C`), naturally shifting `MAPCalcs / MAFCalcs` upward in cold winter air.
