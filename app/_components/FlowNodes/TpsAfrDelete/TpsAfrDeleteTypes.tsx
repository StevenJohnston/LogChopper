
'use client'
import { LogNode, NodeWithType, RefreshableLogNode, RefreshableNode, SaveableNode, isRefreshableLogNode } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { TpsAfrDeleteWorker } from '@/app/_components/FlowNodes/TpsAfrDelete/TpsAfrDeleteWorkerTypes';
import { LogRecord } from '@/app/_lib/log';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { MyNode } from '@/app/store/useFlow';
import { Edge, Node } from 'reactflow';

export const TpsAfrDeleteType = "TpsAfrDeleteNode"
export interface TpsAfrDeleteDataProps extends Partial<RefreshableNode<TpsAfrDeleteData>>, Partial<LogNode> {
  logs?: LogRecord[] | null
}

export type TpsAfrDeleteNodeType = NodeWithType<TpsAfrDeleteData, typeof TpsAfrDeleteType>;

export const TpsAfrDeleteTargetLogHandleId = "LogTarget"
export const TpsAfrDeleteSourceLogHandleId = "LogSource"


export class TpsAfrDeleteData extends RefreshableNode<TpsAfrDeleteData> implements LogNode, SaveableNode, TpsAfrDeleteDataProps {
  public logs: LogRecord[] | null;
  public loading: boolean = false;

  constructor({
    logs = null,
    loading = false,
    activeUpdate = null,

  }: TpsAfrDeleteDataProps) {
    super()

    this.logs = logs
    this.loading = loading
    this.activeUpdate = activeUpdate
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker()
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<TpsAfrDeleteData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type != TpsAfrDeleteType) {
        console.log(`TpsAfrDeleteData.createWorkerPromise called with incorrect node type found ${node.type} expected ${TpsAfrDeleteType}`)
        rejectRefresh(new Error(`TpsAfrDeleteData.createWorkerPromise called with incorrect node type found ${node.type} expected ${TpsAfrDeleteType}`))
        return
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [TpsAfrDeleteTargetLogHandleId])
      if (!parentNodes) {
        this.logs = null
        console.log("TpsAfrDeleteData One or more parents are missing")
        rejectRefresh(new Error(`TpsAfrDeleteData One or more parents are missing`))
        return
      }

      const [sourceLogNode] = orderAndTypeArray<[Node<RefreshableLogNode>]>(parentNodes, [isRefreshableLogNode])

      let updatedSourceLog: Partial<LogNode> | undefined
      try {
        [updatedSourceLog] = await Promise.all([sourceLogNode.data.activeUpdate?.promise])
      } catch (e) {
        // TODO should all these reset the node? aka logs = null
        console.log("TpsAfrDeleteData a parent promise has rejected")
        rejectRefresh(e)
        return
      }
      if (updatedSourceLog == undefined) {
        console.log("TpsAfrDeleteData a source parent promise missing data")
        rejectRefresh(new Error("TpsAfrDeleteData a source parent promise missing data"))
        return
      }

      if (!updatedSourceLog.logs) {
        console.log("TpsAfrDeleteData: missing updatedSourceTable.logs")
        rejectRefresh(new Error("TpsAfrDeleteData: missing updatedSourceTable.logs"))
        return
      }

      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("TpsAfrDeleteData getRefreshData error:", data.error)
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
        }
      })
    })

    this.activeUpdate = {
      worker,
      promise
    }
  }
  public createWorker(): TpsAfrDeleteWorker {
    return new Worker(new URL(
      "app/_components/FlowNodes/TpsAfrDelete/TpsAfrDeleteWorker.ts",
      import.meta.url
    ));
  }
  public getLoadable() { return {} }
  public clone(updates: Partial<TpsAfrDeleteData>): TpsAfrDeleteData {
    return new TpsAfrDeleteData({
      logs: this.logs,

      loading: this.loading,
      activeUpdate: this.activeUpdate,

      ...updates
    })
  }
}
