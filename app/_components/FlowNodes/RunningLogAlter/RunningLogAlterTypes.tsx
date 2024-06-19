'use client'
import { LogNode, NodeWithType, RefreshableLogNode, RefreshableNode, SaveableNode, isRefreshableLogNode } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { RunningLogAlterWorker } from '@/app/_components/FlowNodes/RunningLogAlter/RunningLogAlterWorkertypes';
import { LogRecord } from '@/app/_lib/log';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { MyNode } from '@/app/store/useFlow';
import { Edge, Node } from 'reactflow';

export const RunningLogAlterType = "RunningLogAlterNode"
export interface RunningLogAlterDataProps extends Partial<RefreshableNode<RunningLogAlterData>>, Partial<LogNode> {
  newFieldName?: string
  untilFunc?: string
  alterFunc?: string
  logs?: LogRecord[] | null;
}

export type RunningLogAlterNodeType = NodeWithType<RunningLogAlterData, typeof RunningLogAlterType>;

export const RunningLogAlterTargetLogHandleId = "LogTarget"
export const RunningLogAlterSourceLogHandleId = "LogSource"

export class RunningLogAlterData extends RefreshableNode<RunningLogAlterData> implements LogNode, SaveableNode, RunningLogAlterDataProps {
  public logs: LogRecord[] | null;
  public loading: boolean = false;

  public newFieldName: string;
  public untilFunc: string;
  public alterFunc: string;

  constructor({
    logs = null,
    newFieldName = "",
    untilFunc = "",
    alterFunc = "",
    loading = false,
    activeUpdate = null,

  }: RunningLogAlterDataProps) {
    super()

    this.logs = logs
    this.newFieldName = newFieldName
    this.untilFunc = untilFunc
    this.alterFunc = alterFunc
    this.loading = loading
    this.activeUpdate = activeUpdate
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker()
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<RunningLogAlterData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type != RunningLogAlterType) {
        console.log(`RunningLogAlterData.createWorkerPromise called with incorrect node type found ${node.type} expected ${RunningLogAlterType}`)
        rejectRefresh(new Error(`RunningLogAlterData.createWorkerPromise called with incorrect node type found ${node.type} expected ${RunningLogAlterType}`))
        return
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [RunningLogAlterTargetLogHandleId])
      if (!parentNodes) {
        this.logs = null
        console.log("RunningLogAlterData One or more parents are missing")
        rejectRefresh(new Error(`RunningLogAlterData One or more parents are missing`))
        return
      }

      const [sourceLogNode] = orderAndTypeArray<[Node<RefreshableLogNode>]>(parentNodes, [isRefreshableLogNode])

      let updatedSourceLog: Partial<LogNode> | undefined
      try {
        [updatedSourceLog] = await Promise.all([sourceLogNode.data.activeUpdate?.promise])
      } catch (e) {
        // TODO should all these reset the node? aka logs = null
        console.log("RunningLogAlterData a parent promise has rejected")
        rejectRefresh(e)
        return
      }
      if (updatedSourceLog == undefined) {
        console.log("RunningLogAlterData a source parent promise missing data")
        rejectRefresh(new Error("RunningLogAlterData a source parent promise missing data"))
        return
      }

      if (!updatedSourceLog.logs) {
        console.log("RunningLogAlterData: missing updatedSourceTable.logs")
        rejectRefresh(new Error("RunningLogAlterData: missing updatedSourceTable.logs"))
        return
      }

      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("RunningLogAlterData getRefreshData error:", data.error)
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
          newFieldName: this.newFieldName,
          untilFunc: this.untilFunc,
          alterFunc: this.alterFunc,
        }
      })
    })

    this.activeUpdate = {
      worker,
      promise
    }
  }
  public createWorker(): RunningLogAlterWorker {
    return new Worker(new URL(
      "app/_components/FlowNodes/RunningLogAlter/RunningLogAlterWorker.ts",
      import.meta.url
    ));
  }
  public getLoadable() {
    return {
      newFieldName: this.newFieldName,
      untilFunc: this.untilFunc,
      alterFunc: this.alterFunc,
    }
  }
  public clone(updates: Partial<RunningLogAlterData>): RunningLogAlterData {
    return new RunningLogAlterData({
      newFieldName: this.newFieldName,
      untilFunc: this.untilFunc,
      alterFunc: this.alterFunc,
      logs: this.logs,

      loading: this.loading,
      activeUpdate: this.activeUpdate,

      ...updates
    })
  }
}
