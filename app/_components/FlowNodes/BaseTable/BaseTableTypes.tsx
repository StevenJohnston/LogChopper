'use client'

import { NodeWithType, RefreshableNode, RefreshableRomNode, RomNode, SaveableNode, TableNode, isRefreshableRomNode } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { HandleTypes } from "@/app/_components/FlowNodes/CustomHandle/CustomType";
import { MyNode } from '@/app/store/useFlow';
import { Edge, Node } from 'reactflow';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { BasicTable, Scaling } from '@/app/_lib/rom-metadata';
import { BaseTableWorker } from '@/app/_components/FlowNodes/BaseTable/BaseTableWorkerTypes';

export const BaseTableType = "BaseTableNode"

interface BaseTableDataProps extends Partial<RefreshableNode<BaseTableData>>, Partial<TableNode> {
  tableKey: string
  tableType?: HandleTypes
  table?: BasicTable | null
}

export type BaseTableNodeType = NodeWithType<BaseTableData, typeof BaseTableType>;


export const targetRomHandleId = "RomIn"


export class BaseTableData extends RefreshableNode<BaseTableData> implements TableNode, SaveableNode {
  public tableKey: string;
  public tableType: HandleTypes | undefined = undefined
  public table: BasicTable | null;
  public tableMap: Record<string, BasicTable> | null;
  public scalingMap: Record<string, Scaling> | null;
  public selectedRomFile: File | null;
  public scalingValue: Scaling | undefined | null
  public loading: boolean = false;

  constructor({
    tableKey,
    tableType = undefined,
    table = null,
    tableMap = null,
    scalingMap = null,
    selectedRomFile = null,
    loading = false,
    activeUpdate = null,
    scalingValue = undefined
  }: BaseTableDataProps) {
    super()
    this.tableKey = tableKey
    this.tableType = tableType
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
    const promise = new Promise<BaseTableData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type != BaseTableType) {
        console.log(`BaseTableData.getRefreshedData called with incorrect node type found ${node.type} expected ${BaseTableType}`)
        rejectRefresh(new Error(`BaseTableData.getRefreshedData called with incorrect node type found ${node.type} expected ${BaseTableType}`))
        return
      }
      if (!this.tableKey) {
        console.log("BaseTableData: missing this.tableKey")
        rejectRefresh(new Error("BaseTableData: missing this.tableKey"))
        return
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [targetRomHandleId])
      if (!parentNodes) {
        this.table = null
        console.log("BaseTableData One or more parents are missing")
        rejectRefresh(new Error(`BaseTableData One or more parents are missing`))
        return
      }

      const [romParentNode] = orderAndTypeArray<[Node<RefreshableRomNode>]>(parentNodes, [isRefreshableRomNode])

      let updatedParentData: Partial<RomNode> | undefined
      try {
        [updatedParentData] = await Promise.all([romParentNode.data.activeUpdate?.promise])
        if (updatedParentData == undefined) {
          console.log("BaseTableData a parent promise missing data")
          rejectRefresh(new Error("BaseTableData a parent promise missing data"))
          return
        }
      } catch (e) {
        console.log("BaseTableData a parent promise has rejected")
        rejectRefresh(e)
        return
      }


      if (!updatedParentData.scalingMap) {
        console.log("BaseTableData: missing updatedParentData.scalingMap")
        rejectRefresh(new Error("BaseTableData: missing updatedParentData.scalingMap"))
        return
      }
      if (!updatedParentData.tableMap) {
        console.log("BaseTableData: missing updatedParentData.tableMap")
        rejectRefresh(new Error("BaseTableData: missing updatedParentData.tableMap"))
        return
      }
      if (!updatedParentData.selectedRomFile) {
        console.log("BaseTableData: missing updatedParentData.selectedRomFile")
        rejectRefresh(new Error("BaseTableData: missing updatedParentData.selectedRomFile"))
        return
      }

      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("BaseTableData getRefreshData error:", data.error)
          rejectRefresh(data.error)
          return
        }
        if (data.type == "data") {
          node.data.table = data.data.table
          node.data.tableType = data.data.table.type

          node.data.scalingMap = romParentNode.data.scalingMap
          node.data.tableMap = romParentNode.data.tableMap
          node.data.selectedRomFile = romParentNode.data.selectedRomFile

          node.data.scalingValue = data.data.table.scalingValue

          resolveRefresh(node.data)
          return
        }
      }

      worker.postMessage({
        type: "run",
        data: {
          selectedRomFile: updatedParentData.selectedRomFile,
          scalingMap: updatedParentData.scalingMap,
          tableMap: updatedParentData.tableMap,
          tableKey: this.tableKey,
        }
      })
    })
    this.activeUpdate = {
      worker,
      promise
    }
  }
  public createWorker(): BaseTableWorker {
    return new Worker(new URL(
      "app/_components/FlowNodes/BaseTable/BaseTableWorker.ts",
      import.meta.url
    ));
  }
  public getLoadable() {
    return {
      tableKey: this.tableKey,
      tableType: this.tableType,
      scalingValue: this.scalingValue
    }
  }
  public clone(updates: Partial<BaseTableData>): BaseTableData {
    return new BaseTableData({
      tableKey: this.tableKey,
      tableType: this.tableType,
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

