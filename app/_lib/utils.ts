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
