import { Table } from "@/app/_lib/rom";
import { TableRemapWorkerInput, TableRemapWorkerOutput } from "./TableRemapWorkerTypes";

function interp(x: number, x0: number, x1: number, y0: number, y1: number): number {
  if (x0 === x1) return y0;
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
}

function interp1d(lookupValue: number, searchAxis: number[], outputAxis: number[]): number {
  if (lookupValue <= searchAxis[0]) {
    return outputAxis[0];
  }
  for (let i = 0; i < searchAxis.length - 1; i++) {
    if (lookupValue > searchAxis[i] && lookupValue <= searchAxis[i + 1]) {
      return interp(lookupValue, searchAxis[i], searchAxis[i+1], outputAxis[i], outputAxis[i+1]);
    }
  }
  return outputAxis[searchAxis.length - 1];
}

const getAxis = (table: Table, axis: "x" | "y"): number[] => {
  if (axis === "x") {
    return table.xAxis.values || [];
  }
  return table.yAxis.values || [];
}

const getValue = (table: Table, commonAxis: "x" | "y", commonAxisValue: number, lookupValue: number, searchTarget: "x" | "y" | "v", outputSource: "x" | "y" | "v"): number => {
  let searchAxis: number[] = [];
  let outputAxis: number[] = [];

  if (commonAxis === 'y') { // common is RPM
    const yIndex = findClosestIndex(commonAxisValue, table.yAxis.values);
    if (searchTarget === 'x') searchAxis = table.xAxis.values;
    if (searchTarget === 'v') searchAxis = table.values[yIndex];
    if (outputSource === 'x') outputAxis = table.xAxis.values;
    if (outputSource === 'v') outputAxis = table.values[yIndex];
  } else { // common is something else
    const xIndex = findClosestIndex(commonAxisValue, table.xAxis.values);
    if (searchTarget === 'y') searchAxis = table.yAxis.values;
    if (searchTarget === 'v') searchAxis = table.values.map(row => row[xIndex]);
    if (outputSource === 'y') outputAxis = table.yAxis.values;
    if (outputSource === 'v') outputAxis = table.values.map(row => row[xIndex]);
  }

  return interp1d(lookupValue, searchAxis, outputAxis);
}

const findClosestIndex = (value: number, arr: number[]): number => {
  return arr.reduce((prev, curr, i) => (Math.abs(curr - value) < Math.abs(arr[prev] - value) ? i : prev), 0);
}

onmessage = (e: MessageEvent<{type: 'run', data: TableRemapWorkerInput} | {type: 'kill'}>) => {
  if (e.data.type === 'kill') {
    return;
  }
  const { tableA, tableB, config } = e.data.data;
  const { commonAxis, lookupValueSource, searchTarget, outputSource } = config;

  const outputTable: Table = {
    ...tableA,
    name: `Remapped ${tableA.name}`,
    values: [],
  };

  const structureXAxis = getAxis(tableA, 'x');
  const structureYAxis = getAxis(tableA, 'y');

  for (let i = 0; i < structureYAxis.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < structureXAxis.length; j++) {
      const commonAxisValue = commonAxis === 'y' ? structureYAxis[i] : structureXAxis[j];
      const lookupValue = lookupValueSource === 'y' ? structureYAxis[i] : structureXAxis[j];
      
      const newValue = getValue(tableB, commonAxis, commonAxisValue, lookupValue, searchTarget, outputSource);
      row.push(newValue);
    }
    outputTable.values.push(row);
  }

  const result: TableRemapWorkerOutput = { type: 'data', outputTable };
  postMessage(result);
};
