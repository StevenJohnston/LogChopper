'use client'

import { NodeWithType, RefreshableNode, SaveableNode, TableData } from '@/app/_components/FlowNodes';
import { BasicTable, Scaling } from '@/app/_lib/rom-metadata';

export interface InitCombineData {
  // logField?: keyof LogRecord
  // aggregator?: Aggregator
  func?: string
}

export interface CombineData extends InitCombineData, TableData<unknown>, RefreshableNode, SaveableNode {
  table: BasicTable | null
  scalingMap: Record<string, Scaling>;

}

export const CombineType = "CombineNode";
export type CombineNodeType = NodeWithType<CombineData, typeof CombineType>;
export const targetTableOneHandleID = "TableIn1"
export const targetTableTwoHandleID = "TableIn2"
// export const  = [targetTableOneHandleID, sourceTableTwoHandleID]
