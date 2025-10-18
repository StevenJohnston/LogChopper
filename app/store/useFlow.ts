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
} from "reactflow";

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
import { isRefreshableNode } from "@/app/_components/FlowNodes/FlowNodesTypes";
import { BaseRomNodeType } from "@/app/_components/FlowNodes/BaseRom/BaseRomTypes";
import { AfrShiftNodeType } from "@/app/_components/FlowNodes/AfrShift/AfrShiftTypes";
import { MovingAverageLogFilterNodeType } from "@/app/_components/FlowNodes/MovingAverageLogFilter/MovingAverageLogFilterTypes";
import {
  TableRemapData,
  TableRemapNodeType,
} from "@/app/_components/FlowNodes/TableRemap/TableRemapTypes";
import { RomSelectorNodeType } from "@/app/_components/FlowNodes/RomSelector/RomSelectorTypes";
import { AfrMlShifterNodeType } from "@/app/_components/FlowNodes/AfrMlShifter/AfrMlShifterTypes";
import { TpsAfrDeleteNodeType } from "@/app/_components/FlowNodes/TpsAfrDelete/TpsAfrDeleteTypes";

interface ClonableData {
  clone: (data: any) => any;
}

function isClonableData(data: any): data is ClonableData {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.clone === "function"
  );
}

export type MyNode =
  | BaseLogNodeType
  | LogFilterNodeType
  | BaseRomNodeType
  | BaseTableNodeType
  | ForkNodeType
  | LogAlterNodeType
  | FillTableNodeType
  | FillLogTableNodeType
  | CombineNodeType
  | CombineAdvancedTableNodeType
  | RunningLogAlterNodeType
  | AfrShiftNodeType
  | MovingAverageLogFilterNodeType
  | GroupNodeType
  | TableRemapNodeType
  | RomSelectorNodeType
  | AfrMlShifterNodeType
  | TpsAfrDeleteNodeType;

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
  updateTableRemapNodeConfig: (
    nodeId: string,
    config: Partial<TableRemapData>
  ) => void;
  updateNodeData: (nodeId: string, data: any) => void;
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
      set((state) => {
        return {
          // @ts-ignore
          nodes: applyNodeChanges(changes, state.nodes) as MyNode[],
        };
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
      await set((state) => {
        const updateNode: MyNode | undefined = state.nodes.find(
          (n) => n.id == node.id
        );
        if (!updateNode) return state;

        if (isRefreshableNode(node) && isRefreshableNode(updateNode)) {
          node.data.loading = updateNode.data.loading;
        }
        return {
          nodes: [
            ...state.nodes.filter((n) => n.id != node.id),
            node,
          ] as MyNode[],
        };
      });
    },
    updateNode: async (node: MyNode) => {
      await set((state) => {
        const oldNode = state.nodes.find((n) => n.id == node.id);
        if (oldNode && isRefreshableNode(oldNode)) {
          oldNode?.data.activeUpdate?.worker.postMessage({
            type: "kill",
          });
        }
        // Instantly add new update
        const allNodesUpdated = state.nodes.filter((n) => n.id != node.id);
        allNodesUpdated.push(node);

        const updateOrder = topologicalSort(node, allNodesUpdated, state.edges);
        for (const updateNode of updateOrder) {
          if (!isRefreshableNode(updateNode)) {
            continue;
          }
          updateNode.data.activeUpdate?.worker.postMessage({
            type: "kill",
          });

          updateNode.data.addWorkerPromise(
            updateNode,
            allNodesUpdated,
            state.edges
          );
          const thisPromise = updateNode.data.activeUpdate?.promise;

          thisPromise
            ?.then((refreshedData) => {
              // TODO how can i tell typescript that this promise belongs to updateNode
              set((state) => {
                const thisNode = state.nodes.find(
                  (n) => n.id == updateNode.id
                ) as typeof updateNode;
                if (!thisNode) return {};
                if (!isRefreshableNode(thisNode)) return {};
                // if (thisPromise != thisNode.data.activeUpdate?.promise) {
                //   return {};
                // }

                refreshedData.loading = false;
                if (!thisNode.data.isPartial(refreshedData)) {
                  console.log(
                    `addWorkerPromise has resolved with a non Partial data for node type ${thisNode.type}`
                  );
                  throw new Error(
                    `addWorkerPromise has resolved with a non Partial data for node type ${thisNode.type}`
                  );
                }
                // @ts-ignore Why typescript doesn't respect my .isPartial typeguard
                thisNode.data = thisNode.data.clone(refreshedData);
                return {
                  nodes: [
                    ...state.nodes.filter((n) => n.id != thisNode.id),
                    thisNode,
                  ],
                };
              });
            })
            .catch((e) => {
              // Node may have updated internally
              set((state) => {
                const thisNode = state.nodes.find(
                  (n) => n.id == updateNode.id
                ) as typeof updateNode;
                thisNode.data = thisNode.data.clone({});
                return {
                  nodes: [
                    ...state.nodes.filter((n) => n.id != thisNode.id),
                    thisNode,
                  ],
                };
              });
              console.log(
                "Failed to getRefreshedData, skipping node update",
                e
              );
            })
            .finally(() => {
              set((state) => {
                const thisNode = state.nodes.find(
                  (n) => n.id == updateNode.id
                ) as typeof updateNode;
                if (!thisNode) return {};
                thisNode.data = thisNode.data.clone({ loading: false });
                return {
                  nodes: [
                    ...state.nodes.filter((n) => n.id != thisNode.id),
                    thisNode,
                  ],
                };
              });
            });
          updateNode.data = updateNode.data.clone({
            loading: true,
          });
        }

        return {
          nodes: allNodesUpdated,
        };
      });
    },
    updateEdge: async (edge: Edge, connection: Connection) => {
      set({
        edges: updateEdge(edge, connection, get().edges),
      });

      // Update target node, critical for childNode updates
      set((state) => {
        const targetNode = state.nodes.find((n) => n.id == connection.target);
        if (!targetNode) return {};
        state.updateNode(targetNode);
        return {};
      });
    },
    setReactFlowInstance: (reactFlowInstance: ReactFlowInstance) => {
      set({
        reactFlowInstance,
      });
    },
    updateTableRemapNodeConfig: (
      nodeId: string,
      config: Partial<TableRemapData>
    ) => {
      const nodes = get().nodes;
      const node = nodes.find((n) => n.id === nodeId) as
        | TableRemapNodeType
        | undefined;
      if (node) {
        const newNode = { ...node, data: node.data.clone(config) };
        get().updateNode(newNode);
      }
    },
    updateNodeData: (nodeId: string, data: any) => {
      set((state) => {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          if (isClonableData(node.data)) {
            node.data = node.data.clone(data);
          } else {
            node.data = { ...node.data, ...data };
          }
        }
        return { nodes: [...state.nodes] };
      });
    },
  })
  // )
);

export default useFlow;
