'use client'

import { NodeWithType, RefreshableNode, RefreshableTableNode, SaveableNode, TableNode, isRefreshableTableNode, isTableBasic } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { HandleTypes } from '@/app/_components/FlowNodes/CustomHandle/CustomType';
import { BasicTable, Scaling } from '@/app/_lib/rom-metadata';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { MyNode } from '@/app/store/useFlow';
import { Edge, Node } from 'reactflow';
import { CombineWorker } from '@/app/_components/FlowNodes/Combine/CombineWorkerTypes';

export interface CombineDataProps extends Partial<RefreshableNode<CombineData>>, Partial<TableNode> {
  func?: string
  tableType?: HandleTypes
  table?: BasicTable | null
}

export const CombineType = "CombineNode";
export type CombineNodeType = NodeWithType<CombineData, typeof CombineType>;
export const targetTableOneHandleID = "TableIn1"
export const targetTableTwoHandleID = "TableIn2"

export class CombineData extends RefreshableNode<CombineData> implements TableNode, SaveableNode {
  public func: string;
  public tableType: HandleTypes | undefined
  public table: BasicTable | null;
  public tableMap: Record<string, BasicTable> | null;
  public scalingMap: Record<string, Scaling> | null;
  public selectedRomFile: File | null;
  public scalingValue: Scaling | undefined | null
  public loading: boolean = false;

  constructor({
    tableType = undefined,
    func = "",
    table = null,
    tableMap = null,
    scalingMap = null,
    selectedRomFile = null,
    activeUpdate = null,
    scalingValue = undefined,
    loading = false,
  }: CombineDataProps) {
    super()
    this.tableType = tableType
    this.func = func
    this.loading = loading
    this.activeUpdate = activeUpdate
    this.table = table
    this.tableMap = tableMap
    this.scalingMap = scalingMap
    this.selectedRomFile = selectedRomFile
    this.scalingValue = scalingValue
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker()
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<CombineData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type != CombineType) {
        console.log(`CombineData.createWorkerPromise called with incorrect node type found ${node.type} expected ${CombineType}`)
        rejectRefresh(new Error(`CombineData.createWorkerPromise called with incorrect node type found ${node.type} expected ${CombineType}`))
        return
      }

      if (node.data.func == "") {
        console.log(`CombineData.createWorkerPromise missing func`)
        rejectRefresh(new Error(`CombineData.createWorkerPromise missing func`))
        return
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [targetTableOneHandleID, targetTableTwoHandleID])
      if (!parentNodes) {
        this.table = null
        console.log("CombineData One or more parents are missing")
        rejectRefresh(new Error(`CombineData One or more parents are missing`))
        return
      }

      const [sourceTable, joinTable] = orderAndTypeArray<[Node<RefreshableTableNode>, Node<RefreshableTableNode>]>(parentNodes, [isRefreshableTableNode, isRefreshableTableNode])

      let updatedSourceData: Partial<TableNode> | undefined
      let updatedJoinData: Partial<TableNode> | undefined
      try {
        [updatedSourceData, updatedJoinData] = await Promise.all([sourceTable.data.activeUpdate?.promise, joinTable.data.activeUpdate?.promise])
        if (updatedSourceData == undefined) {
          console.log("CombineData a source parent promise missing data")
          rejectRefresh(new Error("CombineData a source parent promise missing data"))
          return
        }
        if (updatedJoinData == undefined) {
          console.log("CombineData a source parent promise missing data")
          rejectRefresh(new Error("CombineData a source parent promise missing data"))
          return
        }
      } catch (e) {
        console.log("CombineData a parent promise has rejected")
        rejectRefresh(e)
        return
      }


      if (!updatedSourceData.scalingMap) {
        console.log("CombineData: missing updatedSourceData.scalingMap")
        rejectRefresh(new Error("CombineData: missing updatedSourceData.scalingMap"))
        return
      }
      if (!updatedSourceData.tableMap) {
        console.log("CombineData: missing updatedSourceData.tableMap")
        rejectRefresh(new Error("CombineData: missing updatedSourceData.tableMap"))
        return
      }
      if (!updatedSourceData.selectedRomFile) {
        console.log("CombineData: missing updatedSourceData.selectedRomFile")
        rejectRefresh(new Error("CombineData: missing updatedSourceData.selectedRomFile"))
        return
      }

      if (!updatedSourceData.table || !isTableBasic(updatedSourceData.table)) {
        worker.postMessage({ type: "kill" })
        console.log("CombineData: missing updatedSourceData.table")
        rejectRefresh(new Error("CombineData: missing updatedSourceData.table"))
        return
      }

      if (!updatedJoinData.table || !isTableBasic(updatedJoinData.table)) {
        worker.postMessage({ type: "kill" })
        console.log("CombineData: missing updatedJoinData.table")
        rejectRefresh(new Error("CombineData: missing updatedJoinData.table"))
        return
      }

      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("CombineData getRefreshData error:", data.error)
          rejectRefresh(data.error)
          return
        }
        if (data.type == "data") {
          if (updatedSourceData == undefined) {
            return console.error("impossible")// Thanks typescript
          }
          node.data.table = data.data.table
          node.data.tableType = data.data.table.type

          node.data.scalingMap = updatedSourceData?.scalingMap || null
          node.data.tableMap = updatedSourceData?.tableMap || null
          node.data.selectedRomFile = updatedSourceData?.selectedRomFile || null

          if (this.scalingValue === undefined) {
            node.data.scalingValue = updatedSourceData.table?.scalingValue
          }

          resolveRefresh(node.data)
          return
        }
      }

      worker.postMessage({
        type: "run",
        data: {
          func: this.func,
          sourceTable: updatedSourceData.table,
          joinTable: updatedJoinData.table,
        }
      })
    })
    this.activeUpdate = {
      worker,
      promise
    }
  }
  public createWorker(): CombineWorker {
    return new Worker(new URL(
      "app/_components/FlowNodes/Combine/CombineWorker.ts",
      import.meta.url
    ));
  }
  public getLoadable() {
    return {
      func: this.func,
      tableType: this.tableType,
      scalingValue: this.scalingValue
    }
  }
  public clone(updates: Partial<CombineData>): CombineData {
    return new CombineData({
      tableType: this.tableType,
      func: this.func,
      loading: this.loading,
      activeUpdate: this.activeUpdate,
      table: this.table,
      tableMap: this.tableMap,
      scalingMap: this.scalingMap,
      selectedRomFile: this.selectedRomFile,
      scalingValue: this.scalingValue,
      ...updates
    })
  }
}

