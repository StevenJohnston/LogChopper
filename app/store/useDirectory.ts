import { create } from 'zustand';

interface DirectoryState {
    directoryHandle: FileSystemDirectoryHandle | null;
    files: FileSystemFileHandle[];
    setDirectoryHandle: (handle: FileSystemDirectoryHandle) => Promise<void>;
    getFiles: () => FileSystemFileHandle[];
}

const getAllFileHandles = async (dirHandle: FileSystemDirectoryHandle): Promise<FileSystemFileHandle[]> => {
    const files: FileSystemFileHandle[] = [];
    for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
            files.push(entry);
        } else if (entry.kind === 'directory') {
            files.push(...(await getAllFileHandles(entry)));
        }
    }
    return files;
};

export const useDirectory = create<DirectoryState>((set, get) => ({
    directoryHandle: null,
    files: [],
    setDirectoryHandle: async (handle: FileSystemDirectoryHandle) => {
        const files = await getAllFileHandles(handle);
        set({ directoryHandle: handle, files });
    },
    getFiles: () => get().files,
}));
