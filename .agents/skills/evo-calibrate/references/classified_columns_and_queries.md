# Classified Datalog Columns (`*_classified.csv`), SQLite Schema & Query Recipes

Every EvoScan CSV processed by `tuning_tools/tools/datalog_classifier.py` (or `ingest_experience.py --auto-classify-logs` / `--rehydrate`) retains all original EvoScan channels and appends **46 `diag_*` columns**.

---

## 1. Complete `diag_*` Column Dictionary (`46` Columns)

### A. Precomputed ROM Table Lookups (`9` Columns — Evaluated at Exact Row Coordinates)
| Column | Units | Description |
| :--- | :--- | :--- |
| `diag_rom_maf_gs` | `g/s` | Interpolated `MAF Scaling Horizontal` (`0x5757A`) output at current `MAF` voltage (`0x61FD0`). |
| `diag_rom_map_ve_load` | `% Load` | Bilinearly interpolated `MAP based Load Calc #1` (`0x608AE`) table value at `(RPM, MAP kPa)`. |
| `diag_rom_mat_comp_mult` | `%` | Firmware-true `Fuel Compensation MAT vs MAP` (`0x60FCD`, `swapxy=true`) IPW multiplier `(raw + 384) / 512 * 100` at `(MAT °C, MAP)`. |
| `diag_rom_ect_comp_pct` | `%` | Bilinearly interpolated `ECT Fuel Compensation #1` (`0x5ADB9`, `9 ECT × 41 Load`, `Percent128`) at `(ECT °C, ChosenCalc)`. |
| `diag_rom_afrmap` | `AFR` | Reconstructed target AFR from `High Octane Fuel Map` (`0x55027`) at `(ChosenCalc, RPM)`. |
| `diag_rom_timing_high` | `° BTDC` | Bilinearly interpolated `High Octane Timing Map` (`0x55957`, column-major `23×22`) at `(LoadTiming, RPM)`. |
| `diag_rom_timing_low` | `° BTDC` | Bilinearly interpolated `Low Octane Timing Map` (`0x55B59`, column-major `23×22`) at `(LoadTiming, RPM)`. |
| `diag_rom_timing_retard_total` | `°` | `TimingAdv - diag_rom_timing_high` (net runtime knock/MAT/ECT/baro timing trim). |
| `diag_rom_latency_ms` | `ms` | Interpolated `Injector Battery Voltage Latency` (`0x556D0`) deadtime at current `Battery` voltage. |

### B. Thermal Decoupling, Wideband Validity & 1D Airflow Aliasing (`7` Columns)
| Column | Values / Units | Description |
| :--- | :--- | :--- |
| `diag_thermal_regime` | Enum | `ENGINE_OFF`, `POST_START_FLARE_DECAY` (`<90s` cold crank), `WARMUP_ECT_ACTIVE` (`>90s`, `ECT < 80°C`), `INTERCOOLER_BOOST_SPLIT` (`>=120 kPa`), `HEATSOAK_IDLE_SOAK`, `HEATSOAK_FLUSH_SPLIT` (`MAT - IAT >= 10°C`), `COLD_AMBIENT_STEADY` (`IAT <= 12°C`), `WARM_AMBIENT_STEADY`. |
| `diag_iat_mat_delta_c` | `°C` | `MAT - IAT` (isolates manifold heat-soak above ambient MAF intake temperature). |
| `diag_emp_map_density_mult` | Ratio | `MAPCalcs / diag_rom_map_ve_load` (empirical ECU air-density multiplier vs nominal `1.090`). |
| `diag_emp_maf_temp_mult` | Ratio | `MAFCalcs / (4964.28 * diag_rom_maf_gs / RPM)` (confirms temperature invariance of `MAFCalcs`). |
| `diag_wideband_state` | Enum | `ENGINE_OFF`, `SENSOR_WARMUP` (`<35s` post-crank heater warmup), `DFCO_AIR`, `RAIL_RICH_CLIP` (`<=10.08`), `RAIL_LEAN_CLIP` (`>=18.42`), `VALID`. |
| `diag_maf_zone` | Enum | `IDLE_LOW_FLOW` (`<1.65V`), `PURE_VACUUM_MAF` (`<=105 kPa & <=2.68V`), `MAF_MAP_ALIAS_CONFLICT` (`<=105 kPa & >=2.74V`), `SPOOL_CROSSOVER_MAF`, `BOOST_SD_HEADROOM_OK` (`MAP/MAF <= 0.86`), `BOOST_MAF_UNDERCUT_RISK` (`MAP/MAF > 0.86` in boost). |
| `diag_imap_window_pct` | `% Load` | `|IMAPCalcs - MAPCalcs|` (transient load clamp window width from `load_clamp_or_blend.c`). |

### C. Drivetrain, Decel Overrun & Virtual Dyno Physics (`12` Columns)
| Column | Values / Units | Description |
| :--- | :--- | :--- |
| `diag_gear` | `IDLE_STATIONARY`, `1`..`5`, `NEUTRAL` | Gear inferred from `RPM / smooth_speed_kmh` ratio for USDM Evo X 5MT (`4.687` FD). |
| `diag_shift_active` | `0` or `1` | `1` during clutch-in / gear transition (`NEUTRAL` rolling or rapid RPM drop under low TPS). |
| `diag_decel_fuel_status` | Enum | `CUT_ACTIVE` (`IPW <= 0.05ms` or closed-pedal `AFR >= 18.42` w/ `IPW <= 0.45ms`), `DFCO_ENTRY_DELAY` (`<=1.25s`), `DFCO_LOW_RPM_RESUME`, `UNEXPECTED_FUELING` (`>1.25s` leak), `COAST_NEUTRAL`, `DFCO_RECOVERY`, `NORMAL_DRIVING`. |
| `diag_smooth_speed_kmh` | `km/h` | 5-frame centered moving average of vehicle speed. |
| `diag_smooth_accel_g` | `G` | Centered `~0.4s` OLS longitudinal acceleration slope. |
| `diag_rpm_accel_rpms` | `RPM/s` | 15-frame (`~0.50s`) OLS rotational acceleration slope (suppresses RAX `7.8125 RPM` step noise). |
| `diag_map_variance` | `kPa²` | Rolling 9-frame manifold pressure variance. |
| `diag_load_variance` | `%²` | Rolling 9-frame `ChosenCalc` load variance. |
| `diag_pedal_accel_state` | Enum | `WOT_PULL`, `STEADY_ACCEL_LINEAR`, `STEADY_PEDAL_POWER_DROP` (debounced `>=5` frames + `accel_g` drop), `STEADY_CRUISE_FLAT`, `STEADY_PEDAL_DECEL`, `ACCEL_TRANSIENT`, `COAST_OR_DECEL`, `IDLE_OR_STATIONARY`, `SHIFT_OR_NEUTRAL`. |
| `diag_wheel_hp` | `WHP` | Road-load Virtual Dyno wheel horsepower (`m=1705kg`, `Cd=0.35`, `A=2.29m²`). |
| `diag_wheel_tq` | `lb-ft` | Virtual Dyno wheel torque (`WHP * 5252 / RPM`). |
| `diag_usable_for_dyno` | `0` or `1` | `1` when in 2nd/3rd/4th gear, `TPS >= 45%`, `MAP >= 120 kPa`, `0.05 <= accel_g <= 0.90`, `shift == 0`, `ECT >= 75°C`. |

### D. Actuator Health, Regimes, Knock & Pure Open-Loop Subsystem Usability (`18` Columns)
| Column | Values / Units | Description |
| :--- | :--- | :--- |
| `diag_in_vvt_error` | `°` | `InVVTactual - InVVTtarget` (intake MIVEC phaser tracking error). |
| `diag_ex_vvt_error` | `°` | `ExVVTactual - ExVVTtarget` (exhaust MIVEC phaser tracking error). |
| `diag_dbw_throttle_cut` | `%` | `APP - TPS` (DBW throttle closure / torque intervention check). |
| `diag_idc_pct` | `%` | True 4-stroke Injector Duty Cycle: `(RPM * IPW_ms) / 1200.0`. |
| `diag_steady_confidence` | `0.000`–`1.000` | Continuous stationarity confidence penalized by `|dTPS/dt|`, `|dMAP/dt|`, and `|dRPM/dt|`. |
| `diag_operating_regime` | Enum | `STEADY_IDLE`, `STEADY_CRUISE`, `TRANSIENT_CRUISE`, `SPOOL_RAMP`, `WOT_BOOST`, `TIP_IN`, `TIP_OUT`, `OVERRUN_DECEL`, `DFCO`, `DFCO_RECOVERY`. |
| `diag_knock_class` | Enum | `NONE`, `GENUINE_TIMING`, `BOV_FLUTTER`, `DRIVETRAIN_LASH`, `SHIFT_KNOCK` (strictly on $\Delta\text{KnockSum} > 0$). |
| `diag_knock_confidence` | `0.00`–`1.00` | Classifier confidence for knock root-cause attribution. |
| `diag_load_clamping_state` | Enum | `UNCLAMPED`, `VACUUM_CEILING_CLAMPED`, `CROSSOVER_TRANSITION`, `BOOST_SPEED_DENSITY`, `BOOST_FLOOR_CLAMPED`. |
| `diag_ratio_map_to_maf` | Ratio | `MAPCalcs / MAFCalcs` (target `~1.20` in vacuum, `~1.06` at `102.8 kPa`, `~0.80` in boost). |
| `diag_exhaust_lag_sec` | `s` | Dynamic exhaust transport lag $\tau = \text{clamp}(0.35 / \sqrt{\max(0.3, \text{RPM}\cdot\text{MAP}/10^5)}, 0.10, 0.45)$. |
| `diag_aligned_afr` | `AFR` | Forward-shifted wideband O2 reading matched to the cylinder combustion event. |
| `diag_aligned_afr_error` | Multiplier | `diag_aligned_afr / AFRMAP` (`< 1.0` = rich, `> 1.0` = lean, `1.0000` = on target). |
| `diag_total_fuel_trim` | `%` | Always `"0.00"` (platform runs 100% Open-Loop). |
| `diag_usable_for_maf` | `0` or `1` | `1` when warm (`>=80°C`), valid WB, unclamped, steady (`>=0.70`), `MAP <= 105 kPa`, `MAFV <= 2.74V`, non-DFCO, non-shift, non-flutter. |
| `diag_usable_for_ve` | `0` or `1` | `1` when warm (`>=80°C`), valid WB, non-DFCO, non-overrun-leak, non-shift, non-flutter, steady or clean WOT/cruise/idle. |
| `diag_usable_for_injector` | `0` or `1` | `1` when warm (`>=80°C`), valid WB, `MAP <= 105 kPa`, non-heatsoak, stationary (`>=0.75`), `|dTPS/dt| <= 1.5%/s`. |
| `diag_rejection_reason` | `;`-list | Explicit reason(s) a row was excluded (`NONE`, `COLD_WARMUP`, `WIDEBAND_WARMUP`, `WIDEBAND_CLIPPED`, `DFCO`, `OVERRUN_FUEL_LEAK`, `SHIFT_ACTIVE`, `MAF_MAP_ALIAS_ZONE`, `VACUUM_CEILING_CLAMPED`, `UNSTEADY_THROTTLE`, `BOOST_REGIME`, `BOV_FLUTTER`). |

---

## 2. SQLite Experience Database Tables (`tuning_tools/db/calibration_experience.db`)

- `roms` & `rom_tables`: Indexes `maf_scaling`, `map_load_calc_1`, `map_load_calc_2`, `high_octane_timing` (`0x55957`), `low_octane_timing` (`0x55B59`), `fuel_injector_scaling`, `injector_latency`, `fuel_comp_mat_vs_map` (firmware gain), `fuel_comp_mat_vs_map_gui` (`Percent128`), `ect_fuel_comp_1` (`0x5ADB9`), and `ect_fuel_comp_2` (`0x5AF31`).
- `datalogs`: Drive-level weather/thermal envelope (`min_ect_c`, `max_ect_c`, `mean_iat_c`, `mean_mat_c`), `wideband_clipped_frames`, `alias_zone_frames`, `episode_count`, DFCO cut/leak frames, and peak Virtual Dyno WHP/WTQ.
- `regime_summaries`: Valid-wideband-gated open-loop summaries across `(regime, rpm_bucket, map_bucket, mafv_bucket, mat_bucket, vbatt_bucket)`.
- `maf_bin_experience`: Per-drive, per-bin (`0..129`) ledger tracking `unclamped_vac_samples`, `alias_vac_samples`, `boost_sd_samples`, `avg_boost_map_to_maf`, and `avg_boost_true_gs`.
- `thermal_summaries`: Decoupled `(thermal_regime, ect_bucket, iat_bucket, mat_bucket, map_bucket)` table enabling within-drive `ECT` isolation and manifold `MAT - IAT` heat-soak queries.
- `anomaly_episodes` & `operational_events`: Contiguous debounced anomaly episodes (`start_row..end_row`, `start_sec..end_sec`, `root_cause`, `peak_severity`) + frame-level event records.

---

## 3. Practical Open-Loop Query Recipes

### Example A: Trace Any Anomaly Episode Frame-by-Frame
```bash
python3 tuning_tools/tools/experience_query.py investigate --type COLD_ECT_MISFUEL --limit 10
python3 tuning_tools/tools/experience_query.py investigate --episode-id 1 --window-sec 2.5
```

### Example B: SQLite Query for MAF Bin Unclamped vs Boost Headroom Coverage
```bash
sqlite3 -header -column tuning_tools/db/calibration_experience.db "
SELECT bin_idx, volts, ROUND(AVG(rom_maf_gs), 2) AS avg_rom_gs,
       SUM(unclamped_vac_samples) AS unc_n,
       ROUND((SUM(unclamped_vac_samples * avg_unclamped_afr_err) / NULLIF(SUM(unclamped_vac_samples), 0) - 1.0) * 100.0, 2) AS unc_err_pct,
       SUM(alias_vac_samples) AS alias_n,
       SUM(boost_sd_samples) AS boost_n,
       ROUND(SUM(boost_sd_samples * avg_boost_true_gs) / NULLIF(SUM(boost_sd_samples), 0) * 1.25, 2) AS tgt_125_gs
FROM maf_bin_experience
WHERE bin_idx BETWEEN 60 AND 84
GROUP BY bin_idx
ORDER BY bin_idx ASC;
"
```
