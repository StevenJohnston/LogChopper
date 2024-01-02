import { Scaling } from "./rom-metadata"

export const scalingAliases = {
  'StockXMAP in kPa': {
    // insteadUse: 'PSIG', // tephra logger
    insteadUse: 'MAP', // raxx patch evoscan
    expr: 'MAP'
  },
  'Omni4barMAP in kPa': {
    // insteadUse: 'PSIG', // tephra logger
    insteadUse: 'MAP', // raxx patch evoscan
    expr: 'MAP'
  },
  'StockXMAP in psig': {
    insteadUse: 'PSIG',
    expr: 'PSIG'
  },
  'Loadify': {
    'MAPCalcs': {
      insteadUse: 'MAPCalcs',
      expr: 'MAPCalcs'
    },
    'MAFCalcs': {
      insteadUse: 'MAFCalcs',
      expr: 'MAFCalcs'
    },
    'AFROffsetSeconds': {
      insteadUse: 'AFROffsetSeconds',
      expr: 'AFROffsetSeconds'
    },
    insteadUse: 'Load',
    expr: 'Load'
  },
  'Throttle_Main - Stored Minimum Throttle %': {
    insteadUse: 'TPS',
    expr: 'TPS/(84/100)'
  },
  'psia8': {
    insteadUse: 'PSIG',
    expr: 'PSIG - 1.6'
  },
  'AFR': {
    insteadUse: 'AFR',
    expr: 'AFR'
  },
  'RPMGain': {
    insteadUse: 'RPMGain',
    expr: 'RPMGain'
  },
  'CurrentLTFT': {
    insteadUse: 'CurrentLTFT',
    expr: 'CurrentLTFT'
  },
  'CruiseLTFT': {
    insteadUse: 'CruiseLTFT',
    expr: 'CruiseLTFT'
  },
  'STFT': {
    insteadUse: 'STFT',
    expr: 'STFT'
  },
  'LFSTFTAFR': {
    insteadUse: 'STFT',
    expr: '(1 - (CurrentLTFT + STFT)/100) * AFR'
  },
}

export function getScalingAlias(scaling: Scaling): string {
  return scalingAliases?.[scaling.name]?.['insteadUse'] || scaling?.name || '?'
}

interface reader {
  [key: undefined | string]: {
    reader: string,
    byteCount: number
  }
}
export const typeToReader: reader = {
  undefined: {
    reader: 'getInt16',
    byteCount: 2,
  },
  int8: {
    reader: 'getInt8',
    byteCount: 1,
  },
  uint8: {
    reader: 'getUint8',
    byteCount: 1,
  },
  int16: {
    reader: 'getInt16',
    byteCount: 2,
  },
  uint16: {
    reader: 'getUint16',
    byteCount: 2,
  },
  int32: {
    reader: 'getInt32',
    byteCount: 4,
  },
  uint32: {
    reader: 'getUint32',
    byteCount: 4,
  },
}