import {
  TableLookupWorkerInput,
  TableLookupWorkerOutput,
} from "./TableLookupWorkerTypes";
import { LogRecord } from "@/app/_lib/log";
import { Table } from "@/app/_lib/rom-metadata";

// Functions copied from app/_lib/rom.ts

// Returns the index closest to value
function nearestIndex(array: number[], value: number): number {
  return array.indexOf(
    array.reduce((c, n) => {
      if (Math.abs(c - value) >= Math.abs(n - value)) {
        return n;
      }
      return c;
    }, 99999)
  );
}

// Returns the index of value in array as a float. eg, array [0,10,20], value: 3, return: 0.3
function getIndexFloat(array: number[], value: number): number {
  const closestIndex = nearestIndex(array, value);
  if (array[closestIndex] == value) {
    return closestIndex;
  } else if (array[closestIndex] > value) {
    const high = array[closestIndex];
    const low = array[closestIndex - 1];
    if (low == undefined) return closestIndex;
    return closestIndex - 1 + calculateFloatBetween(low, high, value);
  } else {
    const low = array[closestIndex];
    const high = array[closestIndex + 1];
    if (high == undefined) {
      return closestIndex;
    }
    return closestIndex + calculateFloatBetween(low, high, value);
  }
}

function getValueFromIndexFloat(array: number[], index: number): number {
  const lowIndex = Math.floor(index);
  const highIndex = Math.ceil(index);
  if (lowIndex < 0) {
    return array[0];
  }
  if (highIndex >= array.length) {
    return array[array.length - 1];
  }

  if (lowIndex === highIndex) {
    return array[lowIndex];
  }
  const lowValue = array[lowIndex];
  const highValue = array[highIndex];
  const frac = index - lowIndex;
  return (1 - frac) * lowValue + frac * highValue;
}

// Returns float between min and max
function calculateFloatBetween(
  min: number,
  max: number,
  value: number
): number {
  if (min > max) {
    throw new Error("min cannot be greater than max");
  }

  if (value < min) return 0;
  if (value > max) return 0;
  const normalizedValue = value - min;
  const range = max - min;

  return normalizedValue / range;
}

function getInterpolatedValue(
  table: Table,
  y: number,
  x: number
): number | null {
  if (table.type != "3D") {
    postMessage({ error: "getInterpolatedValue only supports 3d tables" });
    return null;
  }
  const lowXIndex = Math.floor(x);
  const highXIndex = Math.ceil(x);
  const lowYIndex = Math.floor(y);
  const highYIndex = Math.ceil(y);

  const q11 = Number(table.values[lowYIndex][lowXIndex]);
  const q12 = Number(table.values[lowYIndex][highXIndex]);
  const q21 = Number(table.values[highYIndex][lowXIndex]);
  const q22 = Number(table.values[highYIndex][highXIndex]);

  const R1 = (1 - (x % 1)) * q11 + (x % 1) * q12;
  const R2 = (1 - (x % 1)) * q21 + (x % 1) * q22;

  return (1 - (y % 1)) * R1 + (y % 1) * R2;
}

function getInterpolatedXAxisValue(
  table: Table,
  yIndex: number,
  targetValue: number
): number | null {
  if (table.type !== "3D") {
    return null;
  }
  if (!table.xAxis?.values || !table.yAxis?.values) {
    return null;
  }

  const lowYIndex = Math.floor(yIndex);
  const highYIndex = Math.ceil(yIndex);
  const yFrac = yIndex - lowYIndex;

  if (lowYIndex < 0 || highYIndex >= table.values.length) {
    return null;
  }

  const row1 = table.values[lowYIndex];
  const row2 = table.values[highYIndex] || row1; // Handle case where yIndex is the last index.

  const interpolatedRow = row1.map((val, i) => {
    const val1 = Number(val);
    const val2 = Number(row2[i]);
    return (1 - yFrac) * val1 + yFrac * val2;
  });

  // Find where targetValue sits in interpolatedRow
  let xIndexFloat = -1;
  for (let i = 0; i < interpolatedRow.length - 1; i++) {
    const val1 = interpolatedRow[i];
    const val2 = interpolatedRow[i + 1];
    if (
      (targetValue >= val1 && targetValue <= val2) ||
      (targetValue <= val1 && targetValue >= val2)
    ) {
      if (val2 - val1 === 0) {
        xIndexFloat = i;
        break;
      }
      const frac = (targetValue - val1) / (val2 - val1);
      xIndexFloat = i + frac;
      break;
    }
  }

  if (xIndexFloat === -1) {
    const firstVal = interpolatedRow[0];
    const lastVal = interpolatedRow[interpolatedRow.length - 1];
    if (
      (targetValue <= firstVal && firstVal <= lastVal) ||
      (targetValue >= firstVal && firstVal >= lastVal)
    ) {
      xIndexFloat = 0;
    } else if (
      (targetValue >= lastVal && lastVal >= firstVal) ||
      (targetValue <= lastVal && lastVal <= firstVal)
    ) {
      xIndexFloat = interpolatedRow.length - 1;
    } else {
      return null; // or some other indicator of failure
    }
  }

  return getValueFromIndexFloat(table.xAxis.values, xIndexFloat);
}

export type TableLookupWorker = Worker;

self.onmessage = (
  event: MessageEvent<{ type: string; data: TableLookupWorkerInput }>
) => {
  if (event.data.type === "kill") {
    self.close();
    return;
  }
  if (event.data.type === "run") {
    const {
      table,
      logs,
      newColumnName,
      lookupMode,
      targetValueColumnName,
    } = event.data.data;
    if (!table.xAxis || !table.yAxis) {
      postMessage({ error: "Table is missing xaxis or yaxis" });
      return;
    }

    if (!table || !logs || !newColumnName) {
      postMessage({ error: "Invalid input" });
      return;
    }

    if (table.type !== "3D") {
      postMessage({ error: "Table must be 3D" });
      return;
    }

    const newLogs: LogRecord[] = logs.map((record) => {
      if (lookupMode === "xAxis") {
        if (!targetValueColumnName) {
          return {
            ...record,
            [newColumnName]: "targetValueColumnName not set",
          };
        }
        const yValue = record[table.yAxis!.name];
        const targetValue = record[targetValueColumnName];

        if (yValue === undefined || targetValue === undefined) {
          return {
            ...record,
            [newColumnName]: undefined,
          };
        }

        const yIndex = getIndexFloat(table.yAxis!.values, yValue as number);
        const interpolatedValue = getInterpolatedXAxisValue(
          table,
          yIndex,
          targetValue as number
        );

        return {
          ...record,
          [newColumnName]: interpolatedValue,
        };
      } else {
        const xValue = record[table.xAxis!.name];
        const yValue = record[table.yAxis!.name];

        if (xValue === undefined || yValue === undefined) {
          return {
            ...record,
            [newColumnName]: undefined,
          };
        }

        const xIndex = getIndexFloat(table.xAxis!.values, xValue as number);
        const yIndex = getIndexFloat(table.yAxis!.values, yValue as number);

        const interpolatedValue = getInterpolatedValue(table, yIndex, xIndex);

        return {
          ...record,
          [newColumnName]: interpolatedValue,
        };
      }
    });

    const output: TableLookupWorkerOutput = { logs: newLogs };
    postMessage(output);
  }
};
