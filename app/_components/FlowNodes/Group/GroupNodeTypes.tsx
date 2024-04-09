'use client'

import { Node } from 'reactflow';

import { RefreshableNode, SaveableNode } from '@/app/_components/FlowNodes';

export interface InitGroupData {
  name: string
  locked: boolean
}


export interface GroupData<T> extends InitGroupData, RefreshableNode, SaveableNode<T> {
  // table: Table;
  // selectedRom: FileSystemFileHandle | null;
  // scalingMap: Record<string, Scaling>;
  // width: number;
  // height: number;
}

export const GroupType = "GroupNode"
export type GroupNodeType = Node<GroupData<InitGroupData>, typeof GroupType>;

// export default GroupNode