'use client'

import { NodeWithType, RefreshableNode, RefreshableTableNode, SaveableNode, TableNode, isRefreshableTableNode, isTableBasic } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { HandleTypes } from '@/app/_components/FlowNodes/CustomHandle/CustomType';
import { MatchCriteria } from '@/app/_lib/rom';
import { BasicTable, Scaling } from '@/app/_lib/rom-metadata';
import { MyNode } from '@/app/store/useFlow';
import { Edge, Node } from 'reactflow';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { CombineAdvancedTableWorker } from '@/app/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableWorkerTypes';

export interface CombineAdvancedTableDataProps extends Partial<RefreshableNode<CombineAdvancedTableData>>, Partial<TableNode> {
  matchCriteria: MatchCriteria[]
  tableType?: HandleTypes
  sourceTable?: BasicTable | null
  destTable?: BasicTable | null
  table?: BasicTable | null
}

export const CombineAdvancedTableType = "CombineAdvancedTableNode"
export type CombineAdvancedTableNodeType = NodeWithType<CombineAdvancedTableData, typeof CombineAdvancedTableType>;

export const sourceHandleId = "SourceHandle"
export const destHandleId = "DestHandle"


export class CombineAdvancedTableData extends RefreshableNode<CombineAdvancedTableData> implements TableNode, SaveableNode {
  public matchCriteria: MatchCriteria[];
  public tableType: HandleTypes | undefined
  public table: BasicTable | null;
  public tableMap: Record<string, BasicTable> | null;
  public scalingMap: Record<string, Scaling> | null;
  public selectedRomFile: File | null;
  public sourceTable: BasicTable | null
  public destTable: BasicTable | null

  public loading: boolean = false;
  constructor({
    tableType = undefined,
    matchCriteria,
    table = null,
    tableMap = null,
    scalingMap = null,
    selectedRomFile = null,
    loading = false,
    activeUpdate = null,
    sourceTable = null,
    destTable = null,
  }: CombineAdvancedTableDataProps) {
    super()
    this.tableType = tableType
    this.matchCriteria = matchCriteria
    this.loading = loading
    this.activeUpdate = activeUpdate
    this.table = table
    this.tableMap = tableMap
    this.scalingMap = scalingMap
    this.selectedRomFile = selectedRomFile
    this.sourceTable = sourceTable
    this.destTable = destTable
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker()
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<CombineAdvancedTableData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type != CombineAdvancedTableType) {
        console.log(`CombineAdvancedTableData.addWorkerPromise called with incorrect node type found ${node.type} expected ${CombineAdvancedTableType}`)
        rejectRefresh(new Error(`CombineAdvancedTableData.addWorkerPromise called with incorrect node type found ${node.type} expected ${CombineAdvancedTableType}`))
        return
      }


      const parentNodes = getParentsByHandleIds(node, nodes, edges, [sourceHandleId, destHandleId])
      if (!parentNodes) {
        this.table = null
        console.log("CombineAdvancedTableData One or more parents are missing")
        rejectRefresh(new Error(`CombineAdvancedTableData One or more parents are missing`))
        return
      }

      const [sourceTable, destTable] = orderAndTypeArray<[Node<RefreshableTableNode>, Node<RefreshableTableNode>]>(parentNodes, [isRefreshableTableNode, isRefreshableTableNode])

      let updatedSourceData: Partial<TableNode> | undefined
      let updatedDestData: Partial<TableNode> | undefined
      try {
        [updatedSourceData, updatedDestData] = await Promise.all([sourceTable.data.activeUpdate?.promise, destTable.data.activeUpdate?.promise])

      } catch (e) {
        console.log("CombineAdvancedTableData a parent promise has rejected")
        rejectRefresh(e)
        return
      }

      if (updatedSourceData == undefined) {
        console.log("CombineAdvancedTableData a source parent promise missing data")
        rejectRefresh(new Error("CombineAdvancedTableData a source parent promise missing data"))
        return
      }
      if (updatedDestData == undefined) {
        console.log("CombineAdvancedTableData a source parent promise missing data")
        rejectRefresh(new Error("CombineAdvancedTableData a source parent promise missing data"))
        return
      }


      if (!updatedSourceData.scalingMap) {
        console.log("CombineAdvancedTableData: missing updatedSourceData.scalingMap")
        rejectRefresh(new Error("CombineAdvancedTableData: missing updatedSourceData.scalingMap"))
        return
      }
      if (!updatedSourceData.tableMap) {
        console.log("CombineAdvancedTableData: missing updatedSourceData.tableMap")
        rejectRefresh(new Error("CombineAdvancedTableData: missing updatedSourceData.tableMap"))
        return
      }
      if (!updatedSourceData.selectedRomFile) {
        console.log("CombineAdvancedTableData: missing updatedSourceData.selectedRomFile")
        rejectRefresh(new Error("CombineAdvancedTableData: missing updatedSourceData.selectedRomFile"))
        return
      }

      // Little ghetto, but we need to half update this node
      if (node.data.matchCriteria.length != 2) {
        if (updatedSourceData.table && isTableBasic(updatedSourceData.table)) {
          node.data.sourceTable = updatedSourceData.table
        } else {
          node.data.sourceTable = null
        }
        if (updatedDestData.table && isTableBasic(updatedDestData.table)) {
          node.data.destTable = updatedDestData.table
        } else {
          node.data.destTable = null
        }
        console.log(`CombineAdvancedTableData.addWorkerPromise requires 2 match criteria`)
        rejectRefresh(new Error(`CombineAdvancedTableData.addWorkerPromise requires 2 match criteria`))
        return
      }


      if (!updatedSourceData.table || !isTableBasic(updatedSourceData.table)) {
        worker.postMessage({ type: "kill" })
        console.log("CombineAdvancedTableData: missing updatedSourceData.table")
        rejectRefresh(new Error("CombineAdvancedTableData: missing updatedSourceData.table"))
        return
      }

      if (!updatedDestData.table || !isTableBasic(updatedDestData.table)) {
        worker.postMessage({ type: "kill" })
        console.log("CombineAdvancedTableData: missing updatedDestData.table")
        rejectRefresh(new Error("CombineAdvancedTableData: missing updatedDestData.table"))
        return
      }


      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("CombineAdvancedTableData getRefreshData error:", data.error)
          rejectRefresh(data.error)
          return
        }
        if (data.type == "data") {
          if (updatedSourceData == undefined || updatedDestData == undefined) {
            return console.error("impossible")// Thanks typescript
          }
          node.data.table = data.data.table
          node.data.tableType = data.data.table.type

          node.data.scalingMap = updatedSourceData.scalingMap || null
          node.data.tableMap = updatedSourceData.tableMap || null
          node.data.selectedRomFile = updatedSourceData.selectedRomFile || null

          if (updatedSourceData.table && isTableBasic(updatedSourceData.table)) {
            node.data.sourceTable = updatedSourceData.table || null
          }
          if (updatedDestData.table && isTableBasic(updatedDestData.table)) {
            node.data.destTable = updatedDestData.table || null
          }
          resolveRefresh(node.data)
          return
        }
      }

      worker.postMessage({
        type: "run",
        data: {
          matchCriteria: this.matchCriteria,
          sourceTable: updatedSourceData.table,
          destTable: updatedDestData.table,
        }
      })
    })
    this.activeUpdate = {
      worker,
      promise
    }
  }
  public createWorker(): CombineAdvancedTableWorker {
    return new Worker(new URL(
      "app/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableWorker.ts",
      import.meta.url
    ));
  }
  public getLoadable() {
    return {
      matchCriteria: this.matchCriteria,
      tableType: this.tableType
    }
  }
  public clone(updates: Partial<CombineAdvancedTableData>): CombineAdvancedTableData {
    return new CombineAdvancedTableData({
      tableType: this.tableType,
      matchCriteria: this.matchCriteria,
      loading: this.loading,
      activeUpdate: this.activeUpdate,
      table: this.table,
      tableMap: this.tableMap,
      scalingMap: this.scalingMap,
      selectedRomFile: this.selectedRomFile,
      sourceTable: this.sourceTable,
      destTable: this.destTable,
      ...updates
    })
  }
}
