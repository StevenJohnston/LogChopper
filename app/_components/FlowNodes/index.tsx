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
import { newForkData } from '@/app/_components/FlowNodes/ForkNode/ForkNode';
import { ForkType } from '@/app/_components/FlowNodes/ForkNode/ForkTypes';
import { newFillLogTable } from '@/app/_components/FlowNodes/FillLogTable/FillLogTableNode';
import { newLogFilter } from '@/app/_components/FlowNodes/LogFilter/LogFilterNode';
import { newGroup } from '@/app/_components/FlowNodes/Group/GroupNode';
import { newFillTable } from '@/app/_components/FlowNodes/FillTable/FillTableNode';
import { FillLogTableType } from '@/app/_components/FlowNodes/FillLogTable/FillLogTableTypes';
import { GroupType } from '@/app/_components/FlowNodes/Group/GroupNodeTypes';
import { MyNode } from '@/app/store/useFlow';
import { CombineAdvancedTableType } from '@/app/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableTypes';
import { newCombineAdvanced } from '@/app/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableNode';
import { newCombine } from '@/app/_components/FlowNodes/Combine/CombineNode';
import { CombineType } from '@/app/_components/FlowNodes/Combine/CombineTypes';
import { LogAlterType } from '@/app/_components/FlowNodes/LogAlter/LogAlterTypes';
import { newLogAlter } from '@/app/_components/FlowNodes/LogAlter/LogAlterNode';
import { RunningLogAlterType } from '@/app/_components/FlowNodes/RunningLogAlter/RunningLogAlterTypes';
import { newRunningLogAlter } from '@/app/_components/FlowNodes/RunningLogAlter/RunningLogAlterNode';

export const LogNodeTypes: string[] = [BaseLogType, LogFilterType, LogAlterType, RunningLogAlterType]
export const TableNodeTypes: string[] = [FillTableType, BaseTableType, FillLogTableType, CombineAdvancedTableType, CombineType]

export interface RefreshableNode {
  loading?: boolean
  updateUUID?: string,
  refresh?: (node: MyNode, nodes: Node[], edges: Edge[]) => Promise<void>
}

export interface NodeWithType<T, U extends string> extends Node<T, U> {
  type: U
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
  [ForkType]: newForkData,
  [FillLogTableType]: newFillLogTable,
  [FillTableType]: newFillTable,
  [GroupType]: newGroup,
  [LogFilterType]: newLogFilter,
  [LogAlterType]: newLogAlter,
  [CombineAdvancedTableType]: newCombineAdvanced,
  [CombineType]: newCombine,
  [RunningLogAlterType]: newRunningLogAlter,
} as const
