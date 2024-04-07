"use client";
import { Edge, Node, getOutgoers } from "reactflow";

// Assumes all missing parent nodes have already been updated
export function topologicalSort(
  node: Node,
  nodes: Node[],
  edges: Edge[]
): Node[] {
  const visitsRequired: Record<string, [number, Node]> = {};
  populateVisitsRequired(visitsRequired, node, nodes, edges);
  return sortVisitsRequired(visitsRequired, node, nodes, edges);
}

export function sortVisitsRequired(
  visitsRequired: Record<string, [number, Node]>,
  node: Node,
  nodes: Node[],
  edges: Edge[]
): Node[] {
  if (visitsRequired[node.id][0] == 1) {
    const childNodes = [node];
    const outgoers = getOutgoers(node, nodes, edges);
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
  visitsRequired: Record<string, [number, Node]>,
  node: Node,
  nodes: Node[],
  edges: Edge[]
) {
  if (visitsRequired[node.id]) {
    visitsRequired[node.id][0]++;
    return;
  }

  visitsRequired[node.id] = [1, node];
  const outgoers = getOutgoers(node, nodes, edges);
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

export function getParentsByHandleIds<T extends Node[]>(
  node: Node,
  nodes: Node[],
  edges: Edge[],
  sourceHandleIds: string[]
): T | null {
  const parentNodes: Node[] = [];
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
  return parentNodes as T;
}
