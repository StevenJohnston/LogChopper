"use client";
import { Scaling } from "./rom-metadata";

export const scalingAliases = {
  "StockXMAP in kPa": {
    // insteadUse: 'PSIG', // tephra logger
    insteadUse: "MAP", // raxx patch evoscan
    expr: "MAP",
  },
  "Omni4barMAP in kPa": {
    // insteadUse: 'PSIG', // tephra logger
    insteadUse: "MAP", // raxx patch evoscan
    expr: "MAP",
  },
  "StockXMAP in psig": {
    insteadUse: "PSIG",
    expr: "PSIG",
  },
  Loadify: {
    MAPCalcs: {
      insteadUse: "MAPCalcs",
      expr: "MAPCalcs",
    },
    MAFCalcs: {
      insteadUse: "MAFCalcs",
      expr: "MAFCalcs",
    },
    AFROffsetSeconds: {
      insteadUse: "AFROffsetSeconds",
      expr: "AFROffsetSeconds",
    },
    insteadUse: "Load",
    expr: "Load",
  },
  "Throttle_Main - Stored Minimum Throttle %": {
    insteadUse: "TPS",
    expr: "TPS/(84/100)",
  },
  psia8: {
    insteadUse: "PSIG",
    expr: "PSIG - 1.6",
  },
  AFR: {
    insteadUse: "AFR",
    expr: "AFR",
  },
  RPMGain: {
    insteadUse: "RPMGain",
    expr: "RPMGain",
  },
  CurrentLTFT: {
    insteadUse: "CurrentLTFT",
    expr: "CurrentLTFT",
  },
  CruiseLTFT: {
    insteadUse: "CruiseLTFT",
    expr: "CruiseLTFT",
  },
  STFT: {
    insteadUse: "STFT",
    expr: "STFT",
  },
  LFSTFTAFR: {
    insteadUse: "STFT",
    expr: "(1 - (CurrentLTFT + STFT)/100) * AFR",
  },
} as const;

export function getScalingAlias(scaling: Scaling | undefined): string {
  if (!scaling?.name) return "?";
  return scalingAliases[scaling.name]?.["insteadUse"] || scaling?.name || "?";
}

// interface reader {
//   [key: string]: {
//     reader: keyof DataView;
//     byteCount: number;
//   };
// }
export const typeToReader = {
  undefined: {
    reader: "getInt16",
    byteCount: 2,
  },
  int8: {
    reader: "getInt8",
    byteCount: 1,
  },
  uint8: {
    reader: "getUint8",
    byteCount: 1,
  },
  int16: {
    reader: "getInt16",
    byteCount: 2,
  },
  uint16: {
    reader: "getUint16",
    byteCount: 2,
  },
  int32: {
    reader: "getInt32",
    byteCount: 4,
  },
  uint32: {
    reader: "getUint32",
    byteCount: 4,
  },
  bloblist: {},
} as const;

export enum Aggregator {
  COUNT = "COUNT",
  AVG = "AVG",
  MIN = "MIN",
  MAX = "MAX",
  SUM = "SUM",
}
