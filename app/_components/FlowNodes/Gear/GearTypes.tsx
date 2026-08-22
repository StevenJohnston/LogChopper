'use client'
import { RefreshableNode } from "@/app/_components/FlowNodes/RefreshableNode";
import { LogNode, NodeWithType, RefreshableLogNode, SaveableNode, isRefreshableLogNode } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { GearWorker } from '@/app/_components/FlowNodes/Gear/GearWorkerTypes';
import { LogRecord, GearRatios, DefaultGearRatios } from '@/app/_lib/log';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { MyNode } from '@/app/store/useFlow';
import { Edge, Node } from 'reactflow';

export const GearType = "GearNode"

export interface GearDataProps extends Partial<RefreshableNode<GearData>>, Partial<LogNode> {
  logs?: LogRecord[] | null
  gear1Ratio?: number
  gear2Ratio?: number
  gear3Ratio?: number
  gear4Ratio?: number
  gear5Ratio?: number
  lookahead?: number
  enableFilter?: boolean
  invertFilter?: boolean
  maxAccuracy?: number
  filterWindowSeconds?: number
}

export type GearNodeType = NodeWithType<GearData, typeof GearType>;

export const GearTargetLogHandleId = "LogTarget"
export const GearSourceLogHandleId = "LogSource"

export class GearData extends RefreshableNode<GearData> implements LogNode, SaveableNode, GearDataProps {
  public logs: LogRecord[] | null;
  public gear1Ratio: number;
  public gear2Ratio: number;
  public gear3Ratio: number;
  public gear4Ratio: number;
  public gear5Ratio: number;
  public lookahead: number;
  public enableFilter: boolean;
  public invertFilter: boolean;
  public maxAccuracy: number;
  public filterWindowSeconds: number;
  public loading: boolean = false;

  constructor({
    logs = null,
    gear1Ratio = DefaultGearRatios[1],
    gear2Ratio = DefaultGearRatios[2],
    gear3Ratio = DefaultGearRatios[3],
    gear4Ratio = DefaultGearRatios[4],
    gear5Ratio = DefaultGearRatios[5],
    lookahead = 20,
    enableFilter = false,
    invertFilter = false,
    maxAccuracy = 10,
    filterWindowSeconds = 0.5,
    loading = false,
    activeUpdate = null,
  }: GearDataProps) {
    super()

    this.logs = logs
    this.gear1Ratio = gear1Ratio
    this.gear2Ratio = gear2Ratio
    this.gear3Ratio = gear3Ratio
    this.gear4Ratio = gear4Ratio
    this.gear5Ratio = gear5Ratio
    this.lookahead = lookahead
    this.enableFilter = enableFilter
    this.invertFilter = invertFilter
    this.maxAccuracy = maxAccuracy
    this.filterWindowSeconds = filterWindowSeconds
    this.loading = loading
    this.activeUpdate = activeUpdate
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker()
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<GearData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type != GearType) {
        console.log(`GearData.createWorkerPromise called with incorrect node type found ${node.type} expected ${GearType}`)
        rejectRefresh(new Error(`GearData.createWorkerPromise called with incorrect node type found ${node.type} expected ${GearType}`))
        return
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [GearTargetLogHandleId])
      if (!parentNodes) {
        this.logs = null
        console.log("GearData One or more parents are missing")
        rejectRefresh(new Error(`GearData One or more parents are missing`))
        return
      }

      const [sourceLogNode] = orderAndTypeArray<[Node<RefreshableLogNode>]>(parentNodes, [isRefreshableLogNode])

      let updatedSourceLog: Partial<LogNode> | undefined
      try {
        [updatedSourceLog] = await Promise.all([sourceLogNode.data.activeUpdate?.promise])
      } catch (e) {
        console.log("GearData a parent promise has rejected")
        rejectRefresh(e)
        return
      }
      if (updatedSourceLog == undefined) {
        console.log("GearData a source parent promise missing data")
        rejectRefresh(new Error("GearData a source parent promise missing data"))
        return
      }

      if (!updatedSourceLog.logs) {
        console.log("GearData: missing updatedSourceTable.logs")
        rejectRefresh(new Error("GearData: missing updatedSourceTable.logs"))
        return
      }

      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("GearData getRefreshData error:", data.error)
          rejectRefresh(data.error)
          return
        }
        if (data.type == "data") {
          const thisNode = node as GearNodeType;
          thisNode.data.logs = data.data.logs

          resolveRefresh(thisNode.data)
          return
        }
      }

      const gearRatios: GearRatios = {
        1: this.gear1Ratio,
        2: this.gear2Ratio,
        3: this.gear3Ratio,
        4: this.gear4Ratio,
        5: this.gear5Ratio,
      }

      worker.postMessage({
        type: "run",
        data: {
          sourceLogs: updatedSourceLog.logs,
          gearRatios,
          lookahead: this.lookahead,
          enableFilter: this.enableFilter,
          invertFilter: this.invertFilter,
          maxAccuracy: this.maxAccuracy,
          filterWindowSeconds: this.filterWindowSeconds,
        }
      })
    })

    this.activeUpdate = {
      worker,
      promise
    }
  }

  public createWorker(): GearWorker {
    return new Worker(new URL(
      "app/_components/FlowNodes/Gear/GearWorker.ts",
      import.meta.url
    ));
  }

  public getLoadable() {
    return {
      gear1Ratio: this.gear1Ratio,
      gear2Ratio: this.gear2Ratio,
      gear3Ratio: this.gear3Ratio,
      gear4Ratio: this.gear4Ratio,
      gear5Ratio: this.gear5Ratio,
      lookahead: this.lookahead,
      enableFilter: this.enableFilter,
      invertFilter: this.invertFilter,
      maxAccuracy: this.maxAccuracy,
      filterWindowSeconds: this.filterWindowSeconds,
    }
  }

  public clone(updates: Partial<GearData>): GearData {
    return new GearData({
      logs: this.logs,
      gear1Ratio: this.gear1Ratio,
      gear2Ratio: this.gear2Ratio,
      gear3Ratio: this.gear3Ratio,
      gear4Ratio: this.gear4Ratio,
      gear5Ratio: this.gear5Ratio,
      lookahead: this.lookahead,
      enableFilter: this.enableFilter,
      invertFilter: this.invertFilter,
      maxAccuracy: this.maxAccuracy,
      filterWindowSeconds: this.filterWindowSeconds,

      loading: this.loading,
      activeUpdate: this.activeUpdate,

      ...updates
    })
  }
}
