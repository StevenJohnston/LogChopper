'use client'
import { Node } from 'reactflow';

import { RefreshableNode, TableData } from '@/app/_components/FlowNodes';
import { LogTable } from '@/app/_lib/rom-metadata';
import { LogRecord } from '@/app/_lib/log';


export interface FillLogTableData extends TableData<LogRecord[]>, RefreshableNode {
  table: LogTable | null
}

export const FillLogTableType = "FillLogTableNode";
export type FillLogTableNodeType = Node<FillLogTableData, typeof FillLogTableType>;
export const sourceTableHandleId = "TableIn"
export const sourceLogHandleId = "LogIn"
export const FillLogTableSources = [sourceTableHandleId, sourceLogHandleId]