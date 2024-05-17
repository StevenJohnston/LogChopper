`use client`;

import { createWithEqualityFn } from "zustand/traditional";
import { Scaling, Table } from "@/app/_lib/rom-metadata";

export type RomState = {
  directoryHandle: FileSystemDirectoryHandle | null;
  selectedRomMetadataHandle: FileSystemFileHandle | null;
  selectedRom: FileSystemFileHandle | null;
  scalingMap: Record<string, Scaling>;
  tableMap: Record<string, Table<unknown>>;

  selectedLogs: FileSystemFileHandle[];

  setDirectoryHandle: (
    directoryHandle: FileSystemDirectoryHandle | null
  ) => void;
  setSelectedRomMetadataHandle: (
    selectedRomMetadataHandle: FileSystemFileHandle | null
  ) => void;
  setSelectedRom: (selectedRom: FileSystemFileHandle | null) => void;
  setScalingMap: (scalingMap: Record<string, Scaling>) => void;
  setTableMap: (tableMap: Record<string, Table<unknown>>) => void;
  setSelectedLogs: (selectedLogs: FileSystemFileHandle[]) => void;
};

export function useRomSelector(state: RomState) {
  return {
    directoryHandle: state.directoryHandle,
    selectedRomMetadataHandle: state.selectedRomMetadataHandle,
    selectedRom: state.selectedRom,
    scalingMap: state.scalingMap,
    tableMap: state.tableMap,
    selectedLogs: state.selectedLogs,
    setDirectoryHandle: state.setDirectoryHandle,
    setSelectedRomMetadataHandle: state.setSelectedRomMetadataHandle,
    setSelectedRom: state.setSelectedRom,
    setScalingMap: state.setScalingMap,
    setTableMap: state.setTableMap,
    setSelectedLogs: state.setSelectedLogs,
  };
}

const useRom = createWithEqualityFn<RomState>((set) => ({
  directoryHandle: null,
  selectedRomMetadataHandle: null,
  selectedRom: null,
  scalingMap: {},
  tableMap: {},

  selectedLogs: [],

  setDirectoryHandle: (directoryHandle: FileSystemDirectoryHandle | null) => {
    set({ directoryHandle });
  },
  setSelectedRomMetadataHandle: (
    selectedRomMetadataHandle: FileSystemFileHandle | null
  ) => {
    set({ selectedRomMetadataHandle });
  },
  setSelectedRom: (selectedRom: FileSystemFileHandle | null) => {
    set({ selectedRom });
  },
  setScalingMap: (scalingMap: Record<string, Scaling>) => {
    set({ scalingMap });
  },
  setTableMap: (tableMap: Record<string, Table<unknown>>) => {
    set({ tableMap });
  },
  setSelectedLogs: async (selectedLogs: FileSystemFileHandle[]) => {
    set({ selectedLogs });
  },
}));

export default useRom;
