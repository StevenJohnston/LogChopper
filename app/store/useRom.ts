`use client`;

import { createWithEqualityFn } from "zustand/traditional";
import { BasicTable, LoadRomMetadata, Scaling } from "@/app/_lib/rom-metadata";
import { createJSONStorage, persist } from "zustand/middleware";
import { findFileByName, getAllFileHandles } from "@/app/_lib/utils";

export type RomState = {
  defaultXml: string | null;
  defaultRom: string | null;

  metadataDirectoryHandle: FileSystemDirectoryHandle | null;
  romDirectoryHandle: FileSystemDirectoryHandle | null;
  romFiles: FileSystemFileHandle[];
  logDirectoryHandle: FileSystemDirectoryHandle | null;
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
  ) => void;
  setSelectedRomMetadataHandle: (
    selectedRomMetadataHandle: FileSystemFileHandle
  ) => void;
  setSelectedRom: (selectedRom: FileSystemFileHandle) => void;
  setScalingMap: (scalingMap: Record<string, Scaling>) => void;
  setTableMap: (tableMap: Record<string, BasicTable>) => void;
  setSelectedLogs: (selectedLogs: FileSystemFileHandle[]) => void;
};

export function useRomSelector(state: RomState) {
  return {
    metadataDirectoryHandle: state.metadataDirectoryHandle,
    romDirectoryHandle: state.romDirectoryHandle,
    romFiles: state.romFiles,
    logDirectoryHandle: state.logDirectoryHandle,

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
      setLogDirectoryHandle: (
        logDirectoryHandle: FileSystemDirectoryHandle | null
      ) => {
        set({ logDirectoryHandle });
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
