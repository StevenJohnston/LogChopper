"use client";
import { Killable } from "@/app/_lib/worker-utilts";
import csv from "csvtojson";
import { Value, Parser as exprParser } from "expr-eval";

export const LogFields = [
  "LogID",
  "LogEntrySeconds",
  "AFR",
  "STFT",
  "CurrentLTFT",
  "Load",
  "IPW",
  "LoadTiming",
  "TimingAdv",
  "KnockSum",
  "RPM",
  "MAP",
  "Boost",
  "WGDC_Active",
  "InVVTactual",
  "ExVVTactual",
  "TPS",
  "APP",
  "WGDCCorr",
  "Speed",
  "MAPCalcs",
  "IMAPCalcs",
  "MAFCalcs",
  "RPMGain",
  "delete",
  "deleteReason",
];

export interface LogRecord {
  LogID?: number;
  // LogEntryDate?: string;
  // LogEntryTime?: string;
  LogEntrySeconds?: number;
  AFR?: number;
  STFT?: number;
  CurrentLTFT?: number;
  // IdleLTFT?: string;
  // CruiseLTFT?: string;
  Load?: number;
  // O2Sensor2?: string;
  IPW?: number;
  // AFRMAP?: string;
  LoadTiming?: number;
  TimingAdv?: number;
  KnockSum?: number;
  RPM?: number;
  // Baro?: string;
  MAP?: number;
  Boost?: number;
  WGDC_Active?: number;
  // MAF?: string;
  // IDC?: string;
  // ExVVTtarget?: string;
  // InVVTtarget?: string;
  InVVTactual?: number;
  ExVVTactual?: number;
  TPS?: number;
  APP?: number;
  // IAT?: string;
  WGDCCorr?: number;
  Speed?: number;
  // Battery?: string;
  // ECT?: string;
  // MAT?: string;
  MAPCalcs?: number;
  IMAPCalcs?: number;
  MAFCalcs?: number;
  // ChosenCalc?: string;
  // AFROffsetSeconds?: string;

  RPMGain?: number;
  delete?: boolean;
  deleteReason?: string;

  weight?: number;
  [key: string]: any;
}

// export type scalings = Exclude<LogRecord, "LogID">;

export async function loadLogs(
  selectedLogs: FileSystemFileHandle[]
): Promise<LogRecord[]> {
  const logPromises = selectedLogs.map(
    async (f: FileSystemFileHandle): Promise<LogRecord[]> => {
      const file = await f.getFile();
      const text = await file.text();
      return csv({ checkType: true }).fromString(text);
    }
  );
  const logsArray = (await Promise.allSettled(logPromises)).filter(
    (result) => result.status == "fulfilled" && result.value
  ) as unknown as PromiseFulfilledResult<LogRecord[]>[];
  return logsArray.reduce((acc: LogRecord[], cur) => {
    // if (cur.)
    return [...acc, ...cur.value];
  }, []); //as unknown as LogRecord[];
}

export function filterLogs(logRecords: LogRecord[], func: string): LogRecord[] {
  if (func == "") return logRecords;
  const parser = new exprParser();
  try {
    return logRecords?.map((logRecord) => {
      // TODO I dont think this returning a true or false
      return {
        ...logRecord,
        delete: logRecord.delete || !parser.evaluate(func, logRecord),
      };
    });
  } catch (e) {
    console.log("Error filterLogs", e);
    return [];
  }
}

export function alterLogs(
  logRecords: LogRecord[],
  func: string,
  newLogField: string
): LogRecord[] {
  if (func == "" || newLogField == "") return logRecords;
  const parser = new exprParser();
  try {
    return logRecords.map((logRecord) => {
      // TODO I dont think this returning a true or false
      return {
        ...logRecord,
        [newLogField]: parser.evaluate(func, logRecord),
      };
    });
  } catch (e) {
    console.log("Error filterLogs", e);
    return [];
  }
}

export async function runningAlter(
  logRecords: LogRecord[],
  newFieldName: string,
  untilFunc: string,
  alterFunc: string,
  killable: Killable
): Promise<LogRecord[]> {
  const parser = new exprParser();

  const alteredLogRecords: LogRecord[] = [];

  for (let li = 0; li < logRecords.length; li++) {
    if (await killable.allowAndCheckKilled()) {
      return [];
    }
    const logRecord = logRecords[li];
    const untilRet = findNextIndex(logRecords, logRecord, li, untilFunc);

    if (untilRet == null) {
      alteredLogRecords.push({
        ...logRecord,
        [newFieldName]: null,
        delete: true,
      });
      continue;
    }

    const [newLogIndex, accumulator] = untilRet;
    const currentLogRecord = logRecords[newLogIndex];
    try {
      alteredLogRecords.push({
        ...logRecord,
        [newFieldName]: parser.evaluate(alterFunc, {
          logRecord,
          currentLogRecord: currentLogRecord,
          accumulator,
        }),
      });
    } catch (e) {
      alteredLogRecords.push({
        ...logRecord,
        [newFieldName]: null,
        delete: true,
      });
    }
  }

  return alteredLogRecords;
}

type ReduceIndex = [index: number, value: Value];
type UntilRet = [stop: boolean, nextIndex: number, value: number];
const MAX_LOOP = 50;

function findNextIndex(
  logRecords: LogRecord[],
  logRecord: LogRecord,
  startIndex: number,
  untilFunc: string
): ReduceIndex | null {
  // TODO test how slow this is, and move it out if significant
  const parser = new exprParser();
  let accumulator: Value = 0;
  let stop: Value = false;
  let li = startIndex;
  let loopCount = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    loopCount++;
    if (loopCount > MAX_LOOP) return null;
    const currentLogRecord = logRecords[li];
    if (currentLogRecord?.LogID == undefined) {
      return null;
    }
    if (
      Math.abs(Number(currentLogRecord.LogID) - Number(logRecord.LogID)) >=
      loopCount
    ) {
      return null;
    }
    try {
      [stop, li, accumulator] = parser.evaluate(untilFunc, {
        logRecord,
        currentLogRecord,
        accumulator,
        currentIndex: li,
      }) as UntilRet;
      if (stop === true) {
        return [li, accumulator];
      }
    } catch (e) {
      return null;
    }
  }
  return null;
}

const FullLeanIPW: number = 0;
const FullLeanAfr: number = 18.5;
interface AfrShiftOptions {
  maxDelaySeconds?: number;
  minAfrDurationSeconds?: number;
}

// AFR values are inherently delayed in the log. This shifts the AFR values forward to match the IPW curve.
export function fixAfrLag(
  logRecords: Partial<LogRecord>[],
  { maxDelaySeconds = 2, minAfrDurationSeconds = 5 }: AfrShiftOptions
): void {
  for (
    let startIpwIndex = 0;
    startIpwIndex < logRecords.length;
    startIpwIndex++
  ) {
    const startIpwLogRecord = logRecords[startIpwIndex];
    if (startIpwLogRecord.LogEntrySeconds == undefined) {
      console.log("AfrShift - startIpwLogRecord.LogEntrySeconds is missing");
      continue;
    }
    //Find first log that is not full-lean, set AFR full-lean if 0 IPW
    if (startIpwLogRecord.IPW == FullLeanIPW) {
      startIpwLogRecord.AFR = FullLeanAfr;
      continue;
    }

    let endIpwIndex = startIpwIndex;
    for (; endIpwIndex < logRecords.length - 1; endIpwIndex++) {
      if (logRecords[endIpwIndex + 1].IPW == FullLeanIPW) {
        break;
      }
    }

    // Since AFR Follows IPW we can start from the IPW start index
    let startAfrIndex = startIpwIndex;

    let afrTooLaggy = false;
    for (; startAfrIndex < logRecords.length; startAfrIndex++) {
      const startAfrLogRecord = logRecords[startAfrIndex];
      if (startAfrLogRecord.LogEntrySeconds == undefined) {
        continue;
      }
      const afrLagSeconds =
        startAfrLogRecord.LogEntrySeconds - startIpwLogRecord.LogEntrySeconds;
      if (afrLagSeconds > maxDelaySeconds) {
        console.warn(
          `AfrShift AFR Lagging to far behind IPW lagSeconds: ${afrLagSeconds}`
        );
        afrTooLaggy = true;
      }
      if (startAfrLogRecord.AFR != FullLeanAfr) {
        break;
      }
    }
    if (afrTooLaggy) {
      logRecords[startIpwIndex].AFR = 18.5;
      logRecords[startIpwIndex].IPW = 0;
      continue;
    }
    if (startAfrIndex == logRecords.length) {
      // All end Logs are lean. No addition edits required
      break;
    }
    const lastIpwRecord = logRecords[endIpwIndex];
    let endAfrIndex = startAfrIndex;
    for (; endAfrIndex < logRecords.length - 1; endAfrIndex++) {
      if (
        (logRecords[endAfrIndex].LogEntrySeconds || 0) - maxDelaySeconds >
        (lastIpwRecord.LogEntrySeconds || 0)
      ) {
        console.log("AfrShift AFR rich reading too long");
        break;
      }
      if (logRecords[endAfrIndex + 1].AFR == FullLeanAfr) {
        break;
      }
    }
    const endAfrSeconds = logRecords[endAfrIndex].LogEntrySeconds || 0;
    const startAfrSeconds = logRecords[startAfrIndex].LogEntrySeconds || 0;
    if (endAfrSeconds - startAfrSeconds < minAfrDurationSeconds) {
      console.log("AfrShift AFR reading rich for too short");
      // Simple solution, set current record to full rich
      // and go to next record.
      logRecords[startIpwIndex].AFR = 18.5;
      logRecords[startIpwIndex].IPW = 0;
      continue;
    }

    const ipwRecordCount = endIpwIndex - startIpwIndex + 1;
    const afrRecordCount = endAfrIndex - startAfrIndex + 1;
    // Update all records between startIpwIndex and endLeanIpwIndex
    for (
      let updateRecordIndex = startIpwIndex;
      updateRecordIndex <= endIpwIndex;
      updateRecordIndex++
    ) {
      const ipwProgression =
        (updateRecordIndex - startIpwIndex) / (ipwRecordCount - 1) || 0;
      const futureAfrRecord =
        startAfrIndex + (afrRecordCount - 1) * ipwProgression;
      const earilyAfr = logRecords[Math.floor(futureAfrRecord)].AFR || 0;
      const lateAfr = logRecords[Math.ceil(futureAfrRecord)].AFR || 0;
      const newAfr = (lateAfr - earilyAfr) * (ipwProgression % 1) + earilyAfr;
      logRecords[updateRecordIndex].AFR = newAfr;
    }
    startIpwIndex = endIpwIndex;
  }
}

export enum Direction {
  DESC = "DESC",
  ACC = "ACC",
  BOTH = "BOTH",
}

export async function movingAverageFilter(
  logRecords: LogRecord[],
  field: keyof LogRecord,
  durationSeconds: number,
  maxDeviation: number, // 0.995
  direction: Direction,
  killable?: Killable
) {
  let runningSum = 0;
  let endI = 1;
  for (let i = 0; i < logRecords.length; i++) {
    if (await killable?.allowAndCheckKilled()) {
      return;
    }
    const logRecord = logRecords[i];
    runningSum += logRecord[field];
    if (endI === i) {
      runningSum -= logRecord[field];
      endI++;
    }
    for (; endI < logRecords.length; endI++) {
      const endRecord = logRecords[endI];

      if (
        logRecord.LogEntrySeconds == undefined ||
        endRecord.LogEntrySeconds == undefined
      ) {
        logRecord.delete = true;
        endRecord.delete = true;
        continue;
      }

      runningSum += endRecord[field];
      if (
        Math.abs(logRecord.LogEntrySeconds - endRecord.LogEntrySeconds) >=
        durationSeconds
      ) {
        const diff = logRecord[field] / (runningSum / (endI - i + 1)); // 0.995
        if (Math.abs(1 - diff) > maxDeviation) {
          switch (direction) {
            case Direction.DESC:
              logRecord.delete = true;
              break;
            case Direction.ACC:
              endRecord.delete = true;
              break;
            case Direction.BOTH:
              endRecord.delete = true;
              logRecord.delete = true;
              break;
          }
          break;
        }
      }
    }
    runningSum -= logRecord[field];
  }
}
