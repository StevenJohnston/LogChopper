import { test } from "node:test";
import assert from "node:assert";
import {
  getIndexFloat,
  getFilledTable,
  FillTableFromLog,
  FillLogTable,
  duplicateTable,
  MapCombine,
  sortCellPos,
  getRecordsForCellSelection,
} from "@/app/_lib/rom";
import { Table2DX, Table3D, isTable2DX, Scaling } from "@/app/_lib/rom-metadata";
import { LogRecord } from "@/app/_lib/log";
import { Aggregator } from "@/app/_lib/consts";

test("getIndexFloat low", () => {
  const arr = [0, 10, 20];
  const val = 3;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 0.3);
});

test("getIndexFloat middle", () => {
  const arr = [0, 10, 20, 30];
  const val = 15;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 1.5);
});
test("getIndexFloat high", () => {
  const arr = [0, 10, 20, 30];
  const val = 27;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 2.7);
});

test("getIndexFloat exact lower bound", () => {
  const arr = [0, 10, 20, 30];
  const val = 0;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 0);
});

test("getIndexFloat exact middle", () => {
  const arr = [0, 10, 20, 30];
  const val = 10;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 1);
});

test("getIndexFloat exact upper bound", () => {
  const arr = [0, 10, 20, 30];
  const val = 30;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 3);
});

test("getIndexFloat index lower bound", () => {
  const arr = [0, 10, 20];
  const val = -3;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 0);
});

test("getIndexFloat index upper bound", () => {
  const arr = [0, 10, 20];
  const val = 30;

  const result = getIndexFloat(arr, val);

  assert.equal(result, 2);
});

test("Table2DX duplicateTable", () => {
  const table2d: Table2DX<number> = {
    type: "2D",
    name: "MAF Scaling Horizontal",
    scaling: "GramsPerSecond",
    address: "5757a",
    xAxis: {
      name: "Volts",
      type: "X Axis",
      elements: 3,
      address: "61fd0",
      scaling: "VoltsADC1023",
      values: [1.0, 2.0, 3.0],
    },
    values: [[10, 20, 30]],
  };

  const dup = duplicateTable(table2d, (v) => v * 2);
  assert(dup !== null);
  assert.equal(dup.type, "2D");
  if (isTable2DX(dup)) {
    assert.deepEqual(dup.values, [[20, 40, 60]]);
  } else {
    assert.fail("duplicateTable did not preserve Table2DX type");
  }
});

test("Table2DX FillTableFromLog and FillLogTable", () => {
  const table2d: Table2DX<number> = {
    type: "2D",
    name: "MAF Scaling Horizontal",
    scaling: "GramsPerSecond",
    address: "5757a",
    scalingValue: {
      name: "GramsPerSecond",
    },
    xAxis: {
      name: "Volts",
      type: "X Axis",
      elements: 5,
      address: "61fd0",
      scaling: "VoltsADC1023",
      values: [1.0, 2.0, 3.0, 4.0, 5.0],
    },
    values: [[10, 20, 30, 40, 50]],
  };

  const logs: LogRecord[] = [
    { LogID: 1, MAF: 1.0, AFR: 14.7 },
    { LogID: 2, MAF: 2.5, AFR: 12.0 },
    { LogID: 3, MAF: 2.5, AFR: 13.0 },
    { LogID: 4, MAF: 5.0, AFR: 11.5 },
  ];

  // Fill table with log records (weighted)
  const logTable = FillTableFromLog(table2d, logs, true);
  assert(logTable !== undefined);
  assert(logTable !== null);
  assert.equal(logTable.type, "2D");
  assert(isTable2DX(logTable));

  // Check bin allocations:
  // Volt 1.0 -> index 0 (weight 1.0)
  assert.equal(logTable.values[0][0].length, 1);
  assert.equal(logTable.values[0][0][0].LogID, 1);
  assert.equal(logTable.values[0][0][0].weight, 1.0);

  // Volt 2.5 -> midway between index 1 (2.0V) and index 2 (3.0V), weight 0.5 each
  // Two records at 2.5, so 2 records in index 1 and 2 records in index 2
  assert.equal(logTable.values[0][1].length, 2);
  assert.equal(logTable.values[0][1][0].weight, 0.5);
  assert.equal(logTable.values[0][2].length, 2);
  assert.equal(logTable.values[0][2][0].weight, 0.5);

  // Volt 5.0 -> index 4 (weight 1.0)
  assert.equal(logTable.values[0][4].length, 1);
  assert.equal(logTable.values[0][4][0].LogID, 4);

  // Aggregate with FillLogTable (AVG AFR)
  const avgTable = FillLogTable(logTable, "AFR", Aggregator.AVG);
  assert(avgTable !== undefined);
  assert(avgTable !== null);
  assert(isTable2DX(avgTable));
  assert.equal(avgTable.values[0][0], 14.7);
  // (12.0 * 0.5 + 13.0 * 0.5) / (0.5 + 0.5) = 12.5
  assert.equal(avgTable.values[0][1], 12.5);
  assert.equal(avgTable.values[0][2], 12.5);
  assert.equal(avgTable.values[0][3], 0);
  assert.equal(avgTable.values[0][4], 11.5);

  // Aggregate with COUNT
  const countTable = FillLogTable(logTable, "AFR", Aggregator.COUNT);
  assert(countTable !== undefined);
  assert(isTable2DX(countTable));
  assert.deepEqual(countTable.values[0], [1, 2, 2, 0, 1]);
});

test("Table2DX MapCombine", () => {
  const tableA: Table2DX<number> = {
    type: "2D",
    name: "Table A",
    scaling: "GramsPerSecond",
    address: "5757a",
    xAxis: {
      name: "Volts",
      type: "X Axis",
      elements: 3,
      address: "61fd0",
      scaling: "VoltsADC1023",
      values: [1.0, 2.0, 3.0],
    },
    values: [[100, 200, 300]],
  };

  const tableB: Table2DX<number> = {
    type: "2D",
    name: "Table B",
    scaling: "GramsPerSecond",
    address: "5757a",
    xAxis: {
      name: "Volts",
      type: "X Axis",
      elements: 3,
      address: "61fd0",
      scaling: "VoltsADC1023",
      values: [1.0, 2.0, 3.0],
    },
    values: [[10, 20, 30]],
  };

  const combined = MapCombine(
    tableA,
    tableB,
    "sourceTable[y][x] - joinTable[y][x]"
  );

  assert(combined !== undefined);
  assert(isTable2DX(combined));
  assert.deepEqual(combined.values, [[90, 180, 270]]);
});

test("Table2DX getFilledTable with binary ROM data", async () => {
  // Create a mock binary ROM buffer
  // Offset 0x100 for X axis (3 elements of uint16 big-endian)
  // Offset 0x200 for Table values (3 elements of uint16 big-endian)
  const buffer = new ArrayBuffer(1024);
  const view = new DataView(buffer);

  // Axis values: raw uint16 = [204.6 -> toExpr x*5/1023 -> 1.0, 409.2 -> 2.0, 613.8 -> 3.0]
  // 1.0 * 1023 / 5 = 204.6 -> 205
  view.setUint16(0x100, 205, false);
  view.setUint16(0x102, 409, false);
  view.setUint16(0x104, 614, false);

  // Table values: raw uint16 = [1000 -> toExpr x/100 -> 10.0, 2000 -> 20.0, 3000 -> 30.0]
  view.setUint16(0x200, 1000, false);
  view.setUint16(0x202, 2000, false);
  view.setUint16(0x204, 3000, false);

  const mockFile = new File([buffer], "test.bin");

  const scalingMap: Record<string, Scaling> = {
    VoltsADC1023: {
      storageType: "uint16",
      endian: "big",
      toExpr: "x*5/1023",
      format: "%.2f",
    },
    GramsPerSecond: {
      storageType: "uint16",
      endian: "big",
      toExpr: "x/100",
      format: "%.2f",
    },
  };

  const tableMetadata: Table2DX<number> = {
    type: "2D",
    name: "MAF Scaling Horizontal",
    scaling: "GramsPerSecond",
    address: "200",
    xAxis: {
      name: "Volts",
      type: "X Axis",
      elements: 3,
      address: "100",
      scaling: "VoltsADC1023",
      values: [],
    },
    values: [],
  };

  const filled = await getFilledTable(mockFile, scalingMap, tableMetadata);
  assert(filled !== undefined);
  assert(isTable2DX(filled));
  assert.equal(filled.xAxis.values.length, 3);
  assert.equal(filled.values.length, 1);
  assert.equal(filled.values[0].length, 3);
  assert.equal(filled.values[0][0], 10);
  assert.equal(filled.values[0][1], 20);
  assert.equal(filled.values[0][2], 30);
});

test("sortCellPos correctly orders coordinates", () => {
  assert.deepEqual(sortCellPos([3, 5], [1, 2]), [[1, 2], [3, 5]]);
  assert.deepEqual(sortCellPos([1, 2], [3, 5]), [[1, 2], [3, 5]]);
  assert.deepEqual(sortCellPos([2, 5], [4, 1]), [[2, 1], [4, 5]]);
});

test("getRecordsForCellSelection extracts records from 3D log table", () => {
  const recA = { LogID: "1", AFR: 14.7 } as unknown as LogRecord;
  const recB = { LogID: "2", AFR: 12.5 } as unknown as LogRecord;
  const recC = { LogID: "3", AFR: 11.8 } as unknown as LogRecord;
  const recD = { LogID: "4", AFR: 13.0 } as unknown as LogRecord;

  const mockLogTable: Table3D<LogRecord[]> = {
    type: "3D",
    name: "Fuel Table",
    xAxis: { name: "RPM", type: "X Axis", elements: 2, values: [1000, 2000] },
    yAxis: { name: "Load", type: "Y Axis", elements: 2, values: [10, 20] },
    values: [
      [[recA], [recB]],
      [[recC, recD], []],
    ],
  };

  // Single cell [0, 0]
  const cell00 = getRecordsForCellSelection(mockLogTable, [0, 0], [0, 0]);
  assert.deepEqual(cell00, [recA]);

  // Single cell [1, 0] with multiple records
  const cell10 = getRecordsForCellSelection(mockLogTable, [1, 0], [1, 0]);
  assert.deepEqual(cell10, [recC, recD]);

  // Multi-cell range [0, 0] to [1, 1]
  const allCells = getRecordsForCellSelection(mockLogTable, [0, 0], [1, 1]);
  assert.deepEqual(allCells, [recA, recB, recC, recD]);

  // Reverse range [1, 1] to [0, 0]
  const allCellsRev = getRecordsForCellSelection(mockLogTable, [1, 1], [0, 0]);
  assert.deepEqual(allCellsRev, [recA, recB, recC, recD]);
});

test("getRecordsForCellSelection extracts records from 2DX horizontal log table", () => {
  const recA = { LogID: "10", Volts: 1.0 } as unknown as LogRecord;
  const recB = { LogID: "20", Volts: 2.0 } as unknown as LogRecord;

  const mock2DXTable: Table2DX<LogRecord[]> = {
    type: "2D",
    name: "MAF Table",
    xAxis: { name: "Volts", type: "X Axis", elements: 3, values: [1, 2, 3] },
    values: [
      [[recA], [recB], []],
    ],
  };

  const cell01 = getRecordsForCellSelection(mock2DXTable, [0, 1], [0, 1]);
  assert.deepEqual(cell01, [recB]);

  const cellRange = getRecordsForCellSelection(mock2DXTable, [0, 0], [0, 2]);
  assert.deepEqual(cellRange, [recA, recB]);
});

test("Table2DX FillTableFromLog with weight filter excludes logs below threshold", () => {
  const table2d: Table2DX<number> = {
    type: "2D",
    name: "MAF Scaling Horizontal",
    scaling: "GramsPerSecond",
    address: "5757a",
    scalingValue: {
      name: "GramsPerSecond",
    },
    xAxis: {
      name: "Volts",
      type: "X Axis",
      elements: 5,
      address: "61fd0",
      scaling: "VoltsADC1023",
      values: [1.0, 2.0, 3.0, 4.0, 5.0],
    },
    values: [[10, 20, 30, 40, 50]],
  };

  const logs: LogRecord[] = [
    { LogID: 1, MAF: 1.0, AFR: 14.7 }, // exact -> index 0, weight 1.0
    { LogID: 2, MAF: 2.2, AFR: 12.0 }, // 2.2V -> index 1 (weight 0.8), index 2 (weight 0.2)
    { LogID: 3, MAF: 5.0, AFR: 11.5 }, // exact -> index 4, weight 1.0
  ];

  // Weight filter with minWeight = 0.5:
  // LogID 2's allocation to index 2 (weight 0.2) should be excluded (< 0.5), but index 1 (weight 0.8) should be kept.
  const logTableFiltered = FillTableFromLog(table2d, logs, true, true, 0.5);
  assert(logTableFiltered !== undefined && logTableFiltered !== null);
  assert(isTable2DX(logTableFiltered));

  // Index 0: 1 record (LogID 1, weight 1.0)
  assert.equal(logTableFiltered.values[0][0].length, 1);
  assert.equal(logTableFiltered.values[0][0][0].LogID, 1);

  // Index 1: 1 record (LogID 2, weight 0.8)
  assert.equal(logTableFiltered.values[0][1].length, 1);
  assert.equal(logTableFiltered.values[0][1][0].LogID, 2);
  assert.ok(Math.abs((logTableFiltered.values[0][1][0].weight ?? 0) - 0.8) < 1e-6);

  // Index 2: 0 records (weight 0.2 was filtered out)
  assert.equal(logTableFiltered.values[0][2].length, 0);

  // Index 4: 1 record (LogID 3, weight 1.0)
  assert.equal(logTableFiltered.values[0][4].length, 1);
});

test("Table 3D FillTableFromLog with weight filter", () => {
  const table3d: Table3D<number> = {
    type: "3D",
    name: "Base Fuel Map",
    scaling: "AFR",
    address: "5000",
    scalingValue: { name: "AFR" },
    xAxis: {
      name: "RPM",
      type: "X Axis",
      elements: 3,
      address: "6000",
      scaling: "RPM",
      values: [1000, 2000, 3000],
    },
    yAxis: {
      name: "Load",
      type: "Y Axis",
      elements: 3,
      address: "7000",
      scaling: "Load",
      values: [1.0, 2.0, 3.0],
    },
    values: [
      [14.7, 14.7, 14.7],
      [13.0, 13.0, 13.0],
      [11.5, 11.5, 11.5],
    ],
  };

  const logs: LogRecord[] = [
    // RPM 1200 (x = 0.2), Load 1.1 (y = 0.1)
    // w(0,0) = (1 - 0.1) * (1 - 0.2) = 0.9 * 0.8 = 0.72
    // w(0,1) = (1 - 0.1) * 0.2 = 0.9 * 0.2 = 0.18
    // w(1,0) = 0.1 * 0.8 = 0.08
    // w(1,1) = 0.1 * 0.2 = 0.02
    { LogID: 100, RPM: 1200, Load: 1.1, AFR: 14.0 },
  ];

  // With minWeight = 0.20: only w(0,0) (0.72) is >= 0.20; the other 3 are filtered out
  const logTable = FillTableFromLog(table3d, logs, true, true, 0.2);
  assert(logTable !== undefined && logTable !== null);
  assert.equal(logTable.type, "3D");

  assert.equal(logTable.values[0][0].length, 1);
  assert.ok(Math.abs((logTable.values[0][0][0].weight ?? 0) - 0.72) < 1e-6);
  assert.equal(logTable.values[0][1].length, 0);
  assert.equal(logTable.values[1][0].length, 0);
  assert.equal(logTable.values[1][1].length, 0);
});

test("FillLogTable with enableWeightFilter filters records in aggregators", () => {
  const mockTable: Table2DX<LogRecord[]> = {
    type: "2D",
    name: "MAF Scaling",
    scaling: "AFR",
    address: "1000",
    scalingValue: { name: "AFR" },
    xAxis: {
      name: "Volts",
      type: "X Axis",
      elements: 2,
      address: "2000",
      scaling: "Volts",
      values: [1.0, 2.0],
    },
    values: [
      [
        [
          { LogID: 1, AFR: 10.0, weight: 0.1 },
          { LogID: 2, AFR: 20.0, weight: 0.9 },
        ],
        [
          { LogID: 3, AFR: 12.0, weight: 0.3 },
        ],
      ],
    ],
  };

  // With minWeight = 0.5:
  // Cell 0: LogID 1 (0.1) filtered out, only LogID 2 (20.0, weight 0.9) remains
  // Cell 1: LogID 3 (0.3) filtered out, cell is empty (AVG -> 0, COUNT -> 0, SUM -> 0)
  const avgTable = FillLogTable(mockTable, "AFR", Aggregator.AVG, true, 0.5);
  assert(avgTable !== undefined && avgTable !== null);
  assert.equal(avgTable.values[0][0], 20.0);
  assert.equal(avgTable.values[0][1], 0);

  const countTable = FillLogTable(mockTable, "AFR", Aggregator.COUNT, true, 0.5);
  assert(countTable !== undefined && countTable !== null);
  assert.deepEqual(countTable.values[0], [1, 0]);

  const sumTable = FillLogTable(mockTable, "AFR", Aggregator.SUM, true, 0.5);
  assert(sumTable !== undefined && sumTable !== null);
  assert.deepEqual(sumTable.values[0], [20.0, 0]);
});


