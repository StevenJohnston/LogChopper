"use client";
import { LogFields, LogRecord } from "@/app/_lib/log";
import { Aggregator, scalingAliases, typeToReader } from "./consts";
import {
  Axis,
  BasicTable,
  LogTable,
  Scaling,
  Table,
  isTable2DX,
  isTable2DY,
} from "./rom-metadata";
import { Parser as exprParser } from "expr-eval";
import { sprintf } from "sprintf-js";

// Returns table filled with data from rom, inclues axis
export async function getFilledTable(
  romFileHandle: FileSystemFileHandle,
  scalingMap: Record<string, Scaling>,
  table: BasicTable
): Promise<BasicTable | void> {
  const newTable: BasicTable | void = { ...table };
  const romFile = await romFileHandle.getFile();
  const romBuffer = await romFile.arrayBuffer();
  const romDataArray = new DataView(
    romBuffer,
    romFile.name.endsWith(".srf") ? 328 : 0
  );
  switch (newTable.type) {
    case "3D": {
      const xAxis = fillAxis(romDataArray, scalingMap, newTable.xAxis);
      if (!xAxis) return console.log("Failed to get xAxis when getFilledTable");
      newTable.xAxis = xAxis;
      const yAxis = fillAxis(romDataArray, scalingMap, newTable.yAxis);
      if (!yAxis) return console.log("Failed to get yAxis when getFilledTable");
      newTable.yAxis = yAxis;
      break;
    }
    //TODO handle 2DX 2DY probably going to need some type guard functions
    default:
      return console.log(
        `Failed to getFilledTable due unhandled type ${newTable.type}`
      );
  }
  // Fill table
  return fillTable(romDataArray, scalingMap, newTable);
}

function fillAxis(
  romBuffer: DataView,
  scalingMap: Record<string, Scaling>,
  axis: Axis
): Axis | void {
  // get scaling
  const newAxis = { ...axis };
  const { address, elements, scaling } = axis;
  if (!scaling || !elements || !address) {
    return console.log(
      "Error fillAxis scaling, elements, or address is missing"
    );
  }
  newAxis.scalingValue = scalingMap[scaling];
  const { storageType, endian, toExpr, format } = scalingMap[scaling];
  if (!storageType || !endian || !toExpr || !format) {
    return console.log(
      "Error fillAxis storageType, endian, toExpr, or format is missing"
    );
  }
  if (storageType == "bloblist") {
    return console.log(
      "We don't do bloblist for some reason, my guess is it just hardcoded values fillAxis"
    );
  }
  const { reader, byteCount } = typeToReader[storageType];
  if (!reader || !byteCount) {
    console.log(
      `missing storagetype for axis scaling: ${scaling} storageType: ${storageType} endian: ${endian}`
    );
  }
  const values = [];
  for (let i = 0; i < elements; i++) {
    const parser = new exprParser();
    const offset = parseInt(address, 16) + i * byteCount;
    const value = romBuffer[reader](offset);
    let displayValue = value;
    if (toExpr) {
      displayValue = parser.evaluate(toExpr, { x: value });
      if (format) {
        displayValue = Number(sprintf(format, displayValue));
      }
    }
    values.push(displayValue);
  }
  newAxis.values = values;
  return newAxis;
}

function fillTable(
  romBuffer: DataView,
  scalingMap: Record<string, Scaling>,
  table: Table<string | number>
): Table<string | number> | void {
  const newTable: BasicTable | void = { ...table };
  const { address, scaling, swapxy } = table;
  if (!address || !scaling || !swapxy) {
    return console.log(
      "error fillTable missing one of address, scaling, swapxy"
    );
  }
  newTable.scalingValue = scalingMap[scaling];
  const { storageType, endian, toExpr, format } = scalingMap[scaling];

  if (!storageType || !endian || !toExpr || !format) {
    return console.log(
      "error fillTable missing one of  storageType, endian, toExpr, format"
    );
  }
  if (storageType == "bloblist") {
    return console.log(
      "We don't do bloblist for some reason, my guess is it just hardcoded values fillTable"
    );
  }
  const { reader, byteCount } = typeToReader[storageType];

  if (!reader || !byteCount) {
    console.log(
      `missing storagetype for table scaling: ${scaling} storageType: ${storageType} endian: ${endian}`,
      "Way am i continuing after that"
    );
  }

  let elements = 1;
  let xAxis: Axis | null = null;
  let yAxis: Axis | null = null;

  switch (newTable.type) {
    case "3D":
      xAxis = newTable.xAxis;
      yAxis = newTable.yAxis;
      break;
    case "2D":
      if (isTable2DX(newTable)) {
        xAxis = newTable.xAxis;
      } else if (isTable2DY(newTable)) {
        yAxis = newTable.yAxis;
      }
      break;
    case "1D":
      break;
    case "Other":
      return console.log(`fillTable unhandled table type ${newTable.type}`);
  }

  if (xAxis && xAxis.elements) elements *= xAxis.elements;
  if (yAxis && yAxis.elements) elements *= yAxis.elements;

  for (let i = 0; i < elements; i++) {
    const parser = new exprParser();
    const offset = parseInt(address, 16) + i * byteCount;
    let value;
    try {
      if (typeof romBuffer[reader] === "function") {
        value = romBuffer[reader](offset, endian == "little");
        romBuffer.getBigInt64(offset, true);
      }
    } catch (e) {
      console.log("What this error fillTable", e);
    }
    let displayValue = value;
    if (toExpr && value !== undefined) {
      displayValue = parser.evaluate(toExpr, { x: value });
      if (format) {
        console.log("Why am in not using format");
        // displayValue = sprintf(format, displayValue)
      }
    }
    if (displayValue === undefined) {
      return console.log("Display value is undefined");
    }
    // let x, y = 0
    switch (newTable.type) {
      case "3D": {
        if (!yAxis || !xAxis) {
          return console.log("3D table missing xAxis or yAxis", xAxis, yAxis);
        }
        let x: number, y: number;
        if (swapxy) {
          x = Math.floor(i / yAxis.elements);
          y = i - x * yAxis.elements;
        } else {
          y = Math.floor(i / xAxis.elements);
          x = i - y * xAxis.elements;
        }

        if (!newTable.values) newTable.values = [];
        if (!newTable.values[y]) newTable.values[y] = [];
        newTable.values[y][x] = displayValue;
        break;
      }
      case "2D":
        if (isTable2DX(newTable)) {
          if (!newTable.values) newTable.values = [[]];
          newTable.values[i] = [displayValue];
        } else if (isTable2DY(newTable)) {
          if (!newTable.values) newTable.values = [];
          newTable.values[i] = displayValue;
        }
        break;
      case "1D":
        newTable.values = displayValue;
        break;
    }
  }
  return newTable;
}

// Fill each cell with an array of LogRecords
export function FillTableFromLog(
  table: BasicTable,
  logs: LogRecord[],
  weighted: boolean = true
): Table<LogRecord[]> | void {
  const newTable = duplicateTable<LogRecord[], string | number>(
    table,
    () => []
  );
  if (newTable == null) {
    return console.log("Failed to duplicate table while FillTableFromLog");
  }

  logs.forEach((l) => {
    if (l.delete) return;
    switch (table.type) {
      case "3D": {
        if (newTable.type != "3D") {
          return console.log("Error: duplicatated table has different type");
        }
        const { xAxis, yAxis } = table;
        // Y axis
        const yScaling = yAxis.scaling;
        const yAxisLogValue = l[yScaling];
        if (typeof yAxisLogValue !== "number") {
          console.log(
            "Wanted log value to be of type number",
            "log",
            l,
            "yScaling",
            yScaling
          );
          return;
        }
        let y = 0;
        if (weighted) {
          y = getIndexFloat(yAxis.values, yAxisLogValue);
        } else {
          y = nearestIndex(yAxis.values, yAxisLogValue);
        }

        const xScaling = xAxis.scaling;
        let xAxisLogValue = l[xScaling];
        if (!xAxisLogValue) {
          // TODO hit this if somehow
          const parser = new exprParser();
          const { insteadUse, expr } = scalingAliases[xScaling];
          if (!l[insteadUse]) return;

          xAxisLogValue = parser.evaluate(expr, l as Record<string, any>);
        }

        let x = 0;
        if (weighted) {
          x = getIndexFloat(xAxis.values, xAxisLogValue);
        } else {
          x = nearestIndex(xAxis.values, xAxisLogValue);
        }

        if (weighted) {
          // TODO get up, down, left, right. And weight it
          const floorX = Math.floor(x);
          const ceilX = Math.ceil(x);
          const floorY = Math.floor(y);
          const ceilY = Math.ceil(y);

          newTable.values[floorY][floorX].push({
            ...l,
            weight: (1 - (y % 1)) * (1 - (x % 1)),
          });

          if (floorX != ceilX) {
            newTable.values[floorY][ceilX].push({
              ...l,
              weight: (1 - (y % 1)) * (x % 1),
            });
          }
          if (floorY != ceilY) {
            newTable.values[ceilY][floorX].push({
              ...l,
              weight: (y % 1) * (1 - (x % 1)),
            });
          }

          if (floorX != ceilX && floorY != ceilY) {
            newTable.values[ceilY][ceilX].push({
              ...l,
              weight: (y % 1) * (x % 1),
            });
          }
        } else {
          newTable.values[y][x].push(l);
        }
        break;
      }
      case "2D":
        break;
      case "1D":
        break;
      default:
        console.log(
          `unknown table type ${table.type} on tableName: ${table.name}`
        );
    }
  });
  return newTable;
}

export function duplicateTable<T, U>(
  table: Table<U>,
  defaultValue: (c: U) => T = <T>(c: U) => c as unknown as T
): Table<T> | null {
  if (table.type == "3D") {
    return {
      ...table,
      type: "3D",
      values: table.values.map((row) => {
        if (Array.isArray(row)) {
          return row.map(defaultValue);
        } else {
          return defaultValue(row);
        }
      }) as T[][], // thanks typescript
    };
  } else if (table.type == "2D") {
    if (isTable2DX(table)) {
      return {
        ...table,
        type: "2D",
        values: [table.values[0].map(defaultValue)],
      };
    } else if (isTable2DY(table)) {
      return {
        ...table,
        type: "2D",
        values: table.values.map(defaultValue),
      };
    }
  } else if (table.type == "1D") {
    return {
      ...table,
      type: "1D",
      values: defaultValue(table.values),
    };
  }
  return null;
}

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
export function getIndexFloat(array: number[], value: number): number {
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

// Returns float between min and max
function calculateFloatBetween(
  min: number,
  max: number,
  value: number
): number {
  if (min > max) {
    throw new Error("min cannot be lower than max");
  }

  if (value < min) return 0;
  if (value > max) return 0;
  const normalizedValue = value - min;
  const range = max - min;

  return normalizedValue / range;
}

export function FillLogTable(
  table: LogTable,
  field: keyof LogRecord,
  aggregator: Aggregator
): BasicTable | void {
  let newTable: BasicTable | null = null;
  if (!table.scalingValue?.name) {
    return console.log("FillLogTable scalingValue.name missing on table");
  }

  switch (aggregator) {
    case Aggregator.AVG:
      // newTable.values[y][x] = 0;
      newTable = duplicateTable<string | number, LogRecord[]>(
        table,
        (logRecords) => {
          // return (
          const [mSum, wSum] = logRecords.reduce(
            ([mSum, wSum], logRecord) => {
              //TODO better number
              const n = Number(logRecord[field]);
              if (isNaN(n)) {
                return [mSum, wSum];
              }
              let weight = logRecord.weight || 1;
              if (field == "weight") {
                weight = 1;
              }
              return [mSum + n * weight, wSum + weight];
            },
            [0, 0]
          );
          if (wSum == 0) return 0;
          return mSum / wSum;
        }
      );
      break;
    case Aggregator.COUNT:
      newTable = duplicateTable<string | number, LogRecord[]>(
        table,
        (logRecords) => {
          return logRecords.length;
        }
      );
      break;
    case Aggregator.MIN:
      newTable = duplicateTable<string | number, LogRecord[]>(
        table,
        (logRecords) => {
          return logRecords.reduce((min, logRecord) => {
            const fieldValue = Number(logRecord[field]);
            return min < fieldValue ? min : fieldValue;
          }, 0);
        }
      );
      break;
    case Aggregator.MAX:
      newTable = duplicateTable<string | number, LogRecord[]>(
        table,
        (logRecords) => {
          return logRecords.reduce((max, logRecord) => {
            const fieldValue = Number(logRecord[field]);
            return max > fieldValue ? max : fieldValue;
          }, 0);
        }
      );
      break;
    case Aggregator.SUM:
      newTable = duplicateTable<string | number, LogRecord[]>(
        table,
        (logRecords) => {
          return logRecords.reduce((sum, logRecord) => {
            const fieldValue = Number(logRecord[field]);
            return sum + fieldValue;
          }, 0);
        }
      );
      break;
    default:
      console.log("FillLogTable missing Aggregator", aggregator);
  }
  if (newTable == null) {
    return console.log("Failed to duplicate table while FillLogTable");
  }
  return newTable;
}

// Takes 2 maps and aggregates them together
export function MapCombine(
  sourceTable: BasicTable,
  joinTable: BasicTable,
  func: string
): BasicTable | void {
  const newTable = duplicateTable(sourceTable, () => 0);
  if (newTable == null)
    return console.log("MapCombine failed to duplicate sourceTable");
  if (
    newTable.type == "3D" &&
    sourceTable.type == "3D" &&
    joinTable.type == "3D"
  ) {
    const parser = new exprParser();

    newTable?.values.forEach((row, y) => {
      row.forEach((cell, x) => {
        try {
          const newValue = parser.evaluate(func, {
            sourceTable: sourceTable.values,
            joinTable: joinTable.values,
            y,
            x,
          });
          newTable.values[y][x] = newValue;
        } catch (error) {
          return console.log("MapCombine func failed to evaluate");
        }
      });
    });
  } else {
    console.log("TODO MapCombine only works on 3D tables");
  }
  return newTable;
}

export type SourceField = "XAxis" | "YAxis" | "Value";
export interface MatchCriteria {
  sourceSourceField: SourceField;
  destSourceField: SourceField;
}
// dest table will be dupicalted
export function MapCombineAdv(
  sourceTable: BasicTable,
  destTable: BasicTable,
  // axisMap: (x: number, y: number, cell: number | string) => [number, number] // (toTable x, y, value): {xValue: , yValue: }
  // matchCriteria: [Axis, Axis][]
  matchCriteria: MatchCriteria[]
): BasicTable | void {
  const newTable = duplicateTable(destTable, () => 0 as number | string);

  if (newTable == null)
    return console.log("MapCombineAdv failed to duplicate sourceTable");

  if (
    newTable.type == "3D" &&
    sourceTable.type == "3D" &&
    destTable.type == "3D"
  ) {
    destTable.values.forEach((row, y) => {
      const destYValue = destTable.yAxis.values[y];
      row.forEach((destCell, x) => {
        const destXValue = destTable.xAxis.values[x];
        // const newAxisValues = axisMap(destXValue, destYValue, destCell);
        // TODO get the x and y. To do this we need to get the values from the dest table using (dest[X,Y,Cell]) and map to the source table using the 2 matching criteria

        let sourceXLookup: number | undefined;
        let sourceYLookup: number | undefined;
        matchCriteria.forEach((m) => {
          if (m.sourceSourceField == "XAxis") {
            if (m.destSourceField == "XAxis") {
              sourceXLookup = destXValue;
            } else if (m.destSourceField == "YAxis") {
              sourceXLookup = destYValue;
            } else if (m.destSourceField == "Value") {
              sourceXLookup = Number(destCell);
            }
          } else if (m.sourceSourceField == "YAxis") {
            if (m.destSourceField == "XAxis") {
              sourceYLookup = destXValue;
            } else if (m.destSourceField == "YAxis") {
              sourceYLookup = destYValue;
            } else if (m.destSourceField == "Value") {
              sourceYLookup = Number(destCell);
            }
          }
        });
        if (sourceXLookup == undefined)
          return console.log("sourceXLookup missing");
        if (sourceYLookup == undefined)
          return console.log("sourceYLookup missing");

        const axes = getAxes(sourceTable, sourceXLookup, sourceYLookup);
        if (!axes) return console.log("MapCombineAdv failed to get axes");
        newTable.values[y][x] = sourceTable.values[axes.y][axes.x];
      });
    });
  } else {
    console.log("TODO MapCombineAdv only works on 3D tables");
  }
  return newTable;
}

// Get the value closest to x, y axis
// TODO make a version of this that uses nearby values / smoothed
function getAxes(table: BasicTable, xAxis: number, yAxis: number) {
  if (table.type != "3D") return console.log("getAxis only works on 3D table");
  const x = nearestIndex(table.xAxis.values, xAxis);
  const y = nearestIndex(table.yAxis.values, yAxis);
  return { x, y };
}
