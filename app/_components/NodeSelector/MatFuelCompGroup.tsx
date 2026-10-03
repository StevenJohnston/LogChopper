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
        width: 1750,
        height: 720,
        zIndex: -1,
      },
      width: 1750,
      height: 720,
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
      id: "m1000000-0000-4000-8000-000000000009",
      type: "BaseTableNode",
      position: { x: 280, y: 380 },
      data: {
        tableKey: "Fuel Compensation MAT vs MAP - Stock3bar",
        tableType: "3D",
      },
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
      id: "m1000000-0000-4000-8000-000000000007",
      type: "LogFilterNode",
      position: { x: 740, y: 40 },
      data: {
        func: "IPW > 0 and AFR > 0 and ECT > 75 and (APP > 10 or Speed == 0)",
      },
      dragHandle: ".drag-handle",
      parentNode: "m1000000-0000-4000-8000-000000000001",
    },
    {
      id: "m1000000-0000-4000-8000-000000000020",
      type: "MatFuelCompNode",
      position: { x: 1180, y: 140 },
      data: {
        minTempSpread: 10.0,
        minDistinctBins: 2,
        minCellSamples: 5,
        maxCorrectionRatio: 0.15,
        enableDamping: true,
        confidenceHk: 100,
        activeView: "corrected",
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
      targetHandle: "Log#logInput",
    },
    {
      id: "m-edge-shifter-to-tps",
      source: "m1000000-0000-4000-8000-000000000004",
      target: "m1000000-0000-4000-8000-000000000005",
      sourceHandle: "Log#logOutput",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "m-edge-tps-to-filter",
      source: "m1000000-0000-4000-8000-000000000005",
      target: "m1000000-0000-4000-8000-000000000007",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogTarget",
    },
    {
      id: "m-edge-filter-to-mat-comp",
      source: "m1000000-0000-4000-8000-000000000007",
      target: "m1000000-0000-4000-8000-000000000020",
      sourceHandle: "Log#LogSource",
      targetHandle: "Log#LogIn",
    },
    {
      id: "m-edge-table-to-mat-comp",
      source: "m1000000-0000-4000-8000-000000000009",
      target: "m1000000-0000-4000-8000-000000000020",
      sourceHandle: "3D#TableOut",
      targetHandle: "3D#TableIn",
    },
  ],
};

export default MatFuelCompGroup;
