### Introduction

This document outlines the implementation of the `LogSelectorNode`. The purpose of this node is to allow users to select multiple log files from within the flow canvas. This is a significant improvement over the previous system, which relied on a single, globally selected set of logs, and enables more complex and flexible log analysis workflows.

The `LogSelectorNode` will feature a searchable multi-select dropdown menu, listing all available log files from the user-selected log directory. The output of this node will be a log data object that can be connected to any node that accepts a log input, such as `LogFilterNode` or `FillLogTableNode`.

---

### Implementation Details

#### Phase 1: State Management for Log Files

-   [x] **Enhance `useRom` Store:**
    -   The existing `useRom` store in `app/store/useRom.ts` will be updated.
    -   A new property, `logFiles: FileSystemFileHandle[]`, will be added to the `RomState` to hold a list of all files from the selected logs directory.

-   [x] **Update `setLogDirectoryHandle`:**
    -   The `setLogDirectoryHandle` action within the `useRom` store will be updated to call the existing `getAllFileHandles` utility function.
    -   This will populate the new `logFiles` state property, making the list of all available log files accessible to the new `LogSelectorNode`.

#### Phase 2: `LogSelectorNode` Implementation

-   [x] **Create Node Directory and Files:**
    -   A new directory will be created: `app/_components/FlowNodes/LogSelector/`.
    -   `LogSelectorTypes.tsx`: Defines the `LogSelectorNodeType` and its data structure. The data property will be an instance of `BaseLogData` to ensure compatibility with other log-processing nodes.
    -   `LogSelectorNodeFactory.ts`: A factory to create new `LogSelectorNode` instances, initializing them with an empty `BaseLogData` object.
    -   `LogSelectorNode.tsx`: The main component for the node.

-   [x] **Implement Node UI with Headless UI:**
    -   A searchable multi-select dropdown will be implemented. This will likely involve using the `@headlessui/react` `Combobox` component with the `multiple` prop, or a similar solution, to allow selecting multiple files.
    -   The combobox will be populated with the list of log files from the `useRom` store.

-   [x] **Implement File Sorting:**
    -   To improve usability, the list of logs in the dropdown will be sorted by modification date, with the newest files appearing at the top.

#### Phase 3: Flow Integration

-   [x] **Update `useFlow.ts` Store:**
    -   The `LogSelectorNodeType` will be added to the `MyNode` type union in `app/store/useFlow.ts`.

-   [x] **Register Node in `Flow.tsx`:**
    -   The `LogSelectorNode` component will be imported and mapped to the `logSelector` type string in the `nodeTypes` map in `app/_components/Flow.tsx`.

-   [x] **Configure Node Handle:**
    -   The `dataType` on the node's output `CustomHandle` will be set to `'Log'` to ensure it can connect correctly to other nodes in the flow.

#### Phase 4: UI Integration

-   [x] **Add Node to Node Selector UI:**
    -   A new button component will be created to add the `LogSelectorNode` to the canvas.
    -   This button will be added to the main `app/_components/NodeSelector/NodeSelector.tsx` component, making it accessible in the UI.

#### Phase 5: Testing

-   [ ] **Perform Integration Testing (Manual):**
    -   The node will be tested by adding it to the flow and selecting one or more log files.
    -   Connection to a `LogFilterNode` and other relevant nodes will be verified to work correctly.
    -   The data flow and processing will be checked to ensure the selected logs are correctly passed to downstream nodes.
