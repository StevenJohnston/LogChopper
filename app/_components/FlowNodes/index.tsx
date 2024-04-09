'use client'
import { Node, Edge } from 'reactflow';
import { BaseLogType } from "@/app/_components/FlowNodes/BaseLog/BaseLogTypes";
import { FillTableType } from '@/app/_components/FlowNodes/FillTable/FillTableTypes';
import { BaseTableType } from '@/app/_components/FlowNodes/BaseTable/BaseTableTypes';
import { Table } from '@/app/_lib/rom-metadata';
import { LogRecord } from '@/app/_lib/log';
import { LogFilterType } from '@/app/_components/FlowNodes/LogFilter/LogFilterTypes';
import { newBaseLogData } from '@/app/_components/FlowNodes/BaseLog/BaseLogNode';
import { newBaseTableData } from '@/app/_components/FlowNodes/BaseTable/BaseTableNode';
import { newCombineData } from '@/app/_components/FlowNodes/CombineNode/CombineNode';
import { CombineType } from '@/app/_components/FlowNodes/CombineNode/CombineTypes';
import { newFillLogTable } from '@/app/_components/FlowNodes/FillLogTable/FillLogTableNode';
import { newLogFilter } from '@/app/_components/FlowNodes/LogFilter/LogFilterNode';
import { newGroup } from '@/app/_components/FlowNodes/Group/GroupNode';
import { newFillTable } from '@/app/_components/FlowNodes/FillTable/FillTableNode';
import { FillLogTableType } from '@/app/_components/FlowNodes/FillLogTable/FillLogTableTypes';
import { GroupType } from '@/app/_components/FlowNodes/Group/GroupNodeTypes';

export const LogNodeTypes: string[] = [BaseLogType, LogFilterType]
export const TableNodeTypes: string[] = [BaseLogType, FillTableType, BaseTableType]

export interface RefreshableNode {
  refresh?: (node: Node, nodes: Node[], edges: Edge[]) => Promise<void>
}

export interface SaveableNode<T = {}> {
  getLoadable: () => T
}

export interface TableData<T> {
  table: Table<T> | null;
}

export interface LogData {
  logs: LogRecord[];
}

export const NodeFactoryLookup = {
  [BaseLogType]: newBaseLogData,
  [BaseTableType]: newBaseTableData,
  [CombineType]: newCombineData,
  [FillLogTableType]: newFillLogTable,
  [FillTableType]: newFillTable,
  [GroupType]: newGroup,
  [LogFilterType]: newLogFilter,
} as const
