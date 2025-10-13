### Introduction

This document outlines the implementation of a synchronized cell selection feature across all table views within the application. The goal is to enhance the user's data analysis workflow by allowing them to select a cell or a range of cells in one table and see the corresponding cell(s) highlighted in all other visible tables that share the same table name. This is particularly useful when comparing data from different sources or processing stages.

The feature ensures that existing functionality, such as the copy-to-clipboard text area, remains intact.

---

### Implementation Details

#### Phase 1: Centralized State Management for Cell Selection

-   [x] **Created a new Zustand Store (`app/store/useCellSelection.ts`):**
    -   A new store, `useCellSelectionStore`, was created to manage the global state of the selected cell(s).
    -   The `CellSelectionState` interface was defined to include:
        -   `tableName: string | null`: The name of the table where the selection originated.
        -   `startCell: [number, number] | null`: The `[rowIndex, colIndex]` of the starting cell of the selection.
        -   `endCell: [number, number] | null`: The `[rowIndex, colIndex]` of the ending cell of the selection.
    -   Actions were defined:
        -   `setSelectedCell(tableName, startCell, endCell)`: Updates the global state with the new table name and cell range.
        -   `clearSelectedCell()`: Resets the global selection state to `null`.

#### Phase 2: Modify Table Components to Use the Store

-   [x] **Identified and Refactored the Core Table UI (`app/_components/TableUI.tsx`):**
    -   The `TableUIProps` interface was updated to include a `tableName: string` prop, which is essential for identifying tables for synchronization.
    -   The `useCellSelectionStore` was integrated into the `TableUI` component, destructuring `selectedTableName`, `selectedStartCell`, `selectedEndCell`, `setSelectedCell`, and `clearSelectedCell`.

-   [x] **Integrated `useCellSelectionStore` into `TableUI.tsx` Event Handlers:**
    -   **`cellOnMouseDown`:** Modified to call `setSelectedCell(tableName, cellpos, cellpos)` when a cell is clicked, initializing the global selection as a single cell.
    -   **`cellOnMouseEnter`:** Modified to update `setSelectedCell(tableName, selectStartCell, endCell)` as the user drags across cells, dynamically updating the global selection range.
    -   **`cellOnMouseUp`:** Modified to call `setSelectedCell(tableName, selectStartCell, endCell)` with the final selection range after the mouse button is released. The existing `highlightCells()` function for local textarea population was preserved.

-   [x] **Implemented Highlighting Logic in `TableUI.tsx` (`formatCell`):**
    -   The `formatCell` function was updated to check if the current cell `[row, col]` falls within the globally `selectedStartCell` and `selectedEndCell` range (after sorting them to get min/max coordinates).
    -   If a match is found, a distinct CSS style (gold background, orange border) is applied to visually highlight the globally selected cell(s). This highlighting is in addition to the local drag-selection highlighting.

-   [x] **Implemented Global Deselection in `TableUI.tsx`:**
    -   An `onMouseUp` handler was added to the outermost `div` of the `TableUI` component.
    -   This handler calls `clearSelectedCell()` if the event target is not a `<td>` element, effectively clearing the global selection when the user clicks outside any table cell.

-   [x] **Updated `TableUI` Usage in Node Components:**
    -   **`app/_components/FlowNodes/TableRemap/TableRemapNode.tsx`:** The `TableUI` component call was updated to pass `tableName={outputTable.name || id}`.
    -   **`app/_components/RomModuleUI.tsx`:** The `TableUI` component call was updated to pass `tableName={table.name || "unknown"}`.
    -   **`app/_components/FlowNodes/BaseTable/BaseTableNode.tsx`:** The `RomModuleUI` component call was updated to pass `tableName={data.table.name || id}`.
    -   **`app/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableNode.tsx`:** The `RomModuleUI` component call was updated to pass `tableName={data.table.name || id}`.
    -   **`app/_components/FlowNodes/FillTable/FillTableNode.tsx`:** The `RomModuleUI` component call was updated to pass `tableName={data.table.name || id}`.
    -   **`app/_components/FlowNodes/Combine/CombineNode.tsx`:** The `RomModuleUI` component call was updated to pass `tableName={data.table.name || id}`.
    -   In all cases, the `tableName` prop is derived from the `table.name` property, with the node's `id` or a generic "unknown" as a fallback for unique identification.

#### Phase 3: Preserve Existing Functionality

-   [x] **Ensured Copy-Paste Functionality is Unbroken:**
    -   The existing logic for populating the `textarea` with selected cell values (`highlightCells` function) was carefully preserved and continues to function as before. The new global selection logic was integrated alongside it without interference.

#### Phase 4: Testing

-   [ ] **Perform Manual Integration Testing:**
    -   Add multiple table nodes (e.g., `BaseTableNode`, `CombineAdvancedTableNode`, `TableRemapNode`, etc.) to the flow canvas, ensuring some share the same table name.
    -   **Verify single-cell selection synchronization:** Select a single cell in one table and confirm that the same cell is highlighted in other tables with the same name.
    -   **Verify multi-cell selection synchronization:** Drag to select a range of cells in one table and confirm that the corresponding range is highlighted in other tables with the same name.
    -   **Verify isolation:** Confirm that tables with different names are not affected by the selection.
    -   **Verify copy-paste:** Confirm that selecting a cell or range of cells still populates the textarea for copying the value.
    -   **Verify deselection:** Test that clicking outside any table cell removes the highlight from all tables.