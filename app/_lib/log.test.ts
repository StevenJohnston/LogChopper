import { test } from "node:test";
import assert from "node:assert";
import {
  Direction,
  LogRecord,
  fixAfrLag,
  movingAverageFilter,
  smoothUpcomingChanges,
  smoothSpeedAndCalculateGear,
  DefaultGearRatios,
} from "@/app/_lib/log";

type GeneratorInput = [AFR: number, IPW: number, inc?: number];
function* logGenerator(
  logEntrySecondsInc: number = 0.1
): Generator<LogRecord, LogRecord, GeneratorInput> {
  let LogEntrySeconds = 0;
  let lastCall: GeneratorInput = [0, 0];
  while (true) {
    lastCall = yield {
      LogEntrySeconds,
      AFR: lastCall[0],
      IPW: lastCall[1],
    };

    LogEntrySeconds += lastCall[2] || logEntrySecondsInc;
  }
}

const leanLog: GeneratorInput = [18.5, 0];
const richLog: GeneratorInput = [10, 10];

test("fixAfrLag empty", () => {
  const logRecords: Partial<LogRecord>[] = [];
  fixAfrLag(logRecords, {});

  assert.deepEqual(logRecords, []);
});

test("fixAfrLag no fix required lean", () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next(leanLog).value,
    logGen.next(leanLog).value,
    logGen.next(leanLog).value,
    logGen.next(leanLog).value,
  ];
  const logGenExpected = logGenerator();
  logGenExpected.next();

  const expected: Partial<LogRecord>[] = [
    logGenExpected.next(leanLog).value,
    logGenExpected.next(leanLog).value,
    logGenExpected.next(leanLog).value,
    logGenExpected.next(leanLog).value,
  ];
  fixAfrLag(logRecords, {});

  assert.deepEqual(logRecords, expected);
});

test("fixAfrLag no fix required rich", () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next(richLog).value,
    logGen.next(richLog).value,
    logGen.next(richLog).value,
    logGen.next(richLog).value,
  ];
  const logGenExpected = logGenerator();
  logGenExpected.next();

  const expected: Partial<LogRecord>[] = [
    logGenExpected.next(richLog).value,
    logGenExpected.next(richLog).value,
    logGenExpected.next(richLog).value,
    logGenExpected.next(richLog).value,
  ];
  fixAfrLag(logRecords, { minAfrDurationSeconds: 0 });

  assert.deepEqual(logRecords, expected);
});

test("fixAfrLag no fix no lag", () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next(richLog).value,
    logGen.next(leanLog).value,
    logGen.next(richLog).value,
    logGen.next(leanLog).value,
  ];
  const logGenExpected = logGenerator();
  logGenExpected.next();

  const expected: Partial<LogRecord>[] = [
    logGenExpected.next(richLog).value,
    logGenExpected.next(leanLog).value,
    logGenExpected.next(richLog).value,
    logGenExpected.next(leanLog).value,
  ];
  fixAfrLag(logRecords, { minAfrDurationSeconds: 0 });

  assert.deepEqual(logRecords, expected);
});

test("fixAfrLag AFR lean -> rich", () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([18.5, 1]).value,
    logGen.next([18.5, 1]).value,
    logGen.next([14.7, 1]).value,
    logGen.next([14.7, 1]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([14.7, 1]).value,
  ];
  fixAfrLag(logRecords, { minAfrDurationSeconds: 0 });

  assert.deepEqual(logRecords, expected);
});

test("fixAfrLag AFR rich -> lean", () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([14.7, 1]).value,
    logGen.next([14.7, 1]).value,
    logGen.next([18.5, 1]).value,
    logGen.next([18.5, 1]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([14.7, 1]).value,
  ];
  fixAfrLag(logRecords, { minAfrDurationSeconds: 0.1 });

  assert.deepEqual(logRecords, expected);
});

test("fixAfrLag IPW rich -> lean", () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([14.7, 1]).value,
    logGen.next([14.7, 1]).value,
    logGen.next([14.7, 1]).value,
    logGen.next([14.7, 0]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([18.5, 0]).value,
  ];
  fixAfrLag(logRecords, { minAfrDurationSeconds: 0 });

  assert.deepEqual(logRecords, expected);
});

test("fixAfrLag IPW lean -> rich", () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([14.7, 0]).value,
    logGen.next([14.7, 0]).value,
    logGen.next([14.7, 0]).value,
    logGen.next([14.7, 1]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    logGenExpected.next([18.5, 0]).value,
    logGenExpected.next([18.5, 0]).value,
    logGenExpected.next([18.5, 0]).value,
    logGenExpected.next([14.7, 1]).value,
  ];
  fixAfrLag(logRecords, { minAfrDurationSeconds: 0 });

  assert.deepEqual(logRecords, expected);
});

test("fixAfrLag rich -> lean -> rich", () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([14.7, 1]).value,
    logGen.next([14.7, 1]).value,
    logGen.next([14.7, 1]).value,
    logGen.next([14.7, 0]).value,
    logGen.next([14.7, 1]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([18.5, 0]).value,
    logGenExpected.next([14.7, 1]).value,
  ];
  fixAfrLag(logRecords, { minAfrDurationSeconds: 0 });

  assert.deepEqual(logRecords, expected);
});

test("fixAfrLag lean -> rich -> lean", () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([18.5, 1]).value,
    logGen.next([14.7, 1]).value,
    logGen.next([14.7, 1]).value,
    logGen.next([14.7, 0]).value,
    logGen.next([18.5, 0]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([18.5, 0]).value,
    logGenExpected.next([18.5, 0]).value,
  ];
  fixAfrLag(logRecords, { minAfrDurationSeconds: 0 });

  assert.deepEqual(logRecords, expected);
});

// In this test there will be "rich" IPW than AFR so we will expand them
test("fixAfrLag stretch AFR to IPW", () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([10, 0]).value,
    logGen.next([18.5, 1]).value,
    logGen.next([10, 1]).value,
    logGen.next([11, 2]).value,
    logGen.next([12, 0]).value,
    logGen.next([14, 0]).value,
    logGen.next([18.5, 1]).value,
    logGen.next([14.7, 1]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    logGenExpected.next([18.5, 0]).value,
    logGenExpected.next([10, 1]).value,
    logGenExpected.next([11.5, 1]).value,
    logGenExpected.next([14, 2]).value,
    logGenExpected.next([18.5, 0]).value,
    logGenExpected.next([18.5, 0]).value,
    logGenExpected.next([14.7, 1]).value,
    logGenExpected.next([14.7, 1]).value,
  ];
  fixAfrLag(logRecords, { minAfrDurationSeconds: 0 });

  assert.deepEqual(logRecords, expected);
});

test("fixAfrLag shirink AFR to IPW", () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([10, 0]).value,
    logGen.next([18.5, 0]).value,
    logGen.next([10, 1]).value,
    logGen.next([11, 2]).value,
    logGen.next([12, 3]).value,
    logGen.next([13, 0]).value,
    logGen.next([14, 0]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    logGenExpected.next([18.5, 0]).value,
    logGenExpected.next([18.5, 0]).value,
    logGenExpected.next([10, 1]).value,
    logGenExpected.next([12, 2]).value,
    logGenExpected.next([14, 3]).value,
    logGenExpected.next([18.5, 0]).value,
    logGenExpected.next([18.5, 0]).value,
  ];
  fixAfrLag(logRecords, { minAfrDurationSeconds: 0 });

  assert.deepEqual(logRecords, expected);
});

test("fixAfrLag skip small AFR", () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([18.5, 0, 1]).value,
    logGen.next([18.5, 1, 1]).value,
    logGen.next([18.5, 0, 1]).value,
    logGen.next([13.5, 1, 1]).value,
    logGen.next([13.5, 1, 2]).value,
    logGen.next([18.5, 0, 1]).value,
    logGen.next([18.5, 1, 1]).value,
    logGen.next([14.7, 1, 1]).value,
    logGen.next([14.7, 1, 1]).value,
    logGen.next([18.5, 0, 1]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    logGenExpected.next([18.5, 0, 1]).value,
    logGenExpected.next([13.5, 1, 1]).value,
    logGenExpected.next([18.5, 0, 1]).value,
    logGenExpected.next([13.5, 1, 1]).value,
    logGenExpected.next([13.5, 1, 2]).value,
    logGenExpected.next([18.5, 0, 1]).value,
    logGenExpected.next([18.5, 0, 1]).value,
    logGenExpected.next([18.5, 0, 1]).value,
    logGenExpected.next([18.5, 0, 1]).value,
    logGenExpected.next([18.5, 0, 1]).value,
  ];
  fixAfrLag(logRecords, { minAfrDurationSeconds: 2 });

  assert.deepEqual(logRecords, expected);
});

test("fixAfrLag AFR too laggy", () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([18.5, 0, 1]).value,
    logGen.next([18.5, 1, 1]).value,
    logGen.next([14.7, 1, 10]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    logGenExpected.next([18.5, 0, 1]).value,
    logGenExpected.next([18.5, 0, 1]).value,
    logGenExpected.next([14.7, 1, 10]).value,
  ];
  fixAfrLag(logRecords, { minAfrDurationSeconds: 0, maxDelaySeconds: 5 });

  assert.deepEqual(logRecords, expected);
});

test("fixAfrLag AFR far longer than IPW", () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([18.5, 0, 1]).value,
    logGen.next([18.5, 1, 1]).value,
    logGen.next([10, 1, 1]).value,
    logGen.next([11, 1, 2]).value,
    logGen.next([12, 0, 2]).value,
    logGen.next([13, 0, 2]).value,
    logGen.next([14.7, 1, 1]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    logGenExpected.next([18.5, 0, 1]).value,
    logGenExpected.next([10, 1, 1]).value,
    logGenExpected.next([11.5, 1, 1]).value,
    logGenExpected.next([13, 1, 2]).value,
    logGenExpected.next([18.5, 0, 2]).value,
    logGenExpected.next([18.5, 0, 2]).value,
    logGenExpected.next([14.7, 1, 1]).value,
  ];
  fixAfrLag(logRecords, { minAfrDurationSeconds: 0, maxDelaySeconds: 2 });

  assert.deepEqual(logRecords, expected);
});

function addDelete(logRecord: LogRecord) {
  return {
    ...logRecord,
    delete: true,
  };
}

test("movingAverageFilter flat", async () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([10, 0, 1]).value,
    logGen.next([10, 0, 1]).value,
    logGen.next([10, 0, 1]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    logGenExpected.next([10, 0, 1]).value,
    logGenExpected.next([10, 0, 1]).value,
    logGenExpected.next([10, 0, 1]).value,
  ];
  await movingAverageFilter(logRecords, "AFR", 0.1, 0.1, Direction.ACC);

  assert.deepEqual(logRecords, expected);
});

test("movingAverageFilter DESC delete", async () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([100, 0, 1]).value,
    logGen.next([10, 0, 1]).value,
    logGen.next([10, 0, 1]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    addDelete(logGenExpected.next([100, 0, 1]).value),
    logGenExpected.next([10, 0, 1]).value,
    logGenExpected.next([10, 0, 1]).value,
  ];
  await movingAverageFilter(logRecords, "AFR", 0.1, 0.1, Direction.DESC);

  assert.deepEqual(logRecords, expected);
});

test("movingAverageFilter ACC", async () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([100, 0, 1]).value,
    logGen.next([10, 0, 1]).value,
    logGen.next([10, 0, 1]).value,
    logGen.next([10, 0, 1]).value,
    logGen.next([10, 0, 1]).value,
    logGen.next([10, 0, 1]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    logGenExpected.next([100, 0, 1]).value,
    addDelete(logGenExpected.next([10, 0, 1]).value),
    logGenExpected.next([10, 0, 1]).value,
    logGenExpected.next([10, 0, 1]).value,
    logGenExpected.next([10, 0, 1]).value,
    logGenExpected.next([10, 0, 1]).value,
  ];
  await movingAverageFilter(logRecords, "AFR", 0.1, 0.1, Direction.ACC);

  assert.deepEqual(logRecords, expected);
});

test("movingAverageFilter BOTH", async () => {
  const logGen = logGenerator();
  logGen.next();
  const logRecords: Partial<LogRecord>[] = [
    logGen.next([100, 0, 1]).value,
    logGen.next([10, 0, 1]).value,
    logGen.next([10, 0, 1]).value,
    logGen.next([10, 0, 1]).value,
    logGen.next([10, 0, 1]).value,
    logGen.next([10, 0, 1]).value,
  ];

  const logGenExpected = logGenerator();
  logGenExpected.next();
  const expected: Partial<LogRecord>[] = [
    addDelete(logGenExpected.next([100, 0, 1]).value),
    addDelete(logGenExpected.next([10, 0, 1]).value),
    logGenExpected.next([10, 0, 1]).value,
    logGenExpected.next([10, 0, 1]).value,
    logGenExpected.next([10, 0, 1]).value,
    logGenExpected.next([10, 0, 1]).value,
  ];
  await movingAverageFilter(logRecords, "AFR", 0.1, 0.1, Direction.BOTH);

  assert.deepEqual(logRecords, expected);
});

test("smoothUpcomingChanges ramps before step changes and preserves true speed records", () => {
  // 0s jumping to 2, then jumping to 4
  const speeds = [0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4];
  const smoothed = smoothUpcomingChanges(speeds, 20);
  assert.strictEqual(smoothed[5], 2); // Jump record to 2 must be exactly 2
  assert.strictEqual(smoothed[10], 4); // Jump record to 4 must be exactly 4
  assert.ok(smoothed[4] > 0 && smoothed[4] < 2); // Ramps up prior to index 5
  assert.ok(smoothed[9] > 2 && smoothed[9] < 4); // Ramps up prior to index 10

  // Long flat run > lookahead (20): stays flat at 50 initially, then ramps retroactively halfLookahead (10) before change
  const longSpeeds = [...Array(22).fill(50), ...Array(5).fill(52)];
  const longSmoothed = smoothUpcomingChanges(longSpeeds, 20);
  assert.strictEqual(longSmoothed[0], 50);
  assert.strictEqual(longSmoothed[10], 50);
  assert.ok(longSmoothed[15] > 50);
  assert.strictEqual(longSmoothed[22], 52);
});

test("smoothSpeedAndCalculateGear calculates gear based on ratio", () => {
  const makeBlock = (rpm: number, speed: number, count: number): LogRecord[] =>
    Array(count).fill(null).map(() => ({ RPM: rpm, Speed: speed }));

  const records: LogRecord[] = [
    ...makeBlock(3000, 23, 10),   // Gear 1 (~130.4)
    ...makeBlock(3000, 37.5, 10), // Gear 2 (~80)
    ...makeBlock(3000, 52.6, 10), // Gear 3 (~57)
    ...makeBlock(3000, 71.4, 10), // Gear 4 (~42)
    ...makeBlock(3000, 100, 10),  // Gear 5 (~30)
    ...makeBlock(0, 0, 5),        // Neutral
  ];

  const result = smoothSpeedAndCalculateGear(records, DefaultGearRatios, 3);
  assert.strictEqual(result[4].Gear, 1);
  assert.strictEqual(result[14].Gear, 2);
  assert.strictEqual(result[24].Gear, 3);
  assert.strictEqual(result[34].Gear, 4);
  assert.strictEqual(result[44].Gear, 5);
  assert.strictEqual(result[52].Gear, 0);
  assert.ok("SmoothedSpeed" in result[0]);
  assert.ok("GearAccuracy" in result[0]);
  assert.strictEqual(result[14].GearAccuracy, 0); // 3000 / 37.5 = 80 -> 0% off ratio 80
  assert.ok(result[4].GearAccuracy! > 0); // 3000 / 23 = 130.43 vs 130 -> >0% off
});

test("gear calculation remains stable with hysteresis near ratio boundaries", () => {
  const records: LogRecord[] = [
    { RPM: 3000, Speed: 52.6 }, // Gear 3 (~57)
    { RPM: 3000, Speed: 44.5 }, // Ratio 67.4 (near 57 and 80 boundary)
    { RPM: 3000, Speed: 44.0 }, // Ratio 68.2
    { RPM: 3000, Speed: 52.6 }, // Gear 3 (~57)
  ];
  const result = smoothSpeedAndCalculateGear(records, DefaultGearRatios, 1);
  // All records stay in Gear 3 without erratic flipping
  assert.strictEqual(result[0].Gear, 3);
  assert.strictEqual(result[1].Gear, 3);
  assert.strictEqual(result[2].Gear, 3);
  assert.strictEqual(result[3].Gear, 3);
});

test("rolling gear accuracy filter marks inaccurate records and records within window prior to inaccuracy", () => {
  const records: LogRecord[] = [
    { LogEntrySeconds: 0.0, RPM: 3000, Speed: 37.5 }, // 0% off (Gear 2 = 80)
    { LogEntrySeconds: 0.2, RPM: 3000, Speed: 37.5 }, // 0% off
    { LogEntrySeconds: 0.4, RPM: 3000, Speed: 37.5 }, // 0% off
    { LogEntrySeconds: 0.6, RPM: 3000, Speed: 30.0 }, // 100 ratio -> 25% off ratio 80 (bad!)
    { LogEntrySeconds: 0.8, RPM: 3000, Speed: 37.5 }, // 0% off
  ];

  // Max accuracy = 10%, window = 0.5s
  const result = smoothSpeedAndCalculateGear(records, DefaultGearRatios, 1, {
    enableFilter: true,
    invertFilter: false,
    maxAccuracy: 10,
    filterWindowSeconds: 0.5,
  });

  // t=0.6 (index 3) is 25% > 10% -> deleted
  assert.strictEqual(result[3].delete, true);
  // t=0.4 (index 2, 0.6 - 0.4 = 0.2 <= 0.5s) -> deleted
  assert.strictEqual(result[2].delete, true);
  // t=0.2 (index 1, 0.6 - 0.2 = 0.4 <= 0.5s) -> deleted
  assert.strictEqual(result[1].delete, true);
  // t=0.0 (index 0, 0.6 - 0.0 = 0.6 > 0.5s) -> NOT deleted
  assert.notStrictEqual(result[0].delete, true);
  // t=0.8 (index 4, after inaccuracy) -> NOT deleted
  assert.notStrictEqual(result[4].delete, true);
});

test("inverted rolling gear accuracy filter keeps inaccurate records and deletes good records", () => {
  const records: LogRecord[] = [
    { LogEntrySeconds: 0.0, RPM: 3000, Speed: 37.5 },
    { LogEntrySeconds: 0.2, RPM: 3000, Speed: 37.5 },
    { LogEntrySeconds: 0.6, RPM: 3000, Speed: 30.0 }, // Bad record
  ];

  const result = smoothSpeedAndCalculateGear(records, DefaultGearRatios, 1, {
    enableFilter: true,
    invertFilter: true,
    maxAccuracy: 10,
    filterWindowSeconds: 0.5,
  });

  // Bad records (t=0.2, t=0.6) are kept in inverted mode (delete is not true)
  assert.notStrictEqual(result[1].delete, true);
  assert.notStrictEqual(result[2].delete, true);
  // Good record (t=0.0) is deleted in inverted mode
  assert.strictEqual(result[0].delete, true);
});

