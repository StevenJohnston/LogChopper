'use client'

import { NodeWithType, RefreshableNode, SaveableNode, TableData } from '@/app/_components/FlowNodes';
import { MatchCriteria } from '@/app/_lib/rom';
import { BasicTable, Scaling } from '@/app/_lib/rom-metadata';

export interface InitCombineAdvancedTableData {
  matchCriteria: MatchCriteria[]
}

export interface CombineAdvancedTableData extends InitCombineAdvancedTableData, TableData<string | number>, RefreshableNode, SaveableNode {
  table: BasicTable | null
  scalingMap: Record<string, Scaling>;
  sourceTable: BasicTable | null
  destTable: BasicTable | null
}


export const CombineAdvancedTableType = "CombineAdvancedTableNode"
export type CombineAdvancedTableNodeType = NodeWithType<CombineAdvancedTableData, typeof CombineAdvancedTableType>;

export const sourceHandleId = "SourceHandle"
export const destHandleId = "DestHandle"