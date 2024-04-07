'use client'

import { Node } from 'reactflow';

import { RefreshableNode, SaveableNode } from '@/app/_components/FlowNodes';

export interface GroupData extends RefreshableNode, SaveableNode {
  // table: Table;
  // selectedRom: FileSystemFileHandle | null;
  // scalingMap: Record<string, Scaling>;
  width: number;
  height: number;
}

export const GroupType = "GroupNode"
export type GroupNodeType = Node<GroupData, "GroupNode">;

// export default GroupNode