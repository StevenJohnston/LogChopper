'use client'

import { NodeWithType, RefreshableNode, SaveableNode } from '@/app/_components/FlowNodes'

export const ForkType = "ForkNode"
export interface ForkData extends RefreshableNode, SaveableNode { }
export type ForkNodeType = NodeWithType<ForkData, typeof ForkType>;
