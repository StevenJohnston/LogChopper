'use client'
import { LogNode, NodeWithType, RefreshableLogNode, RefreshableNode, SaveableNode, isRefreshableLogNode } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { LogFilterWorker } from '@/app/_components/FlowNodes/LogFilter/LogFilterWorkertypes';
import { LogRecord } from '@/app/_lib/log';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { MyNode } from '@/app/store/useFlow';
import { Edge, Node } from 'reactflow';

export const LogFilterType = "LogFilterNode"
export interface LogFilterDataProps extends Partial<RefreshableNode<LogFilterData>>, Partial<LogNode> {
  func?: string
  logs?: LogRecord[] | null
}

export type LogFilterNodeType = NodeWithType<LogFilterData, typeof LogFilterType>;

export const LogFilterTargetLogHandleId = "LogTarget"
export const LogFilterSourceLogHandleId = "LogSource"


export class LogFilterData extends RefreshableNode<LogFilterData> implements LogNode, SaveableNode, LogFilterDataProps {
  public logs: LogRecord[] | null;
  public func: string
  public loading: boolean = false;

  constructor({
    logs = null,
    func = "",
    loading = false,
    activeUpdate = null,

  }: LogFilterDataProps) {
    super()

    this.logs = logs
    this.func = func
    this.loading = loading
    this.activeUpdate = activeUpdate
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker()
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<LogFilterData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type != LogFilterType) {
        console.log(`LogFilterData.createWorkerPromise called with incorrect node type found ${node.type} expected ${LogFilterType}`)
        rejectRefresh(new Error(`LogFilterData.createWorkerPromise called with incorrect node type found ${node.type} expected ${LogFilterType}`))
        return
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [LogFilterTargetLogHandleId])
      if (!parentNodes) {
        this.logs = null
        console.log("LogFilterData One or more parents are missing")
        rejectRefresh(new Error(`LogFilterData One or more parents are missing`))
        return
      }

      const [sourceLogNode] = orderAndTypeArray<[Node<RefreshableLogNode>]>(parentNodes, [isRefreshableLogNode])

      let updatedSourceLog: Partial<LogNode> | undefined
      try {
        [updatedSourceLog] = await Promise.all([sourceLogNode.data.activeUpdate?.promise])
      } catch (e) {
        // TODO should all these reset the node? aka logs = null
        console.log("LogFilterData a parent promise has rejected")
        rejectRefresh(e)
        return
      }
      if (updatedSourceLog == undefined) {
        console.log("LogFilterData a source parent promise missing data")
        rejectRefresh(new Error("LogFilterData a source parent promise missing data"))
        return
      }

      if (!updatedSourceLog.logs) {
        console.log("LogFilterData: missing updatedSourceTable.logs")
        rejectRefresh(new Error("LogFilterData: missing updatedSourceTable.logs"))
        return
      }

      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("LogFilterData getRefreshData error:", data.error)
          rejectRefresh(data.error)
          return
        }
        if (data.type == "data") {
          node.data.logs = data.data.logs

          resolveRefresh(node.data)
          return
        }
      }

      worker.postMessage({
        type: "run",
        data: {
          sourceLogs: updatedSourceLog.logs,
          func: this.func,
        }
      })
    })

    this.activeUpdate = {
      worker,
      promise
    }
  }
  public createWorker(): LogFilterWorker {
    return new Worker(new URL(
      "app/_components/FlowNodes/LogFilter/LogFilterWorker.ts",
      import.meta.url
    ));
  }
  public getLoadable() {
    return {
      func: this.func,
    }
  }
  public clone(updates: Partial<LogFilterData>): LogFilterData {
    return new LogFilterData({
      func: this.func,
      logs: this.logs,

      loading: this.loading,
      activeUpdate: this.activeUpdate,

      ...updates
    })
  }
}