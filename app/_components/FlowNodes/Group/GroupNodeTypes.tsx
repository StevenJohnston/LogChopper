'use client'

import { NodeWithType, SaveableNode } from '@/app/_components/FlowNodes/FlowNodesTypes';

// export interface GroupDataProps extends Partial<RefreshableNode<GroupData>> {
export interface GroupDataProps {
  name: string
  locked: boolean
}

export const GroupType = "GroupNode"
export type GroupNodeType = NodeWithType<GroupData, typeof GroupType>;

export class GroupData implements SaveableNode {
  // export class GroupData extends RefreshableNode<GroupData> implements SaveableNode {
  public name: string
  public locked: boolean
  // public loading: boolean = false;

  constructor({
    name = "name",
    locked = false,
    // loading = false,
    // activeUpdate = null,
  }: GroupDataProps) {
    // super()
    this.name = name
    this.locked = locked
    // this.loading = loading
  }
  // public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
  //   // const worker = this.createWorker()
  //   // eslint-disable-next-line no-async-promise-executor
  //   const promise = new Promise<FillTableData>(async (resolveRefresh, rejectRefresh) => {
  //   })

  //   this.activeUpdate = {
  //     worker: null,
  //     promise
  //   }
  // }

  public getLoadable() {
    return {
      name: this.name,
      locked: this.locked
    }
  }
}