"use client";
import csv from "csvtojson";
import { Parser as exprParser } from "expr-eval";

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
    return logRecords.map((logRecord) => {
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
