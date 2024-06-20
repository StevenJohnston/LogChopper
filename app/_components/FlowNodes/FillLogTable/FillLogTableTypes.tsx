'use client'

import { LogNode, NodeWithType, RefreshableLogNode, RefreshableNode, RefreshableTableNode, SaveableNode, TableNode, isRefreshableLogNode, isRefreshableTableNode, isTableBasic } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { BasicTable, LogTable, Scaling } from '@/app/_lib/rom-metadata';
import { HandleTypes } from '@/app/_components/FlowNodes/CustomHandle/CustomType';
import { MyNode } from '@/app/store/useFlow';
import { Edge, Node } from 'reactflow';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { FillLogTableWorker } from '@/app/_components/FlowNodes/FillLogTable/FillLogTableWorkerTypes';

export interface FillLogTableDataProps extends Partial<RefreshableNode<FillLogTableData>>, Partial<TableNode> {
  weighted: boolean
  table: LogTable | null
}

export const FillLogTableType = "FillLogTableNode";
export type FillLogTableNodeType = NodeWithType<FillLogTableData, typeof FillLogTableType>;
export const sourceTableHandleId = "TableIn"
export const sourceLogHandleId = "LogIn"
export const FillLogTableSources = [sourceTableHandleId, sourceLogHandleId]



export class FillLogTableData extends RefreshableNode<FillLogTableData> implements TableNode, SaveableNode, FillLogTableDataProps {
  public tableType: HandleTypes | undefined
  public table: LogTable | null;
  public tableMap: Record<string, BasicTable> | null;
  public scalingMap: Record<string, Scaling> | null;
  public selectedRomFile: File | null;
  public weighted: boolean = false
  public scalingValue: Scaling | undefined | null
  public loading: boolean = false;

  constructor({
    table = null,
    weighted = false,
    tableType = undefined,
    tableMap = null,
    scalingMap = null,
    selectedRomFile = null,
    loading = false,
    activeUpdate = null,
    scalingValue = null
  }: FillLogTableDataProps) {
    super()
    this.weighted = weighted
    this.table = table
    this.tableType = tableType
    this.loading = loading
    this.activeUpdate = activeUpdate
    this.tableMap = tableMap
    this.scalingMap = scalingMap
    this.selectedRomFile = selectedRomFile
    this.scalingValue = scalingValue
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker()
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<FillLogTableData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type != FillLogTableType) {
        console.log(`FillLogTableData.createWorkerPromise called with incorrect node type found ${node.type} expected ${FillLogTableType}`)
        rejectRefresh(new Error(`FillLogTableData.createWorkerPromise called with incorrect node type found ${node.type} expected ${FillLogTableType}`))
        return
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [sourceTableHandleId, sourceLogHandleId])
      if (!parentNodes) {
        this.table = null
        console.log("FillLogTableData One or more parents are missing")
        rejectRefresh(new Error(`FillLogTableData One or more parents are missing`))
        return
      }

      const [sourceTableNode, sourceLogNode] = orderAndTypeArray<[Node<RefreshableTableNode>, Node<RefreshableLogNode>]>(parentNodes, [isRefreshableTableNode, isRefreshableLogNode])

      let updatedSourceTable: Partial<TableNode> | undefined
      let updatedSourceLogs: Partial<LogNode> | undefined
      try {
        [updatedSourceTable, updatedSourceLogs] = await Promise.all([sourceTableNode.data.activeUpdate?.promise, sourceLogNode.data.activeUpdate?.promise])
      } catch (e) {
        console.log("FillLogTableData a parent promise has rejected")
        rejectRefresh(e)
        return
      }
      if (updatedSourceTable == undefined) {
        console.log("FillLogTableData a source parent promise missing data")
        rejectRefresh(new Error("FillLogTableData a source parent promise missing data"))
        return
      }
      if (updatedSourceLogs == undefined) {
        console.log("FillLogTableData a source parent promise missing data")
        rejectRefresh(new Error("FillLogTableData a source parent promise missing data"))
        return
      }

      if (!updatedSourceTable.scalingMap) {
        console.log("FillLogTableData: missing updatedSourceTable.scalingMap")
        rejectRefresh(new Error("FillLogTableData: missing updatedSourceTable.scalingMap"))
        return
      }
      if (!updatedSourceTable.tableMap) {
        console.log("FillLogTableData: missing updatedSourceTable.tableMap")
        rejectRefresh(new Error("FillLogTableData: missing updatedSourceTable.tableMap"))
        return
      }
      if (!updatedSourceTable.selectedRomFile) {
        console.log("FillLogTableData: missing updatedSourceTable.selectedRomFile")
        rejectRefresh(new Error("FillLogTableData: missing updatedSourceTable.selectedRomFile"))
        return
      }

      if (!updatedSourceTable.table) {
        worker.postMessage({ type: "kill" })
        console.log("FillLogTableData: missing updatedSourceTable.data.table")
        rejectRefresh(new Error("FillLogTableData: missing updatedSourceTable.data.table"))
        return
      }

      if (!isTableBasic(updatedSourceTable.table)) {
        console.log("FillLogTableData: missing updatedSourceTable.data.table isTableLogRecord")
        rejectRefresh(new Error("FillLogTableData: missing updatedSourceTable.data.table isTableLogRecord"))
        return
      }

      if (!updatedSourceLogs.logs) {
        worker.postMessage({ type: "kill" })
        console.log("FillLogTableData: missing updatedSourceLogs.data.logs")
        rejectRefresh(new Error("FillLogTableData: missing updatedSourceLogs.data.logs"))
        return
      }

      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("FillLogTableData getRefreshData error:", data.error)
          rejectRefresh(data.error)
          return
        }
        if (data.type == "data") {
          if (updatedSourceTable == undefined) {
            return console.error("impossible")// Thanks typescript
          }
          node.data.table = data.data.table
          node.data.tableType = data.data.table.type

          node.data.scalingMap = updatedSourceTable.scalingMap || null
          node.data.tableMap = updatedSourceTable.tableMap || null
          node.data.selectedRomFile = updatedSourceTable.selectedRomFile || null

          resolveRefresh(node.data)
          return
        }
      }

      worker.postMessage({
        type: "run",
        data: {
          weighted: this.weighted,
          sourceTable: updatedSourceTable.table,
          sourceLogs: updatedSourceLogs.logs
        }
      })
    })

    this.activeUpdate = {
      worker,
      promise
    }
  }
  public createWorker(): FillLogTableWorker {
    return new Worker(new URL(
      "app/_components/FlowNodes/FillLogTable/FillLogTableWorker.ts",
      import.meta.url
    ));
  }
  public getLoadable() {
    return {
      weighted: this.weighted,
      scalingValue: this.scalingValue
    }
  }
  public clone(updates: Partial<FillLogTableData>): FillLogTableData {
    return new FillLogTableData({
      tableType: this.tableType,
      weighted: this.weighted,
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