'use client'
import {
  Node,
} from 'reactflow';

import { RefreshableNode } from '@/app/_components/FlowNodes'


export interface CombineData extends RefreshableNode { }
export type CombineNodeType = Node<CombineData, "CombineNode">;
