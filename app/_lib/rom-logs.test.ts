import test from "node:test";
import assert from "node:assert";
import {
  isRomFile,
  isLogFile,
  isLatestRom,
  getLogsDatedAfter,
  getLogsForLatestRom,
} from "./rom-logs";

function createMockFileHandle(name: string, lastModified: number): FileSystemFileHandle {
  return {
    kind: "file",
    name,
    getFile: async () => ({
      name,
      lastModified,
    } as unknown as File),
  } as unknown as FileSystemFileHandle;
}

test("isRomFile correctly identifies ROM files", () => {
  assert.strictEqual(isRomFile("tune.srf"), true);
  assert.strictEqual(isRomFile("tune.bin"), true);
  assert.strictEqual(isRomFile("TUNE.SRF"), true);
  assert.strictEqual(isRomFile("TUNE.BIN"), true);
  assert.strictEqual(isRomFile("log.csv"), false);
  assert.strictEqual(isRomFile("metadata.xml"), false);
  assert.strictEqual(isRomFile(".DS_Store"), false);
});

test("isLogFile correctly identifies log files", () => {
  assert.strictEqual(isLogFile("log.csv"), true);
  assert.strictEqual(isLogFile("EvoScanDataLog.CSV"), true);
  assert.strictEqual(isLogFile("tune.srf"), false);
  assert.strictEqual(isLogFile("tune.bin"), false);
  assert.strictEqual(isLogFile("readme.txt"), false);
});

test("isLatestRom correctly identifies latest ROM", async () => {
  const rom1 = createMockFileHandle("v1.srf", 1000);
  const rom2 = createMockFileHandle("v2.srf", 2000);
  const rom3 = createMockFileHandle("v3.srf", 3000);
  const nonRom = createMockFileHandle("notes.txt", 4000); // Newer, but not a ROM

  const allRoms = [rom1, rom2, rom3, nonRom];

  // rom3 is latest
  assert.strictEqual(await isLatestRom(rom3, allRoms), true);
  // rom2 is not latest
  assert.strictEqual(await isLatestRom(rom2, allRoms), false);
  // rom1 is not latest
  assert.strictEqual(await isLatestRom(rom1, allRoms), false);

  // Single ROM is always latest
  assert.strictEqual(await isLatestRom(rom1, [rom1]), true);
});

test("getLogsDatedAfter filters logs dated after ROM date and sorts descending", async () => {
  const log1 = createMockFileHandle("log1.csv", 1500); // Before rom date
  const log2 = createMockFileHandle("log2.csv", 2000); // Equal to rom date
  const log3 = createMockFileHandle("log3.csv", 2500); // After rom date
  const log4 = createMockFileHandle("log4.csv", 3500); // After rom date
  const nonLog = createMockFileHandle("notes.txt", 4000); // Not a log

  const logs = [log1, log2, log3, log4, nonLog];

  const result = await getLogsDatedAfter(2000, logs);

  assert.strictEqual(result.length, 2);
  // Sorted newest first: log4 (3500), then log3 (2500)
  assert.strictEqual(result[0].name, "log4.csv");
  assert.strictEqual(result[1].name, "log3.csv");
});

test("getLogsForLatestRom returns populated logs only if ROM is latest", async () => {
  const romOld = createMockFileHandle("v1.srf", 1000);
  const romLatest = createMockFileHandle("v2.srf", 2000);
  const roms = [romOld, romLatest];

  const logBefore = createMockFileHandle("log1.csv", 1500);
  const logAfter = createMockFileHandle("log2.csv", 2500);
  const logs = [logBefore, logAfter];

  // For older ROM: isLatestRom should be false, selectedLogs should be empty
  const oldResult = await getLogsForLatestRom(romOld, roms, logs);
  assert.strictEqual(oldResult.isLatestRom, false);
  assert.deepStrictEqual(oldResult.selectedLogs, []);

  // For latest ROM: isLatestRom should be true, selectedLogs should contain only logAfter
  const latestResult = await getLogsForLatestRom(romLatest, roms, logs);
  assert.strictEqual(latestResult.isLatestRom, true);
  assert.strictEqual(latestResult.selectedLogs.length, 1);
  assert.strictEqual(latestResult.selectedLogs[0].name, "log2.csv");
});

test("useRom store autoPopulateLogsForRom updates selectedLogs", async () => {
  if (typeof globalThis.localStorage === "undefined") {
    const storage = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, val: string) => storage.set(key, val),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
      length: storage.size,
      key: (i: number) => Array.from(storage.keys())[i] ?? null,
    };
  }

  const { default: useRom } = await import("../store/useRom");

  const romOld = createMockFileHandle("tune_v1.srf", 1000);
  const romNew = createMockFileHandle("tune_v2.srf", 2000);
  const logOld = createMockFileHandle("run1.csv", 1500);
  const logNew = createMockFileHandle("run2.csv", 2500);

  // Set initial state
  useRom.setState({
    romFiles: [romOld, romNew],
    logFiles: [logOld, logNew],
    romDirectoryHandle: null,
    logDirectoryHandle: null,
    selectedRom: null,
    selectedLogs: [],
  });

  // Select latest ROM: should auto-populate with logNew (dated > 2000)
  const populated = await useRom.getState().autoPopulateLogsForRom(romNew);
  assert.strictEqual(populated.length, 1);
  assert.strictEqual(populated[0].name, "run2.csv");
  assert.strictEqual(useRom.getState().selectedLogs.length, 1);
  assert.strictEqual(useRom.getState().selectedLogs[0].name, "run2.csv");

  // Select older ROM: should NOT auto-populate and should clear selectedLogs
  const populatedOld = await useRom.getState().autoPopulateLogsForRom(romOld);
  assert.strictEqual(populatedOld.length, 0);
  assert.strictEqual(useRom.getState().selectedLogs.length, 0);
});

