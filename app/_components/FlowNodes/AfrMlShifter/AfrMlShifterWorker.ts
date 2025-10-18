import { InternalWorker } from "@/app/_lib/worker-utilts";
import {
  AfrMlShifterWorkerMessage,
  AfrMlShifterWorkerResult,
} from "./AfrMlShifterWorkerTypes";
import { LogRecord } from "@/app/_lib/log";
import { AfrShiftMethod } from "./AfrMlShifterTypes";
import * as tf from "@tensorflow/tfjs";

const ctx = self as SelfWorker;

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

    newRow["Corrected AFR"] = logs[effectiveIndex][AFR_KEY];
    newRow["AFR Offset"] = offset;
    return newRow;
  });
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

      if (method === AfrShiftMethod.MachineLearning) {
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
