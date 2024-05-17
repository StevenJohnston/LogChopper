'use client'

import { NodeWithType, RefreshableNode, SaveableNode, TableData } from '@/app/_components/FlowNodes';
import { LogTable } from '@/app/_lib/rom-metadata';
import { LogRecord } from '@/app/_lib/log';

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