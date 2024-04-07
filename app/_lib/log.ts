"use client";
import csv from "csvtojson";

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
  // [key: string]: any;
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
