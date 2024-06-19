'use client'

import { BaseLogWorker } from '@/app/_components/FlowNodes/BaseLog/BaseLogWorkerTypes';
import { LogNode, NodeWithType, RefreshableNode, SaveableNode } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { LogRecord } from '@/app/_lib/log';
import { MyNode } from '@/app/store/useFlow';

export const BaseLogType = "BaseLogNode"

interface BaseLogDataProps extends Partial<RefreshableNode<BaseLogData>> {
  selectedLogFiles?: File[]
  logs?: LogRecord[]
}

export type BaseLogNodeType = NodeWithType<BaseLogData, typeof BaseLogType>;


export class BaseLogData extends RefreshableNode<BaseLogData> implements LogNode, SaveableNode {
  public selectedLogFiles: File[] = [];
  public logs: LogRecord[] = [];
  public loading: boolean = false;
  constructor({
    selectedLogFiles = [],
    logs = [],
    loading = false,
    activeUpdate = null,
  }: BaseLogDataProps) {
    super()
    this.selectedLogFiles = selectedLogFiles
    this.logs = logs
    this.loading = loading
    this.activeUpdate = activeUpdate
  }

  public addWorkerPromise(node: MyNode): void {
    const worker = this.createWorker()
    const promise = new Promise<BaseLogData>((resolveRefresh, rejectRefresh) => {
      if (node.type != BaseLogType) {
        console.log(`newBaseLogData.getRefreshedData called with incorrect node type found ${node.type} expected ${BaseLogType}`)
        rejectRefresh(new Error(`newBaseLogData.getRefreshedData called with incorrect node type found ${node.type} expected ${BaseLogType}`))
        return
      }
      if (!node.data.selectedLogFiles) {
        rejectRefresh(new Error('newBaseLogData.getRefreshedData missing selectedLogFiles'))
      }

      worker.onmessage = async ({ data }) => {
        if (data.type == "error") {
          console.log("newBaseLogData getRefreshData error:", data.error)
          rejectRefresh(data.error)
          return
        }
        if (data.type == "data") {
          resolveRefresh(node.data.clone({
            logs: data.data.logs
          }))
          return
        }
      }

      worker.postMessage({
        type: "run",
        data: {
          selectedLogFiles: node.data.selectedLogFiles
        }
      })
    })
    this.activeUpdate = {
      worker,
      promise
    }
  }
  public createWorker(): BaseLogWorker {
    return new Worker(new URL(
      'app/_components/FlowNodes/BaseLog/BaseLogWorker.ts',
      import.meta.url
    ));
  }
  public getLoadable() { return {} }
  public clone(updates: Partial<BaseLogData>): BaseLogData {
    return new BaseLogData({
      selectedLogFiles: this.selectedLogFiles,
      logs: this.logs,
      loading: this.loading,
      activeUpdate: this.activeUpdate,
      ...updates
    })
  }
}

