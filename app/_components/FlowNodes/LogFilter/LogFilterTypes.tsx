'use client'
import { Node } from 'reactflow';
import { LogData, RefreshableNode, SaveableNode } from '@/app/_components/FlowNodes';
import { LogRecord } from '@/app/_lib/log';

export const LogFilterType = "LogFilterNode"
export interface LogFilterData<T> extends LogData, RefreshableNode, SaveableNode<T> {
  logs: LogRecord[];
}
export type LogFiltereNodeType = Node<LogFilterData<{}>, typeof LogFilterType>;
