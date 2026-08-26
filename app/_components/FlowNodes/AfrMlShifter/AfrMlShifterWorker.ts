import { InternalWorker } from "@/app/_lib/worker-utilts";
import {
  AfrMlShifterWorkerMessage,
  AfrMlShifterWorkerResult,
} from "./AfrMlShifterWorkerTypes";
import { LogRecord } from "@/app/_lib/log";
import { AfrShiftMethod } from "./AfrMlShifterTypes";
import * as tf from "@tensorflow/tfjs";

const ctx: SelfWorker =
  typeof self !== "undefined"
    ? (self as SelfWorker)
    : ({
        postMessage: () => {},
        close: () => {},
        onmessage: null,
      } as unknown as SelfWorker);

interface SelfWorker
  extends InternalWorker<AfrMlShifterWorkerMessage, AfrMlShifterWorkerResult> {}

// --- Shared Utility Functions ---

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  let num = 0,
    denX = 0,
    denY = 0;
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

function calculateBaselineOffsets(
  logs: LogRecord[],
  MIN_DELAY: number,
  MAX_DELAY: number,
  SMOOTHING_WINDOW: number
): number[] {
  const RPM_KEY = "RPM";
  const MAP_KEY = "MAP";

  const inverseFlow = logs.map(
    (row) => 1 / ((row[RPM_KEY] || 1) * (row[MAP_KEY] || 1))
  );
  const minInverseFlow = Math.min(...inverseFlow);
  const maxInverseFlow = Math.max(...inverseFlow);
  const range = maxInverseFlow - minInverseFlow;
  const rawDelays =
    range > 0
      ? inverseFlow.map(
          (val) =>
            MIN_DELAY +
            ((val - minInverseFlow) / range) * (MAX_DELAY - MIN_DELAY)
        )
      : new Array(logs.length).fill((MIN_DELAY + MAX_DELAY) / 2);

  const smoothed = new Array(logs.length).fill(0);
  const halfWindow = Math.floor(SMOOTHING_WINDOW / 2);
  for (let i = 0; i < logs.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(logs.length - 1, i + halfWindow);
    let sum = 0;
    for (let j = start; j <= end; j++) {
      sum += rawDelays[j];
    }
    smoothed[i] = Math.round(sum / (end - start + 1));
  }
  return smoothed;
}

function applyAfrShift(
  logs: LogRecord[],
  offsets: number[],
  direction: "forward" | "backward"
): LogRecord[] {
  const AFR_KEY = "AFR";
  return logs.map((row, i) => {
    const newRow: LogRecord = { ...row };
    const offset = offsets[i];
    const sourceIndex = direction === "forward" ? i + offset : i - offset;
    const effectiveIndex = Math.max(0, Math.min(sourceIndex, logs.length - 1));

    const shiftedAfr = logs[effectiveIndex][AFR_KEY];
    newRow["Corrected AFR"] = shiftedAfr;
    newRow["AFR_SHIFTED"] = shiftedAfr;
    newRow["AFR Offset"] = offset;
    return newRow;
  });
}

// --- Steady-State Detection & Combustion Model ---

export function identifySteadyStateRecords(logs: LogRecord[]): LogRecord[] {
  const steadyRecords: LogRecord[] = [];
  const WINDOW_TIME_SEC = 1.0;
  const MAX_TPS_DEV = 1.5;
  const MAX_RPM_DEV = 120;
  const MAX_SPEED_DEV = 2.0;
  const MAX_MAP_DEV = 5.0;
  const MAX_AFR_DEV = 0.6;

  for (let i = 0; i < logs.length; i++) {
    const cur = logs[i];
    const curTime = cur.LogEntrySeconds ?? 0;
    const curECT =
      typeof cur.ECT === "string" ? parseFloat(cur.ECT) : cur.ECT ?? 80;

    if (!cur.AFR || cur.AFR <= 10 || cur.AFR >= 18.0) continue;
    if (!cur.IPW || cur.IPW <= 0.4) continue;
    if (!cur.RPM || cur.RPM < 600) continue;
    if (curECT < 70) continue;

    let lookbackIdx = i;
    while (
      lookbackIdx > 0 &&
      curTime - (logs[lookbackIdx].LogEntrySeconds ?? 0) < WINDOW_TIME_SEC
    ) {
      lookbackIdx--;
    }

    const window = logs.slice(lookbackIdx, i + 1);
    if (window.length < 8) continue;

    let minTps = Infinity,
      maxTps = -Infinity;
    let minRpm = Infinity,
      maxRpm = -Infinity;
    let minSpeed = Infinity,
      maxSpeed = -Infinity;
    let minMap = Infinity,
      maxMap = -Infinity;
    let minAfr = Infinity,
      maxAfr = -Infinity;

    for (const r of window) {
      const tps = r.TPS ?? 0;
      const rpm = r.RPM ?? 0;
      const spd = r.Speed ?? 0;
      const map = r.MAP ?? 0;
      const afr = r.AFR ?? 0;

      if (tps < minTps) minTps = tps;
      if (tps > maxTps) maxTps = tps;
      if (rpm < minRpm) minRpm = rpm;
      if (rpm > maxRpm) maxRpm = rpm;
      if (spd < minSpeed) minSpeed = spd;
      if (spd > maxSpeed) maxSpeed = spd;
      if (map < minMap) minMap = map;
      if (map > maxMap) maxMap = map;
      if (afr < minAfr) minAfr = afr;
      if (afr > maxAfr) maxAfr = afr;
    }

    if (
      maxTps - minTps <= MAX_TPS_DEV &&
      maxRpm - minRpm <= MAX_RPM_DEV &&
      maxSpeed - minSpeed <= MAX_SPEED_DEV &&
      maxMap - minMap <= MAX_MAP_DEV &&
      maxAfr - minAfr <= MAX_AFR_DEV
    ) {
      steadyRecords.push(cur);
    }
  }

  // Fallback: if not enough strict steady records, loosen criteria slightly
  if (steadyRecords.length < 20 && logs.length > 50) {
    for (let i = 0; i < logs.length; i++) {
      const cur = logs[i];
      if (
        cur.AFR &&
        cur.AFR > 11 &&
        cur.AFR < 17.5 &&
        cur.IPW &&
        cur.IPW > 0.5
      ) {
        steadyRecords.push(cur);
      }
    }
  }

  return steadyRecords;
}

export class SteadyStateCombustionModel {
  private weights: number[] = [];
  private meanFeatures: number[] = [];
  private stdFeatures: number[] = [];
  public isTrained = false;

  private extractFeatures(r: LogRecord): number[] {
    const ipw = r.IPW ?? 1.5;
    const rpm = (r.RPM ?? 1500) / 1000;
    const map = (r.MAP ?? 50) / 100;
    const load = r.Load ?? 30;
    const maf =
      typeof r.MAF === "number"
        ? r.MAF
        : parseFloat((r.MAF as string) || "1.5");
    const tps = (r.TPS ?? 15) / 100;
    const inVvt = (r.InVVTactual ?? 10) / 30;
    const exVvt = (r.ExVVTactual ?? -2) / 15;

    const ratioLoadIpw = ipw > 0.1 ? load / ipw : 0;
    const ratioMapIpw = ipw > 0.1 ? (map * 100) / ipw : 0;
    const ratioMafIpw = ipw > 0.1 ? (maf * 100) / ipw : 0;

    return [
      ratioLoadIpw,
      ratioMapIpw,
      ratioMafIpw,
      ipw,
      rpm,
      map,
      tps,
      inVvt,
      exVvt,
      1.0, // bias
    ];
  }

  public train(steadyRecords: LogRecord[]): void {
    if (steadyRecords.length < 10) {
      return;
    }

    const X = steadyRecords.map((r) => this.extractFeatures(r));
    const y = steadyRecords.map((r) => r.AFR ?? 14.7);
    const numFeatures = X[0].length;

    this.meanFeatures = new Array(numFeatures).fill(0);
    this.stdFeatures = new Array(numFeatures).fill(1);

    for (let j = 0; j < numFeatures - 1; j++) {
      let sum = 0;
      for (let i = 0; i < X.length; i++) sum += X[i][j];
      const mean = sum / X.length;
      this.meanFeatures[j] = mean;

      let sumSq = 0;
      for (let i = 0; i < X.length; i++) sumSq += Math.pow(X[i][j] - mean, 2);
      this.stdFeatures[j] = Math.sqrt(sumSq / X.length) || 1;
    }

    const Xnorm = X.map((row) =>
      row.map((val, j) =>
        j < numFeatures - 1
          ? (val - this.meanFeatures[j]) / this.stdFeatures[j]
          : 1
      )
    );

    this.weights = new Array(numFeatures).fill(0);
    this.weights[numFeatures - 1] = y.reduce((a, b) => a + b, 0) / y.length;

    const lr = 0.02;
    const lambda = 0.005;
    const epochs = 800;

    for (let epoch = 0; epoch < epochs; epoch++) {
      const grads = new Array(numFeatures).fill(0);
      for (let i = 0; i < Xnorm.length; i++) {
        let pred = 0;
        for (let j = 0; j < numFeatures; j++)
          pred += Xnorm[i][j] * this.weights[j];
        const err = pred - y[i];
        for (let j = 0; j < numFeatures; j++) {
          grads[j] += err * Xnorm[i][j];
        }
      }

      for (let j = 0; j < numFeatures; j++) {
        const reg = j < numFeatures - 1 ? lambda * this.weights[j] : 0;
        this.weights[j] -= lr * (grads[j] / Xnorm.length + reg);
      }
    }

    this.isTrained = true;
  }

  public predict(r: LogRecord): number {
    if (r.IPW === 0 || (r.IPW ?? 0) <= 0.1) return 18.5;
    if (!this.isTrained) return r.AFRMAP ? Number(r.AFRMAP) || 14.7 : 14.7;

    const raw = this.extractFeatures(r);
    const numFeatures = raw.length;
    let pred = 0;
    for (let j = 0; j < numFeatures; j++) {
      const normVal =
        j < numFeatures - 1
          ? (raw[j] - this.meanFeatures[j]) / this.stdFeatures[j]
          : 1;
      pred += normVal * this.weights[j];
    }
    return Math.max(9.5, Math.min(18.5, pred));
  }
}

// --- Method: Steady-State Monotonic Dynamic Programming ---
export function runSteadyStateMonotonicDP(logs: LogRecord[]): LogRecord[] {
  const N = logs.length;
  if (N === 0) return [];

  ctx.postMessage({
    type: "progress",
    status: "Identifying steady-state records...",
    progress: 10,
  });

  const steadyRecords = identifySteadyStateRecords(logs);
  const combustionModel = new SteadyStateCombustionModel();
  combustionModel.train(steadyRecords);

  ctx.postMessage({
    type: "progress",
    status: "Calculating flow dynamics & predictions...",
    progress: 30,
  });

  const MIN_LAG = 1;
  const MAX_LAG = 28;
  const K = MAX_LAG - MIN_LAG + 1;

  const expectedAfr = logs.map((r) => combustionModel.predict(r));
  const isFuelCut = logs.map((r) => (r.IPW ?? 0) <= 0.2);

  // Physical prior offset for each row based on engine flow
  const priorOffsets = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const rpm = Math.max(600, logs[i].RPM ?? 1500);
    const map = Math.max(20, logs[i].MAP ?? 50);
    const flow = (rpm / 1500) * (map / 50);
    if (isFuelCut[i]) {
      // During fuel cut (closed throttle, low flow), transit time is longer
      priorOffsets[i] = Math.max(
        MIN_LAG,
        Math.min(MAX_LAG, Math.round(0.06 / 0.045 + 0.55 / (flow * 0.045)))
      );
    } else {
      priorOffsets[i] = Math.max(
        MIN_LAG,
        Math.min(MAX_LAG, Math.round(0.06 / 0.045 + 0.38 / (flow * 0.045)))
      );
    }
  }

  ctx.postMessage({
    type: "progress",
    status: "Executing monotonic dynamic programming...",
    progress: 50,
  });

  const lambdaPhys = 0.04;
  const lambdaSmooth = 0.35;

  let prevDp = new Float32Array(K);
  let currDp = new Float32Array(K);
  const backpointers = new Int16Array(N * K);

  for (let s = 0; s < K; s++) {
    const offset = MIN_LAG + s;
    const targetIdx = Math.min(N - 1, offset);
    const actualAfr = logs[targetIdx]?.AFR ?? 14.7;
    const afrDiff = Math.abs(actualAfr - expectedAfr[0]);
    const physDiff = Math.abs(offset - priorOffsets[0]);
    prevDp[s] = afrDiff + lambdaPhys * physDiff * physDiff;
  }

  for (let i = 1; i < N; i++) {
    const exp = expectedAfr[i];
    const prior = priorOffsets[i];
    const fuelCut = isFuelCut[i];
    const prevFuelCut = isFuelCut[i - 1];

    for (let sCurr = 0; sCurr < K; sCurr++) {
      const offsetCurr = MIN_LAG + sCurr;
      const targetIdxCurr = Math.min(N - 1, i + offsetCurr);
      const actualAfr = logs[targetIdxCurr]?.AFR ?? 14.7;

      let afrCost: number;

      if (fuelCut) {
        // In fuel cut, fuel is zero => AFR must be >= 18.0.
        if (actualAfr >= 18.0) {
          afrCost = 0.0;
        } else if (actualAfr >= 16.0) {
          afrCost = (18.5 - actualAfr) * 2.0;
        } else {
          afrCost = (18.5 - actualAfr) * 5.0;
        }
      } else if (prevFuelCut && !fuelCut) {
        // Exiting fuel cut (tip-in after decel):
        if (actualAfr >= 17.5) {
          afrCost = 25.0; // Avoid lingering lean air pocket
        } else {
          afrCost = Math.abs(actualAfr - exp);
        }
      } else {
        afrCost = Math.abs(actualAfr - exp);
      }

      // Physics distance cost
      const physWeight = fuelCut
        ? lambdaPhys * 0.1
        : fuelCut !== prevFuelCut
          ? lambdaPhys * 0.2
          : lambdaPhys;
      const physCost = physWeight * Math.pow(offsetCurr - prior, 2);
      const emissionCost = afrCost + physCost;

      let minTransCost = Infinity;
      let bestPrevState = 0;

      // Monotonic constraint: targetIdxCurr >= targetIdxPrev
      // i + offsetCurr >= (i - 1) + offsetPrev => offsetPrev <= offsetCurr + 1
      const maxPrevS = Math.min(K - 1, sCurr + 1);

      for (let sPrev = 0; sPrev <= maxPrevS; sPrev++) {
        const offsetPrev = MIN_LAG + sPrev;
        const stepDev = offsetCurr - offsetPrev;
        const smoothWeight =
          fuelCut !== prevFuelCut ? lambdaSmooth * 0.05 : lambdaSmooth;
        const smoothCost = smoothWeight * (stepDev * stepDev);

        const totalCost = prevDp[sPrev] + smoothCost;
        if (totalCost < minTransCost) {
          minTransCost = totalCost;
          bestPrevState = sPrev;
        }
      }

      currDp[sCurr] = emissionCost + minTransCost;
      backpointers[i * K + sCurr] = bestPrevState;
    }

    const temp = prevDp;
    prevDp = currDp;
    currDp = temp;

    if (i % 3000 === 0) {
      ctx.postMessage({
        type: "progress",
        status: "Executing monotonic dynamic programming...",
        progress: 50 + Math.round((i / N) * 40),
      });
    }
  }

  // Backtracking
  const chosenOffsets = new Array(N).fill(0);
  let bestEndState = 0;
  let minEndCost = Infinity;
  for (let s = 0; s < K; s++) {
    if (prevDp[s] < minEndCost) {
      minEndCost = prevDp[s];
      bestEndState = s;
    }
  }

  let currState = bestEndState;
  for (let i = N - 1; i >= 0; i--) {
    chosenOffsets[i] = MIN_LAG + currState;
    currState = backpointers[i * K + currState];
  }

  ctx.postMessage({
    type: "progress",
    status: "Applying corrections...",
    progress: 95,
  });

  return applyAfrShift(logs, chosenOffsets, "forward");
}

// --- Method: Steady-State Forward Search (Greedy) ---
export function runSteadyStateForwardSearch(logs: LogRecord[]): LogRecord[] {
  const N = logs.length;
  if (N === 0) return [];

  ctx.postMessage({
    type: "progress",
    status: "Identifying steady-state records...",
    progress: 10,
  });

  const steadyRecords = identifySteadyStateRecords(logs);
  const combustionModel = new SteadyStateCombustionModel();
  combustionModel.train(steadyRecords);

  ctx.postMessage({
    type: "progress",
    status: "Searching forward window...",
    progress: 30,
  });

  const MAX_FORWARD_WINDOW = 25;
  const MIN_FORWARD_WINDOW = 1;
  const offsets = new Array(N).fill(0);
  const isFuelCut = logs.map((r) => (r.IPW ?? 0) <= 0.2);

  for (let i = 0; i < N; i++) {
    const r = logs[i];
    const exp = combustionModel.predict(r);
    const fuelCut = isFuelCut[i];
    const prevFuelCut = i > 0 && isFuelCut[i - 1];

    const rpm = r.RPM ?? 1500;
    const map = r.MAP ?? 50;
    const flowFactor = Math.min(1.0, (rpm / 4000) * 0.6 + (map / 150) * 0.4);
    const priorOffset = fuelCut
      ? Math.round(24 - flowFactor * 10)
      : Math.round(18 - flowFactor * 14);

    let bestIdx = i + priorOffset;
    let bestScore = Infinity;

    const searchEnd = Math.min(N - 1, i + MAX_FORWARD_WINDOW);
    const searchStart = Math.min(searchEnd, i + MIN_FORWARD_WINDOW);

    for (let k = searchStart; k <= searchEnd; k++) {
      const candidateAfr = logs[k].AFR ?? 14.7;
      const offsetDist = k - i;
      let afrDiff = Math.abs(candidateAfr - exp);

      if (fuelCut) {
        if (candidateAfr >= 18.0) afrDiff = 0.0;
        else if (candidateAfr >= 16.0) afrDiff = (18.5 - candidateAfr) * 1.5;
        else afrDiff = (18.5 - candidateAfr) * 4.0;
      } else if (prevFuelCut && !fuelCut && candidateAfr >= 17.5) {
        afrDiff = 20.0;
      }

      const priorDiff = Math.abs(offsetDist - priorOffset);
      const priorPenalty = fuelCut ? 0.02 * priorDiff : 0.08 * priorDiff;

      const score = afrDiff + priorPenalty;
      if (score < bestScore) {
        bestScore = score;
        bestIdx = k;
      }
    }

    offsets[i] = Math.max(0, bestIdx - i);

    if (i % 3000 === 0) {
      ctx.postMessage({
        type: "progress",
        status: "Searching forward window...",
        progress: 30 + Math.round((i / N) * 60),
      });
    }
  }

  ctx.postMessage({
    type: "progress",
    status: "Applying corrections...",
    progress: 95,
  });

  return applyAfrShift(logs, offsets, "forward");
}

// --- Method 1: Cross-Correlation ---
function runCrossCorrelation(logs: LogRecord[]): LogRecord[] {
  const IPW_KEY = "IPW";
  const AFR_KEY = "AFR";
  const WINDOW_SIZE = 50;
  const MAX_OFFSET = 20;
  const STEP_SIZE = 10;

  if (!logs || logs.length < WINDOW_SIZE) {
    throw new Error("Not enough log data for Cross-Correlation.");
  }

  ctx.postMessage({
    type: "progress",
    status: "Analyzing signals...",
    progress: 10,
  });

  const ipwSignal = logs.map((row) => row[IPW_KEY] || 0);
  const invertedAfrSignal = logs.map((row) =>
    row[AFR_KEY] ? 20 - row[AFR_KEY] : 0
  );
  const offsets = new Array(logs.length).fill(0);

  for (let i = 0; i < logs.length - WINDOW_SIZE - MAX_OFFSET; i += STEP_SIZE) {
    const ipwWindow = ipwSignal.slice(i, i + WINDOW_SIZE);
    let bestOffset = 0;
    let maxCorrelation = -Infinity;

    for (let offset = 0; offset <= MAX_OFFSET; offset++) {
      const afrWindow = invertedAfrSignal.slice(
        i + offset,
        i + offset + WINDOW_SIZE
      );
      const correlation = calculateCorrelation(ipwWindow, afrWindow);
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestOffset = offset;
      }
    }

    for (let j = 0; j < STEP_SIZE && i + j < logs.length; j++) {
      offsets[i + j] = bestOffset;
    }
    const progress =
      10 + Math.round((i / (logs.length - WINDOW_SIZE - MAX_OFFSET)) * 80);
    ctx.postMessage({
      type: "progress",
      status: `Calculating offsets...`,
      progress,
    });
  }

  ctx.postMessage({
    type: "progress",
    status: "Applying corrections...",
    progress: 95,
  });

  return applyAfrShift(logs, offsets, "forward");
}

// --- Method 2: Flow-Based Variable Delay ---
function runFlowBasedDelay(logs: LogRecord[]): LogRecord[] {
  const MIN_DELAY = 3;
  const MAX_DELAY = 15;
  const SMOOTHING_WINDOW = 7;

  ctx.postMessage({
    type: "progress",
    status: "Calculating flow-based offsets...",
    progress: 10,
  });
  const offsets = calculateBaselineOffsets(
    logs,
    MIN_DELAY,
    MAX_DELAY,
    SMOOTHING_WINDOW
  );

  ctx.postMessage({
    type: "progress",
    status: "Applying corrections...",
    progress: 90,
  });
  return applyAfrShift(logs, offsets, "backward");
}

// --- Method 3: Throttle-Triggered Shift ---
function runThrottleTriggeredShift(logs: LogRecord[]): LogRecord[] {
  const TPS_KEY = "TPS";
  const THROTTLE_THRESHOLD = 4;
  const TRANSIENT_OFFSET = 3;
  const MIN_DELAY = 3;
  const MAX_DELAY = 15;
  const SMOOTHING_WINDOW = 7;

  ctx.postMessage({
    type: "progress",
    status: "Calculating baseline offsets...",
    progress: 10,
  });
  const baselineOffsets = calculateBaselineOffsets(
    logs,
    MIN_DELAY,
    MAX_DELAY,
    SMOOTHING_WINDOW
  );

  ctx.postMessage({
    type: "progress",
    status: "Detecting throttle changes...",
    progress: 50,
  });

  const finalOffsets = new Array(logs.length).fill(0);
  for (let i = 1; i < logs.length; i++) {
    const tpsDelta = (logs[i][TPS_KEY] || 0) - (logs[i - 1][TPS_KEY] || 0);
    if (tpsDelta > THROTTLE_THRESHOLD) {
      finalOffsets[i] = TRANSIENT_OFFSET;
    } else {
      finalOffsets[i] = baselineOffsets[i];
    }
  }

  ctx.postMessage({
    type: "progress",
    status: "Applying corrections...",
    progress: 90,
  });
  return applyAfrShift(logs, finalOffsets, "forward");
}

import savitzkyGolayLib from "ml-savitzky-golay";

// --- Method 4: Savitzky-Golay ---
function runSavitzkyGolayFilter(logs: LogRecord[]): LogRecord[] {
  const AFR_KEY = "AFR";
  const afrSignal = logs.map((row) => row[AFR_KEY] || 0);

  const options = {
    derivative: 0,
    windowSize: 5,
    polynomial: 2,
    pad: "none" as const,
  };

  const smoothedAfr = savitzkyGolayLib(afrSignal, 1, options);

  return logs.map((row, i) => {
    const newRow: LogRecord = { ...row };
    newRow["Corrected AFR"] = smoothedAfr[i];
    newRow["AFR Offset"] = 0; // Savitzky-Golay does not produce an offset
    return newRow;
  });
}

// --- Method 5: Machine Learning ---
async function runMachineLearning(logs: LogRecord[]): Promise<LogRecord[]> {
  const FEATURE_KEYS = ["IPW", "RPM", "MAP", "TPS"];
  const TARGET_KEY = "AFR";
  const WINDOW_SIZE = 20;
  const MAX_OFFSET = 20;
  const STEP_SIZE = 10;
  const PRE_OFFSET_WINDOW = 10; // Number of previous log entries to consider for features

  if (!logs || logs.length < WINDOW_SIZE + PRE_OFFSET_WINDOW) {
    throw new Error("Not enough log data for Machine Learning.");
  }

  const offsets = new Array(logs.length).fill(0);

  for (
    let i = PRE_OFFSET_WINDOW;
    i < logs.length - WINDOW_SIZE - MAX_OFFSET;
    i += STEP_SIZE
  ) {
    if (logs[i].logId !== logs[i + WINDOW_SIZE - 1].logId) {
      continue;
    }

    const prevOffset = i > PRE_OFFSET_WINDOW ? offsets[i - 1] : 0; // Get previous offset, default to 0 at start

    // Volatility Check: Only run analysis on windows with enough signal change.
    const windowForVolatilityCheck = logs.slice(i, i + WINDOW_SIZE);
    const tpsData = windowForVolatilityCheck.map((l) => l["TPS"] || 0);
    const afrData = windowForVolatilityCheck.map((l) => l["AFR"] || 0);

    const { variance: tpsVariance } = tf.moments(tpsData);
    const { variance: afrVariance } = tf.moments(afrData);

    const MIN_TPS_VARIANCE = 0.1; // Threshold for throttle changes
    const MIN_AFR_VARIANCE = 0.02; // Threshold for AFR changes
    // If data is too flat, carry over the previous offset and skip analysis for this window
    if (
      tpsVariance.dataSync()[0] < MIN_TPS_VARIANCE ||
      afrVariance.dataSync()[0] < MIN_AFR_VARIANCE
    ) {
      for (let j = 0; j < STEP_SIZE && i + j < logs.length; j++) {
        offsets[i + j] = prevOffset;
      }
      continue;
    }

    let bestOffset = prevOffset; // Initialize with previous offset as a fallback
    let bestCorrelation = -1;
    for (let offset = 0; offset <= MAX_OFFSET; offset++) {
      if (
        i + offset + WINDOW_SIZE > logs.length ||
        logs[i + offset].logId !== logs[i + offset + WINDOW_SIZE - 1].logId
      ) {
        continue;
      }

      const features: number[][] = [];
      for (let k = 0; k < WINDOW_SIZE; k++) {
        const currentFeatures: number[] = [];
        // Add current log's features
        FEATURE_KEYS.forEach((key) =>
          currentFeatures.push(logs[i + k][key] || 0)
        );
        // Add previous logs' features
        for (let p = 1; p <= PRE_OFFSET_WINDOW; p++) {
          FEATURE_KEYS.forEach((key) =>
            currentFeatures.push(logs[i + k - p][key] || 0)
          );
        }
        features.push(currentFeatures);
      }

      const target = logs
        .slice(i + offset, i + offset + WINDOW_SIZE)
        .map((log) => log[TARGET_KEY] || 0);

      if (target.length !== WINDOW_SIZE) {
        continue;
      }

      const featureTensor = tf.tensor2d(features);
      const targetTensor = tf.tensor1d(target);

      const correlation = await tf
        .tidy(() => {
          const centeredFeatures = featureTensor.sub(tf.mean(featureTensor));
          const centeredTarget = targetTensor.sub(tf.mean(targetTensor));

          // Create a weights tensor that decays linearly from 1.0 to 0.5
          const weights = tf
            .linspace(1.0, 0.5, WINDOW_SIZE)
            .reshape([WINDOW_SIZE, 1]);

          // Get the products of the centered values
          const products = centeredFeatures.mul(
            centeredTarget.reshape([WINDOW_SIZE, 1])
          );

          // Apply the weights
          const weightedProducts = products.mul(weights);

          // The rest of the calculation remains the same for simplicity,
          // turning this into a weighted score rather than a true weighted correlation.
          const covariance = tf.sum(weightedProducts);
          const featureStdDev = tf.sqrt(tf.sum(tf.square(centeredFeatures)));
          const targetStdDev = tf.sqrt(tf.sum(tf.square(centeredTarget)));

          return covariance.div(featureStdDev.mul(targetStdDev));
        })
        .data();

      if (correlation[0] > bestCorrelation) {
        bestCorrelation = correlation[0];
        bestOffset = offset;
      }
    }

    for (let j = 0; j < STEP_SIZE && i + j < logs.length; j++) {
      offsets[i + j] = bestOffset;
    }

    const progress =
      10 + Math.round((i / (logs.length - WINDOW_SIZE - MAX_OFFSET)) * 80);
    ctx.postMessage({
      type: "progress",
      status: `Calculating offsets...`,
      progress,
    });
  }

  ctx.postMessage({
    type: "progress",
    status: "Applying corrections...",
    progress: 95,
  });

  return applyAfrShift(logs, offsets, "forward");
}

// Helper function to group logs by logId

function groupLogsById(logs: LogRecord[]): LogRecord[][] {
  const groupedLogs: { [key: number]: LogRecord[] } = {};

  for (const log of logs) {
    const logId = log.logId || 0; // Default to 0 if logId is not present

    if (!groupedLogs[logId]) {
      groupedLogs[logId] = [];
    }

    groupedLogs[logId].push(log);
  }

  return Object.values(groupedLogs);
}

// --- Main Worker Logic ---

ctx.onmessage = async (
  event: MessageEvent<AfrMlShifterWorkerMessage>
): Promise<void> => {
  if (event.data.type === "kill") {
    ctx.postMessage({ type: "error", error: new Error("Worker killed") });

    ctx.close();

    return;
  }

  if (event.data.type === "run") {
    try {
      const { logs, method } = event.data.data;

      let correctedLogs: LogRecord[];

      const IPW_FEATURE_KEYS = ["IPW", "RPM", "MAP", "TPS"];

      const MAF_FEATURE_KEYS = ["MAF", "TPS", "RPM"];

      if (method === AfrShiftMethod.SteadyStateMonotonicDP) {
        const logGroups = groupLogsById(logs);
        const correctedLogGroups = logGroups.map((group) =>
          runSteadyStateMonotonicDP(group)
        );
        correctedLogs = correctedLogGroups.flat();
      } else if (method === AfrShiftMethod.SteadyStateForwardSearch) {
        const logGroups = groupLogsById(logs);
        const correctedLogGroups = logGroups.map((group) =>
          runSteadyStateForwardSearch(group)
        );
        correctedLogs = correctedLogGroups.flat();
      } else if (method === AfrShiftMethod.MachineLearning) {
        // For ML, use all logs to train, but be mindful of boundaries internally

        correctedLogs = await runMachineLearning(logs);
      } else if (method === AfrShiftMethod.PredictiveModel) {
        correctedLogs = await runPredictiveModelAnalysis(
          logs,
          IPW_FEATURE_KEYS
        );
      } else if (method === AfrShiftMethod.PredictiveModelMAF) {
        correctedLogs = await runPredictiveModelAnalysis(
          logs,
          MAF_FEATURE_KEYS
        );
      } else if (method === AfrShiftMethod.OffsetRegression) {
        correctedLogs = await runOffsetRegressionAnalysis(logs);
      } else {
        // For other methods, process each log independently

        const logGroups = groupLogsById(logs);

        const correctedLogGroups = [];

        for (const logGroup of logGroups) {
          let correctedGroup: LogRecord[];

          switch (method) {
            case AfrShiftMethod.CrossCorrelation:
              correctedGroup = runCrossCorrelation(logGroup);

              break;

            case AfrShiftMethod.FlowBasedVariableDelay:
              correctedGroup = runFlowBasedDelay(logGroup);

              break;

            case AfrShiftMethod.ThrottleTriggered:
              correctedGroup = runThrottleTriggeredShift(logGroup);

              break;

            case AfrShiftMethod.SavitzkyGolay:
              correctedGroup = runSavitzkyGolayFilter(logGroup);

              break;

            default:
              // This case should not be hit if the outer if is correct, but it satisfies typescript

              throw new Error(`Unknown AFR shift method: ${method}`);
          }

          correctedLogGroups.push(correctedGroup);
        }

        correctedLogs = correctedLogGroups.flat();
      }

      ctx.postMessage({ type: "data", data: { correctedLogs } });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    } finally {
      ctx.close();
    }
  }
};

async function runPredictiveModelAnalysis(
  logs: LogRecord[],
  featureKeys: string[]
): Promise<LogRecord[]> {
  const TARGET_KEY = "AFR";
  const WINDOW_SIZE = 30; // Larger window for more stable model training
  const MAX_OFFSET = 20;
  const STEP_SIZE = 15;
  const PRE_OFFSET_WINDOW = 10; // Number of previous log entries to consider for features

  if (!logs || logs.length < WINDOW_SIZE + MAX_OFFSET + PRE_OFFSET_WINDOW) {
    throw new Error("Not enough log data for Predictive Model.");
  }

  const offsets = new Array(logs.length).fill(0);

  for (
    let i = PRE_OFFSET_WINDOW;
    i < logs.length - WINDOW_SIZE - MAX_OFFSET;
    i += STEP_SIZE
  ) {
    const prevOffset = i > PRE_OFFSET_WINDOW ? offsets[i - 1] : 0;

    // --- Volatility Check ---
    const volatilityWindow = logs.slice(i, i + WINDOW_SIZE);
    const { variance: tpsVariance } = tf.moments(
      volatilityWindow.map((l) => l["TPS"] || 0)
    );
    const { variance: afrVariance } = tf.moments(
      volatilityWindow.map((l) => l["AFR"] || 0)
    );
    const MIN_TPS_VARIANCE = 0.1;
    const MIN_AFR_VARIANCE = 0.02;

    if (
      tpsVariance.dataSync()[0] < MIN_TPS_VARIANCE ||
      afrVariance.dataSync()[0] < MIN_AFR_VARIANCE
    ) {
      for (let j = 0; j < STEP_SIZE && i + j < logs.length; j++) {
        offsets[i + j] = prevOffset;
      }
      continue;
    }

    let bestOffset = prevOffset;
    let minLoss = Infinity;

    const features: number[][] = [];
    for (let k = 0; k < WINDOW_SIZE; k++) {
      const currentFeatures: number[] = [];
      // Add current log's features
      featureKeys.forEach((key) => currentFeatures.push(logs[i + k][key] || 0));
      // Add previous logs' features
      for (let p = 1; p <= PRE_OFFSET_WINDOW; p++) {
        featureKeys.forEach((key) =>
          currentFeatures.push(logs[i + k - p][key] || 0)
        );
      }
      features.push(currentFeatures);
    }

    const featuresTensor = tf.tensor2d(features);

    for (let k = 0; k <= MAX_OFFSET; k++) {
      const targetTensor = tf.tensor1d(
        logs
          .slice(i + k, i + k + WINDOW_SIZE)
          .map((log) => log[TARGET_KEY] || 0)
      );

      // --- Train a linear regression model for this offset ---
      const model = tf.sequential();
      model.add(
        tf.layers.dense({
          inputShape: [featureKeys.length * (1 + PRE_OFFSET_WINDOW)],
          units: 1,
        })
      );
      model.compile({
        optimizer: tf.train.adam(0.1),
        loss: "meanSquaredError",
      });

      const history = await model.fit(featuresTensor, targetTensor, {
        epochs: 10,
        verbose: 0,
      });
      const currentLoss = history.history.loss[
        history.history.loss.length - 1
      ] as number;

      if (currentLoss < minLoss) {
        minLoss = currentLoss;
        bestOffset = k;
      }
    }

    for (let j = 0; j < STEP_SIZE && i + j < logs.length; j++) {
      offsets[i + j] = bestOffset;
    }

    const progress =
      10 + Math.round((i / (logs.length - WINDOW_SIZE - MAX_OFFSET)) * 80);
    ctx.postMessage({
      type: "progress",
      status: `Training models...`,
      progress,
    });
  }

  ctx.postMessage({
    type: "progress",
    status: "Applying corrections...",
    progress: 95,
  });

  return applyAfrShift(logs, offsets, "forward");
}

async function runOffsetRegressionAnalysis(
  logs: LogRecord[]
): Promise<LogRecord[]> {
  const AFR_TARGET_KEY = "AFR";
  const PREDICTIVE_MODEL_FEATURE_KEYS = ["IPW", "RPM", "MAP", "TPS"]; // Features for initial lag estimation
  const OFFSET_MODEL_FEATURE_KEYS = ["MAF", "TPS", "RPM", "IPW"]; // Features for offset prediction

  const WINDOW_SIZE = 30; // Window for initial lag estimation
  const MAX_OFFSET = 20;
  const STEP_SIZE = 15;
  const OFFSET_MODEL_EPOCHS = 50; // Epochs for training the offset prediction model
  const PRE_OFFSET_WINDOW = 10; // Number of previous log entries to consider for features

  if (!logs || logs.length < WINDOW_SIZE + MAX_OFFSET + PRE_OFFSET_WINDOW) {
    throw new Error("Not enough log data for Offset Regression.");
  }

  ctx.postMessage({
    type: "progress",
    status: "Estimating initial lags...",
    progress: 5,
  });

  const initialLagEstimates: { features: number[]; offset: number }[] = [];

  // --- Stage 1: Estimate initial lags for active regions ---
  for (
    let i = PRE_OFFSET_WINDOW;
    i < logs.length - WINDOW_SIZE - MAX_OFFSET;
    i += STEP_SIZE
  ) {
    // Volatility Check (same as Predictive Model)
    const volatilityWindow = logs.slice(i, i + WINDOW_SIZE);
    const { variance: tpsVariance } = tf.moments(
      volatilityWindow.map((l) => l["TPS"] || 0)
    );
    const { variance: afrVariance } = tf.moments(
      volatilityWindow.map((l) => l["AFR"] || 0)
    );
    const MIN_TPS_VARIANCE = 0.1;
    const MIN_AFR_VARIANCE = 0.02;

    if (
      tpsVariance.dataSync()[0] < MIN_TPS_VARIANCE ||
      afrVariance.dataSync()[0] < MIN_AFR_VARIANCE
    ) {
      continue; // Skip steady state regions for initial lag estimation
    }

    let bestOffsetForWindow = 0;
    let minLossForWindow = Infinity;

    const features: number[][] = [];
    for (let k = 0; k < WINDOW_SIZE; k++) {
      const currentFeatures: number[] = [];
      // Add current log\'s features
      PREDICTIVE_MODEL_FEATURE_KEYS.forEach((key) =>
        currentFeatures.push(logs[i + k][key] || 0)
      );
      // Add previous logs\' features
      for (let p = 1; p <= PRE_OFFSET_WINDOW; p++) {
        PREDICTIVE_MODEL_FEATURE_KEYS.forEach((key) =>
          currentFeatures.push(logs[i + k - p][key] || 0)
        );
      }
      features.push(currentFeatures);
    }

    const featuresTensor = tf.tensor2d(features);

    for (let k = 0; k <= MAX_OFFSET; k++) {
      const targetTensor = tf.tensor1d(
        logs
          .slice(i + k, i + k + WINDOW_SIZE)
          .map((log) => log[AFR_TARGET_KEY] || 0)
      );

      const model = tf.sequential();
      model.add(
        tf.layers.dense({
          inputShape: [
            PREDICTIVE_MODEL_FEATURE_KEYS.length * (1 + PRE_OFFSET_WINDOW),
          ],
          units: 1,
        })
      );
      model.compile({
        optimizer: tf.train.adam(0.1),
        loss: "meanSquaredError",
      });

      const history = await model.fit(featuresTensor, targetTensor, {
        epochs: 10,
        verbose: 0,
      });
      const currentLoss = history.history.loss[
        history.history.loss.length - 1
      ] as number;

      if (currentLoss < minLossForWindow) {
        minLossForWindow = currentLoss;
        bestOffsetForWindow = k;
      }
    }
    // Store the features and the best estimated offset for this active window
    const currentFeaturesForEstimate: number[] = [];
    PREDICTIVE_MODEL_FEATURE_KEYS.forEach((key) =>
      currentFeaturesForEstimate.push(logs[i][key] || 0)
    );
    for (let p = 1; p <= PRE_OFFSET_WINDOW; p++) {
      PREDICTIVE_MODEL_FEATURE_KEYS.forEach((key) =>
        currentFeaturesForEstimate.push(logs[i - p][key] || 0)
      );
    }
    initialLagEstimates.push({
      features: currentFeaturesForEstimate,
      offset: bestOffsetForWindow,
    });
    ctx.postMessage({
      type: "progress",
      status: `Estimating initial lags...`,
      progress:
        5 +
        Math.round(
          ((i - PRE_OFFSET_WINDOW) /
            (logs.length - WINDOW_SIZE - MAX_OFFSET - PRE_OFFSET_WINDOW)) *
            40
        ),
    });
  }

  if (initialLagEstimates.length === 0) {
    throw new Error(
      "No active regions found to estimate initial lags. Try adjusting volatility thresholds."
    );
  }

  ctx.postMessage({
    type: "progress",
    status: "Training offset prediction model...",
    progress: 50,
  });

  // --- Stage 2: Train a model to predict offset from features ---
  const offsetFeatures = tf.tensor2d(
    initialLagEstimates.map((est) =>
      OFFSET_MODEL_FEATURE_KEYS.map(
        (key) => est.features[PREDICTIVE_MODEL_FEATURE_KEYS.indexOf(key)] || 0
      )
    )
  );
  const offsetTargets = tf.tensor1d(
    initialLagEstimates.map((est) => est.offset)
  );

  const offsetModel = tf.sequential();
  offsetModel.add(
    tf.layers.dense({
      inputShape: [OFFSET_MODEL_FEATURE_KEYS.length * (1 + PRE_OFFSET_WINDOW)],
      units: 1,
    })
  );
  offsetModel.compile({
    optimizer: tf.train.adam(0.01),
    loss: "meanSquaredError",
  });

  await offsetModel.fit(offsetFeatures, offsetTargets, {
    epochs: OFFSET_MODEL_EPOCHS,
    verbose: 0,
  });

  ctx.postMessage({
    type: "progress",
    status: "Predicting and applying offsets...",
    progress: 90,
  });

  // --- Stage 3: Predict and apply offsets for the entire log ---
  const finalOffsets = new Array(logs.length).fill(0);
  const allLogFeatures: number[][] = [];
  for (let i = 0; i < logs.length; i++) {
    const currentFeatures: number[] = [];
    OFFSET_MODEL_FEATURE_KEYS.forEach((key) =>
      currentFeatures.push(logs[i][key] || 0)
    );
    for (let p = 1; p <= PRE_OFFSET_WINDOW; p++) {
      if (i - p >= 0) {
        OFFSET_MODEL_FEATURE_KEYS.forEach((key) =>
          currentFeatures.push(logs[i - p][key] || 0)
        );
      } else {
        OFFSET_MODEL_FEATURE_KEYS.forEach(() => currentFeatures.push(0)); // Pad with zeros if not enough history
      }
    }
    allLogFeatures.push(currentFeatures);
  }
  const allLogFeaturesTensor = tf.tensor2d(allLogFeatures);
  const predictedOffsetsTensor = offsetModel.predict(
    allLogFeaturesTensor
  ) as tf.Tensor;
  const predictedOffsets = predictedOffsetsTensor.dataSync();

  for (let i = 0; i < logs.length; i++) {
    finalOffsets[i] = Math.round(
      Math.max(0, Math.min(MAX_OFFSET, predictedOffsets[i]))
    );
  }

  ctx.postMessage({
    type: "progress",
    status: "Applying corrections...",
    progress: 95,
  });

  return applyAfrShift(logs, finalOffsets, "forward");
}
