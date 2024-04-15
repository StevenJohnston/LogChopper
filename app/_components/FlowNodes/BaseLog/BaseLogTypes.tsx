'use client'
import { Node } from 'reactflow';

import { LogData, RefreshableNode, SaveableNode } from '@/app/_components/FlowNodes';
import { newBaseLogData } from '@/app/_components/FlowNodes/BaseLog/BaseLogNode';

export interface BaseLogData extends LogData, RefreshableNode, SaveableNode {
  selectedLogs: FileSystemFileHandle[];
}

export const BaseLogType = "BaseLogNode"
export type BaseLogNodeType = Node<BaseLogData, typeof BaseLogType>;

// export const BASE_LOG_NODE_ID = "SELECTED_LOGS_NODE"
export const INIT_BASE_LOG_NODE: BaseLogNodeType = {
  // id: BASE_LOG_NODE_ID,
}
