'use client';

import { createWithEqualityFn } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_LOG_FIELDS } from '@/app/_lib/log';

export interface LogColumnsState {
  knownColumns: string[];
  columnVisibility: Record<string, boolean>;
  toggleColumn: (column: string) => void;
  setColumnVisibility: (column: string, visible: boolean) => void;
  setMultipleColumnVisibility: (visibilityMap: Record<string, boolean>) => void;
  moveColumn: (sourceCol: string, targetCol: string) => void;
  reorderColumns: (fromIndex: number, toIndex: number) => void;
  setKnownColumns: (columns: string[]) => void;
  selectAll: () => void;
  deselectAll: () => void;
  resetToDefault: () => void;
  registerDiscoveredColumns: (columns: string[]) => void;
  isColumnVisible: (column: string) => boolean;
}

const initialVisibility = DEFAULT_LOG_FIELDS.reduce<Record<string, boolean>>((acc, col) => {
  acc[col] = true;
  return acc;
}, {});

export const useLogColumns = createWithEqualityFn<LogColumnsState>()(
  persist(
    (set, get) => ({
      knownColumns: [...DEFAULT_LOG_FIELDS],
      columnVisibility: initialVisibility,

      toggleColumn: (column: string) => {
        const currentVisibility = get().columnVisibility;
        const currentVal = currentVisibility[column] !== false;
        set({
          columnVisibility: {
            ...currentVisibility,
            [column]: !currentVal,
          },
        });
      },

      setColumnVisibility: (column: string, visible: boolean) => {
        set({
          columnVisibility: {
            ...get().columnVisibility,
            [column]: visible,
          },
        });
      },

      setMultipleColumnVisibility: (visibilityMap: Record<string, boolean>) => {
        set({
          columnVisibility: {
            ...get().columnVisibility,
            ...visibilityMap,
          },
        });
      },

      moveColumn: (sourceCol: string, targetCol: string) => {
        if (sourceCol === targetCol) return;
        const { knownColumns } = get();
        const fromIndex = knownColumns.indexOf(sourceCol);
        const toIndex = knownColumns.indexOf(targetCol);
        if (fromIndex === -1 || toIndex === -1) return;

        const updated = [...knownColumns];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        set({ knownColumns: updated });
      },

      reorderColumns: (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        const { knownColumns } = get();
        if (
          fromIndex < 0 ||
          fromIndex >= knownColumns.length ||
          toIndex < 0 ||
          toIndex >= knownColumns.length
        )
          return;

        const updated = [...knownColumns];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        set({ knownColumns: updated });
      },

      setKnownColumns: (columns: string[]) => {
        set({ knownColumns: [...columns] });
      },

      selectAll: () => {
        const { knownColumns } = get();
        const updated: Record<string, boolean> = {};
        for (const col of knownColumns) {
          updated[col] = true;
        }
        set({ columnVisibility: updated });
      },

      deselectAll: () => {
        const { knownColumns } = get();
        const updated: Record<string, boolean> = {};
        for (const col of knownColumns) {
          updated[col] = false;
        }
        set({ columnVisibility: updated });
      },

      resetToDefault: () => {
        const currentKnown = get().knownColumns;
        const customCols = currentKnown.filter(
          (col) => !DEFAULT_LOG_FIELDS.includes(col)
        );
        const combined = [...DEFAULT_LOG_FIELDS, ...customCols];
        const resetVisibility: Record<string, boolean> = {};
        for (const col of combined) {
          resetVisibility[col] = true;
        }
        set({
          knownColumns: combined,
          columnVisibility: resetVisibility,
        });
      },

      registerDiscoveredColumns: (columns: string[]) => {
        if (!columns || columns.length === 0) return;
        const { knownColumns, columnVisibility } = get();
        const newCols = columns.filter((col) => !knownColumns.includes(col));
        if (newCols.length === 0) return;

        const updatedKnown = [...knownColumns, ...newCols];
        const updatedVisibility = { ...columnVisibility };
        for (const col of newCols) {
          if (updatedVisibility[col] === undefined) {
            updatedVisibility[col] = true;
          }
        }

        set({
          knownColumns: updatedKnown,
          columnVisibility: updatedVisibility,
        });
      },

      isColumnVisible: (column: string) => {
        const { columnVisibility } = get();
        return columnVisibility[column] !== false;
      },
    }),
    {
      name: 'log-column-preferences',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
    }
  )
);

export default useLogColumns;
