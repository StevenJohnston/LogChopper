`use client`;

import { createWithEqualityFn } from "zustand/traditional";
import { BasicTable, LoadRomMetadata, Scaling } from "@/app/_lib/rom-metadata";
import { createJSONStorage, persist } from "zustand/middleware";
import { findFileByName, getAllFileHandles } from "@/app/_lib/utils";
import { getLogsForLatestRom } from "@/app/_lib/rom-logs";

export type RomState = {
  defaultXml: string | null;
  defaultRom: string | null;

  metadataDirectoryHandle: FileSystemDirectoryHandle | null;
  romDirectoryHandle: FileSystemDirectoryHandle | null;
  romFiles: FileSystemFileHandle[];
  logDirectoryHandle: FileSystemDirectoryHandle | null;
  logFiles: FileSystemFileHandle[];
  selectedRomMetadataHandle: FileSystemFileHandle | null;
  selectedRom: FileSystemFileHandle | null;
  scalingMap: Record<string, Scaling>;
  // tableMap: Record<string, Table<unknown>>;
  tableMap: Record<string, BasicTable>;

  selectedLogs: FileSystemFileHandle[];

  setMetadataDirectoryHandle: (
    metadataDirectoryHandle: FileSystemDirectoryHandle
  ) => Promise<void>;
  setRomDirectoryHandle: (
    romDirectoryHandle: FileSystemDirectoryHandle
  ) => Promise<void>;
  setLogDirectoryHandle: (
    logDirectoryHandle: FileSystemDirectoryHandle | null
  ) => Promise<void>;
  setSelectedRomMetadataHandle: (
    selectedRomMetadataHandle: FileSystemFileHandle
  ) => void;
  setSelectedRom: (selectedRom: FileSystemFileHandle) => void;
  setScalingMap: (scalingMap: Record<string, Scaling>) => void;
  setTableMap: (tableMap: Record<string, BasicTable>) => void;
  setSelectedLogs: (selectedLogs: FileSystemFileHandle[]) => void;
  autoPopulateLogsForRom: (
    romHandle?: FileSystemFileHandle | null
  ) => Promise<FileSystemFileHandle[]>;
};

export function useRomSelector(state: RomState) {
  return {
    metadataDirectoryHandle: state.metadataDirectoryHandle,
    romDirectoryHandle: state.romDirectoryHandle,
    romFiles: state.romFiles,
    logDirectoryHandle: state.logDirectoryHandle,
    logFiles: state.logFiles,

    selectedRomMetadataHandle: state.selectedRomMetadataHandle,
    selectedRom: state.selectedRom,
    scalingMap: state.scalingMap,
    tableMap: state.tableMap,
    selectedLogs: state.selectedLogs,

    setMetadataDirectoryHandle: state.setMetadataDirectoryHandle,
    setRomDirectoryHandle: state.setRomDirectoryHandle,
    setLogDirectoryHandle: state.setLogDirectoryHandle,

    setSelectedRomMetadataHandle: state.setSelectedRomMetadataHandle,
    setSelectedRom: state.setSelectedRom,
    setScalingMap: state.setScalingMap,
    setTableMap: state.setTableMap,
    setSelectedLogs: state.setSelectedLogs,
    autoPopulateLogsForRom: state.autoPopulateLogsForRom,
  };
}

const useRom = createWithEqualityFn<RomState>()(
  persist(
    (set, get) => ({
      defaultXml: null,
      defaultRom: null,

      metadataDirectoryHandle: null,
      romDirectoryHandle: null,
      romFiles: [],
      logDirectoryHandle: null,
      logFiles: [],
      selectedRomMetadataHandle: null,
      selectedRom: null,
      scalingMap: {},
      tableMap: {},

      selectedLogs: [],

      setMetadataDirectoryHandle: async (
        metadataDirectoryHandle: FileSystemDirectoryHandle
      ) => {
        set({ metadataDirectoryHandle });

        // Select default xml
        const defaultXml = get().defaultXml;
        if (defaultXml == null) return;

        const defaultRomMetadata = await findFileByName(
          metadataDirectoryHandle,
          // "TephraMOD-59580304.xml"
          defaultXml
        );
        if (!defaultRomMetadata) return;

        const loadedRomMetaData = await LoadRomMetadata(
          metadataDirectoryHandle,
          defaultRomMetadata
        );

        if (loadedRomMetaData == undefined)
          return console.log(
            "useRom setMetadataDirectoryHandle failed to load RomMetaData"
          );
        const { scalingMap, tableMap } = loadedRomMetaData;

        get().setScalingMap(scalingMap);
        get().setTableMap(tableMap);

        get().setSelectedRomMetadataHandle(defaultRomMetadata);
      },
      setRomDirectoryHandle: async (
        romDirectoryHandle: FileSystemDirectoryHandle
      ) => {
        const romFiles = await getAllFileHandles(romDirectoryHandle);
        set({ romDirectoryHandle, romFiles });

        // Select default xml
        const defaultRom = get().defaultRom;
        if (defaultRom == null) return;

        const rom = await findFileByName(
          romDirectoryHandle,
          defaultRom
          // "Steven Johnston 2.0L 8474 ID1300 GSC S2 FR3.5 Intake 94 oct V3.17.00.6-openloop-enrichedidle.srf"
        );
        if (rom) {
          get().setSelectedRom(rom);
        }
      },
      setLogDirectoryHandle: async (
        logDirectoryHandle: FileSystemDirectoryHandle | null
      ) => {
        if (logDirectoryHandle) {
          const logFiles = await getAllFileHandles(logDirectoryHandle);
          set({ logDirectoryHandle, logFiles });
          if (get().selectedRom) {
            await get().autoPopulateLogsForRom(get().selectedRom);
          }
        } else {
          set({ logDirectoryHandle: null, logFiles: [] });
        }
      },

      setSelectedRomMetadataHandle: async (
        selectedRomMetadataHandle: FileSystemFileHandle
      ) => {
        set({
          defaultXml: selectedRomMetadataHandle.name,
          selectedRomMetadataHandle,
        });
      },
      setSelectedRom: (selectedRom: FileSystemFileHandle) => {
        set({
          defaultRom: selectedRom.name,
          selectedRom,
        });
        get().autoPopulateLogsForRom(selectedRom);
      },
      setScalingMap: (scalingMap: Record<string, Scaling>) => {
        set({ scalingMap });
      },
      setTableMap: (tableMap: Record<string, BasicTable>) => {
        set({ tableMap });
      },
      setSelectedLogs: async (selectedLogs: FileSystemFileHandle[]) => {
        set({ selectedLogs });
      },
      autoPopulateLogsForRom: async (
        romHandle?: FileSystemFileHandle | null
      ) => {
        const targetRom = romHandle || get().selectedRom;
        if (!targetRom) return [];

        const romDir = get().romDirectoryHandle;
        let romHandles = get().romFiles;
        if (romDir) {
          try {
            romHandles = await getAllFileHandles(romDir);
            set({ romFiles: romHandles });
          } catch (e) {
            console.error("Failed to get rom file handles", e);
          }
        }

        const logDir = get().logDirectoryHandle;
        let logHandles = get().logFiles;
        if (logDir) {
          try {
            logHandles = await getAllFileHandles(logDir);
            set({ logFiles: logHandles });
          } catch (e) {
            console.error("Failed to get log file handles", e);
          }
        }

        const result = await getLogsForLatestRom(
          targetRom,
          romHandles,
          logHandles
        );

        if (result.isLatestRom) {
          set({ selectedLogs: result.selectedLogs });
          return result.selectedLogs;
        } else {
          set({ selectedLogs: [] });
          return [];
        }
      },
    }),
    {
      name: "rom-data", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      partialize: (state) => ({
        defaultXml: state.defaultXml,
        defaultRom: state.defaultRom,
      }),
    }
  )
);

export default useRom;
