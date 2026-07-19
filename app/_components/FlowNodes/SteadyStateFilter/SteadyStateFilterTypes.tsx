'use client'
import { RefreshableNode } from "@/app/_components/FlowNodes/RefreshableNode";
import { LogNode, NodeWithType, RefreshableLogNode, SaveableNode, isRefreshableLogNode } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { SteadyStateFilterWorker } from '@/app/_components/FlowNodes/SteadyStateFilter/SteadyStateFilterWorkerTypes';
import { LogRecord } from '@/app/_lib/log';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { MyNode } from '@/app/store/useFlow';
import { Edge, Node } from 'reactflow';
import { SteadyStateFilterOptions } from "@/app/_lib/log";

export const SteadyStateFilterType = "SteadyStateFilterNode"
export interface SteadyStateFilterDataProps extends Partial<RefreshableNode<SteadyStateFilterData>>, Partial<LogNode> {
  logs?: LogRecord[] | null
  mafPointsStr?: string;
  lagPointsStr?: string;
  offThrottleThreshold?: number;
  tpsFluctuationThreshold?: number;
  decelBuffer?: number;
  filterIpwZero?: boolean;
  filterEctCold?: boolean;
}

export type SteadyStateFilterNodeType = NodeWithType<SteadyStateFilterData, typeof SteadyStateFilterType>;

export const SteadyStateFilterTargetLogHandleId = "LogTarget"
export const SteadyStateFilterSourceLogHandleId = "LogSource"

export class SteadyStateFilterData extends RefreshableNode<SteadyStateFilterData> implements LogNode, SaveableNode, SteadyStateFilterDataProps {
  public logs: LogRecord[] | null;
  public loading: boolean = false;
  
  public mafPointsStr: string;
  public lagPointsStr: string;
  public offThrottleThreshold: number;
  public tpsFluctuationThreshold: number;
  public decelBuffer: number;
  public filterIpwZero: boolean;
  public filterEctCold: boolean;

  constructor({
    logs = null,
    loading = false,
    activeUpdate = null,
    mafPointsStr = "10, 50, 100, 200, 300",
    lagPointsStr = "1.00, 0.60, 0.35, 0.20, 0.10",
    offThrottleThreshold = 5.0,
    tpsFluctuationThreshold = 3.0,
    decelBuffer = 1.0,
    filterIpwZero = true,
    filterEctCold = true,
  }: SteadyStateFilterDataProps) {
    super()

    this.logs = logs
    this.loading = loading
    this.activeUpdate = activeUpdate
    
    this.mafPointsStr = mafPointsStr;
    this.lagPointsStr = lagPointsStr;
    this.offThrottleThreshold = offThrottleThreshold;
    this.tpsFluctuationThreshold = tpsFluctuationThreshold;
    this.decelBuffer = decelBuffer;
    this.filterIpwZero = filterIpwZero;
    this.filterEctCold = filterEctCold;
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker()
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<SteadyStateFilterData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type != SteadyStateFilterType) {
        console.log(`SteadyStateFilterData.createWorkerPromise called with incorrect node type found ${node.type} expected ${SteadyStateFilterType}`)
        rejectRefresh(new Error(`SteadyStateFilterData.createWorkerPromise called with incorrect node type found ${node.type} expected ${SteadyStateFilterType}`))
        return
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [SteadyStateFilterTargetLogHandleId])
      if (!parentNodes) {
        this.logs = null
        console.log("SteadyStateFilterData One or more parents are missing")
        rejectRefresh(new Error(`SteadyStateFilterData One or more parents are missing`))
        return
      }

      const [sourceLogNode] = orderAndTypeArray<[Node<RefreshableLogNode>]>(parentNodes, [isRefreshableLogNode])

      let updatedSourceLog: Partial<LogNode> | undefined
      try {
        [updatedSourceLog] = await Promise.all([sourceLogNode.data.activeUpdate?.promise])
      } catch (e) {
        console.log("SteadyStateFilterData a parent promise has rejected")
        rejectRefresh(e)
        return
      }
      if (updatedSourceLog == undefined) {
        console.log("SteadyStateFilterData a source parent promise missing data")
        rejectRefresh(new Error("SteadyStateFilterData a source parent promise missing data"))
        return
      }

      if (!updatedSourceLog.logs) {
        console.log("SteadyStateFilterData: missing updatedSourceTable.logs")
        rejectRefresh(new Error("SteadyStateFilterData: missing updatedSourceTable.logs"))
        return
      }

      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("SteadyStateFilterData getRefreshData error:", data.error)
          rejectRefresh(data.error)
          return
        }
        if (data.type == "data") {
          node.data.logs = data.data.logs

          resolveRefresh(node.data)
          return
        }
      }
      
      const parseList = (str: string) => str.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
      const options: SteadyStateFilterOptions = {
        mafPoints: parseList(this.mafPointsStr),
        lagPoints: parseList(this.lagPointsStr),
        offThrottleThreshold: this.offThrottleThreshold,
        tpsFluctuationThreshold: this.tpsFluctuationThreshold,
        decelBuffer: this.decelBuffer,
        filterIpwZero: this.filterIpwZero,
        filterEctCold: this.filterEctCold,
      };

      worker.postMessage({
        type: "run",
        data: {
          sourceLogs: updatedSourceLog.logs,
          options,
        }
      })
    })

    this.activeUpdate = {
      worker,
      promise
    }
  }
  public createWorker(): SteadyStateFilterWorker {
    return new Worker(new URL(
      "app/_components/FlowNodes/SteadyStateFilter/SteadyStateFilterWorker.ts",
      import.meta.url
    ));
  }
  public getLoadable() {
    return {
      mafPointsStr: this.mafPointsStr,
      lagPointsStr: this.lagPointsStr,
      offThrottleThreshold: this.offThrottleThreshold,
      tpsFluctuationThreshold: this.tpsFluctuationThreshold,
      decelBuffer: this.decelBuffer,
      filterIpwZero: this.filterIpwZero,
      filterEctCold: this.filterEctCold,
    }
  }
  public clone(updates: Partial<SteadyStateFilterData>): SteadyStateFilterData {
    return new SteadyStateFilterData({
      logs: this.logs,
      loading: this.loading,
      activeUpdate: this.activeUpdate,
      
      mafPointsStr: this.mafPointsStr,
      lagPointsStr: this.lagPointsStr,
      offThrottleThreshold: this.offThrottleThreshold,
      tpsFluctuationThreshold: this.tpsFluctuationThreshold,
      decelBuffer: this.decelBuffer,
      filterIpwZero: this.filterIpwZero,
      filterEctCold: this.filterEctCold,

      ...updates
    })
  }
}
