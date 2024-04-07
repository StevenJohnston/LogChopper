'use client'
import { Node } from 'reactflow';
import { LogData, RefreshableNode } from '@/app/_components/FlowNodes';
import { LogRecord } from '@/app/_lib/log';

export const LogFilterType = "LogFilterNode"
export interface LogFilterData extends LogData, RefreshableNode { }
export type LogFiltereNodeType = Node<LogFilterData, typeof LogFilterType>;


export interface LogFilterData extends RefreshableNode {
  logs: LogRecord[];
}