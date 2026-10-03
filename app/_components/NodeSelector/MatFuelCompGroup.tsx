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

const MatFuelCompGroup = () => {
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
      {`MAT Fuel Comp`}
    </NodeSelectorButton>
  );
};

export const savedGroup: SavedGroup = {
  groupName: "MAT Fuel Comp",
  nodes: [
    {
      id: "m1000000-0000-4000-8000-000000000001",
      type: "GroupNode",
      position: { x: 0, y: 0 },
      data: {
        name: "MAT Fuel Comp",
        locked: false,
      },
      style: {
        width: 2500,
        height: 820,
        zIndex: -1,
      },
      width: 2500,
      height: 820,
    },
    {
      id: "m1000000-0000-4000-8000-000000000002",
      type: "BaseRomNode",
      position: { x: 40, y: 380 },
      data: {},
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000003",
      type: "BaseLogNode",
      position: { x: 40, y: 40 },
      data: {},
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000004",
      type: "afrMlShifter",
      position: { x: 260, y: 40 },
      data: {
        method: "Steady State Monotonic DP",
        replaceAfr: true,
      },
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000005",
      type: "TpsAfrDeleteNode",
      position: { x: 480, y: 40 },
      data: {},
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000006",
      type: "MatVarietyFilterNode",
      position: { x: 740, y: 40 },
      data: {
        minTempSpread: 10.0,
        minDistinctBins: 2,
        binSize: 5.0,
        minSamplesPerBin: 5,
      },
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000007",
      type: "LogFilterNode",
      position: { x: 1080, y: 40 },
      data: {
        func: "IPW > 0 and AFR > 0 and ECT > 75 and (APP > 10 or Speed == 0)",
      },
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000008",
      type: "LogAlterNode",
      position: { x: 1520, y: 40 },
      data: {
        func: "(1.0 - (STFT + CurrentLTFT) / 100.0) * (AFR / AFRMAP)",
        newLogField: "AFR_ERR",
      },
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000009",
      type: "BaseTableNode",
      position: { x: 260, y: 380 },
      data: {
        tableKey: "Fuel Compensation MAT vs MAP - Stock3bar",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000010",
      type: "FillLogTableNode",
      position: { x: 600, y: 380 },
      data: {
        weighted: true,
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000011",
      type: "FillTableNode",
      position: { x: 900, y: 260 },
      data: {
        logField: "AFR_ERR",
        aggregator: "AVG",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000012",
      type: "FillTableNode",
      position: { x: 900, y: 400 },
      data: {
        logField: "LogID",
        aggregator: "COUNT",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000013",
      type: "FillTableNode",
      position: { x: 900, y: 540 },
      data: {
        logField: "weight",
        aggregator: "AVG",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000014",
      type: "CombineNode",
      position: { x: 1240, y: 470 },
      data: {
        func: "sourceTable[y][x] > 5 ? (sourceTable[y][x] * joinTable[y][x]) : 0",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000015",
      type: "CombineNode",
      position: { x: 1620, y: 320 },
      data: {
        func: "diff = 1 - joinTable[y][x];\nw = sourceTable[y][x];\nconf = w <= 0 ? 0 : (w^2 / (w^2 + 100));\nnewDiff = 1 - conf * diff;\nnewDiff = newDiff < 0.85 ? 0.85 : (newDiff > 1.15 ? 1.15 : newDiff);\n(newDiff - 1) / 3 + 1",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000016",
      type: "CombineNode",
      position: { x: 2060, y: 360 },
      data: {
        func: "sourceTable[y][x] * joinTable[y][x]",
        tableType: "3D",
      },
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
  ],
  edges: [
    {
      id: "m-edge-rom-to-table",
      source: "m1000000-0000-4000-8000-000000000002",
      target: "m1000000-0000-4000-8000-000000000009",
      sourceHandle: "Rom#RomOut",
      targetHandle: "Rom#RomIn",
    },
    {
      id: "m-edge-log-to-shifter",
      source: "m1000000-0000-4000-8000-000000000003",
      target: "m1000000-0000-4000-8000-000000000004",
      sourceHandle: "Log#LogOut",
      targetHandle: "Log#LogIn",
    },
    {
      id: "m-edge-shifter-to-tps",
      source: "m1000000-0000-4000-8000-000000000004",
      target: "m1000000-0000-4000-8000-000000000005",
      sourceHandle: "Log#LogOut",
      targetHandle: "Log#LogIn",
    },
    {
      id: "m-edge-tps-to-variety",
      source: "m1000000-0000-4000-8000-000000000005",
      target: "m1000000-0000-4000-8000-000000000006",
      sourceHandle: "Log#LogOut",
      targetHandle: "LogTarget",
    },
    {
      id: "m-edge-variety-to-filter",
      source: "m1000000-0000-4000-8000-000000000006",
      target: "m1000000-0000-4000-8000-000000000007",
      sourceHandle: "LogSource",
      targetHandle: "Log#LogIn",
    },
    {
      id: "m-edge-filter-to-alter",
      source: "m1000000-0000-4000-8000-000000000007",
      target: "m1000000-0000-4000-8000-000000000008",
      sourceHandle: "Log#LogOut",
      targetHandle: "Log#LogIn",
    },
    {
      id: "m-edge-table-to-fill-log-table",
      source: "m1000000-0000-4000-8000-000000000009",
      target: "m1000000-0000-4000-8000-000000000010",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "m-edge-alter-to-fill-log-table",
      source: "m1000000-0000-4000-8000-000000000008",
      target: "m1000000-0000-4000-8000-000000000010",
      sourceHandle: "Log#LogOut",
      targetHandle: "Log#LogIn",
    },
    {
      id: "m-edge-fill-log-to-fill-afr",
      source: "m1000000-0000-4000-8000-000000000010",
      target: "m1000000-0000-4000-8000-000000000011",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "m-edge-fill-log-to-fill-count",
      source: "m1000000-0000-4000-8000-000000000010",
      target: "m1000000-0000-4000-8000-000000000012",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "m-edge-fill-log-to-fill-weight",
      source: "m1000000-0000-4000-8000-000000000010",
      target: "m1000000-0000-4000-8000-000000000013",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
    {
      id: "m-edge-count-to-combine-w",
      source: "m1000000-0000-4000-8000-000000000012",
      target: "m1000000-0000-4000-8000-000000000014",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TargetTableOne",
    },
    {
      id: "m-edge-weight-to-combine-w",
      source: "m1000000-0000-4000-8000-000000000013",
      target: "m1000000-0000-4000-8000-000000000014",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TargetTableTwo",
    },
    {
      id: "m-edge-combine-w-to-combine-factor",
      source: "m1000000-0000-4000-8000-000000000014",
      target: "m1000000-0000-4000-8000-000000000015",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TargetTableOne",
    },
    {
      id: "m-edge-afr-to-combine-factor",
      source: "m1000000-0000-4000-8000-000000000011",
      target: "m1000000-0000-4000-8000-000000000015",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TargetTableTwo",
    },
    {
      id: "m-edge-base-table-to-final",
      source: "m1000000-0000-4000-8000-000000000009",
      target: "m1000000-0000-4000-8000-000000000016",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TargetTableOne",
    },
    {
      id: "m-edge-factor-to-final",
      source: "m1000000-0000-4000-8000-000000000015",
      target: "m1000000-0000-4000-8000-000000000016",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TargetTableTwo",
    },
  ],
};

export default MatFuelCompGroup;
