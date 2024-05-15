'use client'
import { LogData, NodeWithType, RefreshableNode, SaveableNode } from '@/app/_components/FlowNodes';
import { LogRecord } from '@/app/_lib/log';

export const LogFilterType = "LogFilterNode"
export interface InitLogFilterData {
  func?: string
}
export interface LogFilterData extends InitLogFilterData, LogData, RefreshableNode, SaveableNode<InitLogFilterData> {
  logs: LogRecord[];
}
export type LogFilterNodeType = NodeWithType<LogFilterData, typeof LogFilterType>;

export const LogFilterTargetLogHandleId = "LogTarget"
export const LogFilterSourceLogHandleId = "LogSource"