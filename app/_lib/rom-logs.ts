"use client";

export const ROM_EXTENSIONS = [".srf", ".bin"];
export const LOG_EXTENSIONS = [".csv"];

export function isRomFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ROM_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isLogFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return LOG_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export async function isLatestRom(
  targetRomHandle: FileSystemFileHandle,
  romHandles: FileSystemFileHandle[]
): Promise<boolean> {
  const targetFile = await targetRomHandle.getFile();
  const targetDate = targetFile.lastModified;

  const validRomHandles = romHandles.filter((h) => isRomFile(h.name));

  for (const handle of validRomHandles) {
    try {
      const file = await handle.getFile();
      if (file.lastModified > targetDate) {
        return false;
      }
    } catch (e) {
      console.error("Failed to read ROM file", handle.name, e);
    }
  }

  return true;
}

export async function getLogsDatedAfter(
  romDate: number,
  logHandles: FileSystemFileHandle[]
): Promise<FileSystemFileHandle[]> {
  const validLogHandles = logHandles.filter((h) => isLogFile(h.name));

  const matching: { handle: FileSystemFileHandle; lastModified: number }[] = [];

  for (const handle of validLogHandles) {
    try {
      const file = await handle.getFile();
      if (file.lastModified > romDate) {
        matching.push({ handle, lastModified: file.lastModified });
      }
    } catch (e) {
      console.error("Failed to read log file", handle.name, e);
    }
  }

  // Sort descending by date (newest first)
  matching.sort((a, b) => b.lastModified - a.lastModified);
  return matching.map((item) => item.handle);
}

export interface AutoPopulateLogsResult {
  isLatestRom: boolean;
  selectedLogs: FileSystemFileHandle[];
}

export async function getLogsForLatestRom(
  targetRomHandle: FileSystemFileHandle,
  romHandles: FileSystemFileHandle[],
  logHandles: FileSystemFileHandle[]
): Promise<AutoPopulateLogsResult> {
  const isLatest = await isLatestRom(targetRomHandle, romHandles);
  if (!isLatest) {
    return {
      isLatestRom: false,
      selectedLogs: [],
    };
  }

  const targetFile = await targetRomHandle.getFile();
  const selectedLogs = await getLogsDatedAfter(targetFile.lastModified, logHandles);

  return {
    isLatestRom: true,
    selectedLogs,
  };
}
