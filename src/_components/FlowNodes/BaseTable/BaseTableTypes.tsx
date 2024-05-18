'use client'

import { BasicTable, Scaling } from "@/src/_lib/rom-metadata";
import { NodeWithType, RefreshableNode, SaveableNode, TableData } from '@/src/_components/FlowNodes';

export interface InitBaseTableData {
  tableKey: string
}
export interface BaseTableData<T> extends InitBaseTableData, TableData<string | number>, RefreshableNode, SaveableNode<T> {
  selectedRom: FileSystemFileHandle | null;
  scalingMap: Record<string, Scaling>;
  tableMap: Record<string, BasicTable>
}

export const BaseTableType = "BaseTableNode"
export type BaseTableNodeType = NodeWithType<BaseTableData<InitBaseTableData>, typeof BaseTableType>;
