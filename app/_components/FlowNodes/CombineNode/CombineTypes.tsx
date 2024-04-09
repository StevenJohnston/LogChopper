'use client'
import {
  Node,
} from 'reactflow';

import { RefreshableNode, SaveableNode } from '@/app/_components/FlowNodes'

export const CombineType = "CombineNode"
export interface CombineData extends RefreshableNode, SaveableNode { }
export type CombineNodeType = Node<CombineData, typeof CombineType>;
