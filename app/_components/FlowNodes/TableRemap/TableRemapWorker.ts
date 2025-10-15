import {
  TableRemapWorkerMessage,
  TableRemapWorkerResult,
} from "@/app/_components/FlowNodes/TableRemap/TableRemapWorkerTypes";
import { BasicTable, Table3D } from "@/app/_lib/rom-metadata";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<TableRemapWorkerMessage, TableRemapWorkerResult> {}

function isTable3D(table: BasicTable): table is Table3D<string | number> {
  return table.type === "3D";
}

function interp(
  x: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number
): number {
  if (x0 === x1) return y0;
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

function interp1d(
  lookupValue: number,
  searchAxis: number[],
  outputAxis: number[]
): number {
  if (lookupValue <= searchAxis[0]) {
    return outputAxis[0];
  }
  for (let i = 0; i < searchAxis.length - 1; i++) {
    if (lookupValue > searchAxis[i] && lookupValue <= searchAxis[i + 1]) {
      return interp(
        lookupValue,
        searchAxis[i],
        searchAxis[i + 1],
        outputAxis[i],
        outputAxis[i + 1]
      );
    }
  }
  return outputAxis[searchAxis.length - 1];
}

const getAxis = (table: Table3D<string | number>, axis: "x" | "y"): number[] => {
  if (axis === "x") {
    return (table.xAxis.values || []).map(Number);
  }
  return (table.yAxis.values || []).map(Number);
};

const getValue = (
  table: Table3D<string | number>,
  commonAxis: "x" | "y",
  commonAxisValue: number,
  lookupValue: number,
  searchTarget: "x" | "y" | "v",
  outputSource: "x" | "y" | "v"
): number => {
  let searchAxis: number[] = [];
  let outputAxis: number[] = [];

  const yAxisValues = (table.yAxis.values || []).map(Number);
  const xAxisValues = (table.xAxis.values || []).map(Number);

  if (commonAxis === "y") {
    // common is RPM
    const yIndex = findClosestIndex(commonAxisValue, yAxisValues);
    if (searchTarget === "x") searchAxis = xAxisValues;
    if (searchTarget === "v") searchAxis = table.values[yIndex].map(Number);
    if (outputSource === "x") outputAxis = xAxisValues;
    if (outputSource === "v") outputAxis = table.values[yIndex].map(Number);
  } else {
    // common is something else
    const xIndex = findClosestIndex(commonAxisValue, xAxisValues);
    if (searchTarget === "y") searchAxis = yAxisValues;
    if (searchTarget === "v")
      searchAxis = table.values.map((row) => Number(row[xIndex]));
    if (outputSource === "y") outputAxis = yAxisValues;
    if (outputSource === "v")
      outputAxis = table.values.map((row) => Number(row[xIndex]));
  }

  return interp1d(lookupValue, searchAxis, outputAxis);
};

const findClosestIndex = (value: number, arr: number[]): number => {
  return arr.reduce(
    (prev, curr, i) =>
      Math.abs(curr - value) < Math.abs(arr[prev] - value) ? i : prev,
    0
  );
};

ctx.onmessage = async (
  event: MessageEvent<TableRemapWorkerMessage>
): Promise<void> => {
  if (event.data.type === "run") {
    try {
      const { tableA, tableB, config } = event.data.data;

      if (!isTable3D(tableA)) {
        throw new Error("Table A must be a 3D table for remapping.");
      }
      if (!isTable3D(tableB)) {
        throw new Error("Table B must be a 3D table for remapping.");
      }

      const { commonAxis, lookupValueSource, searchTarget, outputSource } =
        config;

      const outputTable: BasicTable = {
        ...tableA,
        name: `Remapped ${tableA.name}`,
        values: [],
      };

      const structureXAxis = getAxis(tableA, "x");
      const structureYAxis = getAxis(tableA, "y");

      for (let i = 0; i < structureYAxis.length; i++) {
        const row: number[] = [];
        for (let j = 0; j < structureXAxis.length; j++) {
          const commonAxisValue =
            commonAxis === "y" ? structureYAxis[i] : structureXAxis[j];
          const lookupValue =
            lookupValueSource === "y" ? structureYAxis[i] : structureXAxis[j];

          const newValue = getValue(
            tableB,
            commonAxis,
            commonAxisValue,
            lookupValue,
            searchTarget,
            outputSource
          );
          row.push(newValue);
        }
        outputTable.values.push(row);
      }

      ctx.postMessage({ type: "data", data: { outputTable } });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type === "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError("TableRemapWorker received kill message"),
    });
    ctx.close();
  }
};
