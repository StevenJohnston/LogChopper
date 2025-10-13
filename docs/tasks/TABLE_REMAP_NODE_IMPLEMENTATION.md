### Introduction

This document outlines the implementation of the `TableRemapNode`. This node performs a "reverse lookup" or "remapping" operation between two tables. Its functionality is inspired by `CombineAdvancedTableNode`, offering a high degree of user control over the mapping process.

The node creates a new table that adopts the axes of a "Structure" table (Table A) but derives its values by looking up data in a "Lookup" table (Table B). The user can configure which components (X-axis, Y-axis, Values) are used for the lookup and which are used for the output.

For example, to transform `LOAD = f(RPM, MAP)` into `MAP = g(RPM, LOAD)`:
-   **Table A (Structure):** Axes (RPM, Load)
-   **Table B (Lookup):** Axes (RPM, MAP), Values (Load)
-   **Configuration:**
    -   Common Axis: `Y` (RPM)
    -   Lookup Value (from A): `X-Axis` (Load)
    -   Search Target (in B): `Values` (Load)
    -   Output Source (from B): `X-Axis` (MAP)
-   **Result:** A new table with axes (RPM, Load) and values (MAP).

---

### Implementation Details

#### Phase 1: `TableRemapNode` Components

-   [x] **Created Node Directory and Files:**
    -   A new directory was created: `app/_components/FlowNodes/TableRemap/`.
    -   `TableRemapNode.tsx`: This component renders the node, including two input handles, one output handle, and a rich UI for configuration.
    -   `TableRemapTypes.tsx`: Defines types for the node's extensive configuration data (e.g., `commonAxis`, `lookupValueSource`, `searchTarget`, `outputSource`).
    -   `TableRemapWorker.ts`: This worker houses the flexible reverse-lookup and interpolation logic.
    -   `TableRemapWorkerTypes.ts`: Defines types for messages to and from the worker.
    -   `TableRemapNodeFactory.ts`: A factory to create new `TableRemapNode` instances.

-   [x] **Implemented Node UI:**
    -   In `TableRemapNode.tsx`, two `CustomHandle` components were added for the table inputs: "Structure (A)" and "Lookup (B)".
    -   A series of `select` components allow full configuration of the mapping:
        -   **Common Axis:** 'X-Axis' or 'Y-Axis'.
        -   **Lookup Value (from A):** 'X-Axis', 'Y-Axis'.
        -   **Search Target (in B):** 'X-Axis', 'Y-Axis', 'Values'.
        -   **Output Source (from B):** 'X-Axis', 'Y-Axis', 'Values'.
    -   A `TableUI` component was added to display the resulting output table.

#### Phase 2: State Management and Data Flow

-   [x] **Updated `useFlow.ts` Store:**
    -   `TableRemapNode` was added to the `nodeTypes` map in `app/_components/Flow.tsx`.
    -   A new action, `updateTableRemapNodeConfig`, was created to update the mapping settings for a specific `TableRemapNode` instance.
    -   The `MyNode` type was updated to include `TableRemapNodeType`.

-   [x] **Implemented Worker Logic:**
    -   In `TableRemapWorker.ts`, the generalized remapping logic was implemented based on the full configuration object.
        -   For each coordinate in the Structure Table (A):
            1.  Gets the `commonAxisValue` and the `lookupValue` based on the `commonAxis` and `lookupValueSource` settings.
            2.  In the Lookup Table (B), selects the row/column using the `commonAxisValue`.
            3.  Searches the `searchTarget` (X-axis, Y-axis, or Values) within that row/column to find a match for the `lookupValue`. This uses 1D interpolation.
            4.  Once a match is found, it retrieves the corresponding value from the `outputSource` in Table B. This is the new cell value.
    -   In `TableRemapNode.tsx`, when inputs or configuration change, a message is posted to the worker.
    -   The `TableRemapData` class manages the worker promise and updates.

#### Phase 3: UI Integration

-   [x] **Added Node to Node Selector UI:**
    -   A new component `app/_components/NodeSelector/TableRemapper.tsx` was created.
    -   This component renders a button that adds a `TableRemapNode` to the flow.
    -   This new component was added to `app/_components/NodeSelector/NodeSelector.tsx`.

-   [x] **Ensured Node Connectivity:**
    -   The input and output handles for `TableRemapNode` are defined with `dataType='3D'`.
    -   `isValidConnection` in `app/_lib/react-flow-utils.ts` handles the connection validation.

#### Phase 4: Testing

-   [x] **Performed Integration Testing (Manual):**
    -   Added nodes to produce two source tables.
    -   Added a `TableRemapNode` and connected the tables.
    -   Configured the node to match the primary example (Load -> MAP) and verified the output is correct.
    -   Connected the output to a `TableUI` to visualize the result.
    -   Tested other configurations.
