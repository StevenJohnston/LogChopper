'use client'
import { LogNode, NodeWithType, RefreshableLogNode, RefreshableNode, SaveableNode, isRefreshableLogNode } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { MovingAverageLogFilterWorker } from '@/app/_components/FlowNodes/MovingAverageLogFilter/MovingAverageLogFilterWorkerTypes';
import { Direction, LogRecord } from '@/app/_lib/log';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { MyNode } from '@/app/store/useFlow';
import { Edge, Node } from 'reactflow';

export const MovingAverageLogFilterType = "MovingAverageLogFilterNode"
export interface MovingAverageLogFilterDataProps extends Partial<RefreshableNode<MovingAverageLogFilterData>>, Partial<LogNode> {
  logField?: keyof LogRecord
  durationSeconds?: number
  maxDeviation?: number
  direction?: Direction
  logs?: LogRecord[] | null
}

export type MovingAverageLogFilterNodeType = NodeWithType<MovingAverageLogFilterData, typeof MovingAverageLogFilterType>;

export const MovingAverageLogFilterTargetLogHandleId = "LogTarget"
export const MovingAverageLogFilterSourceLogHandleId = "LogSource"

export class MovingAverageLogFilterData extends RefreshableNode<MovingAverageLogFilterData> implements LogNode, SaveableNode, MovingAverageLogFilterDataProps {
  public logs: LogRecord[] | null;
  public loading: boolean = false;

  public logField: keyof LogRecord;
  public durationSeconds: number;
  public maxDeviation: number;
  public direction: Direction;


  constructor({
    logs = null,
    logField = "",
    durationSeconds = 1,
    maxDeviation = 0.1,
    direction = Direction.DESC,
    loading = false,
    activeUpdate = null,
  }: MovingAverageLogFilterDataProps) {
    super()

    this.logs = logs
    this.logField = logField
    this.durationSeconds = durationSeconds
    this.maxDeviation = maxDeviation
    this.direction = direction
    this.loading = loading
    this.activeUpdate = activeUpdate
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker()
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<MovingAverageLogFilterData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type != MovingAverageLogFilterType) {
        console.log(`MovingAverageLogFilterData.createWorkerPromise called with incorrect node type found ${node.type} expected ${MovingAverageLogFilterType}`)
        rejectRefresh(new Error(`MovingAverageLogFilterData.createWorkerPromise called with incorrect node type found ${node.type} expected ${MovingAverageLogFilterType}`))
        return
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [MovingAverageLogFilterTargetLogHandleId])
      if (!parentNodes) {
        this.logs = null
        console.log("MovingAverageLogFilterData One or more parents are missing")
        rejectRefresh(new Error(`MovingAverageLogFilterData One or more parents are missing`))
        return
      }

      const [sourceLogNode] = orderAndTypeArray<[Node<RefreshableLogNode>]>(parentNodes, [isRefreshableLogNode])

      let updatedSourceLog: Partial<LogNode> | undefined
      try {
        [updatedSourceLog] = await Promise.all([sourceLogNode.data.activeUpdate?.promise])
      } catch (e) {
        // TODO should all these reset the node? aka logs = null
        console.log("MovingAverageLogFilterData a parent promise has rejected")
        rejectRefresh(e)
        return
      }
      if (updatedSourceLog == undefined) {
        console.log("MovingAverageLogFilterData a source parent promise missing data")
        rejectRefresh(new Error("MovingAverageLogFilterData a source parent promise missing data"))
        return
      }

      if (!updatedSourceLog.logs) {
        console.log("MovingAverageLogFilterData: missing updatedSourceTable.logs")
        rejectRefresh(new Error("MovingAverageLogFilterData: missing updatedSourceTable.logs"))
        return
      }

      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("MovingAverageLogFilterData getRefreshData error:", data.error)
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
          logField: this.logField,
          durationSeconds: this.durationSeconds,
          maxDeviation: this.maxDeviation,
          direction: this.direction
        }
      })
    })

    this.activeUpdate = {
      worker,
      promise
    }
  }
  public createWorker(): MovingAverageLogFilterWorker {
    return new Worker(new URL(
      "app/_components/FlowNodes/MovingAverageLogFilter/MovingAverageLogFilterWorker.ts",
      import.meta.url
    ));
  }
  public getLoadable() {
    return {
      logField: this.logField,
      durationSeconds: this.durationSeconds,
      maxDeviation: this.maxDeviation,
      direction: this.direction,
    }
  }
  public clone(updates: Partial<MovingAverageLogFilterData>): MovingAverageLogFilterData {
    return new MovingAverageLogFilterData({
      logField: this.logField,
      durationSeconds: this.durationSeconds,
      maxDeviation: this.maxDeviation,
      direction: this.direction,
      logs: this.logs,

      loading: this.loading,
      activeUpdate: this.activeUpdate,

      ...updates
    })
  }
}
