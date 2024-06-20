'use client'

import { NodeWithType, RefreshableNode, RefreshableTableNode, SaveableNode, TableNode, isRefreshableTableNode, isTableLogRecord } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { BasicTable, LogTable, Scaling } from '@/app/_lib/rom-metadata';
import { LogRecord } from '@/app/_lib/log';
import { Aggregator } from '@/app/_lib/consts';
import { HandleTypes } from '@/app/_components/FlowNodes/CustomHandle/CustomType';
import { MyNode } from '@/app/store/useFlow';
import { Node, Edge } from 'reactflow';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { FillTableWorker } from '@/app/_components/FlowNodes/FillTable/FillTableWorkerTypes';

export interface FillTableDataProps extends Partial<RefreshableNode<FillTableData>>, Partial<TableNode> {
  logField?: keyof LogRecord
  aggregator?: Aggregator
  tableType?: HandleTypes
  table?: BasicTable | null
  sourceTable?: LogTable | null
}

export const FillTableType = "FillTableNode";
export type FillTableNodeType = NodeWithType<FillTableData, typeof FillTableType>;
export const sourceTableHandleId = "TableIn"
export const targetTableHandleId = "TableOut"
export const FillTableSources = [sourceTableHandleId]


export class FillTableData extends RefreshableNode<FillTableData> implements TableNode, SaveableNode, FillTableDataProps {
  public tableType: HandleTypes | undefined
  public table: BasicTable | null;
  public tableMap: Record<string, BasicTable> | null;
  public scalingMap: Record<string, Scaling> | null;
  public selectedRomFile: File | null;
  public logField: keyof LogRecord
  public aggregator: Aggregator
  public sourceTable: LogTable | null
  public scalingValue: Scaling | undefined | null
  public loading: boolean = false;

  constructor({
    logField = "",
    aggregator = Aggregator.AVG,
    table = null,
    tableType = undefined,
    tableMap = null,
    scalingMap = null,
    selectedRomFile = null,
    loading = false,
    activeUpdate = null,
    sourceTable = null,
    scalingValue = undefined

  }: FillTableDataProps) {
    super()
    this.logField = logField
    this.aggregator = aggregator
    this.table = table
    this.tableType = tableType
    this.loading = loading
    this.activeUpdate = activeUpdate
    this.tableMap = tableMap
    this.scalingMap = scalingMap
    this.selectedRomFile = selectedRomFile
    this.sourceTable = sourceTable
    this.scalingValue = scalingValue
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker()
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<FillTableData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type != FillTableType) {
        console.log(`FillTableData.createWorkerPromise called with incorrect node type found ${node.type} expected ${FillTableType}`)
        rejectRefresh(new Error(`FillTableData.createWorkerPromise called with incorrect node type found ${node.type} expected ${FillTableType}`))
        return
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [sourceTableHandleId])
      if (!parentNodes) {
        this.table = null
        console.log("FillTableData One or more parents are missing")
        rejectRefresh(new Error(`FillTableData One or more parents are missing`))
        return
      }

      const [sourceTableNode] = orderAndTypeArray<[Node<RefreshableTableNode>]>(parentNodes, [isRefreshableTableNode])

      let updatedSourceTable: Partial<TableNode> | undefined
      try {
        [updatedSourceTable] = await Promise.all([sourceTableNode.data.activeUpdate?.promise])
      } catch (e) {
        console.log("FillTableData a parent promise has rejected")
        rejectRefresh(e)
        return
      }
      if (updatedSourceTable == undefined) {
        console.log("FillTableData a source parent promise missing data")
        rejectRefresh(new Error("FillTableData a source parent promise missing data"))
        return
      }

      if (!updatedSourceTable.scalingMap) {
        console.log("FillTableData: missing updatedSourceTable.scalingMap")
        rejectRefresh(new Error("FillTableData: missing updatedSourceTable.scalingMap"))
        return
      }
      if (!updatedSourceTable.tableMap) {
        console.log("FillTableData: missing updatedSourceTable.tableMap")
        rejectRefresh(new Error("FillTableData: missing updatedSourceTable.tableMap"))
        return
      }
      if (!updatedSourceTable.selectedRomFile) {
        console.log("FillTableData: missing updatedSourceTable.selectedRomFile")
        rejectRefresh(new Error("FillTableData: missing updatedSourceTable.selectedRomFile"))
        return
      }


      if (!updatedSourceTable.table) {
        this.sourceTable = updatedSourceTable.table || null
        worker.postMessage({ type: "kill" })
        console.log("FillTableData: missing updatedSourceTable.data.table")
        rejectRefresh(new Error("FillTableData: missing updatedSourceTable.data.table"))
        return
      }

      if (!isTableLogRecord(updatedSourceTable.table)) {
        console.log("FillTableData: missing updatedSourceTable.data.table isTableLogRecord")
        rejectRefresh(new Error("FillTableData: missing updatedSourceTable.data.table isTableLogRecord"))
        return
      }

      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("FillTableData getRefreshData error:", data.error)
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


          if (updatedSourceTable.table && isTableLogRecord(updatedSourceTable.table)) {
            node.data.sourceTable = updatedSourceTable.table || null
          }

          node.data.scalingValue = updatedSourceTable.scalingMap?.[this.logField]

          resolveRefresh(node.data)
          return
        }
      }

      worker.postMessage({
        type: "run",
        data: {
          aggregator: this.aggregator,
          logField: this.logField,
          sourceTable: updatedSourceTable.table,
        }
      })
    })

    this.activeUpdate = {
      worker,
      promise
    }
  }
  public createWorker(): FillTableWorker {
    return new Worker(new URL(
      "app/_components/FlowNodes/FillTable/FillTableWorker.ts",
      import.meta.url
    ));
  }
  public getLoadable() {
    return {
      logField: this.logField,
      aggregator: this.aggregator,
      tableType: this.tableType,
      scalingValue: this.scalingValue
    }
  }
  public clone(updates: Partial<FillTableData>): FillTableData {
    return new FillTableData({
      tableType: this.tableType,
      logField: this.logField,
      aggregator: this.aggregator,
      sourceTable: this.sourceTable,
      table: this.table,

      loading: this.loading,
      activeUpdate: this.activeUpdate,

      tableMap: this.tableMap,
      scalingMap: this.scalingMap,
      selectedRomFile: this.selectedRomFile,
      scalingValue: this.scalingValue,
      ...updates
    })
  }
}