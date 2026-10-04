# Mitsubishi Evolution X (4B11T) Idle System Architecture & Firmware Disassembly

## Overview

This reference document details the complete reverse-engineered architecture of the idle control and deceleration dashpot systems in the Mitsubishi Lancer Evolution X (Renesas M32186F8 M32R MCU, USDM Base ROM `59580004` / TephraMOD `59580304`).

All routines have been decompiled from raw machine code into typed C source files located in `tuning_tools/decompiled_c/`.

---

## 1. Decompiled C Firmware Routines

The following C source files were extracted and decompiled from the ECU firmware:

| Function Name | Entry Address | File Path | Subsystem Role |
| :--- | :---: | :--- | :--- |
| `idle_target_rpm_selector` | `0x025C3C` | [`tuning_tools/decompiled_c/idle_target_rpm_selector.c`](file:///Users/steven/Library/CloudStorage/GoogleDrive-stevenjohnston.ca@gmail.com/My%20Drive/Evoman/tuning_tools/decompiled_c/idle_target_rpm_selector.c) | Master Target Idle selector; evaluates ECT curves (`#1–#9`) and state floor clamps (`Target Idle #1–#14`). |
| `idle_throttle_airflow_calc` | `0x07CB18` | [`tuning_tools/decompiled_c/idle_throttle_airflow_calc.c`](file:///Users/steven/Library/CloudStorage/GoogleDrive-stevenjohnston.ca@gmail.com/My%20Drive/Evoman/tuning_tools/decompiled_c/idle_throttle_airflow_calc.c) | Drive-by-Wire (DBW) idle airflow dashpot and throttle follower decay state machine. |
| `idle_ignition_timing_compensation_evaluator` | `0x02125C` | [`tuning_tools/decompiled_c/idle_ignition_timing_compensation_evaluator.c`](file:///Users/steven/Library/CloudStorage/GoogleDrive-stevenjohnston.ca@gmail.com/My%20Drive/Evoman/tuning_tools/decompiled_c/idle_ignition_timing_compensation_evaluator.c) | Evaluates closed-loop spark timing feedback (`Comp 1.1–2.2`) and VSS retard suppression. |
| `idle_ignition_timing_control` | `0x04BF18` | [`tuning_tools/decompiled_c/idle_ignition_timing_control.c`](file:///Users/steven/Library/CloudStorage/GoogleDrive-stevenjohnston.ca@gmail.com/My%20Drive/Evoman/tuning_tools/decompiled_c/idle_ignition_timing_control.c) | Primary idle spark timing error accumulator and proportional-integral loop. |
| `state_flag_routine_0x1ea14` | `0x01EA14` | [`tuning_tools/decompiled_c/state_flag_routine_0x1ea14.c`](file:///Users/steven/Library/CloudStorage/GoogleDrive-stevenjohnston.ca@gmail.com/My%20Drive/Evoman/tuning_tools/decompiled_c/state_flag_routine_0x1ea14.c) | Speed hysteresis and delay timer for moving/rolling state flag `_DAT_00809528` bit 1 (0x2). |
| `state_flag_routine_0x1eaa4` | `0x01EAA4` | [`tuning_tools/decompiled_c/state_flag_routine_0x1eaa4.c`](file:///Users/steven/Library/CloudStorage/GoogleDrive-stevenjohnston.ca@gmail.com/My%20Drive/Evoman/tuning_tools/decompiled_c/state_flag_routine_0x1eaa4.c) | Speed hysteresis and delay timer for moving/rolling state flag `_DAT_00809528` bit 9 (0x200). |
| `idle_subsystem_dispatcher_0x2e8c4` | `0x02E8C4` | [`tuning_tools/decompiled_c/idle_subsystem_dispatcher_0x2e8c4.c`](file:///Users/steven/Library/CloudStorage/GoogleDrive-stevenjohnston.ca@gmail.com/My%20Drive/Evoman/tuning_tools/decompiled_c/idle_subsystem_dispatcher_0x2e8c4.c) | Main periodic task loop dispatcher for idle, speed calculation, and DBW scheduling. |
| `idle_rpm_error_calc` | `0x04BDC0` | [`tuning_tools/decompiled_c/idle_rpm_error_calc.c`](file:///Users/steven/Library/CloudStorage/GoogleDrive-stevenjohnston.ca@gmail.com/My%20Drive/Evoman/tuning_tools/decompiled_c/idle_rpm_error_calc.c) | Scales `Target RPM` (`_DAT_00808b44`) and actual RPM (`_DAT_0080a304`) into 16-bit error domain. |
| `idle_subroutine_0x26018` | `0x026018` | [`tuning_tools/decompiled_c/idle_subroutine_0x26018.c`](file:///Users/steven/Library/CloudStorage/GoogleDrive-stevenjohnston.ca@gmail.com/My%20Drive/Evoman/tuning_tools/decompiled_c/idle_subroutine_0x26018.c) | Fast idle compensation and startup flare decay timer. |
| `speed_vehicle_speed_calc` | `0x03190C` | [`tuning_tools/decompiled_c/speed_vehicle_speed_calc.c`](file:///Users/steven/Library/CloudStorage/GoogleDrive-stevenjohnston.ca@gmail.com/My%20Drive/Evoman/tuning_tools/decompiled_c/speed_vehicle_speed_calc.c) | Vehicle speed smoothing, filter lag, and rolling flag buffer `_DAT_00809520`. |

---

## 2. The 3-Tier Idle Control Architecture

```mermaid
flowchart TD
    ECT["Engine Coolant Temp (ECT)"] --> T1["Tier 1: Base 2D Curve Selection (Idle RPM #1 - #9)"]
    VSS["Vehicle Speed Sensor (VSS)"] --> STAT["Rolling vs Stationary State Check (0x01EA14)"]
    AC["A/C Compressor Clutch Flag (_DAT_00808646 & 0x20)"] --> STAT
    PSP["Power Steering & Electrical Load Flags"] --> STAT

    T1 --> T2["Tier 2: Target Idle Floor Comparator (Target Idle #1 - #14)"]
    STAT --> T2

    T2 -->|Output Target RPM 0x00808B44| T3A["Tier 3A: Closed-Loop Ignition Timing (0x02125C)"]
    T2 -->|Output Target RPM 0x00808B44| T3B["Tier 3B: DBW Throttle Dashpot Airflow (0x07CB18)"]
    T2 -->|Output Target RPM 0x00808B44| T3C["Tier 3C: Dynamic Adders vs ECT (0x60E0C / 0x60E1A)"]

    T3A -->|Retards Timing to 6°-10° (Stopped Only)| SPARK["Ignition Timing Advance"]
    T3B -->|Holds Throttle Blade at 13.7%| THROTTLE["Drive-by-Wire Throttle Command"]
    T3C -->|Trims Target Upward| FINAL_RPM["Engine Idle RPM"]
```

---

## 3. Comprehensive Calibration Table Map

### 3.1 Tier 1: Base Coolant Temperature Curves (2D Tables)

All tables use the 9-element ECT axis at `0x0619EC` (`-32, -18, -8, 7, 20, 34, 50, 77, 82 °C`):

| Table Name | Address | Function in Firmware Routine (`0x025C3C`) | Stock Warm (82°C) | Tuned ROM (S2 Cams) |
| :--- | :---: | :--- | :---: | :---: |
| **Idle RPM #1 vs Coolant Temp** | `0x05F630` | **Engine Cranking / Starting**: Target RPM while starter is engaged. | 852 RPM | 1000 RPM |
| **Idle RPM #2 vs Coolant Temp** | `0x05F620` | **Post-Start Initial Flare**: Target RPM immediately following start flare. | 703 RPM | 1000 RPM |
| **Idle RPM #3 vs Coolant Temp** | `0x056248` | **Base Idle (A/C ON)**: Primary curve when A/C compressor is engaged. | 703 RPM | 1000 RPM |
| **Idle RPM #4 vs Coolant Temp** | `0x05AB18` | **Base Idle (High Electrical Load)**: Alternator load, headlights, rear defroster. | 703 RPM | 1000 RPM |
| **Idle RPM #5 vs Coolant Temp** | `0x056258` | **Primary Base Idle (A/C OFF)**: Master baseline curve for normal operation. | 703 RPM | 1000 RPM |
| **Idle RPM #6 vs Coolant Temp** | `0x05AB4A` | **Moving / In-Gear (A/C OFF)**: Rolling target when transmission is in gear (`0x80A470 == 4`). | 805 RPM | 1000 RPM |
| **Idle RPM #7 vs Coolant Temp** | `0x05AB3E` | **Moving / Neutral (A/C OFF)**: Rolling target when coasting in neutral (A/C OFF). | 805 RPM | 1000 RPM |
| **Idle RPM #8 vs Coolant Temp** | `0x05A094` | **Moving / In-Gear (A/C ON)**: Rolling target when in gear with A/C active. | 805 RPM | 1000 RPM |
| **Idle RPM #9 vs Coolant Temp** | `0x05A088` | **Moving / Neutral (A/C ON)**: Rolling target when coasting in neutral with A/C active. | 805 RPM | 1000 RPM |

---

### 3.2 Tier 2: State Floor Overrides (1D Tables)

Scalar floor checks: `if (Target_RPM < Floor) Target_RPM = Floor`:

| Table Name | Address | Function in Firmware Routine (`0x025C3C`) | Stock USDM | Tuned ROM | Notes / Impact |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **Target Idle #1** | `0x0533CA` | **A/C Active Minimum Floor** | 898 RPM | 1000 RPM | Hard floor whenever A/C compressor is ON. |
| **Target Idle #2** | `0x053C84` | **Rolling Idle Floor (A/C ON)** | **1297 RPM** | **1578 RPM** | Hard floor while rolling with A/C active. Set abnormally high. |
| **Target Idle #3** | `0x053C86` | **Rolling Idle Floor (A/C OFF)** | 1000 RPM | 1000 RPM | Hard floor while rolling with A/C OFF. |
| **Target Idle #4** | `0x0532E2` | **Power Steering + A/C ON (In Gear)** | 703 RPM | 1000 RPM | Steering assist load floor with A/C in gear. |
| **Target Idle #5** | `0x053D88` | **Power Steering + A/C ON (High Elec)**| 797 RPM | 1000 RPM | Steering assist load floor with A/C and high electrical load. |
| **Target Idle #6** | `0x0532DE` | **Power Steering + A/C ON (Neutral)** | 797 RPM | 1000 RPM | Steering assist load floor with A/C in neutral. |
| **Target Idle #7** | `0x0532E4` | **Power Steering + A/C OFF (In Gear)** | 703 RPM | 1000 RPM | Steering assist load floor with A/C OFF in gear. |
| **Target Idle #8** | `0x053D8A` | **Power Steering + A/C OFF (High Elec)**| 797 RPM | 1000 RPM | Steering assist load floor with A/C OFF and electrical load. |
| **Target Idle #9** | `0x0532E0` | **Power Steering + A/C OFF (Neutral)** | 797 RPM | 1000 RPM | Steering assist load floor with A/C OFF in neutral. |
| **Target Idle #10**| `0x05403A` | **Fast Idle Warmup Floor (A/C ON)** | 852 RPM | 1000 RPM | Cold fast-idle floor with A/C active. |
| **Target Idle #11**| `0x05403E` | **Fast Idle Warmup Floor (A/C OFF)** | 852 RPM | 1000 RPM | Cold fast-idle floor with A/C OFF. |
| **Target Idle #12**| `0x0548DA` | **Catalyst Warmup Floor (A/C ON)** | 797 RPM | 1000 RPM | Post-start catalyst rapid heating mode floor (A/C ON). |
| **Target Idle #13**| `0x0548DC` | **Catalyst Warmup Floor (A/C OFF)** | 797 RPM | 1000 RPM | Post-start catalyst rapid heating mode floor (A/C OFF). |
| **Target Idle #14**| `0x054B28` | **Emergency / Low Battery Floor** | 852 RPM | 1000 RPM | Battery preservation floor when voltage drops. |

---

### 3.3 Tier 3: Throttle Dashpot & Spark Timing Loops

#### Throttle Follower / Dashpot Parameters (`0x07CB18`)
| Parameter | Address | Format | Stock Value | Function in Firmware |
| :--- | :---: | :---: | :---: | :--- |
| **Dashpot Catch Floor RPM** | `0x05495C` | `uint16` | 1500.0 RPM (raw 192) | Lower bound floor for throttle follower on tip-out. |
| **Dashpot Step Decrement** | `0x05495E` | `uint16` | 3 (23.4 RPM) | Decay rate per step subtracted from throttle target. |
| **Dashpot Decay Interval** | `0x054960` | `uint16` | 4 loops | Loop interval between step decrements. |
| **Dashpot Hold Delay #1** | `0x054962` | `uint16` | 40 loops (~1.0s) | Initial hold time before decay begins (low speed). |
| **Dashpot Hold Delay #2** | `0x054966` | `uint16` | 80 loops (~2.0s) | Initial hold time before decay begins (high speed). |

#### Rolling State Hysteresis (`0x01EA14` / `0x01EAA4`)
| Parameter | Address | Format | Value | Function in Firmware |
| :--- | :---: | :---: | :---: | :--- |
| **Rolling Speed High Threshold** | `0x0541C8` | `int16` | 16 (~4.0 km/h) | VSS threshold to enter rolling idle mode. |
| **Rolling Speed Low Threshold** | `0x0541CA` | `int16` | 11 (~2.75 km/h) | VSS hysteresis threshold to exit rolling idle mode. |
| **Rolling Stop Delay Timer** | `0x05428C` | `int16` | 200 loops (~2.0s) | Delay counter before rolling flag fully clears. |
| **Minimum ECT for Rolling Idle** | `0x053C82` | `uint16` | 30 (30°C) | Coolant temperature lockout for rolling mode. |

---

## 4. Root Cause Analysis: The Rolling Neutral Hang (A/C OFF)

Telemetry from [`scans/EvoScanDataLog_2026.09.30_17.28.53.csv`](file:///Users/steven/Library/CloudStorage/GoogleDrive-stevenjohnston.ca@gmail.com/My%20Drive/Evoman/scans/EvoScanDataLog_2026.09.30_17.28.53.csv) demonstrates why the car hangs at 1,250–1,450 RPM even with A/C confirmed OFF:

```text
Stationary Idle (Speed = 0):  1006 RPM | TPS: 13.64% | MAF: 1.47 g/s | Timing: 10.08° | MAP: 52.9 kPa
Rolling in Neutral (Speed > 4): 1292 RPM | TPS: 13.92% | MAF: 1.50 g/s | Timing: 14.25°-23° | MAP: 46.1 kPa
```

### Why the Engine Hangs
1. **Identical Airflow**: The throttle blade (`TPS = 13.7%–13.9%`) and airflow (`MAF = 1.47–1.50 g/s`) are virtually identical between stationary idle and rolling neutral.
2. **Lockout of Closed-Loop Idle Spark Retard**:
   - When stationary (`Speed = 0`), the closed-loop timing loop (`Idle Timing Compensation 1.2 / 2.2`) actively **chokes engine torque by retarding ignition timing to 6°–10°**. With only 8°–10° of timing, 1.48 g/s of airflow can only sustain 1,000 RPM.
   - When rolling (`Speed > 0`), routine `0x02125C` suppresses idle spark retard using speed lookup tables `0x60ECE` / `0x60EDE` vs axis `0x633DC`. The engine runs on the base `High Octane Timing Map` (`0x55957`), advancing timing to **18°–23°**.
   - With 18°–23° of advance, combustion efficiency is dramatically higher. That exact same 1.48 g/s airflow generates enough torque to spin the free-wheeling engine at **1,250 – 1,300 RPM**.
3. **Dashpot Catch Floor**: On rapid throttle lift from higher RPM, parameter `0x05495C` catches the engine at 1,500 RPM and decays very slowly over 4–6 seconds. If braking quickly, the car reaches a stop before the decay timer finishes, causing revs to hang at ~1,450 RPM until the instant `Speed` drops below 2.75 km/h.

---

## 5. Calibration Recommendations for GSC S2 Cams

1. **Do NOT zero out rolling idle completely**: GSC S2 camshafts (274° duration) produce low manifold vacuum and low idle torque reserve. Eliminating the rolling cushion will cause the engine to undershoot and stall on rapid clutch-in.
2. **Target Idle #2 (`0x053C84`)**: Lower from `1578 RPM` to **`1100 RPM`** (or `1150 RPM`). This removes the 1,578 RPM clamp when A/C or defroster is active while maintaining a 100 RPM buffer over base idle.
3. **High Octane Timing Map (`0x55957`)**: Smooth the decel cells at `1,000 – 1,500 RPM` and `10% – 20% Load` down to **`10° – 12°`**. This removes the excess ignition torque that sustains the 1,250–1,300 RPM rolling hang.
4. **Dashpot Catch Floor (`0x05495C`)**: Lower from `1500 RPM` to **`1200 RPM`** to prevent the initial high catch on clutch-in.
