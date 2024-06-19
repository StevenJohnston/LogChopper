"use client";
import { MyNode } from "@/app/store/useFlow";
import { Edge, Node, getOutgoers } from "reactflow";

export interface TopologicalNode extends Node {
  lastParentId: string;
}

// Assumes all missing parent nodes have already been updated
export function topologicalSort(
  node: MyNode,
  nodes: MyNode[],
  edges: Edge[]
): MyNode[] {
  const visitsRequired: Record<string, [number, MyNode]> = {};
  populateVisitsRequired(visitsRequired, node, nodes, edges);
  return sortVisitsRequired(visitsRequired, node, nodes, edges);
}

export function sortVisitsRequired(
  visitsRequired: Record<string, [number, MyNode]>,
  node: MyNode,
  nodes: MyNode[],
  edges: Edge[]
): MyNode[] {
  if (visitsRequired[node.id][0] == 1) {
    const childNodes = [node];
    const outgoers = getOutgoers(node, nodes, edges) as MyNode[];
    for (const o of outgoers) {
      childNodes.push(...sortVisitsRequired(visitsRequired, o, nodes, edges));
    }
    return childNodes;
  } else {
    visitsRequired[node.id][0]--;
  }
  return [];
}

export function populateVisitsRequired(
  visitsRequired: Record<string, [number, MyNode]>,
  node: MyNode,
  nodes: MyNode[],
  edges: Edge[]
) {
  if (visitsRequired[node.id]) {
    visitsRequired[node.id][0]++;
    return;
  }

  visitsRequired[node.id] = [1, node];
  // TODO in this cast to MyNode[] needed
  const outgoers = getOutgoers(node, nodes, edges) as MyNode[];
  if (!outgoers) {
    return;
  }
  for (const o of outgoers) {
    populateVisitsRequired(visitsRequired, o, nodes, edges);
  }
}

// export function getEdgeHandleType(c: Edge): string | null {
//   return c.sourceHandle?.split("#")[0] || null;
// }

// export function edgeIsType(e: Edge, t: string): boolean {
//   return getEdgeHandleType(e) == t;
// }

export function edgeIsSourceHanldeId(e: Edge, handleId: string): boolean {
  return e.sourceHandle?.split("#")[1] == handleId;
}

export function edgeIsTargetHanldeId(e: Edge, handleId: string): boolean {
  return e.targetHandle?.split("#")[1] == handleId;
}

// returns parent nodes in order of sourceHandleIds
export function getParentsByHandleIds(
  node: MyNode,
  nodes: MyNode[],
  edges: Edge[],
  sourceHandleIds: string[]
): MyNode[] | null {
  const parentNodes: MyNode[] = [];
  const myEdges = edges.filter((e) => e.target == node.id);
  for (const sourceHandleId of sourceHandleIds) {
    const tableSourceEdge = myEdges.find((e) =>
      edgeIsTargetHanldeId(e, sourceHandleId)
    );
    if (!tableSourceEdge) {
      console.log(
        `source edge for ${sourceHandleId} handle is not ${sourceHandleId}`
      );
      return null;
    }
    const edgeSourceNode = nodes.find((n) => n.id == tableSourceEdge.source);
    if (!edgeSourceNode) {
      console.log(`node for edge ${tableSourceEdge.id} not found`);
      return null;
    }
    parentNodes.push(edgeSourceNode);
  }
  return parentNodes;
}

export function orderAndTypeArray<T extends Node[]>(
  arr: Node[],
  typeGuards: Array<(value: Node) => value is any>
): T | never[] {
  const result: T | never[] = [];
  for (const typeGuard of typeGuards) {
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i];
      if (typeGuard(v)) {
        // @ts-ignore
        result.push(v); // Safe push due to type guard
        arr.splice(i, 1);
        break;
      }
    }
  }
  return result;
}

// export function orderAndTypeArray<T extends Node>(
//   arr: Node[],
//   typeGuards: {
//     // Array<(value: Node) => value is T>,
//     [K in keyof T]: (value: Node) => value is Extract<T[K], Node>;
//   }[]
// ): T[] {
//   const result: T[] = [];
//   const unmatched: unknown[] = [];

//   for (const item of arr) {
//     for (const typeGuard of typeGuards) {
//       let passedGuardCount = 0;
//       for (const t of typeGuard) {
//         if (t(item)) {
//           passedGuardCount++;
//           // result.push(item); // Safe push due to type guard
//           // break; // Move to the next item if a match is found
//         }
//       }
//       if (passedGuardCount == typeGuard.length) {
//         result.push(item); // Safe push due to type guard
//         break; // Move to the next item if a match is found
//       }
//     }
//     if (!result.includes(item as T)) {
//       // Check if item was already added
//       unmatched.push(item);
//     }
//   }

//   // If there are unmatched values, you might want to handle them (e.g., error, log)
//   if (unmatched.length > 0) {
//     console.warn("Unmatched values:", unmatched);
//   }

//   return result;
// }
