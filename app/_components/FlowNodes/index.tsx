import { Node, Edge } from 'reactflow';
import { BaseLogType } from "@/app/_components/FlowNodes/BaseLogNode";
import { FillTableType } from '@/app/_components/FlowNodes/FillTableNode';
import { BaseTableType } from '@/app/_components/FlowNodes/BaseTableNode';
import { Table } from '@/app/_lib/rom-metadata';
import { LogRecord } from '@/app/_lib/log';

export const LogNodeTypes: string[] = [BaseLogType]
export const TableNodeTypes: string[] = [BaseLogType, FillTableType, BaseTableType]

export interface RefreshableNode {
  refresh?: (node: Node, nodes: Node[], edges: Edge[]) => Promise<void>
}

export interface TableData {
  table: Table<unknown> | null;
}

export interface LogData {
  logs: LogRecord[];
}