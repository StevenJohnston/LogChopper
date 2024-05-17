'use client'

import { LogData, NodeWithType, RefreshableNode, SaveableNode } from '@/app/_components/FlowNodes';

export interface BaseLogData extends LogData, RefreshableNode, SaveableNode {
  selectedLogs: FileSystemFileHandle[];
}

export const BaseLogType = "BaseLogNode"
export type BaseLogNodeType = NodeWithType<BaseLogData, typeof BaseLogType>;
