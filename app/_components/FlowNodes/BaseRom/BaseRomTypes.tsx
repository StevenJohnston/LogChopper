'use client'

import { BaseRomWorker } from '@/app/_components/FlowNodes/BaseRom/BaseRomWorkerTypes';
import { NodeWithType, RefreshableNode, RomNode, SaveableNode } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { BasicTable, Scaling } from '@/app/_lib/rom-metadata';
import { MyNode } from '@/app/store/useFlow';
import { RomSelectorType } from '../RomSelector/RomSelectorTypes';

export interface BaseRomDataProps extends Partial<RefreshableNode<BaseRomData>> {
  selectedRomFile?: File | null;
  selectedRomFileName?: string | null;
  scalingMap?: Record<string, Scaling> | null;
  tableMap?: Record<string, BasicTable> | null;
}

export const BaseRomType = "BaseRomNode"
export type BaseRomNodeType = NodeWithType<BaseRomData, typeof BaseRomType>;

export class BaseRomData extends RefreshableNode<BaseRomData> implements RomNode, SaveableNode {
  public selectedRomFile: File | null = null
  public selectedRomFileName: string | null = null;
  public scalingMap: Record<string, Scaling> | null = null;
  public tableMap: Record<string, BasicTable> | null = null;
  public loading: boolean = false;
  constructor({
    selectedRomFile = null,
    selectedRomFileName = null,
    scalingMap = null,
    tableMap = null,
    loading = false,
    activeUpdate = null
  }: BaseRomDataProps) {
    super()
    this.selectedRomFile = selectedRomFile
    this.selectedRomFileName = selectedRomFileName
    this.scalingMap = scalingMap
    this.tableMap = tableMap
    this.loading = loading
    this.activeUpdate = activeUpdate
  }

  public addWorkerPromise(node: MyNode): void {
    const worker = this.createWorker()

    const promise = new Promise<BaseRomData>((resolveRefresh, rejectRefresh) => {
      if (node.type !== BaseRomType && node.type !== RomSelectorType) {
        console.log(`BaseRomData.getRefreshedData called with incorrect node type found ${node.type} expected ${BaseRomType}`)
        rejectRefresh(`BaseRomData.getRefreshedData called with incorrect node type found ${node.type} expected ${BaseRomType}`)
        return
      }

      if (!node.data.selectedRomFile) {
        rejectRefresh(new Error('BaseRomData.getRefreshedData missing selectedRomFile'))
        return
      }


      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("BaseRomData getRefreshData error:", data.error)
          rejectRefresh(data.error)
          return
        }
        if (data.type == "data") {
          // TODO why is this even a worker lol
          resolveRefresh(node.data.clone())
          return
        }
      }

      worker.postMessage({
        type: "run",
        data: {}
      })
    })
    this.activeUpdate = {
      worker,
      promise
    }
  }

  public createWorker(): BaseRomWorker {
    return new Worker(
      new URL(
        "app/_components/FlowNodes/BaseRom/BaseRomWorker.ts",
        import.meta.url
      )
    );
  }
  public getLoadable() {
    return { selectedRomFileName: this.selectedRomFileName }
  }
  public clone(updates: Partial<BaseRomData> = {}): BaseRomData {
    return new BaseRomData({
      selectedRomFile: this.selectedRomFile,
      selectedRomFileName: this.selectedRomFileName,
      scalingMap: this.scalingMap,
      tableMap: this.tableMap,
      loading: this.loading,
      activeUpdate: this.activeUpdate,
      ...updates
    })
  }
}