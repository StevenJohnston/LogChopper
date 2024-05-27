`use client`;

import {
  Connection,
  Edge,
  EdgeChange,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  updateEdge,
  ReactFlowInstance,
  Node,
} from "reactflow";
import { v4 as uuid } from "uuid";

import { createWithEqualityFn } from "zustand/traditional";
import { BaseTableNodeType } from "@/app/_components/FlowNodes/BaseTable/BaseTableTypes";
import { BaseLogNodeType } from "@/app/_components/FlowNodes/BaseLog/BaseLogTypes";
import { ForkNodeType } from "@/app/_components/FlowNodes/ForkNode/ForkTypes";
import { LogFilterNodeType } from "@/app/_components/FlowNodes/LogFilter/LogFilterTypes";
import { topologicalSort } from "@/app/_lib/react-flow-utils";
import { FillTableNodeType } from "@/app/_components/FlowNodes/FillTable/FillTableTypes";
import { FillLogTableNodeType } from "@/app/_components/FlowNodes/FillLogTable/FillLogTableTypes";
import {
  GroupNodeType,
  GroupType,
} from "@/app/_components/FlowNodes/Group/GroupNodeTypes";

import type { MouseEvent } from "react";
import { CombineNodeType } from "@/app/_components/FlowNodes/Combine/CombineTypes";
import { CombineAdvancedTableNodeType } from "@/app/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableTypes";
import { LogAlterNodeType } from "@/app/_components/FlowNodes/LogAlter/LogAlterTypes";
import { RunningLogAlterNodeType } from "@/app/_components/FlowNodes/RunningLogAlter/RunningLogAlterTypes";

export type MyNode =
  | BaseTableNodeType
  | BaseLogNodeType
  | ForkNodeType
  | LogFilterNodeType
  | LogAlterNodeType
  | FillTableNodeType
  | FillLogTableNodeType
  | GroupNodeType
  | CombineNodeType
  | CombineAdvancedTableNodeType
  | RunningLogAlterNodeType;

const initialNodes = [] as MyNode[];
const initialEdges = [] as Edge[];

export type RFState = {
  reactFlowInstance?: ReactFlowInstance;
  nodes: MyNode[];
  edges: Edge[];
  onNodeDragStop: (event: MouseEvent, node: MyNode, nodes: MyNode[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: MyNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: MyNode) => void;
  addEdge: (edge: Edge) => void;
  softUpdateNode: (node: MyNode) => void;
  updateNode: (node: MyNode) => void;
  updateEdge: (edge: Edge, connection: Connection) => void;
  orderedRefreshNodes: (
    nodesIds: string[],
    updateUUID: string,
    i?: number
  ) => Promise<void>;
  setReactFlowInstance: (reactFlowInstance: ReactFlowInstance) => void;
};

const useFlow = createWithEqualityFn<RFState>(
  // zukeeper((set, get) => ({
  (set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,
    onNodeDragStop: (event: MouseEvent, node: MyNode, nodes: MyNode[]) => {
      const reactFlowInstance = get().reactFlowInstance;
      if (reactFlowInstance) {
        nodes = get().nodes;
        if (node.type == GroupType) {
          const intersections = reactFlowInstance.getIntersectingNodes(
            node
          ) as MyNode[];
          if (!node.data.locked) {
            for (const interNode of intersections) {
              if (!interNode) {
                continue;
              }
              if (interNode.type == GroupType) {
                console.log("Cannot add GroupNode to GroupNode");
                continue;
              }
              if (interNode.parentNode) {
                console.log("Will not steal node from another group");
                continue;
              }
              if (interNode.parentNode !== node.id) {
                interNode.position = {
                  x: interNode.position.x - node.position.x,
                  y: interNode.position.y - node.position.y,
                };
                interNode.parentNode = node.id;
                get().softUpdateNode(interNode);
              }
            }
          }
        } else {
          const intersections = reactFlowInstance.getIntersectingNodes(node);
          // TODO check if there is atleast one group
          const groupIntersections = intersections.filter(
            (n) => n.type == GroupType
          ) as GroupNodeType[];

          if (groupIntersections.length == 0) {
            if (node.parentNode != undefined) {
              const oldParent = nodes.find((n) => n.id == node.parentNode);
              if (!oldParent) {
                return console.log(
                  "Failed to find parent node while removing node from parent"
                );
              }

              node.parentNode = undefined;
              node.position = {
                x: node.position.x + oldParent.position.x,
                y: node.position.y + oldParent.position.y,
              };
              get().softUpdateNode(node);
            }
          } else if (groupIntersections.length == 1) {
            if (
              groupIntersections[0].id != node.parentNode &&
              !groupIntersections[0].data.locked
            ) {
              node.position = {
                x: node.position.x - groupIntersections[0].position.x,
                y: node.position.y - groupIntersections[0].position.y,
              };
              node.parentNode = groupIntersections[0].id;
              get().softUpdateNode(node);
            }
          } else {
            console.log("Will not update parent if in more than 1 group");
          }
        }
      } else {
        console.log("reactFlowInstance missing");
      }
    },
    onNodesChange: (changes: NodeChange[]) => {
      console.log("onNodesChange");
      set({
        nodes: applyNodeChanges(changes, get().nodes) as MyNode[],
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
    setNodes: (nodes: MyNode[]) => {
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
    softUpdateNode: async (node: MyNode) => {
      set({
        nodes: [...get().nodes.filter((n) => n.id != node.id), node],
      });
    },
    updateNode: async (node: MyNode) => {
      const updateUUID = uuid();
      const nodes = get().nodes;
      const edges = get().edges;
      const updateOrder = topologicalSort(node, nodes, edges);
      for (const updateNode of updateOrder) {
        // Updates Node in place
        updateNode.data = { ...updateNode.data, loading: true };
        await set((state) => ({
          nodes: [
            //TODO maybe use nodes instead of ...get().nodes
            ...state.nodes.filter((n) => n.id != updateNode.id),
            updateNode,
          ] as MyNode[],
        }));
      }
      get().orderedRefreshNodes(
        updateOrder.map((u) => u.id),
        updateUUID
      );
    },
    updateEdge: async (edge: Edge, connection: Connection) => {
      set({
        edges: updateEdge(edge, connection, get().edges),
      });
    },
    setReactFlowInstance: (reactFlowInstance: ReactFlowInstance) => {
      set({
        reactFlowInstance,
      });
    },
    orderedRefreshNodes: async (
      nodeIds: string[],
      updateUUID: string,
      i: number = 0
    ) => {
      if (nodeIds.length == 0 || i == nodeIds.length) return;

      // TODO these nodes are out of date, thus we need to use setTimeout
      const updateNode: Node | undefined = get().nodes.find(
        (n) => n.id == nodeIds[i]
      );
      if (!updateNode) return;

      await updateNode.data.refresh?.(updateNode, get().nodes, get().edges);
      // Force inplaced update
      updateNode.data = { ...updateNode.data, loading: false };

      await set((state) => {
        return {
          ...state,
          nodes: [
            //TODO maybe use nodes instead of ...get().nodes
            ...state.nodes.filter((n) => n.id != updateNode.id),
            updateNode,
          ] as MyNode[],
        };
      });
      setTimeout(() => {
        get().orderedRefreshNodes(nodeIds, updateUUID, i + 1);
      }, 0);
    },
  })
  // )
);

export default useFlow;
