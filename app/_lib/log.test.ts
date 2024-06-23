import { test } from "node:test";
import assert from "node:assert";
import { LogRecord, fixAfrLag } from "@/app/_lib/log";

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
