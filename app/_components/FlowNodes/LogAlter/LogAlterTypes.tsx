'use client'
import { LogNode, NodeWithType, RefreshableLogNode, RefreshableNode, SaveableNode, isRefreshableLogNode } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { LogAlterWorker } from '@/app/_components/FlowNodes/LogAlter/LogAlterWorkerTypes';
import { LogRecord } from '@/app/_lib/log';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { MyNode } from '@/app/store/useFlow';
import { Edge, Node } from 'reactflow';

export const LogAlterType = "LogAlterNode"
export interface LogAlterDataProps extends Partial<RefreshableNode<LogAlterData>>, Partial<LogNode> {
  func?: string
  newLogField?: string
  logs?: LogRecord[] | null
}

export type LogAlterNodeType = NodeWithType<LogAlterData, typeof LogAlterType>;

export const LogAlterTargetLogHandleId = "LogTarget"
export const LogAlterSourceLogHandleId = "LogSource"



export class LogAlterData extends RefreshableNode<LogAlterData> implements LogNode, SaveableNode, LogAlterDataProps {
  public logs: LogRecord[] | null;
  public func: string
  public newLogField: string
  public loading: boolean = false;

  constructor({
    logs = null,
    func = "",
    newLogField = "",
    loading = false,
    activeUpdate = null,

  }: LogAlterDataProps) {
    super()

    this.logs = logs
    this.func = func
    this.newLogField = newLogField
    this.loading = loading
    this.activeUpdate = activeUpdate
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker()
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<LogAlterData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type != LogAlterType) {
        console.log(`LogAlterData.createWorkerPromise called with incorrect node type found ${node.type} expected ${LogAlterType}`)
        rejectRefresh(new Error(`LogAlterData.createWorkerPromise called with incorrect node type found ${node.type} expected ${LogAlterType}`))
        return
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [LogAlterTargetLogHandleId])
      if (!parentNodes) {
        this.logs = null
        console.log("LogAlterData One or more parents are missing")
        rejectRefresh(new Error(`LogAlterData One or more parents are missing`))
        return
      }

      const [sourceLogNode] = orderAndTypeArray<[Node<RefreshableLogNode>]>(parentNodes, [isRefreshableLogNode])

      let updatedSourceLog: Partial<LogNode> | undefined
      try {
        [updatedSourceLog] = await Promise.all([sourceLogNode.data.activeUpdate?.promise])
      } catch (e) {
        // TODO should all these reset the node? aka logs = null
        console.log("LogAlterData a parent promise has rejected")
        rejectRefresh(e)
        return
      }
      if (updatedSourceLog == undefined) {
        console.log("LogAlterData a source parent promise missing data")
        rejectRefresh(new Error("LogAlterData a source parent promise missing data"))
        return
      }

      if (!updatedSourceLog.logs) {
        console.log("LogAlterData: missing updatedSourceTable.logs")
        rejectRefresh(new Error("LogAlterData: missing updatedSourceTable.logs"))
        return
      }

      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("LogAlterData getRefreshData error:", data.error)
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
          newLogField: this.newLogField
        }
      })
    })

    this.activeUpdate = {
      worker,
      promise
    }
  }
  public createWorker(): LogAlterWorker {
    return new Worker(new URL(
      "app/_components/FlowNodes/LogAlter/LogAlterWorker.ts",
      import.meta.url
    ));
  }
  public getLoadable() {
    return {
      func: this.func,
      newLogField: this.newLogField
    }
  }
  public clone(updates: Partial<LogAlterData>): LogAlterData {
    return new LogAlterData({
      newLogField: this.newLogField,
      func: this.func,
      logs: this.logs,

      loading: this.loading,
      activeUpdate: this.activeUpdate,

      ...updates
    })
  }
}