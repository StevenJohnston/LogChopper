import { createWithEqualityFn } from "zustand/traditional";

interface CellSelectionState {
  tableName: string | null;
  startCell: [number, number] | null;
  endCell: [number, number] | null;
  setSelectedCell: (tableName: string, startCell: [number, number], endCell: [number, number]) => void;
  clearSelectedCell: () => void;
}

const useCellSelectionStore = createWithEqualityFn<CellSelectionState>(
  (set) => ({
    tableName: null,
    startCell: null,
    endCell: null,
    setSelectedCell: (tableName, startCell, endCell) =>
      set({ tableName, startCell, endCell }),
    clearSelectedCell: () => set({ tableName: null, startCell: null, endCell: null }),
  })
);

export default useCellSelectionStore;
