

// --- Types ---
export interface LogRecord {
  LogID?: number;
  LogEntrySeconds?: number;
  AFR?: number;
  IPW?: number;
  RPM?: number;
  MAP?: number;
  MAF?: number;
  TPS?: number;
  APP?: number;
  Load?: number;
  Speed?: number;
  ECT?: number | string;
  InVVTactual?: number;
  ExVVTactual?: number;
  STFT?: number;
  CurrentLTFT?: number;
  AFRMAP?: number | string;
  [key: string]: any;
}

export interface SteadyStateRecord {
  index: number;
  record: LogRecord;
  expectedAfr: number;
}

// 1. Identify Steady-State Records
export function identifySteadyState(logs: LogRecord[]): {
  steadyIndices: Set<number>;
  steadyRecords: LogRecord[];
} {
  const steadyIndices = new Set<number>();
  const steadyRecords: LogRecord[] = [];

  const WINDOW_TIME_SEC = 1.0;
  const MAX_TPS_DEV = 1.5; // Max TPS range in window
  const MAX_RPM_DEV = 100; // Max RPM range in window
  const MAX_SPEED_DEV = 2.0; // Max Speed range in window
  const MAX_MAP_DEV = 5.0; // Max MAP range in window
  const MAX_AFR_DEV = 0.6; // Max AFR range in window

  for (let i = 0; i < logs.length; i++) {
    const cur = logs[i];
    const curTime = cur.LogEntrySeconds ?? 0;
    const curECT = typeof cur.ECT === "string" ? parseFloat(cur.ECT) : (cur.ECT ?? 80);

    // Basic validity checks
    if (!cur.AFR || cur.AFR <= 10 || cur.AFR >= 18.0) continue; // Exclude wide open sensor limits / fuel cut
    if (!cur.IPW || cur.IPW <= 0.5) continue; // Exclude zero IPW / fuel cut
    if (!cur.RPM || cur.RPM < 650) continue;
    if (curECT < 70) continue; // Only warm engine

    // Lookback window for steady condition (1 second back)
    let lookbackIdx = i;
    while (lookbackIdx > 0 && curTime - (logs[lookbackIdx].LogEntrySeconds ?? 0) < WINDOW_TIME_SEC) {
      lookbackIdx--;
    }

    const window = logs.slice(lookbackIdx, i + 1);
    if (window.length < 10) continue;

    let minTps = Infinity, maxTps = -Infinity;
    let minRpm = Infinity, maxRpm = -Infinity;
    let minSpeed = Infinity, maxSpeed = -Infinity;
    let minMap = Infinity, maxMap = -Infinity;
    let minAfr = Infinity, maxAfr = -Infinity;

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
      steadyIndices.add(i);
      steadyRecords.push(cur);
    }
  }

  return { steadyIndices, steadyRecords };
}

// 2. Train Steady State Combustion Model (Air / Fuel -> AFR)
// Physical relation: AFR = AirMass / FuelMass
// AirMass ~ MAP * (RPM / 1000) or Load or MAF
// FuelMass ~ (IPW - Latency) * STFT * LTFT
export class SteadyStateCombustionModel {
  private weights: number[] = [];
  private meanFeatures: number[] = [];
  private stdFeatures: number[] = [];
  public isTrained = false;

  private extractFeatures(r: LogRecord): number[] {
    const rpm = r.RPM ?? 2000;
    const map = r.MAP ?? 50;
    const ipw = r.IPW ?? 1.5;
    const tps = r.TPS ?? 15;
    const load = r.Load ?? 40;
    const maf = typeof r.MAF === "number" ? r.MAF : parseFloat(r.MAF as string || "1.5");

    // Physical features:
    // f0: Load / IPW (direct air-to-fuel ratio proxy)
    // f1: (MAP / IPW)
    // f2: (MAF / IPW)
    // f3: RPM
    // f4: MAP
    // f5: IPW
    // f6: TPS
    const f0 = ipw > 0.1 ? load / ipw : 0;
    const f1 = ipw > 0.1 ? map / ipw : 0;
    const f2 = ipw > 0.1 ? (maf * 100) / ipw : 0;
    const f3 = rpm / 1000;
    const f4 = map / 100;
    const f5 = ipw;
    const f6 = tps / 100;
    const f7 = 1.0; // bias

    return [f0, f1, f2, f3, f4, f5, f6, f7];
  }

  public train(steadyRecords: LogRecord[]) {
    if (steadyRecords.length < 20) {
      console.warn("Not enough steady records to train model.");
      return;
    }

    const X = steadyRecords.map(r => this.extractFeatures(r));
    const y = steadyRecords.map(r => r.AFR ?? 14.7);
    const numFeatures = X[0].length;

    // Normalization parameters
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

    // Normalized X
    const Xnorm = X.map(row =>
      row.map((val, j) => (j < numFeatures - 1 ? (val - this.meanFeatures[j]) / this.stdFeatures[j] : 1))
    );

    // Ridge regression via gradient descent
    this.weights = new Array(numFeatures).fill(0);
    // Initial guess: mean AFR on bias
    this.weights[numFeatures - 1] = y.reduce((a, b) => a + b, 0) / y.length;

    const lr = 0.01;
    const lambda = 0.01;
    const epochs = 1000;

    for (let epoch = 0; epoch < epochs; epoch++) {
      const grads = new Array(numFeatures).fill(0);
      for (let i = 0; i < Xnorm.length; i++) {
        let pred = 0;
        for (let j = 0; j < numFeatures; j++) pred += Xnorm[i][j] * this.weights[j];
        const err = pred - y[i];
        for (let j = 0; j < numFeatures; j++) {
          grads[j] += err * Xnorm[i][j];
        }
      }

      for (let j = 0; j < numFeatures; j++) {
        const reg = j < numFeatures - 1 ? lambda * this.weights[j] : 0;
        this.weights[j] -= (lr * (grads[j] / Xnorm.length + reg));
      }
    }

    this.isTrained = true;
  }

  public predict(r: LogRecord): number {
    if (!this.isTrained) return r.AFRMAP ? Number(r.AFRMAP) || 14.7 : 14.7;
    if (r.IPW === 0 || (r.IPW ?? 0) <= 0.1) return 18.5; // Fuel cut is full lean

    const raw = this.extractFeatures(r);
    const numFeatures = raw.length;
    let pred = 0;
    for (let j = 0; j < numFeatures; j++) {
      const normVal = j < numFeatures - 1 ? (raw[j] - this.meanFeatures[j]) / this.stdFeatures[j] : 1;
      pred += normVal * this.weights[j];
    }
    // Clamp to realistic AFR
    return Math.max(9.5, Math.min(18.5, pred));
  }
}

// -------------------------------------------------------------
// ALGORITHM 1: Baseline Existing Flow-Based Delay
// -------------------------------------------------------------
export function algo1_ExistingFlowDelay(logs: LogRecord[]): { shiftedAfr: number[]; offsets: number[] } {
  const MIN_DELAY = 3;
  const MAX_DELAY = 15;
  const SMOOTHING_WINDOW = 7;

  const inverseFlow = logs.map((row) => 1 / ((row.RPM || 1) * (row.MAP || 1)));
  const minInverse = Math.min(...inverseFlow);
  const maxInverse = Math.max(...inverseFlow);
  const range = maxInverse - minInverse;
  const rawDelays =
    range > 0
      ? inverseFlow.map((val) => MIN_DELAY + ((val - minInverse) / range) * (MAX_DELAY - MIN_DELAY))
      : new Array(logs.length).fill((MIN_DELAY + MAX_DELAY) / 2);

  const offsets = new Array(logs.length).fill(0);
  const halfWindow = Math.floor(SMOOTHING_WINDOW / 2);
  for (let i = 0; i < logs.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(logs.length - 1, i + halfWindow);
    let sum = 0;
    for (let j = start; j <= end; j++) sum += rawDelays[j];
    offsets[i] = Math.round(sum / (end - start + 1));
  }

  const shiftedAfr = logs.map((r, i) => {
    const targetIdx = Math.min(logs.length - 1, i + offsets[i]);
    return logs[targetIdx].AFR ?? 14.7;
  });

  return { shiftedAfr, offsets };
}

// -------------------------------------------------------------
// ALGORITHM 2: Exhaust Volume Integrator (Physical Volumetric Mass Flow)
// Gas volume between cylinder and O2 sensor is constant V_pipe.
// Delay in records is when cumulative exhaust volume reaches V_pipe.
// -------------------------------------------------------------
export function algo2_PhysicalExhaustVolumeIntegrator(
  logs: LogRecord[],
  targetPipeVolumeRelative = 8.0 // calibrated parameter
): { shiftedAfr: number[]; offsets: number[] } {
  const offsets = new Array(logs.length).fill(0);
  const shiftedAfr = new Array(logs.length).fill(0);

  // Volumetric flow rate per log record:
  // Flow ~ (RPM / 60) * (MAP / 100) * dt
  const flows: number[] = [];
  for (let i = 0; i < logs.length; i++) {
    const dt = i < logs.length - 1 ? (logs[i + 1].LogEntrySeconds ?? 0.05) - (logs[i].LogEntrySeconds ?? 0) : 0.05;
    const safeDt = dt > 0 && dt < 0.5 ? dt : 0.05;
    const rpm = logs[i].RPM ?? 1000;
    const map = logs[i].MAP ?? 50;
    // Volumetric flow proxy
    const flow = (rpm / 1000) * (map / 50) * (safeDt / 0.05);
    flows.push(Math.max(0.2, flow));
  }

  for (let i = 0; i < logs.length; i++) {
    let accumulatedFlow = 0;
    let targetIdx = i;
    while (targetIdx < logs.length - 1 && accumulatedFlow < targetPipeVolumeRelative) {
      accumulatedFlow += flows[targetIdx];
      targetIdx++;
    }
    const offset = Math.min(30, targetIdx - i);
    offsets[i] = offset;
    shiftedAfr[i] = logs[i + offset]?.AFR ?? logs[i].AFR ?? 14.7;
  }

  return { shiftedAfr, offsets };
}

// -------------------------------------------------------------
// ALGORITHM 3: Steady-State Model + Forward Window Best Actual AFR Search
// User's core idea: Use steady state logs to learn what AFR to expect,
// and in non-steady records, find the closest actual recorded AFR reading
// in the forward window (next 1 to 30 records) weighted by physical delay prior.
// -------------------------------------------------------------
export function algo3_SteadyModelForwardSearch(
  logs: LogRecord[],
  combustionModel: SteadyStateCombustionModel
): { shiftedAfr: number[]; offsets: number[]; expectedAfr: number[] } {
  const offsets = new Array(logs.length).fill(0);
  const shiftedAfr = new Array(logs.length).fill(0);
  const expectedAfr = new Array(logs.length).fill(0);

  const MAX_FORWARD_WINDOW = 25; // max ~1.2s forward
  const MIN_FORWARD_WINDOW = 1;  // min 1 record forward

  for (let i = 0; i < logs.length; i++) {
    const r = logs[i];
    const exp = combustionModel.predict(r);
    expectedAfr[i] = exp;

    // Estimate physical baseline offset for this engine condition
    const rpm = r.RPM ?? 1500;
    const map = r.MAP ?? 50;
    // Physical transit heuristic: high RPM/MAP -> ~3-5 records, idle -> ~15-20 records
    const flowFactor = Math.min(1.0, ((rpm / 4000) * 0.6 + (map / 150) * 0.4));
    const priorOffset = Math.round(18 - flowFactor * 14); // maps to ~4..18

    // Search window [i + MIN_FORWARD_WINDOW, i + MAX_FORWARD_WINDOW]
    let bestIdx = i + priorOffset;
    let bestScore = Infinity;

    const searchEnd = Math.min(logs.length - 1, i + MAX_FORWARD_WINDOW);
    const searchStart = Math.min(searchEnd, i + MIN_FORWARD_WINDOW);

    for (let k = searchStart; k <= searchEnd; k++) {
      const candidateAfr = logs[k].AFR ?? 14.7;
      const offsetDist = k - i;

      // Penalize difference between candidate actual AFR and expected AFR
      const afrDiff = Math.abs(candidateAfr - exp);

      // Distance penalty from physical prior offset
      const priorDiff = Math.abs(offsetDist - priorOffset);
      const priorPenalty = 0.08 * priorDiff;

      // Fuel cut handling: if expected is full lean (IPW=0), heavily prefer high AFR readings
      const fuelCutBonus = (exp >= 18.0 && candidateAfr >= 17.0) ? -2.0 : 0;

      const score = afrDiff + priorPenalty + fuelCutBonus;

      if (score < bestScore) {
        bestScore = score;
        bestIdx = k;
      }
    }

    const finalOffset = Math.max(0, bestIdx - i);
    offsets[i] = finalOffset;
    shiftedAfr[i] = logs[bestIdx]?.AFR ?? r.AFR ?? 14.7;
  }

  return { shiftedAfr, offsets, expectedAfr };
}

// -------------------------------------------------------------
// ALGORITHM 4: Hybrid Calibrated Physics + Actual Reading Monotonic Warping
// Combines physical mass flow integration with adaptive calibration and
// monotone matching to prevent temporal inversion (never jumping backwards).
// -------------------------------------------------------------
export function algo4_HybridCalibratedPhysicalWarping(
  logs: LogRecord[],
  combustionModel: SteadyStateCombustionModel
): { shiftedAfr: number[]; offsets: number[]; expectedAfr: number[] } {
  const offsets = new Array(logs.length).fill(0);
  const shiftedAfr = new Array(logs.length).fill(0);
  const expectedAfr = new Array(logs.length).fill(0);

  // 1. Calculate continuous physical delay curve tau(i)
  const rawOffsets: number[] = [];
  for (let i = 0; i < logs.length; i++) {
    const r = logs[i];
    expectedAfr[i] = combustionModel.predict(r);

    const rpm = Math.max(600, r.RPM ?? 1500);
    const map = Math.max(20, r.MAP ?? 50);

    // Dynamic physical exhaust delay in seconds
    // Delay = PipeVolume / (EngineVolumetricFlow)
    // EngineVolumetricFlow ~ (RPM / 120) * 2.0L * (MAP / 100)
    // Delay (sec) ~ 0.08 + 0.45 / ( (RPM/1000) * (MAP/50) )
    const normalizedFlow = (rpm / 1500) * (map / 50);
    const delaySeconds = 0.06 + 0.38 / Math.max(0.3, normalizedFlow);

    // Convert delaySeconds to discrete log records
    const curTime = r.LogEntrySeconds ?? (i * 0.05);
    const targetTime = curTime + delaySeconds;

    let targetIdx = i;
    while (targetIdx < logs.length - 1 && (logs[targetIdx].LogEntrySeconds ?? (targetIdx * 0.05)) < targetTime) {
      targetIdx++;
    }
    rawOffsets.push(Math.max(1, Math.min(30, targetIdx - i)));
  }

  // 2. Smooth the offset curve with a Gaussian / moving average window to prevent jitter
  const smoothOffsets = new Array(logs.length).fill(0);
  const SMOOTH_RADIUS = 5;
  for (let i = 0; i < logs.length; i++) {
    let sum = 0, count = 0;
    for (let k = Math.max(0, i - SMOOTH_RADIUS); k <= Math.min(logs.length - 1, i + SMOOTH_RADIUS); k++) {
      sum += rawOffsets[k];
      count++;
    }
    smoothOffsets[i] = Math.round(sum / count);
  }

  // 3. Monotonic mapping & local fine-tuning to find the true local peak/valley
  for (let i = 0; i < logs.length; i++) {
    const baseOffset = smoothOffsets[i];
    const exp = expectedAfr[i];

    // Search small local window +/- 3 records around base physical offset
    let bestIdx = i + baseOffset;
    let minErr = Infinity;

    const winStart = Math.max(i + 1, i + baseOffset - 3);
    const winEnd = Math.min(logs.length - 1, i + baseOffset + 3);

    for (let k = winStart; k <= winEnd; k++) {
      const afr = logs[k].AFR ?? 14.7;
      const err = Math.abs(afr - exp) + 0.05 * Math.abs(k - (i + baseOffset));
      if (err < minErr) {
        minErr = err;
        bestIdx = k;
      }
    }

    const chosenOffset = Math.max(0, bestIdx - i);
    offsets[i] = chosenOffset;
    shiftedAfr[i] = logs[bestIdx]?.AFR ?? logs[i].AFR ?? 14.7;
  }

  return { shiftedAfr, offsets, expectedAfr };
}
