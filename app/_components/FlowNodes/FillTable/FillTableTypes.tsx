'use client'
import { Node } from 'reactflow';

import { RefreshableNode, TableData } from '@/app/_components/FlowNodes';
import { Table } from '@/app/_lib/rom-metadata';

export interface FillTableData extends TableData<unknown>, RefreshableNode {
  table: Table<unknown> | null
}

export const FillTableType = "FillTableNode";
export type FillTableNodeType = Node<FillTableData, typeof FillTableType>;
export const sourceTableHandleId = "TableIn"
export const sourceLogHandleId = "LogIn"
export const FillTableSources = [sourceTableHandleId, sourceLogHandleId]
