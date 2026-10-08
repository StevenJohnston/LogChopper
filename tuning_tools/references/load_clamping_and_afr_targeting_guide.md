# ECU Load Clamping, Speed Density Envelope & Balanced AFR Targeting Guide

This document establishes the mandatory mathematical and physical calibration architecture for targeting Air-Fuel Ratio (AFR) on the Mitsubishi Lancer Evolution X (4B11T) platform without triggering ECU engine load clamping or boundary instability.

---

## 1. Firmware Architecture & The Clamping Trap

### 1.1 The Steady-State Clamping Equation
As proven by decompiled M32R firmware routines `0x04DC64` (`load_clamp_or_blend`) and `0x02FDC4` (`map_load_calc_and_blend_engine`):
$$\text{Lower} = \min(MAPCalcs, IMAPCalcs)$$
$$\text{Upper} = \max(MAPCalcs, IMAPCalcs)$$
$$\text{ChosenCalc} = \text{clamp}(MAFCalcs_{\text{filtered}}, \text{Lower}, \text{Upper})$$

During steady cruise, idle, and non-tip-in operation ($\Delta TPS \le 1.0\%$), the baseline transient register `0x00808810` holds $0.0$, making `IMAPCalcs = 0.0`:
$$\text{Lower} = 0.0, \quad \text{Upper} = MAPCalcs \implies \mathbf{ChosenCalc = \min(MAFCalcs, MAPCalcs)}$$

> [!IMPORTANT]
> **`MAPCalcs` functions strictly as an UPPER CEILING in vacuum, NOT a bilateral lock.**
> - When $MAFCalcs \le MAPCalcs$, the car runs on pure filtered MAF.
> - When $MAFCalcs > MAPCalcs$, the ECU clips engine load down to `MAPCalcs`.

### 1.2 The Dynamic Scatter Reality (Why Flat 1.05 Fails)
LogChopper's legacy balancer assumed a flat target ratio of $1.05$ across all vacuum conditions based on the factory firmware scalar $(256 + 0x5494C)/256 = 1.05078$ ($+5.08\%$).

However, empirical datalog analysis demonstrates that on modified platforms with **aggressive camshafts (GSC S2)**, large turbochargers (Precision 8474), and 3.5" intake piping:
- Manifold pressure waves and airflow pulsations produce a ratio standard deviation of **$\sigma = 0.2312$ (18.8% Coefficient of Variation)** during steady cruise.
- Within $\pm 5\%$ of the mean occurs **only 33.5% of the time**.
- If the mean table ratio is calibrated to $1.05$, **38.2% of cruise telemetry crosses under 1.00 and hits the ceiling clamp**.
- This artificial truncation clips injector pulse width (IPW), starves fueling, and advances ignition timing undesirably.

---

## 2. The 3-Tier Target Ratio Ramp Across Manifold Pressure

To eliminate chronic clamping in vacuum while guaranteeing seamless transition into boost without sensor boundary chatter, calibration targets MUST follow a 3-tier pressure ramp:

$$\text{Target Ratio} = \frac{MAPCalcs}{MAFCalcs}$$

```
Target Ratio (MAPCalcs / MAFCalcs) Across Manifold Pressure:

Ratio
 1.20 | [<= 80 kPa Vacuum: Pure MAF Master, +20% Headroom Ceiling]
      |  \
 1.00 |   \--- [100 kPa Atmospheric Crossover Point]
      |        \
 0.80 |         \--- [>= 120 kPa Boost: Pure Speed Density Master, 25% MAF Headroom]
      +--------------------------------------------------------------------------> MAP (kPa)
          20k     40k     60k     80k     100k    120k    160k    200k    250k
```

| Pressure Regime | MAP Range | Target Ratio ($\frac{MAPCalcs}{MAFCalcs}$) | Dominant Fuel/Spark Master | Physical & Control Rationale |
| :--- | :---: | :---: | :---: | :--- |
| **Vacuum (Idle / Cruise)** | $\le 80\text{ kPa}$ | **1.20** *(1.18–1.22)* | **Pure MAF** (`MAFCalcs`) | Absorbs $\pm 18\%$ dynamic cam overlap scatter. Keeps ceiling clamping $< 5\%$, allowing pure MAF transient response. |
| **Atmospheric Crossover** | $100\text{ kPa}$ | **1.00** *(0.98–1.02)* | **Neutral Handshake** | Natural physical zero-gauge transition where vacuum gives way to positive manifold pressure. |
| **Positive Boost / WOT** | $\ge 120\text{ kPa}$ | **0.80** *(0.80–0.85)* | **Pure Speed Density** (`MAPCalcs`) | Firmly locks into Speed Density. MAF sits $25\%$ higher ($MAF = 1.25 \times MAP$), preventing boundary chatter under rapid spool. |

### Continuous Blending Equation:
For any given manifold pressure reading $\text{MAP}$ (kPa):
$$Ratio(\text{MAP}) = \begin{cases} 
1.20 & \text{for } \text{MAP} \le 80\text{ kPa} \\
1.20 - \left(\frac{\text{MAP} - 80}{40}\right) \times 0.40 = 1.20 - 0.010 \times (\text{MAP} - 80) & \text{for } 80 < \text{MAP} < 120\text{ kPa} \\
0.80 & \text{for } \text{MAP} \ge 120\text{ kPa}
\end{cases}$$

---

## 3. The Core Targeting Principle: Targeting AFR = AFRMAP via Load Calibration

A foundational principle of this calibration architecture is that **we target $\text{AFR} = AFRMAP$ strictly by calibrating the airflow / load calculation models (MAF and MAP), NEVER by distorting the fuel map**.

### 3.1 The Fuel Map is the Ground-Truth Target AFR Surface
- The **`High Octane Fuel Map` (`0x55027` / `0x57508`) defines the desired target AFR ($AFRMAP$)** across all engine RPM and Load conditions (e.g., $14.70$ at idle and cruise, transitioning to $11.20\text{--}11.80$ under high boost).
- Calibrators must **never** tweak the fuel map to compensate for lean or rich air mass calculation errors. The Fuel Map represents pure desired stoichiometry/enrichment.
- If measured wideband $\text{AFR} \ne AFRMAP$, the discrepancy represents an error in calculated cylinder air mass ($\text{Load}_{\text{true}}$) and must be solved in the respective sensor's load calculation table.

### 3.2 Operating Regimes and Fuel Masters
1. **In Vacuum ($\text{MAP} \le 80\text{ kPa}$): MAF Scaling is Fuel Master**
   - In vacuum, the ECU selects $MAFCalcs$ as the fueling master ($\min(MAFCalcs, MAPCalcs)$).
   - Adjust `MAF Scaling Horizontal` so that measured steady-state $\text{AFR} = AFRMAP$ ($14.70$).
   - `MAP based Load Calc` is set to $1.20 \times \text{Load}_{\text{true}}$ (+20% ceiling) to absorb camshaft overlap scatter and prevent chronic ceiling clamping.
2. **In Positive Boost ($\text{MAP} \ge 120\text{ kPa}$): MAP Load Calc is Speed Density VE Fuel Master**
   - Under boost, the ECU indexes fuel and spark directly from `MAP based Load Calc` ($MAPCalcs < MAFCalcs$).
   - `MAP based Load Calc` functions as the **Speed Density Volumetric Efficiency (VE) table**.
   - If the car runs rich or lean under boost, adjust `MAP based Load Calc` so that actual $\text{AFR} = AFRMAP$:
     $$\text{Target MAP Load} = \text{Current MAP Load} \times \left(\frac{\text{Actual AFR}}{AFRMAP}\right)$$
     This aligns delivered AFR directly with $AFRMAP$ and ensures the ECU indexes the true physical cylinder load in the ignition timing map.
   - Set MAF Scaling $25\%$ higher than true load ($MAF = 1.25 \times \text{Load}_{\text{true}}$, target ratio $0.80$) solely as anti-chatter headroom to keep Speed Density in continuous command.

### 3.3 The Failure Modes of Unilateral Adjustments
1. **Unilateral MAF Increase in Vacuum**:
   - Calibrator sees lean AFR (e.g. 15.2 vs 14.7) and raises MAF Scaling by $+3\%$.
   - If `MAP based Load Calc` is not raised proportionally, $MAFCalcs$ exceeds $MAPCalcs$.
   - The ECU immediately clamps load to `MAPCalcs`, **completely neutralizing the fuel increase**. The engine remains lean while hitting the ceiling clamp.
2. **Unilateral MAP Increase in Vacuum**:
   - Calibrator raises `MAP based Load Calc` to fix lean cruise.
   - Because $MAFCalcs < MAPCalcs$, the car is in Pure MAF control.
   - Raising MAP only raises the ceiling—it injects **zero extra fuel**.
3. **Deflating MAP below True Air Mass in Boost (DANGEROUS)**:
   - Calibrator tries to achieve the 0.80 ratio in boost by artificially deflating `MAP based Load Calc` below actual cylinder filling.
   - Because the ECU uses `MAPCalcs` in boost, this artificially reduces calculated load.
   - The ECU indexes lower load columns in the ignition map, **advancing spark timing by $3^\circ\text{--}5^\circ$ under boost, inducing severe knock/detonation**.
   - Correct method: MAP Load must equal true physical air mass ($100\%$ VE), and MAF must be raised $+25\%$ above it.

---

## 4. Ground Truth Airflow Assignment Protocol

To correct measured AFR errors while preserving exact 3-tier envelope balance, follow this rigorous dual-table update formula:

### Step 1: Calculate Ground Truth Airflow ($\text{Load}_{\text{true}}$)
The wideband O2 sensor directly measures the fueling error of whichever sensor was actively governing fuel delivery:
$$\text{AFR\_ERR} = \left(1.0 - \frac{\text{STFT} + \text{CurrentLTFT}}{100.0}\right) \times \frac{\text{AFR}}{\text{AFRMAP}}$$
$$\mathbf{\text{Load}_{\text{true}} = \min(MAFCalcs, MAPCalcs) \times \text{AFR\_ERR}}$$

### Step 2: Assign Regimes According to the 3-Tier Target Ratio

#### A. In Vacuum ($\text{MAP} \le 80\text{ kPa}$): MAF is Master
$$\text{Target\_MAFCalcs} = \mathbf{\text{Load}_{\text{true}}}$$
$$\text{Target\_MAPCalcs} = 1.20 \times \mathbf{\text{Load}_{\text{true}}}$$
$$\implies C_{\text{MAF}} = \frac{\text{Load}_{\text{true}}}{MAFCalcs}, \quad C_{\text{MAP}} = \frac{1.20 \times \text{Load}_{\text{true}}}{MAPCalcs}$$

#### B. At Atmospheric Crossover ($\text{MAP} = 100\text{ kPa}$): Shared Handshake
$$\text{Target\_MAFCalcs} = \mathbf{\text{Load}_{\text{true}}}$$
$$\text{Target\_MAPCalcs} = 1.00 \times \mathbf{\text{Load}_{\text{true}}}$$

#### C. In Boost ($\text{MAP} \ge 120\text{ kPa}$): MAP (Speed Density) is Master
$$\text{Target\_MAPCalcs} = \mathbf{\text{Load}_{\text{true}}}$$
$$\text{Target\_MAFCalcs} = \frac{\text{Load}_{\text{true}}}{0.80} = \mathbf{1.25 \times \text{Load}_{\text{true}}}$$
$$\implies C_{\text{MAP}} = \frac{\text{Load}_{\text{true}}}{MAPCalcs}, \quad C_{\text{MAF}} = \frac{1.25 \times \text{Load}_{\text{true}}}{MAFCalcs}$$

> [!CAUTION]
> In boost, `MAP based Load Calc` MUST ALWAYS equal 100% of True Physical Cylinder Load ($\text{Load}_{\text{true}}$) so that ignition timing and target AFR are indexed accurately. The 0.80 ratio is created by **over-scaling MAF by 25%** as headroom above MAP, never by under-scaling MAP.

---

## 5. Damping and Monotonic Convergence

On large injectors (ID1300x) and 3.5" intake piping, open-loop empirical fueling gain is:
$$\text{Empirical Gain} = \frac{\Delta AFR\%}{\Delta Table\%} \approx 1.5\times\text{ to }2.0\times$$

To prevent closed-loop oscillation and overshoot, apply damping ($D = 0.33$ to $0.50$) to both multiplier updates:
$$C_{\text{MAF, applied}} = 1.0 + D \times (C_{\text{MAF}} - 1.0)$$
$$C_{\text{MAP, applied}} = 1.0 + D \times (C_{\text{MAP}} - 1.0)$$

This ensures monotonic, stable convergence toward stoichiometric cruising and safe, high-load boost delivery across sequential flashes.

---

## 6. Thermal Decoupling & The Strict 2D MAT Monotonicity Law

While load clamping balances airflow between MAF and MAP, charge air temperature compensation (`Fuel Compensation MAT vs MAP` at `0x60FCD`) governs fueling stability across engine operating temperatures.

### 6.1 Thermal Decoupling vs. Base Air Mass Error
- **The Core Rule**: MAT compensation exists strictly for **Thermal Invariance** ($\frac{\partial \text{AFR}}{\partial \text{MAT}} = 0$). High manifold temperatures ($40^\circ\text{C}\text{--}60^\circ\text{C}+$) must produce the exact same AFR as the cold ambient baseline ($20^\circ\text{C}$).
- **The Cross-Coupling Anti-Pattern**: Never adjust MAT compensation cells to target `AFRMAP` (e.g. 14.70). If the engine is running 15.10 AFR cold, adding MAT compensation to achieve 14.70 when hot cross-couples thermal multipliers with base air mass error. When MAF is later corrected, the engine will drift rich when hot.
- **Proper Decoupled Protocol**:
  1. Determine thermal drift relative to cold baseline: $\Delta_{\text{thermal}} = \frac{\text{AFR}_{\text{hot}}}{\text{AFR}_{\text{cold\_witnessed}}}$.
  2. Adjust MAT cells by $\Delta_{\text{thermal}}$ to guarantee thermal invariance.
  3. Resolve the residual global baseline error (e.g., $15.10 \to 14.70$) strictly through **MAF Scaling** and **MAP based Load Calc** using the 3-Tier Target Ratio Ramp.

### 6.2 The Strict 2D Monotonicity Law
Every MAT compensation table MUST satisfy pure 2D monotonicity without localized dips:
1. **Cold Baseline Floor (Rows 0 & 1)**:
   - Row 0 ($-10^\circ\text{C}$ / $14^\circ\text{F}$) and Row 1 ($5^\circ\text{C}$ / $41^\circ\text{F}$) **MUST remain locked at 100.0% across all MAP columns**.
2. **Monotonicity With Temperature (Down Rows)**:
   - For every MAP column $c$ and temperature row $r$:
     $$Mult(r+1, c) \ge Mult(r, c)$$
   - Fuel compensation must strictly increase (or remain equal) as intake manifold temperature rises. Temperature dips down a column create artificial lean pockets during heat-soak.
3. **Monotonicity With Vacuum (Across Columns from Boost to Vacuum)**:
   - For every temperature row $r$ and MAP column $c$ (ordered from vacuum $c=0$ to boost $c=9$):
     $$Mult(r, c) \ge Mult(r, c+1)$$
   - Fuel compensation must strictly increase with vacuum (tapering smoothly down toward $100.0\%$ in positive boost). Pressure dips across a row cause fuel delivery stutter during manifold pressure transitions.
4. **Zero-Dip Mandate**:
   - Any localized cell dip violates physical combustion chamber dynamics and introduces non-linear AFR instability across seasonal and operating temperature shifts.

