import NodeSelectorButton from "@/app/_components/NodeSelector/NodeSelectorButton";
import useFlow, { MyNode, RFState } from "@/app/store/useFlow";
import { useCallback } from "react";
import { shallow } from "zustand/shallow";
import { SavedGroup, cloneSavedGroup } from "@/app/store/useNodeStorage";

const selector = (state: RFState) => ({
  reactFlowInstance: state.reactFlowInstance,
  updateNode: state.updateNode,
  addNode: state.addNode,
  addEdge: state.addEdge,
});

const MafMapCoherenceGroup = () => {
  const { addNode, addEdge } = useFlow(selector, shallow);

  const onLoadSavedGroup = useCallback(
    (savedGroup: SavedGroup) => {
      const newGroup = cloneSavedGroup(savedGroup);

      for (const node of newGroup.nodes) {
        addNode(node as MyNode);
      }
      for (const edge of newGroup.edges) {
        addEdge(edge);
      }
    },
    [addNode, addEdge]
  );

  return (
    <NodeSelectorButton
      onClick={() => {
        onLoadSavedGroup(savedGroup);
      }}
    >
      {`MAF & MAP Coherence`}
    </NodeSelectorButton>
  );
};

export const savedGroup: SavedGroup = {
  groupName: "MAF & MAP Coherence Analyzer",
  nodes: [
    {
      id: "c1000000-0000-4000-8000-000000000001",
      type: "GroupNode",
      position: {
        x: 0,
        y: 0,
      },
      data: {
        name: "MAF & MAP Coherence Analyzer",
        locked: false,
      },
      style: {
        width: 2350,
        height: 1220,
        zIndex: -1,
      },
      width: 2350,
      height: 1220,
    },
    {
      id: "c1000000-0000-4000-8000-000000000002",
      type: "BaseRomNode",
      position: {
        x: 40,
        y: 400,
      },
      data: {},
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000003",
      type: "BaseLogNode",
      position: {
        x: 40,
        y: 40,
      },
      data: {},
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000004",
      type: "afrMlShifter",
      position: {
        x: 240,
        y: 40,
      },
      data: {
        method: "Steady State Monotonic DP",
        replaceAfr: true,
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000005",
      type: "TpsAfrDeleteNode",
      position: {
        x: 460,
        y: 40,
      },
      data: {},
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000006",
      type: "GearNode",
      position: {
        x: 680,
        y: 40,
      },
      data: {
        gear1Ratio: 130,
        gear2Ratio: 80,
        gear3Ratio: 57,
        gear4Ratio: 42,
        gear5Ratio: 30,
        lookahead: 20,
        enableFilter: true,
        invertFilter: false,
        maxAccuracy: 5,
        filterWindowSeconds: 0.5,
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000007",
      type: "LogFilterNode",
      position: {
        x: 1000,
        y: 40,
      },
      data: {
        func: "IPW > 0 and AFR > 0 and ECT > 75 and (APP > 10 or Speed == 0) and MAFCalcs > 0 and MAPCalcs > 0",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000008",
      type: "LogAlterNode",
      position: {
        x: 1430,
        y: 40,
      },
      data: {
        func: "MAFCalcs / MAPCalcs",
        newLogField: "MAF_MAP_RATIO",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000009",
      type: "LogAlterNode",
      position: {
        x: 1850,
        y: 40,
      },
      data: {
        func: "((MAFCalcs - MAPCalcs) / MAPCalcs) * 100",
        newLogField: "DISCREPANCY_PCT",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000010",
      type: "BaseTableNode",
      position: {
        x: 280,
        y: 280,
      },
      data: {
        tableKey: "MAF Scaling Horizontal",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000011",
      type: "FillLogTableNode",
      position: {
        x: 580,
        y: 280,
      },
      data: {
        weighted: true,
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000012",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 200,
      },
      data: {
        logField: "MAF_MAP_RATIO",
        aggregator: "AVG",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000013",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 340,
      },
      data: {
        logField: "MAF_MAP_RATIO",
        aggregator: "MAX",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000014",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 480,
      },
      data: {
        logField: "MAF_MAP_RATIO",
        aggregator: "MIN",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000015",
      type: "CombineNode",
      position: {
        x: 1300,
        y: 410,
      },
      data: {
        func: "sourceTable[y][x] > 0 and joinTable[y][x] > 0 ? (sourceTable[y][x] - joinTable[y][x]) : 0",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000016",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 620,
      },
      data: {
        logField: "LogID",
        aggregator: "COUNT",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000020",
      type: "BaseTableNode",
      position: {
        x: 280,
        y: 800,
      },
      data: {
        tableKey: "MAP based Load Calc #2 - Cold/Interpolated",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000021",
      type: "FillLogTableNode",
      position: {
        x: 580,
        y: 800,
      },
      data: {
        weighted: true,
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000022",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 760,
      },
      data: {
        logField: "DISCREPANCY_PCT",
        aggregator: "AVG",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000023",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 900,
      },
      data: {
        logField: "MAF",
        aggregator: "AVG",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
    {
      id: "c1000000-0000-4000-8000-000000000024",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 1040,
      },
      data: {
        logField: "LogID",
        aggregator: "COUNT",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "c1000000-0000-4000-8000-000000000001",
    },
  ],
  edges: [
    {
      id: "edge-rom-to-maf-table",
      source: "c1000000-0000-4000-8000-000000000002",
      target: "c1000000-0000-4000-8000-000000000010",
      sourceHandle: "Rom#RomOut",
      targetHandle: "Rom#RomIn",
    },
    {
      id: "edge-rom-to-map-table",
      source: "c1000000-0000-4000-8000-000000000002",
      target: "c1000000-0000-4000-8000-000000000020",
      sourceHandle: "Rom#RomOut",
      targetHandle: "Rom#RomIn",
    },
    {
      id: "edge-log-to-afr-ml-shifter",
      source: "c1000000-0000-4000-8000-000000000003",
      target: "c1000000-0000-4000-8000-000000000004",
      sourceHandle: "Log#LogOut",
      targetHandle: "Log#logInput",
    },
    {
      id: "edge-afr-ml-shifter-to-tps-delete",
      source: "c1000000-0000-4000-8000-000000000004",
      target: "c1000000-0000-4000-8000-000000000005",
      sourceHandle: "Log#logOutput",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-tps-delete-to-gear",
      source: "c1000000-0000-4000-8000-000000000005",
      target: "c1000000-0000-4000-8000-000000000006",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-gear-to-filter",
      source: "c1000000-0000-4000-8000-000000000006",
      target: "c1000000-0000-4000-8000-000000000007",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-filter-to-alter-ratio",
      source: "c1000000-0000-4000-8000-000000000007",
      target: "c1000000-0000-4000-8000-000000000008",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-alter-ratio-to-alter-discrepancy",
      source: "c1000000-0000-4000-8000-000000000008",
      target: "c1000000-0000-4000-8000-000000000009",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-alter-discrepancy-to-maf-fill-log",
      source: "c1000000-0000-4000-8000-000000000009",
      target: "c1000000-0000-4000-8000-000000000011",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogIn",
    },
    {
      id: "edge-alter-discrepancy-to-map-fill-log",
      source: "c1000000-0000-4000-8000-000000000009",
      target: "c1000000-0000-4000-8000-000000000021",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogIn",
    },
    {
      id: "edge-maf-base-to-fill-log",
      source: "c1000000-0000-4000-8000-000000000010",
      target: "c1000000-0000-4000-8000-000000000011",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-fill-log-to-fill-ratio-avg",
      source: "c1000000-0000-4000-8000-000000000011",
      target: "c1000000-0000-4000-8000-000000000012",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-fill-log-to-fill-ratio-max",
      source: "c1000000-0000-4000-8000-000000000011",
      target: "c1000000-0000-4000-8000-000000000013",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-fill-log-to-fill-ratio-min",
      source: "c1000000-0000-4000-8000-000000000011",
      target: "c1000000-0000-4000-8000-000000000014",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-fill-log-to-fill-count",
      source: "c1000000-0000-4000-8000-000000000011",
      target: "c1000000-0000-4000-8000-000000000016",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-ratio-max-to-combine",
      source: "c1000000-0000-4000-8000-000000000013",
      target: "c1000000-0000-4000-8000-000000000015",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn1",
    },
    {
      id: "edge-maf-ratio-min-to-combine",
      source: "c1000000-0000-4000-8000-000000000014",
      target: "c1000000-0000-4000-8000-000000000015",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn2",
    },
    {
      id: "edge-map-base-to-fill-log",
      source: "c1000000-0000-4000-8000-000000000020",
      target: "c1000000-0000-4000-8000-000000000021",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "edge-map-fill-log-to-fill-discrepancy",
      source: "c1000000-0000-4000-8000-000000000021",
      target: "c1000000-0000-4000-8000-000000000022",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "edge-map-fill-log-to-fill-maf-volts",
      source: "c1000000-0000-4000-8000-000000000021",
      target: "c1000000-0000-4000-8000-000000000023",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "edge-map-fill-log-to-fill-count",
      source: "c1000000-0000-4000-8000-000000000021",
      target: "c1000000-0000-4000-8000-000000000024",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
  ],
};

export default MafMapCoherenceGroup;
