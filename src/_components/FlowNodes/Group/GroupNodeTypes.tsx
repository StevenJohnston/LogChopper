'use client'

import { NodeWithType, SaveableNode } from '@/src/_components/FlowNodes';

export interface InitGroupData {
  name: string
  locked: boolean
}


export interface GroupData<T> extends InitGroupData, SaveableNode<T> {
  // table: Table;
  // selectedRom: FileSystemFileHandle | null;
  // scalingMap: Record<string, Scaling>;
  // width: number;
  // height: number;
}

export const GroupType = "GroupNode"
export type GroupNodeType = NodeWithType<GroupData<InitGroupData>, typeof GroupType>;

// export default GroupNode