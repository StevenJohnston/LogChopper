'use client'
import { LogData, NodeWithType, RefreshableNode, SaveableNode } from '@/app/_components/FlowNodes';
import { LogRecord } from '@/app/_lib/log';

export const LogAlterType = "LogAlterNode"
export interface InitLogAlterData {
  func?: string
  newLogField?: string
}
export interface LogAlterData extends InitLogAlterData, LogData, RefreshableNode, SaveableNode<InitLogAlterData> {
  logs: LogRecord[];
}
export type LogAlterNodeType = NodeWithType<LogAlterData, typeof LogAlterType>;

export const LogAlterTargetLogHandleId = "LogTarget"
export const LogAlterSourceLogHandleId = "LogSource"