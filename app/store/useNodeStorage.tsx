`use client`;

import {
  Edge,
  Node,
} from "reactflow";

import { createWithEqualityFn } from "zustand/traditional";
import { persist, createJSONStorage } from 'zustand/middleware'
import { NodeFactoryLookup } from "@/app/_components/FlowNodes";
import { v4 as uuid } from "uuid";

import { MyNode } from "@/app/store/useFlow";

export interface SavedGroup {
  groupName: string
  nodes: MyNode[]
  edges: Edge[]
}

export type NodeStorageState = {
  savedGroups: SavedGroup[]
  saveGroup(savedGroup: SavedGroup): void
  deleteGroup(groupName: string): void
};


const useNodeStorage = createWithEqualityFn<NodeStorageState>()(
  persist(
    // zukeeper((set, get) => ({
    (set, get) => ({
      savedGroups: [],
      saveGroup: (savedGroup: SavedGroup) => {
        set({
          savedGroups: [...get().savedGroups, savedGroup]
        })
      },
      deleteGroup: (groupName: string) => {
        set({
          savedGroups: get().savedGroups.filter(g => g.groupName != groupName)
        })
      }
    }),
    {
      name: 'saved-nodes', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    },
    // )
  )
);

export function cloneSavedGroup(savedGroup: SavedGroup): SavedGroup {
  const newIdMap: Record<string, string> = {}
  const newNodes: MyNode[] = []
  for (const node of savedGroup.nodes) {
    if (!newIdMap[node.id]) {
      newIdMap[node.id] = uuid()
    }
    if (node.parentNode && !newIdMap[node.parentNode]) {
      newIdMap[node.parentNode] = uuid()
    }

    if (!node?.type) {
      console.log("Failed to init node", node)
      continue
    }
    if (!NodeFactoryLookup[node.type]) {
      console.log(`NodeFactoryLookup missing node type ${node.type}`)
    }

    newNodes.push({
      ...node,
      id: newIdMap[node.id],
      parentNode: node.parentNode ? newIdMap[node.parentNode] : undefined,
      data: NodeFactoryLookup[node.type](node.data),
      selected: undefined
    })
  }
  const newEdges: Edge[] = []

  for (const edge of savedGroup.edges) {
    if (!newIdMap[edge.id]) {
      newIdMap[edge.id] = uuid()
    }
    if (!newIdMap[edge.source]) {
      newIdMap[edge.source] = uuid()
    }
    if (!newIdMap[edge.target]) {
      newIdMap[edge.target] = uuid()
    }
    if (edge.sourceHandle && !newIdMap[edge.sourceHandle]) {
      newIdMap[edge.sourceHandle] = uuid()
    }
    if (edge.targetHandle && !newIdMap[edge.targetHandle]) {
      newIdMap[edge.targetHandle] = uuid()
    }
    newEdges.push({
      ...edge,
      source: newIdMap[edge.source],
      target: newIdMap[edge.target],
      // sourceHandle: edge.sourceHandle ? newIdMap[edge.sourceHandle] : undefined,
      // targetHandle: edge.targetHandle ? newIdMap[edge.targetHandle] : undefined,
      selected: undefined
    })
    // if (node.parentNode && !newIdMap[node.parentNode]) {
    //   newIdMap[node.parentNode] = uuid()
    // }
  }
  return {
    groupName: savedGroup.groupName,
    nodes: newNodes,
    edges: newEdges
  }
}


export default useNodeStorage;
