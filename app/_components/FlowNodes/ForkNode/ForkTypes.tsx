'use client'

import { NodeWithType, SaveableNode } from '@/app/_components/FlowNodes/FlowNodesTypes'

export const ForkType = "ForkNode"
export interface ForkData extends SaveableNode { }
export type ForkNodeType = NodeWithType<ForkData, typeof ForkType>;
