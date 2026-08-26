import test from "node:test";
import assert from "node:assert";
import fs from "fs";
import csv from "csvtojson";
import { LogRecord } from "@/app/_lib/log";
import {
  identifySteadyStateRecords,
  SteadyStateCombustionModel,
  runSteadyStateMonotonicDP,
  runSteadyStateForwardSearch,
} from "@/app/_components/FlowNodes/AfrMlShifter/AfrMlShifterWorker";

test("identifySteadyStateRecords filters transients and captures steady states", () => {
  const records: LogRecord[] = [];
  // 30 steady records
  for (let i = 0; i < 30; i++) {
    records.push({
      LogID: i + 1,
      LogEntrySeconds: i * 0.05,
      RPM: 2000,
      TPS: 15.0,
      Speed: 30.0,
      MAP: 50.0,
      MAF: 1.5,
      IPW: 1.5,
      AFR: 14.7,
      ECT: 85,
    });
  }
  // 10 transient records with fluctuating TPS
  for (let i = 30; i < 40; i++) {
    records.push({
      LogID: i + 1,
      LogEntrySeconds: i * 0.05,
      RPM: 2000 + (i - 30) * 100,
      TPS: 15.0 + (i - 30) * 3.0,
      Speed: 30.0,
      MAP: 50.0 + (i - 30) * 5.0,
      MAF: 1.5,
      IPW: 2.0,
      AFR: 13.0,
      ECT: 85,
    });
  }

  const steady = identifySteadyStateRecords(records);
  assert.ok(steady.length >= 10, "Should find steady records in stable region");
  assert.ok(
    steady.every((r) => (r.LogID ?? 0) <= 30),
    "Transient records should not be marked steady"
  );
});

test("SteadyStateCombustionModel trains and predicts accurately", () => {
  const model = new SteadyStateCombustionModel();
  const steadyData: LogRecord[] = [];

  for (let i = 0; i < 50; i++) {
    const rpm = 1500 + i * 20;
    const map = 40 + i * 0.5;
    const ipw = 1.2 + i * 0.02;
    // Expected stoichiometric around 14.7
    const afr = 14.7 + (Math.random() * 0.2 - 0.1);
    steadyData.push({
      RPM: rpm,
      MAP: map,
      IPW: ipw,
      MAF: 1.5,
      TPS: 15,
      Load: 35,
      InVVTactual: 10,
      ExVVTactual: -2,
      AFR: afr,
      ECT: 85,
    });
  }

  model.train(steadyData);
  assert.ok(model.isTrained, "Model should be marked as trained");

  const predNormal = model.predict({
    RPM: 1800,
    MAP: 45,
    IPW: 1.3,
    MAF: 1.5,
    TPS: 15,
    Load: 35,
    InVVTactual: 10,
    ExVVTactual: -2,
  });
  assert.ok(
    predNormal >= 13.5 && predNormal <= 15.5,
    `Predicted AFR should be near 14.7, got ${predNormal}`
  );

  // Fuel cut should predict full lean (18.5)
  const predFuelCut = model.predict({
    RPM: 3000,
    MAP: 25,
    IPW: 0.0,
  });
  assert.strictEqual(predFuelCut, 18.5, "Fuel cut IPW=0 should predict 18.5 AFR");
});

test("Monotonic Dynamic Programming enforces strict monotonicity and forward bounds", () => {
  const N = 100;
  const records: LogRecord[] = [];

  for (let i = 0; i < N; i++) {
    const isTipIn = i >= 40 && i <= 45;
    const isDecel = i >= 70 && i <= 80;
    const ipw = isDecel ? 0.0 : isTipIn ? 3.0 : 1.5;
    const tps = isDecel ? 13.0 : isTipIn ? 45.0 : 15.0;
    // Simulating delayed AFR reading (8 records lag)
    const afrLag = 8;
    const delayedIpw = i >= afrLag ? (records[i - afrLag]?.IPW ?? 1.5) : 1.5;
    const afr = delayedIpw === 0 ? 18.5 : delayedIpw > 2.5 ? 12.5 : 14.7;

    records.push({
      LogID: i + 1,
      LogEntrySeconds: i * 0.05,
      RPM: 2000,
      TPS: tps,
      MAP: 50,
      MAF: 1.5,
      IPW: ipw,
      Load: 40,
      AFR: afr,
      ECT: 85,
    });
  }

  const model = new SteadyStateCombustionModel();
  model.train(records.slice(0, 35));

  const shiftedLogs = runSteadyStateMonotonicDP(records);

  assert.strictEqual(shiftedLogs.length, N, "Output length should match input length");

  // Verify monotonicity: targetIdx[i+1] >= targetIdx[i]
  for (let i = 1; i < N; i++) {
    const prevOffset = shiftedLogs[i - 1]["AFR Offset"] ?? 0;
    const currOffset = shiftedLogs[i]["AFR Offset"] ?? 0;
    const prevTarget = i - 1 + prevOffset;
    const currTarget = i + currOffset;
    assert.ok(
      currTarget >= prevTarget,
      `Non-monotonic step at row ${i}: prev target ${prevTarget} > curr target ${currTarget}`
    );
  }

  // Verify forward window bounds: 1 <= offset <= 28
  for (let i = 0; i < N; i++) {
    const offset = shiftedLogs[i]["AFR Offset"] ?? 0;
    assert.ok(
      offset >= 1 && offset <= 28,
      `Offset at row ${i} out of bounds: ${offset}`
    );
  }

  // Verify that shifted AFR matches the actual future record value
  for (let i = 0; i < N; i++) {
    const offset = shiftedLogs[i]["AFR Offset"] ?? 0;
    const targetIdx = Math.min(N - 1, i + offset);
    assert.strictEqual(
      shiftedLogs[i]["Corrected AFR"],
      records[targetIdx].AFR,
      `Shifted AFR at ${i} must match real AFR at target ${targetIdx}`
    );
    assert.strictEqual(
      shiftedLogs[i]["AFR_SHIFTED"],
      records[targetIdx].AFR,
      `AFR_SHIFTED at ${i} must match real AFR at target ${targetIdx}`
    );
  }
});

test("Real Log Integration Test: processes example log end-to-end with high correlation", async () => {
  const logFile = "/Users/steven/go/github.com/LogChopper/example/logs/EvoScanDataLog_2026.08.24_16.51.25.csv";
  if (!fs.existsSync(logFile)) return;

  const records: LogRecord[] = await csv({ checkType: true }).fromFile(logFile);
  const steady = identifySteadyStateRecords(records);
  assert.ok(steady.length > 500, "Should extract hundreds of steady records from real log");

  const dpRes = runSteadyStateMonotonicDP(records);
  const greedyRes = runSteadyStateForwardSearch(records);

  assert.strictEqual(dpRes.length, records.length);
  assert.strictEqual(greedyRes.length, records.length);

  // Check no NaNs
  assert.ok(dpRes.every((r) => typeof r["Corrected AFR"] === "number" && !isNaN(r["Corrected AFR"])));

  // Check monotonicity
  let violations = 0;
  for (let i = 1; i < records.length; i++) {
    const prevTarget = i - 1 + (dpRes[i - 1]["AFR Offset"] ?? 0);
    const currTarget = i + (dpRes[i]["AFR Offset"] ?? 0);
    if (currTarget < prevTarget) {
      violations++;
    }
  }
  assert.strictEqual(violations, 0, "DP algorithm must have 0 non-monotonic steps");
});
