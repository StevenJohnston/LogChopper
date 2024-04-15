'use client'

import { Node } from 'reactflow';
import { BasicTable, Scaling } from "@/app/_lib/rom-metadata";
import { RefreshableNode, SaveableNode, TableData } from '@/app/_components/FlowNodes';

export interface InitBaseTableData {
  tableKey: string
}
export interface BaseTableData<T> extends InitBaseTableData, TableData<string | number>, RefreshableNode, SaveableNode<T> {
  selectedRom: FileSystemFileHandle | null;
  scalingMap: Record<string, Scaling>;
  tableMap: Record<string, BasicTable>
}

export const BaseTableType = "BaseTableNode"
export type BaseTableNodeType = Node<BaseTableData<InitBaseTableData>, typeof BaseTableType>;
