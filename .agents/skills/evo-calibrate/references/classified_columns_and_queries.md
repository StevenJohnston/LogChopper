# Classified Datalog Columns (`*_classified.csv`) & Query Recipes

Every EvoScan CSV processed by `tuning_tools/tools/datalog_classifier.py` (or `ingest_experience.py --auto-classify-logs` / `--rehydrate`) retains all original EvoScan channels and appends **34 `diag_*` columns**.

---

## 1. Complete `diag_*` Column Dictionary

### A. Precomputed ROM Table Lookups (Evaluated at Exact Row Coordinates)
| Column | Units | Description |
| :--- | :--- | :--- |
| `diag_rom_maf_gs` | `g/s` | Interpolated `MAF Scaling Horizontal` (`0x5757A`) output at current `MAF` voltage (`0x61FD0`). |
| `diag_rom_map_ve_load` | `% Load` | Bilinearly interpolated `MAP based Load Calc #1` (`0x608AE`) table value at `(RPM, MAP kPa)`. |
| `diag_rom_mat_comp_mult` | `%` | Bilinearly interpolated `Fuel Compensation MAT vs MAP` (`0x60FCD`, `swapxy=true`) multiplier at `(MAT °C, MAP)`. |
| `diag_rom_afrmap` | `AFR` | Reconstructed target AFR from `High Octane Fuel Map` (`0x55027`) at `(Load, RPM)`. |
| `diag_rom_timing_high` | `° BTDC` | Bilinearly interpolated `High Octane Timing Map` (`0x55957`) at `(Load, RPM)`. |
| `diag_rom_timing_low` | `° BTDC` | Bilinearly interpolated `Low Octane Timing Map` (`0x55757`) at `(Load, RPM)`. |
| `diag_rom_timing_retard_total` | `°` | `TimingAdv - diag_rom_timing_high` (net runtime knock/MAT/ECT/baro timing trim). |
| `diag_rom_latency_ms` | `ms` | Interpolated `Injector Battery Voltage Latency` (`0x556D0`) deadtime at current `Battery` voltage. |

### B. Drivetrain, Decel Overrun & Virtual Dyno Physics
| Column | Values / Units | Description |
| :--- | :--- | :--- |
| `diag_gear` | `IDLE_STATIONARY`, `1`..`5`, `NEUTRAL` | Gear inferred from `RPM / smooth_speed_kmh` ratio for USDM Evo X 5MT (`4.687` FD). |
| `diag_shift_active` | `0` or `1` | `1` during clutch-in / gear transition (`NEUTRAL` rolling or rapid RPM drop under low TPS). |
| `diag_decel_fuel_status` | Enum | Overrun DFCO state machine:<br>- `CUT_ACTIVE`: Injectors cut (`IPW <= 0.05ms` or closed-pedal `AFR >= 19.0`)<br>- `DFCO_ENTRY_DELAY`: Closed pedal in gear `<= 1.25s` (OEM DBW torque dashpot / DFCO timer window)<br>- `DFCO_LOW_RPM_RESUME`: Closed pedal in gear below `1,900 RPM` or `ECT < 68°C`<br>- `UNEXPECTED_FUELING`: Closed pedal in gear continuously `> 1.25s` (`ECT >= 68°C`, `RPM >= 1900`) yet `IPW > 0.05ms` (true overrun fuel leak)<br>- `COAST_NEUTRAL`: Closed pedal while out of gear / shifting<br>- `DFCO_RECOVERY`: First `0.50s` re-wetting transient after exiting `CUT_ACTIVE`<br>- `NORMAL_DRIVING`: Active pedal/idle operation |
| `diag_smooth_speed_kmh` | `km/h` | 5-frame centered moving average of vehicle speed. |
| `diag_smooth_accel_g` | `G` | Centered `~0.4s` longitudinal acceleration slope (suppresses `1 km/h` VSS stair-stepping). |
| `diag_wheel_hp` | `WHP` | Road-load Virtual Dyno wheel horsepower (inertial + aero drag `Cd=0.35, A=2.29m²` + rolling resistance, `m=1705kg`). |
| `diag_wheel_tq` | `lb-ft` | Virtual Dyno wheel torque (`WHP * 5252 / RPM`). |
| `diag_usable_for_dyno` | `0` or `1` | `1` when in 2nd/3rd/4th gear, `TPS >= 45%`, `MAP >= 120 kPa`, `0.05 <= accel_g <= 0.90`, `shift == 0`, `ECT >= 75°C`. |

### C. Actuator Health, Regimes, Knock & Subsystem Usability
| Column | Values / Units | Description |
| :--- | :--- | :--- |
| `diag_in_vvt_error` | `°` | `InVVTactual - InVVTtarget` (intake MIVEC phaser tracking error). |
| `diag_ex_vvt_error` | `°` | `ExVVTactual - ExVVTtarget` (exhaust MIVEC phaser tracking error). |
| `diag_dbw_throttle_cut` | `%` | `APP - TPS` (DBW throttle closure / torque intervention check). |
| `diag_idc_pct` | `%` | True 4-stroke Injector Duty Cycle: `(RPM * IPW_ms) / 1200.0`. |
| `diag_steady_confidence` | `0.000`–`1.000` | Continuous stationarity confidence penalized by `|dTPS/dt|`, `|dMAP/dt|`, and `|dRPM/dt|`. |
| `diag_operating_regime` | Enum | `STEADY_IDLE`, `STEADY_CRUISE`, `TRANSIENT_CRUISE`, `SPOOL_RAMP`, `WOT_BOOST`, `TIP_IN`, `TIP_OUT`, `OVERRUN_DECEL`, `DFCO`, `DFCO_RECOVERY`. |
| `diag_knock_class` | Enum | `NONE` (no inception), `GENUINE_TIMING`, `BOV_FLUTTER`, `DRIVETRAIN_LASH`, `SHIFT_KNOCK` (evaluated strictly on $\Delta\text{KnockSum} > 0$). |
| `diag_knock_confidence` | `0.00`–`1.00` | Classifier confidence for knock root-cause attribution. |
| `diag_load_clamping_state` | Enum | `UNCLAMPED`, `VACUUM_CEILING_CLAMPED`, `CROSSOVER_TRANSITION`, `BOOST_SPEED_DENSITY`, `BOOST_FLOOR_CLAMPED`. |
| `diag_ratio_map_to_maf` | Ratio | `MAPCalcs / MAFCalcs` (target `~1.20` in vacuum, `~1.06` at `102.8 kPa`, `~0.80` in boost). |
| `diag_exhaust_lag_sec` | `s` | Dynamic exhaust transport lag $\tau = \text{clamp}(0.35 / \sqrt{\max(0.3, \text{RPM}\cdot\text{MAP}/10^5)}, 0.10, 0.45)$. |
| `diag_aligned_afr` | `AFR` | Forward-shifted wideband O2 reading matched to the cylinder combustion event. |
| `diag_aligned_afr_error` | Multiplier | `diag_aligned_afr / AFRMAP` (`< 1.0` = rich, `> 1.0` = lean, `1.0000` = on target). |
| `diag_total_fuel_trim` | `%` | `STFT + LTFT` combined closed-loop trim. |
| `diag_usable_for_maf` | `0` or `1` | `1` only when warm, unclamped, steady (`>= 0.70`), `MAP <= 105 kPa`, non-DFCO, non-shift, non-flutter. |
| `diag_usable_for_ve` | `0` or `1` | `1` when warm, non-DFCO, non-overrun-leak, non-shift, non-flutter, steady or clean WOT/cruise/idle. |
| `diag_usable_for_injector` | `0` or `1` | `1` when warm, closed-loop, highly stationary (`>= 0.75`), `|dTPS/dt| <= 1.5%/s`. |
| `diag_rejection_reason` | `;`-list | Explicit reason(s) a row was excluded (`NONE`, `COLD_WARMUP`, `DFCO`, `DFCO_ENTRY_DELAY`, `OVERRUN_FUEL_LEAK`, `SHIFT_ACTIVE`, `VACUUM_CEILING_CLAMPED`, `UNSTEADY_THROTTLE`, `BOOST_REGIME`, `BOV_FLUTTER`). |

---

## 2. Practical Script & Query Examples

### Example A: Inspect Clean Unclamped MAF Error by Voltage Bin in Latest Drive
```bash
python3 -c '
import csv, collections
with open("scans/EvoScanDataLog_2026.10.28_18.00.12_classified.csv", encoding="latin1") as f:
    rows = [r for r in csv.DictReader(f) if r["diag_usable_for_maf"] == "1"]
bins = collections.defaultdict(list)
for r in rows:
    v_bin = round(float(r["MAF"]) * 20) / 20.0
    err = float(r["diag_aligned_afr_error"]) + float(r["diag_total_fuel_trim"]) / 100.0
    bins[v_bin].append((err, float(r["diag_rom_maf_gs"])))
for v in sorted(bins):
    if len(bins[v]) >= 5:
        avg_e = sum(x[0] for x in bins[v]) / len(bins[v])
        avg_gs = sum(x[1] for x in bins[v]) / len(bins[v])
        print(f"MAFV ~{v:4.2f}V ({avg_gs:5.1f} g/s) | N={len(bins[v]):4d} | Combined Fuel Err={(avg_e-1)*100:+5.2f}%")
'
```

### Example B: Check Where Injectors Stayed On During Decel (`UNEXPECTED_FUELING`)
```bash
python3 -c '
import csv
with open("scans/EvoScanDataLog_2026.10.27_13.15.46_classified.csv", encoding="latin1") as f:
    leaks = [r for r in csv.DictReader(f) if r["diag_decel_fuel_status"] == "UNEXPECTED_FUELING"]
print(f"Sustained overrun fueling frames: {len(leaks)}")
for r in leaks[:10]:
    print(f"t={float(r[\"LogEntrySeconds\"]):6.1f}s | Gear {r[\"diag_gear\"]} | {float(r[\"RPM\"]):5.0f} RPM | "
          f"MAP={float(r[\"MAP\"]):4.1f} kPa | TPS={float(r[\"TPS\"]):4.1f}% | IPW={r[\"IPW\"]}ms | AFR={r[\"AFR\"]}")
'
```

### Example C: SQLite Query Comparing Precomputed MAT Multiplier vs AFR Across ROMs
```bash
sqlite3 -header -column tuning_tools/db/calibration_experience.db "
SELECT r.rom_id, substr(r.rom_name, -18) AS rom, s.mat_bucket AS mat_c,
       SUM(s.sample_count) AS n,
       ROUND(AVG(s.avg_rom_mat_comp_mult), 2) AS mat_mult_pct,
       ROUND(AVG(s.avg_afr), 2) AS afr,
       ROUND((AVG(s.avg_afr_error) - 1.0) * 100.0, 2) AS err_pct
FROM regime_summaries s
JOIN roms r ON s.rom_id = r.rom_id
WHERE s.regime = 'STEADY_CRUISE'
GROUP BY r.rom_id, s.mat_bucket
HAVING n >= 25
ORDER BY r.rom_id DESC, s.mat_bucket ASC;
"
```

### Example D: Extract Virtual Dyno Pull Curve from a Classified Log
```bash
python3 -c '
import csv
with open("scans/EvoScanDataLog_2026.10.27_13.15.46_classified.csv", encoding="latin1") as f:
    dyno = [r for r in csv.DictReader(f) if r["diag_usable_for_dyno"] == "1"]
for r in dyno:
    print(f"t={float(r[\"LogEntrySeconds\"]):6.2f}s | G{r[\"diag_gear\"]} | {float(r[\"RPM\"]):5.0f} RPM | "
          f"{float(r[\"MAP\"]):5.1f} kPa | AFR={r[\"diag_aligned_afr\"]} (Tgt {r[\"AFRMAP\"]}) | "
          f"{r[\"diag_wheel_hp\"]} WHP / {r[\"diag_wheel_tq\"]} WTQ | IDC={r[\"diag_idc_pct\"]}%")
'
```
