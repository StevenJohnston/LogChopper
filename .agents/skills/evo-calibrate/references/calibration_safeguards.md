# Mandatory Evo X (4B11T) Calibration Safeguards Checklist

Before outputting any EcuFlash clipboard paste buffers, verify every single safeguard below:

## 1. Zero ROM Binary Creation Rule
- **NEVER** create, overwrite, or output `.srf` or `.bin` files in `roms/` or anywhere else.
- Output calibration updates strictly as tab-separated clipboard blocks (and `/tmp/*.tsv` files if needed by `timing_mivec_remapper.py`).

## 2. EcuFlash Grid Orientation & Table Parity
- **`MAF Scaling Horizontal` (`0x5757A`)**: `1 × 130` values (g/s).
  - Never inflate idle/low-voltage bins (`Idx 31–38`, `1.21V–1.49V`) above the physical warm `50 kPa` idle curve (`~4.9–5.2 g/s` at `1.41V–1.45V`).
  - Maintain smooth monotonicity across adjacent voltage bins.
- **`MAP based Load Calc #1` (`0x608AE`) & `#2` (`0x605AC`)**:
  - **19 RPM Rows × 20 MAP Columns** (`380` cells).
  - Raw binary is stored column-major (`swapxy="true"`), so clipboard output MUST iterate `for r in range(19): [val[m * 19 + r] for m in range(20)]`.
  - Instruct the user to paste the identical `19 × 20` block into **BOTH** `#1 - Hot/Interpolated` and `#2 - Cold/Interpolated`.
  - Preserve non-decreasing VE along `V3.18`'s RPM slope above `2,000 RPM` and never deflate positive boost (`116.3–129.7 kPa`) below the knock-free `ROM 25` / `V3.18` floor (`~100.0%` at `116.3 kPa`, `~115.2%` at `129.7 kPa`).
- **`High Octane` (`0x55957`) & `Low Octane` (`0x55757`) Timing**:
  - **23 RPM Rows × 22 Load Columns** (`506` integer cells).
  - Always run `timing_mivec_remapper.py` with `K_MAP_RUNTIME = 1.090` and `--lower-only` so zero accidental timing advance is ever introduced (`Timing_new <= Timing_curr`), and `LowTiming <= HighTiming - 1`.

## 3. Load Envelope & Anti-Rectification Rules
- **Sacred Fuel Map**: Never edit `High Octane Fuel Map` (`0x55027`) to fix airflow errors. Target `AFR = AFRMAP` via `MAF Scaling` (vacuum master) and `MAP based Load Calc` (boost Speed Density master).
- **3-Tier Ratio Ramp (`MAPCalcs / MAFCalcs`)**:
  - Vacuum (`<= 80 kPa`): **`1.20x`** (`1.18–1.22`) so `MAFCalcs` governs cleanly with `< 5%` ceiling clamping.
  - Crossover (`89.4 kPa` Col 6 / `102.8 kPa` Col 7): **`1.14x`** at `89.4 kPa` and **`1.06x`** at `102.8 kPa` to prevent Jensen's Inequality $\min(\text{MAFCalcs}, \text{MAPCalcs})$ peak-clipping lean-out.
  - Boost (`>= 120 kPa`): **`0.80x`** achieved by placing `MAF Scaling` (`Idx >= 74`, `>= 2.89V`) at **`1.25 × TrueLoad`** while keeping `MAP based Load Calc == 100% TrueLoad`.
- **Cross-Regime MAF Isolation (`Idx <= 73`, `<= 2.85V`)**:
  - Calibrate `Idx <= 73` strictly from **unclamped** (`MAPCalcs >= 0.99 * MAFCalcs`) vacuum/atmospheric frames (`MAP <= 105 kPa`). Never apply boost headroom to `<= 2.85V`.

## 4. Knock Confidence & BOV Flutter Decoupling
- **BOV Flutter (`BOV_FLUTTER`)**: High-frequency charge-pipe reversion (`ΔMAFV >= 0.25V`, multiple reversals at part-throttle `90–140 kPa`). Never pull ignition timing for flutter—pass `--filter-flutter-knock`.
- **Isolated Single-Count Knock (`KnockSum == 1`)**: When a cell experiences only an isolated single count of `1` at low visit frequency (`< 25%` of visits), store it in `calibration_experience.db` (`operational_events`) for monitoring, and **hold ignition timing unchanged (`0°` retard)** via `--min-knock-frequency 0.25`.
- **Frequent / Multi-Count Knock**: Apply `-1°` safety retard only when $\Delta\text{KnockSum} \ge 2$, $\ge 2$ knock inceptions occur in that cell, or visit knock frequency $\ge 25\%$.

## 5. Decoupled MAT Thermal Invariance (`0x60FCD`)
- `Fuel Compensation MAT vs MAP` (`7 MAT Rows × 10 MAP Columns`, `swapxy="true"`) targets **Thermal Invariance** ($\text{AFR}_{\text{hot}} == \text{AFR}_{\text{cold\_witnessed}}$), NOT `AFRMAP` directly.
- Enforce **Strict 2D Monotonicity**: Rows 0 & 1 (`-10°C`, `5°C`) locked at `100.0%`; values must never dip as temperature increases down a column or as vacuum increases across a row.
