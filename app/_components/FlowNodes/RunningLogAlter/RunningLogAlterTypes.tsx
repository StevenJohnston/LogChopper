'use client'
import { LogData, NodeWithType, RefreshableNode, SaveableNode } from '@/app/_components/FlowNodes';
import { LogRecord } from '@/app/_lib/log';

export const RunningLogAlterType = "RunningLogAlterNode"
export interface InitRunningLogAlterData {
  newFieldName?: string
  untilFunc?: string
  alterFunc?: string
}
export interface RunningLogAlterData extends InitRunningLogAlterData, LogData, RefreshableNode, SaveableNode<InitRunningLogAlterData> {
  logs: LogRecord[];
}
export type RunningLogAlterNodeType = NodeWithType<RunningLogAlterData, typeof RunningLogAlterType>;

export const RunningLogAlterTargetLogHandleId = "LogTarget"
export const RunningLogAlterSourceLogHandleId = "LogSource"