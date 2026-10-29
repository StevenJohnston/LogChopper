'use client'
import { RefreshableNode } from "@/app/_components/FlowNodes/RefreshableNode";
import { LogNode, NodeWithType, RefreshableLogNode, SaveableNode, isRefreshableLogNode } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { MatVarietyFilterWorker } from '@/app/_components/FlowNodes/MatVarietyFilter/MatVarietyFilterWorkerTypes';
import { LogRecord, MatVarietyFilterOptions, MatVarietyFilterResult } from '@/app/_lib/log';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { MyNode } from '@/app/store/useFlow';
import { Edge, Node } from 'reactflow';

export const MatVarietyFilterType = "MatVarietyFilterNode"

export interface MatVarietyFilterDataProps extends Partial<RefreshableNode<MatVarietyFilterData>>, Partial<LogNode> {
  logs?: LogRecord[] | null
  minTempSpread?: number;
  minDistinctBins?: number;
  binSize?: number;
  minSamplesPerBin?: number;
  varietyResult?: MatVarietyFilterResult | null;
}

export type MatVarietyFilterNodeType = NodeWithType<MatVarietyFilterData, typeof MatVarietyFilterType>;

export const MatVarietyFilterTargetLogHandleId = "LogTarget"
export const MatVarietyFilterSourceLogHandleId = "LogSource"

export class MatVarietyFilterData extends RefreshableNode<MatVarietyFilterData> implements LogNode, SaveableNode, MatVarietyFilterDataProps {
  public logs: LogRecord[] | null;
  public loading: boolean = false;
  
  public minTempSpread: number;
  public minDistinctBins: number;
  public binSize: number;
  public minSamplesPerBin: number;
  public varietyResult: MatVarietyFilterResult | null;

  constructor({
    logs = null,
    loading = false,
    activeUpdate = null,
    minTempSpread = 10.0,
    minDistinctBins = 2,
    binSize = 5.0,
    minSamplesPerBin = 5,
    varietyResult = null,
  }: MatVarietyFilterDataProps = {}) {
    super()

    this.logs = logs
    this.loading = loading
    this.activeUpdate = activeUpdate
    
    this.minTempSpread = minTempSpread;
    this.minDistinctBins = minDistinctBins;
    this.binSize = binSize;
    this.minSamplesPerBin = minSamplesPerBin;
    this.varietyResult = varietyResult;
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker()
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<MatVarietyFilterData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type != MatVarietyFilterType) {
        console.log(`MatVarietyFilterData.createWorkerPromise called with incorrect node type found ${node.type} expected ${MatVarietyFilterType}`)
        rejectRefresh(new Error(`MatVarietyFilterData.createWorkerPromise called with incorrect node type found ${node.type} expected ${MatVarietyFilterType}`))
        return
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [MatVarietyFilterTargetLogHandleId])
      if (!parentNodes) {
        this.logs = null
        console.log("MatVarietyFilterData One or more parents are missing")
        rejectRefresh(new Error(`MatVarietyFilterData One or more parents are missing`))
        return
      }

      const [sourceLogNode] = orderAndTypeArray<[Node<RefreshableLogNode>]>(parentNodes, [isRefreshableLogNode])

      let updatedSourceLog: Partial<LogNode> | undefined
      try {
        [updatedSourceLog] = await Promise.all([sourceLogNode.data.activeUpdate?.promise])
      } catch (e) {
        console.log("MatVarietyFilterData a parent promise has rejected")
        rejectRefresh(e)
        return
      }
      if (updatedSourceLog == undefined) {
        console.log("MatVarietyFilterData a source parent promise missing data")
        rejectRefresh(new Error("MatVarietyFilterData a source parent promise missing data"))
        return
      }

      if (!updatedSourceLog.logs) {
        console.log("MatVarietyFilterData: missing updatedSourceTable.logs")
        rejectRefresh(new Error("MatVarietyFilterData: missing updatedSourceTable.logs"))
        return
      }

      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("MatVarietyFilterData getRefreshData error:", data.error)
          rejectRefresh(data.error)
          return
        }
        if (data.type == "data") {
          node.data.logs = data.data.logs
          node.data.varietyResult = data.data.result

          resolveRefresh(node.data)
          return
        }
      }
      
      const options: MatVarietyFilterOptions = {
        minTempSpread: this.minTempSpread,
        minDistinctBins: this.minDistinctBins,
        binSize: this.binSize,
        minSamplesPerBin: this.minSamplesPerBin,
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

  public createWorker(): MatVarietyFilterWorker {
    return new Worker(new URL(
      "app/_components/FlowNodes/MatVarietyFilter/MatVarietyFilterWorker.ts",
      import.meta.url
    ));
  }

  public getLoadable() {
    return {
      minTempSpread: this.minTempSpread,
      minDistinctBins: this.minDistinctBins,
      binSize: this.binSize,
      minSamplesPerBin: this.minSamplesPerBin,
    }
  }

  public clone(updates: Partial<MatVarietyFilterData>): MatVarietyFilterData {
    return new MatVarietyFilterData({
      logs: this.logs,
      loading: this.loading,
      activeUpdate: this.activeUpdate,
      
      minTempSpread: this.minTempSpread,
      minDistinctBins: this.minDistinctBins,
      binSize: this.binSize,
      minSamplesPerBin: this.minSamplesPerBin,
      varietyResult: this.varietyResult,

      ...updates
    })
  }
}
