'use client'

import { Node } from 'reactflow';
import { Scaling } from "@/app/_lib/rom-metadata";
import { RefreshableNode, TableData } from '@/app/_components/FlowNodes';


export interface BaseTableData extends TableData<string | number>, RefreshableNode {
  selectedRom: FileSystemFileHandle | null;
  scalingMap: Record<string, Scaling>;
}

export const BaseTableType = "BaseTableNode"
export type BaseTableNodeType = Node<BaseTableData, typeof BaseTableType>;
