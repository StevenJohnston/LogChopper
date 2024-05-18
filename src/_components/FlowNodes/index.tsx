'use client'
import { Node, Edge } from 'reactflow';
import { BaseLogType } from "@/src/_components/FlowNodes/BaseLog/BaseLogTypes";
import { FillTableType } from '@/src/_components/FlowNodes/FillTable/FillTableTypes';
import { BaseTableType } from '@/src/_components/FlowNodes/BaseTable/BaseTableTypes';
import { Table } from '@/src/_lib/rom-metadata';
import { LogRecord } from '@/src/_lib/log';
import { LogFilterType } from '@/src/_components/FlowNodes/LogFilter/LogFilterTypes';
import { newBaseLogData } from '@/src/_components/FlowNodes/BaseLog/BaseLogNode';
import { newBaseTableData } from '@/src/_components/FlowNodes/BaseTable/BaseTableNode';
import { newForkData } from '@/src/_components/FlowNodes/ForkNode/ForkNode';
import { ForkType } from '@/src/_components/FlowNodes/ForkNode/ForkTypes';
import { newFillLogTable } from '@/src/_components/FlowNodes/FillLogTable/FillLogTableNode';
import { newLogFilter } from '@/src/_components/FlowNodes/LogFilter/LogFilterNode';
import { newGroup } from '@/src/_components/FlowNodes/Group/GroupNode';
import { newFillTable } from '@/src/_components/FlowNodes/FillTable/FillTableNode';
import { FillLogTableType } from '@/src/_components/FlowNodes/FillLogTable/FillLogTableTypes';
import { GroupType } from '@/src/_components/FlowNodes/Group/GroupNodeTypes';
import { MyNode } from '@/src/store/useFlow';
import { CombineAdvancedTableType } from '@/src/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableTypes';
import { newCombineAdvanced } from '@/src/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableNode';
import { newCombine } from '@/src/_components/FlowNodes/Combine/CombineNode';
import { CombineType } from '@/src/_components/FlowNodes/Combine/CombineTypes';
import { LogAlterType } from '@/src/_components/FlowNodes/LogAlter/LogAlterTypes';
import { newLogAlter } from '@/src/_components/FlowNodes/LogAlter/LogAlterNode';

export const LogNodeTypes: string[] = [BaseLogType, LogFilterType, LogAlterType]
export const TableNodeTypes: string[] = [FillTableType, BaseTableType, FillLogTableType, CombineAdvancedTableType, CombineType]

export interface RefreshableNode {
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
} as const
