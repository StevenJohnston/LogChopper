"use client";
export type Nullable<T> = T | null;

export async function findFileByName(
  directory: FileSystemDirectoryHandle,
  fileName: string
): Promise<FileSystemFileHandle | null> {
  try {
    for await (const entry of directory.values()) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        if (file.name == fileName) {
          return entry;
        }
      } else if (entry.kind === "directory") {
        const foundFile = await findFileByName(entry, fileName);
        if (foundFile) return foundFile;
      }
    }
  } catch (e) {
    console.log(e);
  }
  return null;
}

export const formatter = new Intl.DateTimeFormat("en-US", {
  // year: 'numeric',
  year: "2-digit",
  month: "2-digit",
  day: "2-digit", // '2-digit' for leading zero (e.g., 01)
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: 'h23',
});

export const getAllFileHandles = async (
  dirHandle: FileSystemDirectoryHandle
): Promise<FileSystemFileHandle[]> => {
  const files: FileSystemFileHandle[] = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file") {
      files.push(entry);
    } else if (entry.kind === "directory") {
      files.push(...(await getAllFileHandles(entry)));
    }
  }
  return files;
};

