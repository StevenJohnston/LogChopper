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

export interface TableData<T> {
  table: Table<T> | null;
  // tableType: string
}

// export const LogTableDataType = "LogRecord[]"
// export const BasicTableDataType = "string | number"
// export interface LogTableData extends BaseTableData<LogRecord[]> {
//   tableType: typeof LogTableDataType
// }
// export interface BasicTableData extends BaseTableData<string | number> {
//   tableType: typeof BasicTableDataType
// }

// export type TableData = LogTableData | BasicTableData

export interface LogData {
  logs: LogRecord[];
}