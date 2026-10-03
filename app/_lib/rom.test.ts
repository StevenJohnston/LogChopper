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
  getCellRangeTSV,
  getTableTSV,
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
    xAxis: { name: "RPM", type: "X Axis", elements: 2, address: "0", scaling: "RPM", values: [1000, 2000] },
    yAxis: { name: "Load", type: "Y Axis", elements: 2, address: "0", scaling: "Load", values: [10, 20] },
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
    xAxis: { name: "Volts", type: "X Axis", elements: 3, address: "0", scaling: "Volts", values: [1, 2, 3] },
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
  const logTable = FillTableFromLog(table3d, logs, true, true, 0.2) as Table3D<LogRecord[]>;
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
  const avgTable = FillLogTable(mockTable, "AFR", Aggregator.AVG, true, 0.5) as Table2DX<number>;
  assert(avgTable !== undefined && avgTable !== null);
  assert.equal(avgTable.values[0][0], 20.0);
  assert.equal(avgTable.values[0][1], 0);

  const countTable = FillLogTable(mockTable, "AFR", Aggregator.COUNT, true, 0.5) as Table2DX<number>;
  assert(countTable !== undefined && countTable !== null);
  assert.deepEqual(countTable.values[0], [1, 0]);

  const sumTable = FillLogTable(mockTable, "AFR", Aggregator.SUM, true, 0.5) as Table2DX<number>;
  assert(sumTable !== undefined && sumTable !== null);
  assert.deepEqual(sumTable.values[0], [20.0, 0]);
});

test("MAF & MAP Balancer savedGroup structure and cloning", () => {
  const { savedGroup } = require("@/app/_components/NodeSelector/MafMapBalancerGroup");
  const { cloneSavedGroup } = require("@/app/store/useNodeStorage");

  assert.equal(savedGroup.groupName, "MAF & MAP Balancer");
  assert.equal(savedGroup.nodes.length, 27);
  assert.equal(savedGroup.edges.length, 32);

  // Check GearNode configuration
  const gearNode = savedGroup.nodes.find((n: any) => n.type === "GearNode");
  assert(gearNode !== undefined, "GearNode must be present in savedGroup");
  assert.equal(gearNode.data.enableFilter, true);
  assert.equal(gearNode.data.maxAccuracy, 5);

  // Check AfrMlShifter configuration
  const afrShifterNode = savedGroup.nodes.find((n: any) => n.type === "afrMlShifter");
  assert(afrShifterNode !== undefined, "AfrMlShifter must be present in savedGroup");
  assert.equal(afrShifterNode.data.method, "Steady State Monotonic DP");
  assert.equal(afrShifterNode.data.replaceAfr, true);

  // Check edge wiring for AfrMlShifter
  const logToShifterEdge = savedGroup.edges.find((e: any) => e.target === afrShifterNode.id);
  assert(logToShifterEdge !== undefined, "BaseLog must connect to AfrMlShifter");
  assert.equal(logToShifterEdge.sourceHandle, "Log#LogOut");
  assert.equal(logToShifterEdge.targetHandle, "Log#logInput");

  const shifterToTpsEdge = savedGroup.edges.find((e: any) => e.source === afrShifterNode.id);
  assert(shifterToTpsEdge !== undefined, "AfrMlShifter must connect to TpsAfrDeleteNode");
  assert.equal(shifterToTpsEdge.sourceHandle, "Log#logOutput");
  assert.equal(shifterToTpsEdge.targetHandle, "Log#LogTarget");

  const cloned = cloneSavedGroup(savedGroup);
  assert.equal(cloned.groupName, "MAF & MAP Balancer");
  assert.equal(cloned.nodes.length, 27);
  assert.equal(cloned.edges.length, 32);

  // Ensure all cloned node IDs are unique
  const nodeIds = new Set(cloned.nodes.map((n: any) => n.id));
  assert.equal(nodeIds.size, 27);

  // Ensure all edges reference existing cloned nodes
  for (const edge of cloned.edges) {
    assert(nodeIds.has(edge.source), `Edge source ${edge.source} not in cloned nodes`);
    assert(nodeIds.has(edge.target), `Edge target ${edge.target} not in cloned nodes`);
  }
});

test("MAF & MAP Balancer mathematical formulas and smooth rule", () => {
  const { Parser } = require("expr-eval");
  const parser = new Parser();

  const ratioFunc = "MAP <= 80 ? 1.05 : (MAP >= 120 ? 0.95 : (1.05 - 0.0025 * (MAP - 80)))";
  const afrErrFunc = "(1.0 - (STFT + CurrentLTFT) / 100.0) * (AFR / AFRMAP)";
  const mafCorrFunc =
    "activeLoad = MAFCalcs <= MAPCalcs ? MAFCalcs : MAPCalcs;\ntrueLoad = activeLoad * AFR_ERR;\nW = MAP <= 80 ? 1.0 : (MAP >= 120 ? 0.0 : (120.0 - MAP) / 40.0);\n(trueLoad * (W + (1.0 - W) / TARGET_RATIO)) / MAFCalcs";
  const mapCorrFunc =
    "activeLoad = MAFCalcs <= MAPCalcs ? MAFCalcs : MAPCalcs;\ntrueLoad = activeLoad * AFR_ERR;\nW = MAP <= 80 ? 1.0 : (MAP >= 120 ? 0.0 : (120.0 - MAP) / 40.0);\n(trueLoad * (W * TARGET_RATIO + (1.0 - W))) / MAPCalcs";
  const mafSmoothFunc =
    "val = sourceTable[y][x] * joinTable[y][x];\nx > 0 ? (baseStep = sourceTable[y][x] - sourceTable[y][x - 1]; minVal = destTable[y][x - 1] + (baseStep > 0 ? baseStep * 0.25 : 0.01); val < minVal ? minVal : val) : val";

  // 1. Target ratio curve
  assert.equal(parser.evaluate(ratioFunc, { MAP: 40 }), 1.05);
  assert.equal(parser.evaluate(ratioFunc, { MAP: 80 }), 1.05);
  assert(Math.abs(parser.evaluate(ratioFunc, { MAP: 90 }) - 1.025) < 1e-6);
  assert.equal(parser.evaluate(ratioFunc, { MAP: 100 }), 1.0);
  assert(Math.abs(parser.evaluate(ratioFunc, { MAP: 110 }) - 0.975) < 1e-6);
  assert.equal(parser.evaluate(ratioFunc, { MAP: 120 }), 0.95);
  assert.equal(parser.evaluate(ratioFunc, { MAP: 200 }), 0.95);

  // 2. AFR error direction and trim awareness:
  const richErr = parser.evaluate(afrErrFunc, { AFRMAP: 11.5, AFR: 11.0, STFT: 0, CurrentLTFT: 0 });
  assert(richErr < 1.0);
  assert(Math.abs(richErr - 11.0 / 11.5) < 1e-6);

  const leanWithTrim = parser.evaluate(afrErrFunc, { AFRMAP: 14.7, AFR: 14.7, STFT: 5, CurrentLTFT: 3 });
  assert(Math.abs(leanWithTrim - 0.92) < 1e-6);

  // 3. Ground Truth Airflow: Low MAP (e.g. 50 kPa, Target Ratio = 1.05)
  // Vacuum mode (W=1.0): TrueLoad = activeLoad * AFR_ERR
  // Normal state (MAF 40 <= MAP 45): MAF is active (40), TrueLoad = 40 * 0.98 = 39.2
  const lowMapNormal = {
    MAP: 50,
    MAPCalcs: 45,
    MAFCalcs: 40,
    TARGET_RATIO: 1.05,
    AFR_ERR: 0.98,
  };
  assert(Math.abs(parser.evaluate(mafCorrFunc, lowMapNormal) - 0.98) < 1e-6);
  assert(Math.abs(parser.evaluate(mapCorrFunc, lowMapNormal) - (1.05 * 39.2) / 45) < 1e-6);

  // Inverted vacuum state (MAP under-reads at 30 < 40): MAP is active (30)
  // Engine ran 10% lean because of MAP: TrueLoad = 30 * 1.10 = 33.0
  // MAF is trimmed down to TrueLoad (33/40 = 0.825), MAP is lifted above MAF (1.05 * 33 / 30 = 1.155)
  const lowMapInverted = {
    MAP: 50,
    MAPCalcs: 30,
    MAFCalcs: 40,
    TARGET_RATIO: 1.05,
    AFR_ERR: 1.10,
  };
  assert(Math.abs(parser.evaluate(mafCorrFunc, lowMapInverted) - 0.825) < 1e-6);
  assert(Math.abs(parser.evaluate(mapCorrFunc, lowMapInverted) - 1.155) < 1e-6);

  // 4. Ground Truth Airflow: High MAP (e.g. 180 kPa, Target Ratio = 0.95)
  // Boost mode (W=0.0): MAP is fuel master, MAF provides headroom (TrueLoad / 0.95)
  // Normal state (MAP 200 <= MAF 220): MAP is active (200), TrueLoad = 200 * 1.04 = 208
  const highMapNormal = {
    MAP: 180,
    MAPCalcs: 200,
    MAFCalcs: 220,
    TARGET_RATIO: 0.95,
    AFR_ERR: 1.04,
  };
  assert(Math.abs(parser.evaluate(mapCorrFunc, highMapNormal) - 1.04) < 1e-6);
  assert(Math.abs(parser.evaluate(mafCorrFunc, highMapNormal) - 208 / (0.95 * 220)) < 1e-6);

  // Inverted boost state (MAF under-reads at 180 < 200): MAF is active (180)
  // Engine ran 10% lean: TrueLoad = 180 * 1.10 = 198
  // MAP is adjusted to TrueLoad (198/200 = 0.99), MAF is lifted to TrueLoad / 0.95 (208.42/180 = 1.15789)
  const highMapInverted = {
    MAP: 180,
    MAPCalcs: 200,
    MAFCalcs: 180,
    TARGET_RATIO: 0.95,
    AFR_ERR: 1.10,
  };
  assert(Math.abs(parser.evaluate(mapCorrFunc, highMapInverted) - 0.99) < 1e-6);
  assert(Math.abs(parser.evaluate(mafCorrFunc, highMapInverted) - 198 / (0.95 * 180)) < 1e-6);

  // 5. MAF Scaling smooth rule: enforces strictly monotonic increasing table without flat plateaus
  const baseTable: Table2DX<number> = {
    type: "2D",
    name: "MAF Scaling Horizontal",
    scaling: "GramsPerSecond",
    address: "5757a",
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

  // Join table with a dip at index 2 (0.7 would yield 21 < 24)
  const corrTable: Table2DX<number> = {
    type: "2D",
    name: "Correction Table",
    scaling: "Multiplier",
    address: "0",
    xAxis: baseTable.xAxis,
    values: [[1.0, 1.2, 0.7, 0.8, 1.0]],
  };

  const smoothed = MapCombine(baseTable, corrTable, mafSmoothFunc) as Table2DX<number>;
  assert(smoothed !== undefined && smoothed !== null);
  assert.equal(smoothed.type, "2D");
  // Expected: [10, 24, 26.5, 32, 50] -> at index 2, 21 is lifted to 26.5 (preserving 25% of baseline step: 24 + 0.25 * (30 - 20))
  assert.deepEqual(smoothed.values[0], [10, 24, 26.5, 32, 50]);

  // Verify all elements are strictly monotonically increasing
  for (let i = 1; i < smoothed.values[0].length; i++) {
    assert.ok(
      smoothed.values[0][i] > smoothed.values[0][i - 1],
      `Cell ${i} (${smoothed.values[0][i]}) must be > cell ${i - 1} (${smoothed.values[0][i - 1]})`
    );
  }

  // 6. Total weight confidence damping (Hill equation):
  const dampFunc =
    "diff = 1 - joinTable[y][x];\nw = sourceTable[y][x];\nconf = w <= 0 ? 0 : (w^2 / (w^2 + 225));\nnewDiff = 1 - conf * diff;\nnewDiff = newDiff < 0.85 ? 0.85 : (newDiff > 1.15 ? 1.15 : newDiff);\n(newDiff - 1) / 3 + 1";

  // No samples -> multiplier is exactly 1.0 (no change)
  assert.equal(
    parser.evaluate(dampFunc, { sourceTable: [[0]], joinTable: [[1.1]], y: 0, x: 0 }),
    1.0
  );

  // High samples (w=100) -> strong confidence (~98%), applies ~1/3 of the 10% delta
  const highConf = parser.evaluate(dampFunc, {
    sourceTable: [[100]],
    joinTable: [[1.1]],
    y: 0,
    x: 0,
  });
  assert(Math.abs(highConf - 1.0326) < 0.001);

  // Large delta (1.50) is clamped to 1.15 -> max applied is (1.15 - 1)/3 + 1 = 1.05
  const clampedConf = parser.evaluate(dampFunc, {
    sourceTable: [[100]],
    joinTable: [[1.5]],
    y: 0,
    x: 0,
  });
  assert.equal(clampedConf, 1.05);
});

test("getTableTSV extracts 3D table values in TSV format without axis", () => {
  const table3d: Table3D<number> = {
    type: "3D",
    name: "Fuel Map",
    scaling: "AFR",
    address: "1000",
    xAxis: {
      name: "Load",
      type: "X Axis",
      elements: 3,
      address: "2000",
      scaling: "Loadify",
      values: [100, 120, 140],
    },
    yAxis: {
      name: "RPM",
      type: "Y Axis",
      elements: 3,
      address: "3000",
      scaling: "RPMGain",
      values: [2000, 3000, 4000],
    },
    values: [
      [14.7, 14.2, 13.8],
      [13.5, 12.8, 12.2],
      [12.5, 11.9, 11.4],
    ],
  };

  const tsv = getTableTSV(table3d);
  assert.equal(
    tsv,
    "14.7\t14.2\t13.8\n13.5\t12.8\t12.2\n12.5\t11.9\t11.4"
  );
});

test("getTableTSV extracts 2DX table values in TSV format without axis", () => {
  const table2d: Table2DX<number> = {
    type: "2D",
    name: "MAF Scaling",
    scaling: "GramsPerSecond",
    address: "4000",
    xAxis: {
      name: "Volts",
      type: "X Axis",
      elements: 4,
      address: "5000",
      scaling: "Volts",
      values: [1.0, 2.0, 3.0, 4.0],
    },
    values: [[10.5, 20.2, 35.8, 55.1]],
  };

  const tsv = getTableTSV(table2d);
  assert.equal(tsv, "10.5\t20.2\t35.8\t55.1");
});

test("getCellRangeTSV extracts partial cell range matching highlight behavior", () => {
  const table3d: Table3D<number> = {
    type: "3D",
    name: "Timing Map",
    scaling: "Timing",
    address: "1000",
    xAxis: {
      name: "Load",
      type: "X Axis",
      elements: 3,
      address: "2000",
      scaling: "Loadify",
      values: [100, 120, 140],
    },
    yAxis: {
      name: "RPM",
      type: "Y Axis",
      elements: 3,
      address: "3000",
      scaling: "RPMGain",
      values: [2000, 3000, 4000],
    },
    values: [
      [25, 22, 18],
      [22, 19, 15],
      [18, 15, 11],
    ],
  };

  // Sub-rectangle from [1, 1] to [2, 2]
  const partialTsv = getCellRangeTSV(table3d, [1, 1], [2, 2]);
  assert.equal(partialTsv, "19\t15\n15\t11");

  // Inverted range order ([2, 2] to [1, 1])
  const invertedTsv = getCellRangeTSV(table3d, [2, 2], [1, 1]);
  assert.equal(invertedTsv, "19\t15\n15\t11");
});

test("MAF & MAP Coherence Analyzer savedGroup structure and cloning", () => {
  const { savedGroup } = require("@/app/_components/NodeSelector/MafMapCoherenceGroup");
  const { cloneSavedGroup } = require("@/app/store/useNodeStorage");

  assert.equal(savedGroup.groupName, "MAF & MAP Coherence Analyzer");
  assert.equal(savedGroup.nodes.length, 21);
  assert.equal(savedGroup.edges.length, 21);

  // Check GearNode configuration
  const gearNode = savedGroup.nodes.find((n: any) => n.type === "GearNode");
  assert(gearNode !== undefined, "GearNode must be present in savedGroup");
  assert.equal(gearNode.data.enableFilter, true);
  assert.equal(gearNode.data.maxAccuracy, 5);

  // Check AfrMlShifter configuration
  const afrShifterNode = savedGroup.nodes.find((n: any) => n.type === "afrMlShifter");
  assert(afrShifterNode !== undefined, "AfrMlShifter must be present in savedGroup");
  assert.equal(afrShifterNode.data.method, "Steady State Monotonic DP");
  assert.equal(afrShifterNode.data.replaceAfr, true);

  // Check 2D and 3D BaseTable nodes
  const mafBaseTable = savedGroup.nodes.find((n: any) => n.data.tableKey === "MAF Scaling Horizontal");
  assert(mafBaseTable !== undefined, "MAF Scaling Horizontal node must be present");
  assert.equal(mafBaseTable.data.tableType, "2D");

  const mapBaseTable = savedGroup.nodes.find((n: any) => n.data.tableKey === "MAP based Load Calc #2 - Cold/Interpolated");
  assert(mapBaseTable !== undefined, "MAP based Load Calc #2 node must be present");
  assert.equal(mapBaseTable.data.tableType, "3D");

  // Check 2D CombineNode (Spread: MAX - MIN)
  const combineNode = savedGroup.nodes.find((n: any) => n.type === "CombineNode");
  assert(combineNode !== undefined, "CombineNode for MAF bin spread must be present");
  assert.equal(combineNode.data.tableType, "2D");

  // Check edge wiring for AfrMlShifter
  const logToShifterEdge = savedGroup.edges.find((e: any) => e.target === afrShifterNode.id);
  assert(logToShifterEdge !== undefined, "BaseLog must connect to AfrMlShifter");
  assert.equal(logToShifterEdge.sourceHandle, "Log#LogOut");
  assert.equal(logToShifterEdge.targetHandle, "Log#logInput");

  // Check CombineNode wiring
  const maxTableNode = savedGroup.nodes.find((n: any) => n.data.logField === "MAF_MAP_RATIO" && n.data.aggregator === "MAX");
  const minTableNode = savedGroup.nodes.find((n: any) => n.data.logField === "MAF_MAP_RATIO" && n.data.aggregator === "MIN");
  assert(maxTableNode !== undefined && minTableNode !== undefined);

  const edgeMaxToCombine = savedGroup.edges.find((e: any) => e.source === maxTableNode.id && e.target === combineNode.id);
  const edgeMinToCombine = savedGroup.edges.find((e: any) => e.source === minTableNode.id && e.target === combineNode.id);
  assert(edgeMaxToCombine !== undefined, "MAX table must connect to Combine TableIn1");
  assert.equal(edgeMaxToCombine.targetHandle, "2D#TableIn1");
  assert(edgeMinToCombine !== undefined, "MIN table must connect to Combine TableIn2");
  assert.equal(edgeMinToCombine.targetHandle, "2D#TableIn2");

  const cloned = cloneSavedGroup(savedGroup);
  assert.equal(cloned.groupName, "MAF & MAP Coherence Analyzer");
  assert.equal(cloned.nodes.length, 21);
  assert.equal(cloned.edges.length, 21);

  // Ensure all cloned node IDs are unique
  const nodeIds = new Set(cloned.nodes.map((n: any) => n.id));
  assert.equal(nodeIds.size, 21);

  // Ensure all edges reference existing cloned nodes
  for (const edge of cloned.edges) {
    assert(nodeIds.has(edge.source), `Edge source ${edge.source} not in cloned nodes`);
    assert(nodeIds.has(edge.target), `Edge target ${edge.target} not in cloned nodes`);
  }
});

test("MAF & MAP Coherence Analyzer mathematical formulas", () => {
  const { Parser } = require("expr-eval");
  const parser = new Parser();

  const ratioFunc = "MAFCalcs / MAPCalcs";
  const discrepancyFunc = "((MAFCalcs - MAPCalcs) / MAPCalcs) * 100";
  const spreadFunc = "sourceTable[y][x] > 0 and joinTable[y][x] > 0 ? (sourceTable[y][x] - joinTable[y][x]) : 0";

  // Point A: 2000 RPM, 200 kPa -> MAFCalcs = 160, MAPCalcs = 200 (MAF is 20% lower)
  const pointA = { MAFCalcs: 160, MAPCalcs: 200 };
  assert.equal(parser.evaluate(ratioFunc, pointA), 0.80);
  assert.equal(parser.evaluate(discrepancyFunc, pointA), -20);

  // Point B: 4000 RPM, 100 kPa -> MAFCalcs = 60, MAPCalcs = 100 (MAF is 40% lower)
  const pointB = { MAFCalcs: 60, MAPCalcs: 100 };
  assert.equal(parser.evaluate(ratioFunc, pointB), 0.60);
  assert.equal(parser.evaluate(discrepancyFunc, pointB), -40);

  // Perfectly coherent point (MAFCalcs == MAPCalcs)
  const pointCoherent = { MAFCalcs: 150, MAPCalcs: 150 };
  assert.equal(parser.evaluate(ratioFunc, pointCoherent), 1.0);
  assert.equal(parser.evaluate(discrepancyFunc, pointCoherent), 0);

  // Over-reading MAF point (+15%)
  const pointOver = { MAFCalcs: 115, MAPCalcs: 100 };
  assert.equal(parser.evaluate(ratioFunc, pointOver), 1.15);
  assert.equal(parser.evaluate(discrepancyFunc, pointOver), 15);

  // Spread calculation in 2D MAF bin:
  // Cell with 25% spread across log records (MAX = 0.85, MIN = 0.60)
  assert.equal(
    parser.evaluate(spreadFunc, {
      sourceTable: [[0.85]],
      joinTable: [[0.60]],
      y: 0,
      x: 0,
    }),
    0.25
  );

  // Coherent cell with tight spread (MAX = 1.02, MIN = 0.98 -> 0.04 spread)
  assert(
    Math.abs(
      parser.evaluate(spreadFunc, {
        sourceTable: [[1.02]],
        joinTable: [[0.98]],
        y: 0,
        x: 0,
      }) - 0.04
    ) < 1e-6
  );

  // Unpopulated cell
  assert.equal(
    parser.evaluate(spreadFunc, {
      sourceTable: [[0]],
      joinTable: [[0]],
      y: 0,
      x: 0,
    }),
    0
  );
});

test("MAT Variety Filter logic blocks narrow temperature datalogs and permits diverse datalogs", () => {
  const { evaluateMatVariety, filterMatVarietyLogs } = require("@/app/_lib/log");

  // 1. Narrow temperature datalog (single run, MAT 22°C - 26°C -> span 4°C < 10°C)
  const narrowLogs = [
    { LogID: 1, MAT: 22.0, AFR: 14.7 },
    { LogID: 2, MAT: 23.5, AFR: 14.6 },
    { LogID: 3, MAT: 24.0, AFR: 14.8 },
    { LogID: 4, MAT: 25.0, AFR: 14.7 },
    { LogID: 5, MAT: 26.0, AFR: 14.5 },
  ];

  const narrowEval = evaluateMatVariety(narrowLogs, { minTempSpread: 10.0, minDistinctBins: 2 });
  assert.equal(narrowEval.sufficient, false);
  assert.equal(narrowEval.spread, 4.0);
  assert.ok(narrowEval.reason.includes("MAT spread"));

  const filteredNarrow = filterMatVarietyLogs(narrowLogs, { minTempSpread: 10.0, minDistinctBins: 2 });
  assert.equal(filteredNarrow.result.sufficient, false);
  // All records should be marked delete = true to prevent corruption downstream
  assert.equal(filteredNarrow.logs.length, 5);
  for (const record of filteredNarrow.logs) {
    assert.equal(record.delete, true);
  }

  // 2. Diverse temperature datalogs (morning commute MAT 20°C - 24°C combined with afternoon MAT 40°C - 44°C)
  const diverseLogs = [
    { LogID: 1, MAT: 20.0, AFR: 14.7 },
    { LogID: 2, MAT: 21.0, AFR: 14.8 },
    { LogID: 3, MAT: 22.0, AFR: 14.7 },
    { LogID: 4, MAT: 23.0, AFR: 14.6 },
    { LogID: 5, MAT: 24.0, AFR: 14.7 },
    { LogID: 6, MAT: 40.0, AFR: 13.9 },
    { LogID: 7, MAT: 41.0, AFR: 14.0 },
    { LogID: 8, MAT: 42.0, AFR: 14.1 },
    { LogID: 9, MAT: 43.0, AFR: 13.8 },
    { LogID: 10, MAT: 44.0, AFR: 13.9 },
  ];

  const diverseEval = evaluateMatVariety(diverseLogs, { minTempSpread: 10.0, minDistinctBins: 2, minSamplesPerBin: 5 });
  assert.equal(diverseEval.sufficient, true);
  assert.equal(diverseEval.spread, 24.0);
  assert.ok(diverseEval.activeBinsCount >= 2);
  assert.strictEqual(diverseEval.reason, undefined);

  const filteredDiverse = filterMatVarietyLogs(diverseLogs, { minTempSpread: 10.0, minDistinctBins: 2, minSamplesPerBin: 5 });
  assert.equal(filteredDiverse.result.sufficient, true);
  assert.equal(filteredDiverse.logs.length, 10);
  for (const record of filteredDiverse.logs) {
    assert.strictEqual(record.delete, undefined);
  }

  // 3. Fallback to IAT if MAT column is missing
  const iatLogs = [
    { LogID: 1, IAT: 15.0, AFR: 14.7 },
    { LogID: 2, IAT: 16.0, AFR: 14.7 },
    { LogID: 3, IAT: 17.0, AFR: 14.7 },
    { LogID: 4, IAT: 18.0, AFR: 14.7 },
    { LogID: 5, IAT: 19.0, AFR: 14.7 },
    { LogID: 6, IAT: 35.0, AFR: 14.0 },
    { LogID: 7, IAT: 36.0, AFR: 14.0 },
    { LogID: 8, IAT: 37.0, AFR: 14.0 },
    { LogID: 9, IAT: 38.0, AFR: 14.0 },
    { LogID: 10, IAT: 39.0, AFR: 14.0 },
  ];
  const iatEval = evaluateMatVariety(iatLogs, { minTempSpread: 10.0, minDistinctBins: 2, minSamplesPerBin: 5 });
  assert.equal(iatEval.sufficient, true);
  assert.equal(iatEval.spread, 24.0);
});

test("MAT Fuel Comp savedGroup structure and cloning", () => {
  const { savedGroup } = require("@/app/_components/NodeSelector/MatFuelCompGroup");
  const { cloneSavedGroup } = require("@/app/store/useNodeStorage");

  assert.equal(savedGroup.groupName, "MAT Fuel Comp");
  assert.equal(savedGroup.nodes.length, 8);
  assert.equal(savedGroup.edges.length, 6);

  // 1. Check MAT Fuel Comp Node configuration
  const matCompNode = savedGroup.nodes.find((n: any) => n.type === "MatFuelCompNode");
  assert(matCompNode !== undefined, "MatFuelCompNode must be present in MAT Fuel Comp savedGroup");
  assert.equal(matCompNode.data.minTempSpread, 10.0);
  assert.equal(matCompNode.data.minDistinctBins, 2);
  assert.equal(matCompNode.data.minCellSamples, 5);
  assert.equal(matCompNode.data.maxCorrectionRatio, 0.15);
  assert.equal(matCompNode.data.enableDamping, true);

  // 2. Check Pipeline wiring: Log -> AfrMlShifter -> TpsAfrDelete -> LogFilter -> MatFuelCompNode
  const tpsNode = savedGroup.nodes.find((n: any) => n.type === "TpsAfrDeleteNode");
  const logFilterNode = savedGroup.nodes.find((n: any) => n.type === "LogFilterNode");
  assert(tpsNode !== undefined && logFilterNode !== undefined);

  const tpsToLogFilterEdge = savedGroup.edges.find((e: any) => e.source === tpsNode.id && e.target === logFilterNode.id);
  assert(tpsToLogFilterEdge !== undefined, "TpsAfrDeleteNode must connect into LogFilterNode");
  assert.equal(tpsToLogFilterEdge.sourceHandle, "Log#LogSource");
  assert.equal(tpsToLogFilterEdge.targetHandle, "Log#LogTarget");

  const logFilterToMatCompEdge = savedGroup.edges.find((e: any) => e.source === logFilterNode.id && e.target === matCompNode.id);
  assert(logFilterToMatCompEdge !== undefined, "LogFilterNode must connect into MatFuelCompNode");
  assert.equal(logFilterToMatCompEdge.sourceHandle, "Log#LogSource");
  assert.equal(logFilterToMatCompEdge.targetHandle, "Log#LogIn");

  // 3. Check BaseTable is 3D Fuel Compensation MAT vs MAP connected to MatFuelCompNode
  const baseTableNode = savedGroup.nodes.find((n: any) => n.type === "BaseTableNode");
  assert(baseTableNode !== undefined);
  assert.equal(baseTableNode.data.tableKey, "Fuel Compensation MAT vs MAP - Stock3bar");
  assert.equal(baseTableNode.data.tableType, "3D");

  const tableToMatCompEdge = savedGroup.edges.find((e: any) => e.source === baseTableNode.id && e.target === matCompNode.id);
  assert(tableToMatCompEdge !== undefined, "BaseTableNode must connect into MatFuelCompNode");
  assert.equal(tableToMatCompEdge.sourceHandle, "3D#TableOut");
  assert.equal(tableToMatCompEdge.targetHandle, "3D#TableIn");

  // Verify all edges have defined and valid handle IDs
  for (const edge of savedGroup.edges) {
    assert(edge.sourceHandle && edge.sourceHandle.length > 0, `Edge ${edge.id} missing sourceHandle`);
    assert(edge.targetHandle && edge.targetHandle.length > 0, `Edge ${edge.id} missing targetHandle`);
  }

  // 4. Verify Cloning preserves node count, edge count, unique IDs, and handle integrity
  const cloned = cloneSavedGroup(savedGroup);
  assert.equal(cloned.groupName, "MAT Fuel Comp");
  assert.equal(cloned.nodes.length, 8);
  assert.equal(cloned.edges.length, 6);

  const nodeIds = new Set(cloned.nodes.map((n: any) => n.id));
  assert.equal(nodeIds.size, 8);

  for (const edge of cloned.edges) {
    assert(nodeIds.has(edge.source), `Edge source ${edge.source} not in cloned nodes`);
    assert(nodeIds.has(edge.target), `Edge target ${edge.target} not in cloned nodes`);
    assert(edge.sourceHandle && edge.sourceHandle.length > 0, `Cloned edge ${edge.id} missing sourceHandle`);
    assert(edge.targetHandle && edge.targetHandle.length > 0, `Cloned edge ${edge.id} missing targetHandle`);
  }
});

test("FillTableFromLog resolves scalingAliases for 3D MAT vs MAP table", () => {
  const { FillTableFromLog } = require("@/app/_lib/rom");
  const { scalingAliases } = require("@/app/_lib/consts");

  // Verify scalingAliases mapping for MAT and Temp
  assert.equal(scalingAliases["Temp"].insteadUse, "MAT");
  assert.equal(scalingAliases["Temp"].expr, "MAT * 1.8 + 32");
  assert.equal(scalingAliases["TempC"].insteadUse, "MAT");
  assert.equal(scalingAliases["MAT"].insteadUse, "MAT");

  const tableMatMap: Table3D<number> = {
    type: "3D",
    name: "Fuel Compensation MAT vs MAP - Stock3bar",
    scaling: "Multiplier",
    address: "60fcd",
    xAxis: {
      name: "Pressure",
      type: "X Axis",
      elements: 3,
      address: "61000",
      scaling: "StockXMAP in kPa",
      values: [50, 100, 150],
    },
    yAxis: {
      name: "Temp",
      type: "Y Axis",
      elements: 3,
      address: "62000",
      scaling: "Temp", // XML axis name/scaling is Temp (Fahrenheit in EcuFlash)
      values: [41, 68, 104], // 5°C, 20°C, 40°C in Fahrenheit
    },
    values: [
      [1.0, 1.0, 1.0],
      [1.02, 1.02, 1.02],
      [1.05, 1.05, 1.05],
    ],
  };

  // Log record has 'MAT' in Celsius (20°C -> 68°F)
  const logs: LogRecord[] = [
    { LogID: 1, MAP: 100, MAT: 20, AFR: 14.7 },
  ];

  const logTable = FillTableFromLog(tableMatMap, logs, true) as Table3D<LogRecord[]>;
  assert(logTable !== undefined && logTable !== null);
  assert.equal(logTable.type, "3D");

  // Row index 1 is MAT=68°F (from MAT=20°C), Col index 1 is MAP=100
  assert.equal(logTable.values[1][1].length, 1);
  assert.equal(logTable.values[1][1][0].LogID, 1);
  assert.equal(logTable.values[1][1][0].weight, 1.0);
});

test("calculateMatTempInvariance flattens temperature AFR delta to reference temperature", () => {
  const { calculateMatTempInvariance } = require("@/app/_lib/rom");

  // Real 4B11T table with Fahrenheit axis
  const tableMatMap: Table3D<number> = {
    type: "3D",
    name: "Fuel Compensation MAT vs MAP - Stock3bar",
    scaling: "Multiplier",
    address: "60fcd",
    xAxis: {
      name: "Pressure",
      type: "X Axis",
      elements: 3,
      address: "61000",
      scaling: "StockXMAP in kPa",
      values: [40, 80, 120],
    },
    yAxis: {
      name: "Temp",
      type: "Y Axis",
      elements: 3,
      address: "62000",
      scaling: "Temp",
      values: [41, 68, 104], // 41°F (+5°C), 68°F (+20°C), 104°F (+40°C)
    },
    values: [
      [1.000, 1.000, 1.000], // 41°F
      [1.025, 1.025, 1.025], // 68°F (reference)
      [1.060, 1.060, 1.060], // 104°F (hot)
    ],
  };

  // 10 records at MAT=20°C (morning): 20°C * 1.8 + 32 = 68°F
  // Runs 15.5 AFR (target 14.7 -> error 1.0544)
  const coolLogs: LogRecord[] = Array.from({ length: 10 }, (_, i) => ({
    LogID: i + 1,
    MAP: 40,
    MAT: 20,
    AFR: 15.5,
    AFRMAP: 14.7,
  }));

  // 10 records at MAT=40°C (afternoon): 40°C * 1.8 + 32 = 104°F
  // Runs 14.5 AFR (target 14.7 -> error 0.9864)
  const hotLogs: LogRecord[] = Array.from({ length: 10 }, (_, i) => ({
    LogID: i + 11,
    MAP: 40,
    MAT: 40,
    AFR: 14.5,
    AFRMAP: 14.7,
  }));

  const allLogs = [...coolLogs, ...hotLogs];

  const result = calculateMatTempInvariance(tableMatMap, allLogs, {
    refTemp: 68,
    minTempSpread: 10.0,
    minDistinctBins: 2,
    minCellSamples: 5,
    enableDamping: false, // test raw ratio precision
  });

  assert(result !== null);
  assert.equal(result.sufficient, true);
  assert.equal(result.refTempUsed, 68);

  // Column 0 is MAP=40 kPa:
  // Row 0 is 41°F (no samples) -> unchanged
  assert.equal(result.countTable.values[0][0], 0);
  assert.equal(result.deltaPercentTable.values[0][0], 0);
  assert.equal(result.correctedTable.values[0][0], 1.000);

  // Row 1 is 68°F (reference temperature from 20°C morning):
  // deltaPercent is 0.0%, baseline value 1.025 is UNCHANGED!
  assert.equal(result.countTable.values[1][0], 10);
  assert.equal(result.deltaPercentTable.values[1][0], 0);
  assert.equal(result.correctedTable.values[1][0], 1.025);

  // Row 2 is 104°F (hot temperature from 40°C afternoon):
  // Raw ratio = 0.9864 / 1.0544 = 0.9355 (-6.45% drift)
  assert.equal(result.countTable.values[2][0], 10);
  assert(Math.abs(result.deltaPercentTable.values[2][0] - (-6.45)) < 0.1);
  // Corrected value = 1.060 * 0.9355 = 0.9916
  assert(Math.abs(result.correctedTable.values[2][0] - (1.060 * (0.9864 / 1.0544))) < 0.001);

  // Verify resulting AFR equivalence:
  // Initial hot fuel multiplier: 1.060 -> gave 14.5 AFR.
  // New hot fuel multiplier: 0.9916 -> delivers (14.5 * 1.060 / 0.9916) = 15.5 AFR!
  const predictedHotAfr = 14.5 * (1.060 / result.correctedTable.values[2][0]);
  assert(Math.abs(predictedHotAfr - 15.5) < 0.05, "Hot AFR should equal cool AFR (15.5)!");
});

test("calculateMatTempInvariance anchors at 68°F base MAT and matches higher MAT to lower", () => {
  const { calculateMatTempInvariance } = require("@/app/_lib/rom");

  // Factory 4B11T MAT vs MAP table (Fahrenheit axis: 14, 41, 68, 104, 140, 176, 212)
  const table4B11T: Table3D<number> = {
    type: "3D",
    name: "Fuel Compensation MAT vs MAP - Stock3bar",
    scaling: "Multiplier",
    address: "60fcd",
    xAxis: {
      name: "Pressure",
      type: "X Axis",
      elements: 3,
      address: "634d4",
      scaling: "StockXMAP in kPa",
      values: [50, 100, 150],
    },
    yAxis: {
      name: "MAT",
      type: "Y Axis",
      elements: 7,
      address: "634c0",
      scaling: "Temp",
      values: [14, 41, 68, 104, 140, 176, 212],
    },
    values: [
      [1.10, 1.10, 1.10], // 14°F (-10°C winter)
      [1.05, 1.05, 1.05], // 41°F (+5°C cold ambient)
      [1.00, 1.00, 1.00], // 68°F (+20°C base MAT anchor)
      [1.03, 1.03, 1.03], // 104°F (+40°C warm commute & heat soak)
      [1.05, 1.05, 1.05], // 140°F (+60°C high heat soak)
      [1.00, 1.00, 1.00], // 176°F
      [1.00, 1.00, 1.00], // 212°F
    ],
  };

  // Morning commute: cool, MAT ~20°C in EvoScan log (evaluates to 68°F)
  // Car ran 15.6 AFR at 50 kPa
  const morningLogs: LogRecord[] = Array.from({ length: 15 }, (_, i) => ({
    LogID: i + 1,
    MAP: 50,
    MAT: 20,
    AFR: 15.6,
    AFRMAP: 14.7,
  }));

  // Afternoon commute: hot, MAT ~40°C in EvoScan log (evaluates to 104°F)
  // Heat soak caused car to run richer at 14.8 AFR
  const afternoonLogs: LogRecord[] = Array.from({ length: 15 }, (_, i) => ({
    LogID: i + 20,
    MAP: 50,
    MAT: 40,
    AFR: 14.8,
    AFRMAP: 14.7,
  }));

  const allLogs = [...morningLogs, ...afternoonLogs];

  // Default options (auto-detects 68°F baseline row for Fahrenheit table)
  const result = calculateMatTempInvariance(table4B11T, allLogs, {
    minTempSpread: 10.0,
    minDistinctBins: 2,
    minCellSamples: 5,
    enableDamping: false,
  });

  assert(result !== null);
  assert.equal(result.sufficient, true);
  // Auto picks 68°F (index 2) as baseline reference
  assert.equal(result.refTempUsed, 68);

  // 68°F row (index 2) is the base MAT: 0% drift, value unchanged (1.00)
  assert.equal(result.deltaPercentTable.values[2][0], 0);
  assert.equal(result.correctedTable.values[2][0], 1.00);

  // 104°F row (index 3): ran richer (14.8 vs 15.6)
  // Drift = (14.8 / 15.6 - 1) * 100 = -5.13%
  const driftPct = result.deltaPercentTable.values[3][0];
  assert(Math.abs(driftPct - (-5.13)) < 0.1, `Expected ~ -5.13% drift, got ${driftPct}`);

  // Corrected multiplier decreases to reduce fuel at higher MAT:
  const correctedMultiplier = result.correctedTable.values[3][0];
  assert(correctedMultiplier < 1.03, "Higher MAT multiplier must decrease to lean out afternoon rich drift");

  // Verify that predicted afternoon AFR now matches morning baseline:
  const predictedHotAfr = 14.8 * (1.03 / correctedMultiplier);
  assert(Math.abs(predictedHotAfr - 15.6) < 0.05, `Afternoon AFR (${predictedHotAfr}) must equal morning baseline (15.6)!`);
});
