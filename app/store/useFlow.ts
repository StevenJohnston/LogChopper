`use client`;

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
  ReactFlowInstance,
} from "reactflow";

import { createWithEqualityFn } from "zustand/traditional";
import { LogRecord } from "../_lib/log";
import { BaseTableNodeType } from "@/app/_components/FlowNodes/BaseTable/BaseTableNode";
import { BaseLogNodeType } from "@/app/_components/FlowNodes/BaseLog/BaseLogNode";
import { CombineNodeType } from "@/app/_components/FlowNodes/CombineNode/CombineNode";
import { LogFiltereNodeType } from "@/app/_components/FlowNodes/LogFilter/LogFilterNode";
import { topologicalSort } from "@/app/_lib/react-flow-utils";
import { FillTableNodeType } from "@/app/_components/FlowNodes/FillTable/FillTableNode";
import { FillLogTableNodeType } from "@/app/_components/FlowNodes/FillLogTable/FillLogTableNode";
import {
  GroupNodeType,
  GroupType,
} from "@/app/_components/FlowNodes/Group/GroupNodeTypes";

import type { MouseEvent } from "react";

export type MyNode =
  | BaseTableNodeType
  | BaseLogNodeType
  | CombineNodeType
  | LogFiltereNodeType
  | FillTableNodeType
  | FillLogTableNodeType
  | GroupNodeType;

const initialNodes = [] as Node[];
const initialEdges = [] as Edge[];

export type RFState = {
  reactFlowInstance?: ReactFlowInstance;
  nodes: Node[];
  edges: Edge[];
  onNodeDragStop: (event: MouseEvent, node: Node, nodes: Node[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: MyNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: MyNode) => void;
  addEdge: (edge: Edge) => void;
  softUpdateNode: (node: Node) => void;
  updateNode: (node: MyNode) => void;
  updateEdge: (edge: Edge, connection: Connection) => void;
  setReactFlowInstance: (reactFlowInstance: ReactFlowInstance) => void;
};

const useFlow = createWithEqualityFn<RFState>(
  // zukeeper((set, get) => ({
  (set, get) => ({
    nodes: initialNodes,
    edges: initialEdges,
    onNodeDragStop: (event: MouseEvent, node: Node, nodes: Node[]) => {
      const reactFlowInstance = get().reactFlowInstance;
      if (reactFlowInstance) {
        nodes = get().nodes;
        if (node.type == GroupType) {
          console.log("Dropped Group");
          const intersections = reactFlowInstance.getIntersectingNodes(node);
          console.log("intersections", intersections);
          for (const interNode of intersections) {
            // const interNode = nodes.find((n) => n.id == intersection);
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
        } else {
          const intersections = reactFlowInstance.getIntersectingNodes(node);
          // TODO check if there is atleast one group
          const groupIntersections = intersections.filter(
            (n) => n.type == GroupType
          );

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
            if (groupIntersections[0].id != node.parentNode) {
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
    softUpdateNode: async (node: Node) => {
      set({
        nodes: [...get().nodes.filter((n) => n.id != node.id), node],
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
            //TODO maybe use nodes instead of ...get().nodes
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
    setReactFlowInstance: (reactFlowInstance: ReactFlowInstance) => {
      set({
        reactFlowInstance,
      });
    },
  })
  // )
);

export default useFlow;
