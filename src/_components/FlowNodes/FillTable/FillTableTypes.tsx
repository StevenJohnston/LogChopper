'use client'

import { NodeWithType, RefreshableNode, SaveableNode, TableData } from '@/src/_components/FlowNodes';
import { BasicTable, LogTable, Scaling } from '@/src/_lib/rom-metadata';
import { LogRecord } from '@/src/_lib/log';
import { Aggregator } from '@/src/_lib/consts';

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
