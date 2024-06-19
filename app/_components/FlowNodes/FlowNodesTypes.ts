import { MyWorker } from "@/app/_lib/worker-utilts";

import { Node, Edge } from "reactflow";
import {
  BasicTable,
  LogTable,
  Scaling,
  Table,
  isTable2DX,
  isTable2DY,
} from "@/app/_lib/rom-metadata";
import { LogRecord } from "@/app/_lib/log";
import { MyNode } from "@/app/store/useFlow";
import { HandleTypes } from "@/app/_components/FlowNodes/CustomHandle/CustomType";

export interface RefreshSource {
  sourceNodeId: string;
  refreshUUID: string;
}

export interface KillablePromise<T> {
  worker: MyWorker;
  promise: Promise<T>;
}

export interface Cloneable<T> {
  clone(updates?: Partial<T>): T;
}

export abstract class RefreshableNode<T> implements Cloneable<T> {
  loading?: boolean;
  updates?: RefreshSource[];
  activeUpdate?: KillablePromise<Partial<T>> | null;
  abstract clone(updates?: Partial<T>): T;
  abstract createWorker(): Worker;
  public abstract addWorkerPromise(
    node: MyNode,
    nodes: MyNode[],
    edges: Edge[]
  ): void;
  public isPartial(nodeData: unknown): nodeData is Partial<T> {
    return (
      nodeData !== null &&
      typeof nodeData === "object" &&
      Object.keys(nodeData).every((key) => key in this)
    );
  }
}

export interface NodeWithType<T, U extends string> extends Node<T, U> {
  type: U;
}

export interface SaveableNode<T = {}> {
  getLoadable: () => T;
}

export interface TableData<T> {
  table: Table<T> | null;
  scalingMap: Record<string, Scaling> | null;
  tableMap: Record<string, BasicTable> | null;
}

export interface LogNode {
  logs: LogRecord[] | null;
}

export function isRefreshableNode<T>(
  node: MyNode
): node is Extract<MyNode, Node<RefreshableNode<T>>> {
  return (
    node.data instanceof RefreshableNode &&
    typeof node.data.addWorkerPromise === "function"
  );
}
export interface RomNode {
  scalingMap: Record<string, Scaling> | null;
  tableMap: Record<string, BasicTable> | null;
  selectedRomFile: File | null;
}

export interface TableNode extends RomNode {
  table: BasicTable | LogTable | null;
  tableType: HandleTypes | undefined;
}

// TODO create better tpying around BasicTable and LogTable
export function isTableLogRecord(
  table: BasicTable | LogTable
): table is LogTable {
  if (table.type == "1D") {
    return Array.isArray(table.values);
  }
  if (table.type == "3D") {
    return Array.isArray(table.values[0][0]);
  }
  if (table.type == "2D") {
    if (isTable2DX(table)) {
      return Array.isArray(table.values[0][0]);
    }
    if (isTable2DY(table)) {
      return Array.isArray(table.values[0]);
    }
  }
  return false;
}

export function isTableBasic(
  table: BasicTable | LogTable
): table is BasicTable {
  return !isTableLogRecord(table);
}

export function isLogNode(node: Node): node is Node<LogNode> {
  return "logs" in node.data;
}

export type RefreshableLogNode = RefreshableNode<LogNode> & LogNode;
export function isRefreshableLogNode(
  node: Node
): node is Node<RefreshableLogNode> {
  return "addWorkerPromise" in node.data && "logs" in node.data;
}

export type RefreshableTableNode = RefreshableNode<TableNode> & TableNode;
export function isRefreshableTableNode(
  node: Node
): node is Node<RefreshableTableNode> {
  return (
    "addWorkerPromise" in node.data &&
    "table" in node.data &&
    "scalingMap" in node.data &&
    "tableMap" in node.data &&
    "selectedRomFile" in node.data
  );
}
// export type RefreshableTableNode = RefreshableNode<TableNode> & TableNode;
// export function isRefreshableTableNode(
//   node: Node
// ): node is Node<RefreshableTableNode> {
//   return (
//     "addWorkerPromise" in node.data &&
//     "table" in node.data &&
//     "scalingMap" in node.data &&
//     "tableMap" in node.data &&
//     "selectedRomFile" in node.data
//   );
// }
export type RefreshableRomNode = RefreshableNode<RomNode> & RomNode;
export function isRefreshableRomNode(
  node: Node
): node is Node<RefreshableRomNode> {
  return "addWorkerPromise" in node.data && "selectedRomFile" in node.data;
}
