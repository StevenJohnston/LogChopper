'use client'
import { LogNode, NodeWithType, RefreshableLogNode, RefreshableNode, SaveableNode, isRefreshableLogNode } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { AfrShiftWorker } from '@/app/_components/FlowNodes/AfrShift/AfrShiftWorkertypes';
import { LogRecord } from '@/app/_lib/log';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { MyNode } from '@/app/store/useFlow';
import { Edge, Node } from 'reactflow';

export const AfrShiftType = "AfrShiftNode"
export interface AfrShiftDataProps extends Partial<RefreshableNode<AfrShiftData>>, Partial<LogNode> {
  logs?: LogRecord[] | null
}

export type AfrShiftNodeType = NodeWithType<AfrShiftData, typeof AfrShiftType>;

export const AfrShiftTargetLogHandleId = "LogTarget"
export const AfrShiftSourceLogHandleId = "LogSource"


export class AfrShiftData extends RefreshableNode<AfrShiftData> implements LogNode, SaveableNode, AfrShiftDataProps {
  public logs: LogRecord[] | null;
  public loading: boolean = false;

  constructor({
    logs = null,
    loading = false,
    activeUpdate = null,

  }: AfrShiftDataProps) {
    super()

    this.logs = logs
    this.loading = loading
    this.activeUpdate = activeUpdate
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker()
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<AfrShiftData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type != AfrShiftType) {
        console.log(`AfrShiftData.createWorkerPromise called with incorrect node type found ${node.type} expected ${AfrShiftType}`)
        rejectRefresh(new Error(`AfrShiftData.createWorkerPromise called with incorrect node type found ${node.type} expected ${AfrShiftType}`))
        return
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [AfrShiftTargetLogHandleId])
      if (!parentNodes) {
        this.logs = null
        console.log("AfrShiftData One or more parents are missing")
        rejectRefresh(new Error(`AfrShiftData One or more parents are missing`))
        return
      }

      const [sourceLogNode] = orderAndTypeArray<[Node<RefreshableLogNode>]>(parentNodes, [isRefreshableLogNode])

      let updatedSourceLog: Partial<LogNode> | undefined
      try {
        [updatedSourceLog] = await Promise.all([sourceLogNode.data.activeUpdate?.promise])
      } catch (e) {
        // TODO should all these reset the node? aka logs = null
        console.log("AfrShiftData a parent promise has rejected")
        rejectRefresh(e)
        return
      }
      if (updatedSourceLog == undefined) {
        console.log("AfrShiftData a source parent promise missing data")
        rejectRefresh(new Error("AfrShiftData a source parent promise missing data"))
        return
      }

      if (!updatedSourceLog.logs) {
        console.log("AfrShiftData: missing updatedSourceTable.logs")
        rejectRefresh(new Error("AfrShiftData: missing updatedSourceTable.logs"))
        return
      }

      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("AfrShiftData getRefreshData error:", data.error)
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
  public createWorker(): AfrShiftWorker {
    return new Worker(new URL(
      "app/_components/FlowNodes/AfrShift/AfrShiftWorker.ts",
      import.meta.url
    ));
  }
  public getLoadable() { return {} }
  public clone(updates: Partial<AfrShiftData>): AfrShiftData {
    return new AfrShiftData({
      logs: this.logs,

      loading: this.loading,
      activeUpdate: this.activeUpdate,

      ...updates
    })
  }
}