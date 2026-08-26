import fs from "fs";
import path from "path";
import csv from "csvtojson";
import {
  LogRecord,
  identifySteadyState,
  SteadyStateCombustionModel,
  algo1_ExistingFlowDelay,
  algo2_PhysicalExhaustVolumeIntegrator,
  algo3_SteadyModelForwardSearch,
  algo4_HybridCalibratedPhysicalWarping,
} from "./afr_algorithms";

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX) * Math.sqrt(denY);
  return den === 0 ? 0 : num / den;
}

const logsDir = "/Users/steven/go/github.com/LogChopper/example/logs";
const files = fs.readdirSync(logsDir).filter((f) => f.endsWith(".csv"));

async function runBenchmark() {
  console.log("================================================================================");
  console.log("               AFR LAG COMPENSATION & ML SHIFT BENCHMARK                        ");
  console.log("================================================================================\n");

  for (const file of files) {
    const filePath = path.join(logsDir, file);
    const records: LogRecord[] = await csv({ checkType: true }).fromFile(filePath);
    console.log(`\n================================================================================`);
    console.log(`FILE: ${file} (${records.length} records)`);
    console.log(`================================================================================`);

    // 1. Identify Steady-State Records
    const { steadyRecords } = identifySteadyState(records);
    const steadyPct = ((steadyRecords.length / records.length) * 100).toFixed(1);
    console.log(`Steady-state records found: ${steadyRecords.length} / ${records.length} (${steadyPct}%)`);

    // 2. Train Steady-State Model
    const combustionModel = new SteadyStateCombustionModel();
    combustionModel.train(steadyRecords);

    // Evaluate model on steady state records
    if (steadyRecords.length > 0) {
      const steadyErrors = steadyRecords.map(r => Math.abs((r.AFR ?? 14.7) - combustionModel.predict(r)));
      const steadyMAE = steadyErrors.reduce((a, b) => a + b, 0) / steadyErrors.length;
      console.log(`Combustion Model Steady-State MAE: ${steadyMAE.toFixed(3)} AFR`);
    }

    // 3. Run Algorithms
    console.log("\nRunning Algorithms...");
    const unshiftedAfr = records.map(r => r.AFR ?? 14.7);
    const res1 = algo1_ExistingFlowDelay(records);
    const res2 = algo2_PhysicalExhaustVolumeIntegrator(records);
    const res3 = algo3_SteadyModelForwardSearch(records, combustionModel);
    const res4 = algo4_HybridCalibratedPhysicalWarping(records, combustionModel);

    const algos = [
      { name: "0. Unshifted (Original)", afr: unshiftedAfr, offsets: new Array(records.length).fill(0) },
      { name: "1. Baseline Flow-Based Delay", afr: res1.shiftedAfr, offsets: res1.offsets },
      { name: "2. Physical Volume Integrator", afr: res2.shiftedAfr, offsets: res2.offsets },
      { name: "3. Steady Model + Forward Search (User Idea)", afr: res3.shiftedAfr, offsets: res3.offsets },
      { name: "4. Hybrid Calibrated Physics + Local Search", afr: res4.shiftedAfr, offsets: res4.offsets },
    ];

    // 4. Metrics Comparison
    console.log("\n--- Quantitative Metrics Summary ---");
    console.log(
      "Algorithm".padEnd(45) +
      "IPW Corr".padEnd(12) +
      "Model Corr".padEnd(12) +
      "Avg Offset".padEnd(12) +
      "Jitter (dOffset)".padEnd(18)
    );
    console.log("-".repeat(95));

    const ipwSignal = records.map(r => r.IPW ?? 0);
    const expectedSignal = records.map(r => combustionModel.predict(r));

    for (const algo of algos) {
      // Inverted AFR correlates with IPW (more fuel = lower AFR)
      const invAfr = algo.afr.map(v => 20 - v);
      const ipwCorr = calculateCorrelation(ipwSignal, invAfr);
      const modelCorr = calculateCorrelation(expectedSignal, algo.afr);
      const avgOffset = algo.offsets.reduce((a, b) => a + b, 0) / algo.offsets.length;

      // Calculate offset jitter (smoothness)
      let dOffsetSum = 0;
      for (let i = 1; i < algo.offsets.length; i++) {
        dOffsetSum += Math.abs(algo.offsets[i] - algo.offsets[i - 1]);
      }
      const avgDOffset = dOffsetSum / (algo.offsets.length - 1);

      console.log(
        algo.name.padEnd(45) +
        ipwCorr.toFixed(3).padEnd(12) +
        modelCorr.toFixed(3).padEnd(12) +
        avgOffset.toFixed(1).padEnd(12) +
        avgDOffset.toFixed(3).padEnd(18)
      );
    }

    // 5. Inspect a Transient Tip-In Event
    console.log("\n--- Sample Transient Tip-In Event (Comparing Shifted AFR Responses) ---");
    // Find a clear tip-in
    let sampleIdx = -1;
    for (let i = 20; i < records.length - 40; i++) {
      const dtps = (records[i].TPS ?? 0) - (records[i - 1].TPS ?? 0);
      const dipw = (records[i].IPW ?? 0) - (records[i - 1].IPW ?? 0);
      if (dtps > 5 && dipw > 0.5 && (records[i].RPM ?? 0) > 1500) {
        sampleIdx = i;
        break;
      }
    }

    if (sampleIdx > 0) {
      console.log(`Tip-In detected at index ${sampleIdx} (t=${records[sampleIdx].LogEntrySeconds}s, RPM=${records[sampleIdx].RPM?.toFixed(0)}, TPS=${records[sampleIdx].TPS?.toFixed(1)}%)`);
      console.log(
        "Idx".padEnd(6) +
        "dt(s)".padEnd(8) +
        "TPS".padEnd(8) +
        "IPW".padEnd(8) +
        "Unshifted".padEnd(12) +
        "Algo 1 (Flow)".padEnd(15) +
        "Algo 2 (Vol)".padEnd(15) +
        "Algo 3 (User)".padEnd(15) +
        "Algo 4 (Hybrid)".padEnd(15) +
        "Expected".padEnd(10)
      );
      console.log("-".repeat(112));

      for (let k = -2; k <= 12; k++) {
        const idx = sampleIdx + k;
        const r = records[idx];
        const dt = ((r.LogEntrySeconds ?? 0) - (records[sampleIdx].LogEntrySeconds ?? 0)).toFixed(3);
        console.log(
          String(k).padStart(3).padEnd(6) +
          dt.padStart(6).padEnd(8) +
          (r.TPS?.toFixed(1) ?? "").padStart(5).padEnd(8) +
          (r.IPW?.toFixed(2) ?? "").padStart(5).padEnd(8) +
          (unshiftedAfr[idx]?.toFixed(2) ?? "").padStart(8).padEnd(12) +
          (res1.shiftedAfr[idx]?.toFixed(2) ?? "").padStart(8).padEnd(15) +
          (res2.shiftedAfr[idx]?.toFixed(2) ?? "").padStart(8).padEnd(15) +
          (res3.shiftedAfr[idx]?.toFixed(2) ?? "").padStart(8).padEnd(15) +
          (res4.shiftedAfr[idx]?.toFixed(2) ?? "").padStart(8).padEnd(15) +
          (expectedSignal[idx]?.toFixed(2) ?? "").padStart(8).padEnd(10)
        );
      }
    }

    // 6. Inspect a Decel / Fuel Cut Event
    console.log("\n--- Sample Decel / Fuel Cut Event (Comparing Shifted AFR Responses) ---");
    let decelIdx = -1;
    for (let i = 20; i < records.length - 40; i++) {
      if ((records[i - 1].IPW ?? 0) > 1.0 && (records[i].IPW ?? 0) === 0 && (records[i].RPM ?? 0) > 2000) {
        decelIdx = i;
        break;
      }
    }

    if (decelIdx > 0) {
      console.log(`Fuel Cut detected at index ${decelIdx} (t=${records[decelIdx].LogEntrySeconds}s, RPM=${records[decelIdx].RPM?.toFixed(0)})`);
      console.log(
        "Idx".padEnd(6) +
        "dt(s)".padEnd(8) +
        "TPS".padEnd(8) +
        "IPW".padEnd(8) +
        "Unshifted".padEnd(12) +
        "Algo 1 (Flow)".padEnd(15) +
        "Algo 2 (Vol)".padEnd(15) +
        "Algo 3 (User)".padEnd(15) +
        "Algo 4 (Hybrid)".padEnd(15) +
        "Expected".padEnd(10)
      );
      console.log("-".repeat(112));

      for (let k = -2; k <= 12; k++) {
        const idx = decelIdx + k;
        const r = records[idx];
        const dt = ((r.LogEntrySeconds ?? 0) - (records[decelIdx].LogEntrySeconds ?? 0)).toFixed(3);
        console.log(
          String(k).padStart(3).padEnd(6) +
          dt.padStart(6).padEnd(8) +
          (r.TPS?.toFixed(1) ?? "").padStart(5).padEnd(8) +
          (r.IPW?.toFixed(2) ?? "").padStart(5).padEnd(8) +
          (unshiftedAfr[idx]?.toFixed(2) ?? "").padStart(8).padEnd(12) +
          (res1.shiftedAfr[idx]?.toFixed(2) ?? "").padStart(8).padEnd(15) +
          (res2.shiftedAfr[idx]?.toFixed(2) ?? "").padStart(8).padEnd(15) +
          (res3.shiftedAfr[idx]?.toFixed(2) ?? "").padStart(8).padEnd(15) +
          (res4.shiftedAfr[idx]?.toFixed(2) ?? "").padStart(8).padEnd(15) +
          (expectedSignal[idx]?.toFixed(2) ?? "").padStart(8).padEnd(10)
        );
      }
    }
  }
}

runBenchmark().catch(console.error);
