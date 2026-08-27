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

const MafMapBalancerGroup = () => {
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
      {`MAF & MAP Balancer`}
    </NodeSelectorButton>
  );
};

export const savedGroup: SavedGroup = {
  groupName: "MAF & MAP Balancer",
  nodes: [
    {
      id: "a1000000-0000-4000-8000-000000000001",
      type: "GroupNode",
      position: {
        x: 0,
        y: 0,
      },
      data: {
        name: "MAF & MAP Balancer",
        locked: false,
      },
      style: {
        width: 3200,
        height: 1200,
        zIndex: -1,
      },
      width: 3200,
      height: 1200,
    },
    {
      id: "a1000000-0000-4000-8000-000000000002",
      type: "BaseRomNode",
      position: {
        x: 40,
        y: 420,
      },
      data: {},
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000003",
      type: "BaseLogNode",
      position: {
        x: 40,
        y: 40,
      },
      data: {},
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000031",
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
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000004",
      type: "TpsAfrDeleteNode",
      position: {
        x: 460,
        y: 40,
      },
      data: {},
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000030",
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
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000005",
      type: "LogFilterNode",
      position: {
        x: 1000,
        y: 40,
      },
      data: {
        func: "IPW > 0 and AFR > 0 and ECT > 75 and (APP > 10 or Speed == 0) and MAFCalcs > 0 and MAPCalcs > 0",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000006",
      type: "LogAlterNode",
      position: {
        x: 1430,
        y: 40,
      },
      data: {
        func: "MAP <= 80 ? 1.05 : (MAP >= 120 ? 0.95 : (1.05 - 0.0025 * (MAP - 80)))",
        newLogField: "TARGET_RATIO",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000007",
      type: "LogAlterNode",
      position: {
        x: 1850,
        y: 40,
      },
      data: {
        func: "AFR / AFRMAP",
        newLogField: "AFR_ERR",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000008",
      type: "LogAlterNode",
      position: {
        x: 2120,
        y: 40,
      },
      data: {
        func: "MAFCalcs < MAPCalcs ? AFR_ERR : (MAPCalcs / (TARGET_RATIO * MAFCalcs))",
        newLogField: "MAF_CORR",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000009",
      type: "LogAlterNode",
      position: {
        x: 2570,
        y: 40,
      },
      data: {
        func: "MAPCalcs < MAFCalcs ? AFR_ERR : ((TARGET_RATIO * MAFCalcs) / MAPCalcs)",
        newLogField: "MAP_CORR",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000010",
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
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000011",
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
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000012",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 230,
      },
      data: {
        logField: "MAF_CORR",
        aggregator: "AVG",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000013",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 370,
      },
      data: {
        logField: "LogID",
        aggregator: "COUNT",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000014",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 510,
      },
      data: {
        logField: "weight",
        aggregator: "AVG",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000015",
      type: "CombineNode",
      position: {
        x: 1220,
        y: 440,
      },
      data: {
        func: "sourceTable[y][x] > 5 ? joinTable[y][x] : 0",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000016",
      type: "CombineNode",
      position: {
        x: 1600,
        y: 260,
      },
      data: {
        func: "diff = 1 - joinTable[y][x];\nweight = sourceTable[y][x];\nk = 20;\nnewWeight = weight / (1 + exp(-k * (weight - 0.1)));\nsuperWeight = 1 - (1 - newWeight)^10;\nnewDiff = 1 - superWeight * diff;\nnewDiff = newDiff < 0.85 ? 0.85 : (newDiff > 1.15 ? 1.15 : newDiff);\n(newDiff - 1) / 3 + 1",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000017",
      type: "CombineNode",
      position: {
        x: 2150,
        y: 300,
      },
      data: {
        func: "val = sourceTable[y][x] * joinTable[y][x];\nx > 0 ? (val < destTable[y][x - 1] ? destTable[y][x - 1] : val) : val",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000020",
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
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000021",
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
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000022",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 720,
      },
      data: {
        logField: "MAP_CORR",
        aggregator: "AVG",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000023",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 860,
      },
      data: {
        logField: "LogID",
        aggregator: "COUNT",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000024",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 1000,
      },
      data: {
        logField: "weight",
        aggregator: "AVG",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000025",
      type: "CombineNode",
      position: {
        x: 1220,
        y: 930,
      },
      data: {
        func: "sourceTable[y][x] > 5 ? joinTable[y][x] : 0",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000026",
      type: "CombineNode",
      position: {
        x: 1600,
        y: 750,
      },
      data: {
        func: "diff = 1 - joinTable[y][x];\nweight = sourceTable[y][x];\nk = 20;\nnewWeight = weight / (1 + exp(-k * (weight - 0.1)));\nsuperWeight = 1 - (1 - newWeight)^10;\nnewDiff = 1 - superWeight * diff;\nnewDiff = newDiff < 0.85 ? 0.85 : (newDiff > 1.15 ? 1.15 : newDiff);\n(newDiff - 1) / 3 + 1",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
    {
      id: "a1000000-0000-4000-8000-000000000027",
      type: "CombineNode",
      position: {
        x: 2150,
        y: 800,
      },
      data: {
        func: "sourceTable[y][x] * joinTable[y][x]",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "a1000000-0000-4000-8000-000000000001",
    },
  ],
  edges: [
    {
      id: "edge-rom-to-maf-table",
      source: "a1000000-0000-4000-8000-000000000002",
      target: "a1000000-0000-4000-8000-000000000010",
      sourceHandle: "Rom#RomOut",
      targetHandle: "Rom#RomIn",
    },
    {
      id: "edge-rom-to-map-table",
      source: "a1000000-0000-4000-8000-000000000002",
      target: "a1000000-0000-4000-8000-000000000020",
      sourceHandle: "Rom#RomOut",
      targetHandle: "Rom#RomIn",
    },
    {
      id: "edge-log-to-afr-ml-shifter",
      source: "a1000000-0000-4000-8000-000000000003",
      target: "a1000000-0000-4000-8000-000000000031",
      sourceHandle: "Log#LogOut",
      targetHandle: "Log#logInput",
    },
    {
      id: "edge-afr-ml-shifter-to-tps-delete",
      source: "a1000000-0000-4000-8000-000000000031",
      target: "a1000000-0000-4000-8000-000000000004",
      sourceHandle: "Log#logOutput",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-tps-delete-to-gear",
      source: "a1000000-0000-4000-8000-000000000004",
      target: "a1000000-0000-4000-8000-000000000030",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-gear-to-filter",
      source: "a1000000-0000-4000-8000-000000000030",
      target: "a1000000-0000-4000-8000-000000000005",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-filter-to-alter-ratio",
      source: "a1000000-0000-4000-8000-000000000005",
      target: "a1000000-0000-4000-8000-000000000006",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-alter-ratio-to-alter-err",
      source: "a1000000-0000-4000-8000-000000000006",
      target: "a1000000-0000-4000-8000-000000000007",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-alter-err-to-alter-maf",
      source: "a1000000-0000-4000-8000-000000000007",
      target: "a1000000-0000-4000-8000-000000000008",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-alter-maf-to-alter-map",
      source: "a1000000-0000-4000-8000-000000000008",
      target: "a1000000-0000-4000-8000-000000000009",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-alter-map-to-maf-fill-log",
      source: "a1000000-0000-4000-8000-000000000009",
      target: "a1000000-0000-4000-8000-000000000011",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogIn",
    },
    {
      id: "edge-alter-map-to-map-fill-log",
      source: "a1000000-0000-4000-8000-000000000009",
      target: "a1000000-0000-4000-8000-000000000021",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogIn",
    },
    {
      id: "edge-maf-base-to-fill-log",
      source: "a1000000-0000-4000-8000-000000000010",
      target: "a1000000-0000-4000-8000-000000000011",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-base-to-combine-final",
      source: "a1000000-0000-4000-8000-000000000010",
      target: "a1000000-0000-4000-8000-000000000017",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn1",
    },
    {
      id: "edge-maf-fill-log-to-fill-corr",
      source: "a1000000-0000-4000-8000-000000000011",
      target: "a1000000-0000-4000-8000-000000000012",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-fill-log-to-fill-count",
      source: "a1000000-0000-4000-8000-000000000011",
      target: "a1000000-0000-4000-8000-000000000013",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-fill-log-to-fill-weight",
      source: "a1000000-0000-4000-8000-000000000011",
      target: "a1000000-0000-4000-8000-000000000014",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-count-to-threshold",
      source: "a1000000-0000-4000-8000-000000000013",
      target: "a1000000-0000-4000-8000-000000000015",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn1",
    },
    {
      id: "edge-maf-weight-to-threshold",
      source: "a1000000-0000-4000-8000-000000000014",
      target: "a1000000-0000-4000-8000-000000000015",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn2",
    },
    {
      id: "edge-maf-threshold-to-damping",
      source: "a1000000-0000-4000-8000-000000000015",
      target: "a1000000-0000-4000-8000-000000000016",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn1",
    },
    {
      id: "edge-maf-corr-to-damping",
      source: "a1000000-0000-4000-8000-000000000012",
      target: "a1000000-0000-4000-8000-000000000016",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn2",
    },
    {
      id: "edge-maf-damping-to-final",
      source: "a1000000-0000-4000-8000-000000000016",
      target: "a1000000-0000-4000-8000-000000000017",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn2",
    },
    {
      id: "edge-map-base-to-fill-log",
      source: "a1000000-0000-4000-8000-000000000020",
      target: "a1000000-0000-4000-8000-000000000021",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "edge-map-base-to-combine-final",
      source: "a1000000-0000-4000-8000-000000000020",
      target: "a1000000-0000-4000-8000-000000000027",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn1",
    },
    {
      id: "edge-map-fill-log-to-fill-corr",
      source: "a1000000-0000-4000-8000-000000000021",
      target: "a1000000-0000-4000-8000-000000000022",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "edge-map-fill-log-to-fill-count",
      source: "a1000000-0000-4000-8000-000000000021",
      target: "a1000000-0000-4000-8000-000000000023",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "edge-map-fill-log-to-fill-weight",
      source: "a1000000-0000-4000-8000-000000000021",
      target: "a1000000-0000-4000-8000-000000000024",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "edge-map-count-to-threshold",
      source: "a1000000-0000-4000-8000-000000000023",
      target: "a1000000-0000-4000-8000-000000000025",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn1",
    },
    {
      id: "edge-map-weight-to-threshold",
      source: "a1000000-0000-4000-8000-000000000024",
      target: "a1000000-0000-4000-8000-000000000025",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn2",
    },
    {
      id: "edge-map-threshold-to-damping",
      source: "a1000000-0000-4000-8000-000000000025",
      target: "a1000000-0000-4000-8000-000000000026",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn1",
    },
    {
      id: "edge-map-corr-to-damping",
      source: "a1000000-0000-4000-8000-000000000022",
      target: "a1000000-0000-4000-8000-000000000026",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn2",
    },
    {
      id: "edge-map-damping-to-final",
      source: "a1000000-0000-4000-8000-000000000026",
      target: "a1000000-0000-4000-8000-000000000027",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn2",
    },
  ],
};

export default MafMapBalancerGroup;
