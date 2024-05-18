'use client'

import { NodeWithType, RefreshableNode, SaveableNode, TableData } from '@/src/_components/FlowNodes';
import { LogTable } from '@/src/_lib/rom-metadata';
import { LogRecord } from '@/src/_lib/log';

export interface InitFillLogTableData {
  weighted: boolean
}
export interface FillLogTableData extends InitFillLogTableData, TableData<LogRecord[]>, RefreshableNode, SaveableNode {
  table: LogTable | null
}

export const FillLogTableType = "FillLogTableNode";
export type FillLogTableNodeType = NodeWithType<FillLogTableData, typeof FillLogTableType>;
export const sourceTableHandleId = "TableIn"
export const sourceLogHandleId = "LogIn"
export const FillLogTableSources = [sourceTableHandleId, sourceLogHandleId]