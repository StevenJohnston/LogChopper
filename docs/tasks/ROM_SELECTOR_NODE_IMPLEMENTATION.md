### Introduction

This document outlines the implementation of the `RomSelectorNode`. The purpose of this node is to allow users to select a specific ROM file from within the flow canvas. This marks a shift from relying on a single, globally selected ROM, and opens up the possibility for powerful multi-ROM workflows, such as comparing tables from different ROM versions side-by-side.

The `RomSelectorNode` features a searchable dropdown menu, listing all available ROM files from the user-selected directory. The output of this node is a ROM data object that can be connected to any node that accepts a ROM input, like the `BaseTableNode`.

---

### Implementation Details

#### Phase 1: State Management for ROM Files

-   [x] **Augmented `useRom` Store:**
    -   Instead of creating a new store, the existing `useRom` store in `app/store/useRom.ts` was enhanced.
    -   A new property, `romFiles: FileSystemFileHandle[]`, was added to the `RomState` to hold a list of all files from the selected ROMs directory.

-   [x] **Created a File Utility:**
    -   A new asynchronous utility function, `getAllFileHandles`, was added to `app/_lib/utils.ts`. This function recursively scans a directory handle and returns a flat array of all file handles within it.

-   [x] **Integrated File Scanning:**
    -   The `setRomDirectoryHandle` action within the `useRom` store was updated to call `getAllFileHandles` and populate the new `romFiles` state property, making the list of ROMs globally available.

#### Phase 2: `RomSelectorNode` Implementation

-   [x] **Created Node Directory and Files:**
    -   A new directory was created: `app/_components/FlowNodes/RomSelector/`.
    -   `RomSelectorTypes.tsx`: Defines the `RomSelectorNodeType`. After refactoring, this type was defined to use `BaseRomData` directly as its data property to ensure compatibility with other nodes.
    -   `RomSelectorNodeFactory.ts`: A factory to create new `RomSelectorNode` instances, initializing them with an empty `BaseRomData` object.
    -   `RomSelectorNode.tsx`: The main component for the node.

-   [x] **Implemented Node UI with Headless UI:**
    -   A searchable dropdown was implemented using the `@headlessui/react` `Combobox` component.
    -   The combobox fetches the list of ROM files from the `useRom` store, filtering for `.bin` and `.srf` files.

-   [x] **Implemented File Sorting:**
    -   To improve usability, the list of ROMs in the dropdown is sorted by modification date, with the newest files appearing at the top. This is handled asynchronously within the `RomSelectorNode` component using a `useEffect` hook.

-   [x] **Refactored Data Structure for Compatibility:**
    -   A critical bug was discovered where `BaseTableNode` could not read the data from `RomSelectorNode`. This was because `BaseTableNode` expects the node's `data` property to be a `BaseRomData` instance directly.
    -   The `RomSelectorNode` was refactored to adopt this structure, making it a compatible, drop-in replacement for the existing `BaseRomNode`.

#### Phase 3: Flow Integration and Bug Fixes

-   [x] **Updated `useFlow.ts` Store:**
    -   The `RomSelectorNodeType` was added to the `MyNode` type union.

-   [x] **Registered Node in `Flow.tsx`:**
    -   The `RomSelectorNode` component was imported and correctly mapped to the `romSelector` type string in the `nodeTypes` map. This fixed a bug where the node was rendering as a default React Flow node.

-   [x] **Corrected Handle `dataType`:**
    -   The `dataType` on the node's output `CustomHandle` was changed from lowercase `'rom'` to uppercase `'Rom'` to match the application's convention and fix a bug preventing connections to other nodes.

-   [x] **Patched Core ROM Logic:**
    -   A critical bug was fixed in `app/_components/FlowNodes/BaseRom/BaseRomTypes.tsx`. The `addWorkerPromise` method in the `BaseRomData` class was hard-coded to only allow the `'BaseRomNode'` type, causing a crash when connecting to a `BaseTableNode`.
    -   This was patched to also accept the `'romSelector'` type, allowing `BaseTableNode` to correctly process updates from the new `RomSelectorNode`.

#### Phase 4: UI Integration

-   [x] **Added Node to Node Selector UI:**
    -   A new component, `app/_components/NodeSelector/RomSelectorButton.tsx`, was created to render a button for adding the new node.
    -   This button was added to the main `app/_components/NodeSelector/NodeSelector.tsx` component under the "Rom" section, making it accessible in the UI.

#### Phase 5: Testing

-   [x] **Performed Integration Testing (Manual):**
    -   The node was tested by adding it to the flow and selecting a ROM.
    -   Connection to a `BaseTableNode` was verified to work correctly, loading the appropriate table data.
    -   Several bugs related to data structures, type checks, and component registration were identified and fixed during this process, leading to the refactoring and patches described above.
