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

const UntargetableAfrGroup = () => {
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
      {`Untargetable AFR`}
    </NodeSelectorButton>
  );
};

export const savedGroup: SavedGroup = {
  groupName: "Untargetable AFR Identifier",
  nodes: [
    {
      id: "u1000000-0000-4000-8000-000000000001",
      type: "GroupNode",
      position: {
        x: 0,
        y: 0,
      },
      data: {
        name: "Untargetable AFR Identifier",
        locked: false,
      },
      style: {
        width: 2700,
        height: 1420,
        zIndex: -1,
      },
      width: 2700,
      height: 1420,
    },
    {
      id: "u1000000-0000-4000-8000-000000000002",
      type: "BaseRomNode",
      position: {
        x: 40,
        y: 380,
      },
      data: {},
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000003",
      type: "BaseLogNode",
      position: {
        x: 40,
        y: 40,
      },
      data: {},
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000004",
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
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000005",
      type: "TpsAfrDeleteNode",
      position: {
        x: 460,
        y: 40,
      },
      data: {},
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000006",
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
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000007",
      type: "LogFilterNode",
      position: {
        x: 1000,
        y: 40,
      },
      data: {
        func: "IPW > 0 and AFR > 0 and ECT > 75 and (APP > 10 or Speed == 0) and MAFCalcs > 0 and MAPCalcs > 0",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000008",
      type: "LogAlterNode",
      position: {
        x: 1430,
        y: 40,
      },
      data: {
        func: "AFR / AFRMAP",
        newLogField: "AFR_ERR",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000009",
      type: "LogAlterNode",
      position: {
        x: 1850,
        y: 40,
      },
      data: {
        func: "AFR - AFRMAP",
        newLogField: "AFR_DELTA",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000010",
      type: "BaseTableNode",
      position: {
        x: 280,
        y: 260,
      },
      data: {
        tableKey: "MAF Scaling Horizontal",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000011",
      type: "FillLogTableNode",
      position: {
        x: 580,
        y: 260,
      },
      data: {
        weighted: true,
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000012",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 160,
      },
      data: {
        logField: "AFR_ERR",
        aggregator: "MAX",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000013",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 280,
      },
      data: {
        logField: "AFR_ERR",
        aggregator: "MIN",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000014",
      type: "CombineNode",
      position: {
        x: 1300,
        y: 220,
      },
      data: {
        func: "sourceTable[y][x] > 0 and joinTable[y][x] > 0 ? (sourceTable[y][x] - joinTable[y][x]) : 0",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000015",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 400,
      },
      data: {
        logField: "RPM",
        aggregator: "MAX",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000016",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 520,
      },
      data: {
        logField: "RPM",
        aggregator: "MIN",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000017",
      type: "CombineNode",
      position: {
        x: 1300,
        y: 460,
      },
      data: {
        func: "sourceTable[y][x] > 0 and joinTable[y][x] > 0 ? (sourceTable[y][x] - joinTable[y][x]) : 0",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000018",
      type: "CombineNode",
      position: {
        x: 1720,
        y: 340,
      },
      data: {
        func: "sourceTable[y][x] >= 0.08 and joinTable[y][x] >= 1000 ? sourceTable[y][x] * (joinTable[y][x] / 1000) : 0",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000019",
      type: "FillTableNode",
      position: {
        x: 2140,
        y: 160,
      },
      data: {
        logField: "AFR_ERR",
        aggregator: "AVG",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000020",
      type: "FillTableNode",
      position: {
        x: 2140,
        y: 280,
      },
      data: {
        logField: "AFR",
        aggregator: "STDDEV",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000021",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 640,
      },
      data: {
        logField: "AFR",
        aggregator: "MAX",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000022",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 760,
      },
      data: {
        logField: "AFR",
        aggregator: "MIN",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000023",
      type: "CombineNode",
      position: {
        x: 1300,
        y: 700,
      },
      data: {
        func: "sourceTable[y][x] > 0 and joinTable[y][x] > 0 ? (sourceTable[y][x] - joinTable[y][x]) : 0",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000024",
      type: "FillTableNode",
      position: {
        x: 2140,
        y: 400,
      },
      data: {
        logField: "LogID",
        aggregator: "COUNT",
        tableType: "2D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000025",
      type: "BaseTableNode",
      position: {
        x: 280,
        y: 950,
      },
      data: {
        tableKey: "MAP based Load Calc #2 - Cold/Interpolated",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000026",
      type: "FillLogTableNode",
      position: {
        x: 580,
        y: 950,
      },
      data: {
        weighted: true,
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000027",
      type: "FillTableNode",
      position: {
        x: 880,
        y: 950,
      },
      data: {
        logField: "MAF",
        aggregator: "AVG",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000028",
      type: "FillTableNode",
      position: {
        x: 1300,
        y: 950,
      },
      data: {
        logField: "AFR",
        aggregator: "AVG",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000029",
      type: "FillTableNode",
      position: {
        x: 1720,
        y: 950,
      },
      data: {
        logField: "AFR_ERR",
        aggregator: "AVG",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
    {
      id: "u1000000-0000-4000-8000-000000000030",
      type: "FillTableNode",
      position: {
        x: 2140,
        y: 950,
      },
      data: {
        logField: "LogID",
        aggregator: "COUNT",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "u1000000-0000-4000-8000-000000000001",
    },
  ],
  edges: [
    {
      id: "edge-rom-to-maf-table",
      source: "u1000000-0000-4000-8000-000000000002",
      target: "u1000000-0000-4000-8000-000000000010",
      sourceHandle: "Rom#RomOut",
      targetHandle: "Rom#RomIn",
    },
    {
      id: "edge-rom-to-map-table",
      source: "u1000000-0000-4000-8000-000000000002",
      target: "u1000000-0000-4000-8000-000000000025",
      sourceHandle: "Rom#RomOut",
      targetHandle: "Rom#RomIn",
    },
    {
      id: "edge-log-to-afr-ml-shifter",
      source: "u1000000-0000-4000-8000-000000000003",
      target: "u1000000-0000-4000-8000-000000000004",
      sourceHandle: "Log#LogOut",
      targetHandle: "Log#logInput",
    },
    {
      id: "edge-afr-ml-shifter-to-tps-delete",
      source: "u1000000-0000-4000-8000-000000000004",
      target: "u1000000-0000-4000-8000-000000000005",
      sourceHandle: "Log#logOutput",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-tps-delete-to-gear",
      source: "u1000000-0000-4000-8000-000000000005",
      target: "u1000000-0000-4000-8000-000000000006",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-gear-to-filter",
      source: "u1000000-0000-4000-8000-000000000006",
      target: "u1000000-0000-4000-8000-000000000007",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-filter-to-alter-err",
      source: "u1000000-0000-4000-8000-000000000007",
      target: "u1000000-0000-4000-8000-000000000008",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-alter-err-to-alter-delta",
      source: "u1000000-0000-4000-8000-000000000008",
      target: "u1000000-0000-4000-8000-000000000009",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "edge-alter-delta-to-maf-fill-log",
      source: "u1000000-0000-4000-8000-000000000009",
      target: "u1000000-0000-4000-8000-000000000011",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogIn",
    },
    {
      id: "edge-maf-base-to-fill-log",
      source: "u1000000-0000-4000-8000-000000000010",
      target: "u1000000-0000-4000-8000-000000000011",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-fill-log-to-fill-err-max",
      source: "u1000000-0000-4000-8000-000000000011",
      target: "u1000000-0000-4000-8000-000000000012",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-fill-log-to-fill-err-min",
      source: "u1000000-0000-4000-8000-000000000011",
      target: "u1000000-0000-4000-8000-000000000013",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-combine-err-max-to-combine",
      source: "u1000000-0000-4000-8000-000000000012",
      target: "u1000000-0000-4000-8000-000000000014",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn1",
    },
    {
      id: "edge-combine-err-min-to-combine",
      source: "u1000000-0000-4000-8000-000000000013",
      target: "u1000000-0000-4000-8000-000000000014",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn2",
    },
    {
      id: "edge-maf-fill-log-to-fill-rpm-max",
      source: "u1000000-0000-4000-8000-000000000011",
      target: "u1000000-0000-4000-8000-000000000015",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-fill-log-to-fill-rpm-min",
      source: "u1000000-0000-4000-8000-000000000011",
      target: "u1000000-0000-4000-8000-000000000016",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-combine-rpm-max-to-combine",
      source: "u1000000-0000-4000-8000-000000000015",
      target: "u1000000-0000-4000-8000-000000000017",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn1",
    },
    {
      id: "edge-combine-rpm-min-to-combine",
      source: "u1000000-0000-4000-8000-000000000016",
      target: "u1000000-0000-4000-8000-000000000017",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn2",
    },
    {
      id: "edge-disparity-to-conflict-index",
      source: "u1000000-0000-4000-8000-000000000014",
      target: "u1000000-0000-4000-8000-000000000018",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn1",
    },
    {
      id: "edge-rpm-spread-to-conflict-index",
      source: "u1000000-0000-4000-8000-000000000017",
      target: "u1000000-0000-4000-8000-000000000018",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn2",
    },
    {
      id: "edge-maf-fill-log-to-fill-err-avg",
      source: "u1000000-0000-4000-8000-000000000011",
      target: "u1000000-0000-4000-8000-000000000019",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-fill-log-to-fill-afr-stddev",
      source: "u1000000-0000-4000-8000-000000000011",
      target: "u1000000-0000-4000-8000-000000000020",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-fill-log-to-fill-afr-max",
      source: "u1000000-0000-4000-8000-000000000011",
      target: "u1000000-0000-4000-8000-000000000021",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-maf-fill-log-to-fill-afr-min",
      source: "u1000000-0000-4000-8000-000000000011",
      target: "u1000000-0000-4000-8000-000000000022",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-combine-afr-max-to-combine",
      source: "u1000000-0000-4000-8000-000000000021",
      target: "u1000000-0000-4000-8000-000000000023",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn1",
    },
    {
      id: "edge-combine-afr-min-to-combine",
      source: "u1000000-0000-4000-8000-000000000022",
      target: "u1000000-0000-4000-8000-000000000023",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn2",
    },
    {
      id: "edge-maf-fill-log-to-fill-count",
      source: "u1000000-0000-4000-8000-000000000011",
      target: "u1000000-0000-4000-8000-000000000024",
      sourceHandle: "2D#TableOut",
      targetHandle: "2D#TableIn",
    },
    {
      id: "edge-alter-delta-to-map-fill-log",
      source: "u1000000-0000-4000-8000-000000000009",
      target: "u1000000-0000-4000-8000-000000000026",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogIn",
    },
    {
      id: "edge-map-base-to-fill-log",
      source: "u1000000-0000-4000-8000-000000000025",
      target: "u1000000-0000-4000-8000-000000000026",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "edge-map-fill-to-maf-avg",
      source: "u1000000-0000-4000-8000-000000000026",
      target: "u1000000-0000-4000-8000-000000000027",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "edge-map-fill-to-afr-avg",
      source: "u1000000-0000-4000-8000-000000000026",
      target: "u1000000-0000-4000-8000-000000000028",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "edge-map-fill-to-err-avg",
      source: "u1000000-0000-4000-8000-000000000026",
      target: "u1000000-0000-4000-8000-000000000029",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "edge-map-fill-to-count",
      source: "u1000000-0000-4000-8000-000000000026",
      target: "u1000000-0000-4000-8000-000000000030",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
  ],
};

export default UntargetableAfrGroup;
