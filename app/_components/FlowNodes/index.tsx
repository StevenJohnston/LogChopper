'use client'
import { Node, Edge } from 'reactflow';
import { BaseLogType } from "@/app/_components/FlowNodes/BaseLog/BaseLogTypes";
import { FillTableType } from '@/app/_components/FlowNodes/FillTable/FillTableTypes';
import { BaseTableType } from '@/app/_components/FlowNodes/BaseTable/BaseTableTypes';
import { Table } from '@/app/_lib/rom-metadata';
import { LogRecord } from '@/app/_lib/log';
import { LogFilterType } from '@/app/_components/FlowNodes/LogFilter/LogFilterTypes';

export const LogNodeTypes: string[] = [BaseLogType, LogFilterType]
export const TableNodeTypes: string[] = [BaseLogType, FillTableType, BaseTableType]

export interface RefreshableNode {
  refresh?: (node: Node, nodes: Node[], edges: Edge[]) => Promise<void>
}

export interface SaveableNode {
  save: (node: Node, nodes: Node[], edges: Edge[]) => string;
  load: (json: string) => void;
}

export interface TableData<T> {
  table: Table<T> | null;
}

export interface LogData {
  logs: LogRecord[];
}