'use client'

import { Node } from 'reactflow';

import { RefreshableNode, SaveableNode, TableData } from '@/app/_components/FlowNodes';
import { BasicTable } from '@/app/_lib/rom-metadata';
import { LogRecord } from '@/app/_lib/log';
import { Aggregator } from '@/app/_lib/consts';

export interface InitFillTableData {
  logField?: keyof LogRecord
  aggregator?: Aggregator
}

export interface FillTableData extends InitFillTableData, TableData<unknown>, RefreshableNode, SaveableNode {
  table: BasicTable | null
}

export const FillTableType = "FillTableNode";
export type FillTableNodeType = Node<FillTableData, typeof FillTableType>;
export const sourceTableHandleId = "TableIn"
export const FillTableSources = [sourceTableHandleId]
