'use client'

import { NodeWithType, RefreshableNode, SaveableNode, TableData } from '@/app/_components/FlowNodes';
import { BasicTable, LogTable, Scaling } from '@/app/_lib/rom-metadata';
import { LogRecord } from '@/app/_lib/log';
import { Aggregator } from '@/app/_lib/consts';

export interface InitFillTableData {
  logField?: keyof LogRecord
  aggregator?: Aggregator
}

export interface FillTableData extends InitFillTableData, TableData<unknown>, RefreshableNode, SaveableNode {
  table: BasicTable | null
  scalingMap: Record<string, Scaling>;
  parentTable: LogTable | null
}

export const FillTableType = "FillTableNode";
export type FillTableNodeType = NodeWithType<FillTableData, typeof FillTableType>;
export const sourceTableHandleId = "TableIn"
export const targetTableHandleId = "TableOut"
export const FillTableSources = [sourceTableHandleId]
