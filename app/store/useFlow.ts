`use client`;
import { create } from "zustand";
import { uuid } from "uuidv4";
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  updateEdge,
  getIncomers,
  getOutgoers,
} from "reactflow";

import { createWithEqualityFn } from "zustand/traditional";
import { LogRecord } from "../_lib/log";
import { BaseTableNodeType } from "@/app/_components/FlowNodes/BaseTableNode";
import { BaseLogNodeType } from "@/app/_components/FlowNodes/BaseLogNode";
import { CombineNodeType } from "@/app/_components/FlowNodes/CombineNode";
import { LogFiltereNodeType } from "@/app/_components/FlowNodes/LogFilterNode";
import { topologicalSort } from "@/app/_lib/react-flow-utils";
import { FillTableNodeType } from "@/app/_components/FlowNodes/FillTableNode";

export interface LogFilterData {
  logs: LogRecord[];
}

export type MyNode =
  | BaseTableNodeType
  | BaseLogNodeType
  | CombineNodeType
  | LogFiltereNodeType
  | FillTableNodeType;

const initialNodes = [] as Node[];
const initialEdges = [] as Edge[];

export type RFState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: MyNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: MyNode) => void;
  addEdge: (edge: Edge) => void;
  updateNode: (node: MyNode) => void;
  updateEdge: (edge: Edge, connection: Connection) => void;
};

const useFlow = createWithEqualityFn<RFState>(
  // zukeeper((set, get) => ({
  (set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,
    onNodesChange: (changes: NodeChange[]) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    },
    onEdgesChange: (changes: EdgeChange[]) => {
      console.log("onEdgesChange", changes);
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
    },
    onConnect: (connection: Connection) => {
      console.log("onConnect", connection);
      set({
        edges: addEdge(connection, get().edges),
      });
    },
    setNodes: (nodes: Node[]) => {
      set({ nodes });
    },
    setEdges: (edges: Edge[]) => {
      set({ edges });
    },
    addNode: (node: MyNode) => {
      set({
        nodes: [...get().nodes, node],
      });
    },
    addEdge: (edge: Edge) => {
      console.log("addEdge", edge);
      set({
        edges: [...get().edges, edge],
      });
    },
    updateNode: async (node: MyNode) => {
      const nodes = get().nodes;
      const edges = get().edges;
      const updateOrder = topologicalSort(node, nodes, edges);
      for (const updateNode of updateOrder) {
        // Updates Node in place
        await updateNode.data.refresh(updateNode, nodes, edges);
        // Force inplaced update
        updateNode.data = { ...updateNode.data };
        console.log(`updating node ${updateNode.id}`);
        set({
          nodes: [
            ...get().nodes.filter((n) => n.id != updateNode.id),
            updateNode,
          ],
        });
      }
    },
    updateEdge: async (edge: Edge, connection: Connection) => {
      set({
        edges: updateEdge(edge, connection, get().edges),
      });
    },
  })
  // )
);

export default useFlow;
