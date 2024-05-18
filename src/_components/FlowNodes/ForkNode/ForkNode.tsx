'use client'
import { useMemo } from 'react';
import {
  Position,
  NodeProps,
  Node,
  getIncomers,
  Connection,
} from 'reactflow';

import useFlow, { RFState } from '@/src/store/useFlow';
import { newLogFilter } from '@/src/_components/FlowNodes/LogFilter/LogFilterNode';
import { LogFilterTargetLogHandleId, LogFilterType, LogFilterNodeType } from '@/src/_components/FlowNodes/LogFilter/LogFilterTypes';
import { LogNodeTypes, TableNodeTypes } from '@/src/_components/FlowNodes'
import { CustomHandle } from '@/src/_components/FlowNodes/CustomHandle/CustomHandle';
import { newFillLogTable } from '@/src/_components/FlowNodes/FillLogTable/FillLogTableNode';
import { FillLogTableNodeType, FillLogTableType } from '@/src/_components/FlowNodes/FillLogTable/FillLogTableTypes';
import { shallow } from 'zustand/shallow';
import { ForkData } from '@/src/_components/FlowNodes/ForkNode/ForkTypes';
import { BaseTableType } from '@/src/_components/FlowNodes/BaseTable/BaseTableTypes';
import { FillTableNodeType, FillTableType } from '@/src/_components/FlowNodes/FillTable/FillTableTypes';
import { newFillTable } from '@/src/_components/FlowNodes/FillTable/FillTableNode';
import { CombineNodeType, CombineType, targetTableOneHandleID } from '@/src/_components/FlowNodes/Combine/CombineTypes';
import { newCombine } from '@/src/_components/FlowNodes/Combine/CombineNode';
import ForkButton from '@/src/_components/FlowNodes/ForkNode/ForkButton';
import { CombineAdvancedTableNodeType, CombineAdvancedTableType, destHandleId as combineAdancedDestHandleId } from '@/src/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableTypes';
import { newCombineAdvanced } from '@/src/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableNode';
import { newLogAlter } from '@/src/_components/FlowNodes/LogAlter/LogAlterNode';
import { LogAlterNodeType, LogAlterTargetLogHandleId, LogAlterType } from '@/src/_components/FlowNodes/LogAlter/LogAlterTypes';

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  updateEdge: state.updateEdge,
  updateNode: state.updateNode
});

export function newForkData(): ForkData {
  return {
    getLoadable: () => ({})
  }
}

function ForkNode({ isConnectable, id }: NodeProps<ForkData>) {
  const { nodes, edges, updateNode, updateEdge } = useFlow(selector, shallow);

  // let i = getInco÷
  const [node, parentNode]: (Node | undefined)[] = useMemo(() => {
    const node = nodes.find(n => n.id == id)
    if (!node) return [node]
    const i = getIncomers(node, nodes, edges)
    return [node, i[0]]
  }, [nodes, edges, id])

  if (!node) return <div>Loading</div>
  return (
    <div className="flex flex-col p-2 border border-black rounded">
      {/* <Handle type="target" position={Position.Top} id="top-h" isConnectable={true} /> */}
      {
        parentNode?.type && LogNodeTypes.includes(parentNode?.type)
        && <CustomHandle type="target" dataType='Log' position={Position.Left} id="LogIn" isConnectable={isConnectable} />
      }
      {
        parentNode?.type && TableNodeTypes.includes(parentNode?.type)
        && <CustomHandle type="target" dataType='3D' position={Position.Left} id="TableIn" isConnectable={isConnectable} />
      }

      <div className='flex justify-between drag-handle'>
        <div className='pr-2'>New Forker</div>
        {/* <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button> */}
      </div>

      {
        // parentNode.type == "BaseLogNode"
        parentNode?.type && LogNodeTypes.includes(parentNode.type)
        && <ForkButton
          onClick={async () => {
            const logFilter: LogFilterNodeType = {
              ...node,
              type: LogFilterType,
              data: newLogFilter({})
            }
            await updateNode(logFilter)

            const edge = edges.find(e => e.target == node.id)
            if (!edge) return
            const targetType = edge?.sourceHandle?.split("#")[0]
            const newConenction: Connection = {
              source: edge?.source,
              target: edge?.target,
              sourceHandle: edge.sourceHandle || null,
              targetHandle: `${targetType}#${LogFilterTargetLogHandleId}`,
            }

            updateEdge(edge, newConenction)
            // let i = getIncomers(node, nodes, edges)
            // let o = getOutgoers(node, nodes, edges)
            // let c = getConnectedEdges()
          }}
        >
          Log Filter
        </ForkButton>
      }
      {
        // parentNode.type == "BaseLogNode"
        parentNode?.type && LogNodeTypes.includes(parentNode.type)
        && <ForkButton
          onClick={async () => {
            const logAlter: LogAlterNodeType = {
              ...node,
              type: LogAlterType,
              data: newLogAlter({})
            }
            await updateNode(logAlter)

            const edge = edges.find(e => e.target == node.id)
            if (!edge) return
            const targetType = edge?.sourceHandle?.split("#")[0]
            const newConenction: Connection = {
              source: edge?.source,
              target: edge?.target,
              sourceHandle: edge.sourceHandle || null,
              targetHandle: `${targetType}#${LogAlterTargetLogHandleId}`
            }

            updateEdge(edge, newConenction)
            // let i = getIncomers(node, nodes, edges)
            // let o = getOutgoers(node, nodes, edges)
            // let c = getConnectedEdges()
          }}
        >
          Log Alter
        </ForkButton>
      }
      {
        // parentNode.type == "BaseLogNode"
        (parentNode?.type && LogNodeTypes.includes(parentNode.type)
          || parentNode?.type == BaseTableType)
        && <ForkButton
          onClick={async () => {
            const fillTable: FillLogTableNodeType = {
              ...node,
              type: FillLogTableType,
              data: newFillLogTable({ weighted: true }),
              dragHandle: '.drag-handle'
            }
            await updateNode(fillTable)
            const edge = edges.find(e => e.target == node.id)
            if (!edge) return
            const targetType = edge?.sourceHandle?.split("#")[0]
            const newConenction: Connection = {
              source: edge?.source,
              target: edge?.target,
              sourceHandle: edge.sourceHandle || null,
              targetHandle: parentNode?.type && LogNodeTypes.includes(parentNode.type) ? `${targetType}#LogIn` : `${targetType}#TableIn`
            }

            updateEdge(edge, newConenction)
          }}
        >
          Log Table Filler
        </ForkButton>
      }
      {
        // parentNode.type == "BaseLogNode"
        (parentNode?.type &&
          parentNode?.type == FillLogTableType)
        && <ForkButton
          onClick={async () => {
            const fillTable: FillTableNodeType = {
              ...node,
              type: FillTableType,
              data: newFillTable({}),
              dragHandle: '.drag-handle'
            }
            await updateNode(fillTable)
            const edge = edges.find(e => e.target == node.id)
            if (!edge) return
            const targetType = edge?.sourceHandle?.split("#")[0]
            const newConenction: Connection = {
              source: edge?.source,
              target: edge?.target,
              sourceHandle: edge.sourceHandle || null,
              targetHandle: parentNode?.type && LogNodeTypes.includes(parentNode.type) ? `${targetType}#LogIn` : `${targetType}#TableIn`
            }

            updateEdge(edge, newConenction)
          }}
        >
          Table Filler
        </ForkButton>
      }
      {
        // parentNode.type == "BaseLogNode"
        (parentNode?.type && TableNodeTypes.includes(parentNode.type))
        && <ForkButton
          onClick={async () => {
            const combineTable: CombineNodeType = {
              ...node,
              type: CombineType,
              data: newCombine({}),
              dragHandle: '.drag-handle'
            }
            await updateNode(combineTable)
            const existingEdge = edges.find(e => e.target == node.id)
            if (!existingEdge) return
            const targetType = existingEdge?.sourceHandle?.split("#")[0]
            const newConenction: Connection = {
              source: existingEdge?.source,
              target: existingEdge?.target,
              sourceHandle: existingEdge.sourceHandle || null,
              targetHandle: `${targetType}#${targetTableOneHandleID}`
            }

            updateEdge(existingEdge, newConenction)
          }}>
          Combine Table
        </ForkButton>
      }
      {
        // parentNode.type == "BaseLogNode"
        (parentNode?.type && TableNodeTypes.includes(parentNode.type))
        && <ForkButton
          onClick={async () => {
            const combineTable: CombineAdvancedTableNodeType = {
              ...node,
              type: CombineAdvancedTableType,
              data: newCombineAdvanced({ matchCriteria: [] }),
              dragHandle: '.drag-handle'
            }
            await updateNode(combineTable)
            const existingEdge = edges.find(e => e.target == node.id)
            if (!existingEdge) return
            const targetType = existingEdge?.sourceHandle?.split("#")[0]
            const newConenction: Connection = {
              source: existingEdge?.source,
              target: existingEdge?.target,
              sourceHandle: existingEdge.sourceHandle || null,
              targetHandle: `${targetType}#${combineAdancedDestHandleId}`
            }

            updateEdge(existingEdge, newConenction)
          }}>
          Combine Advanced
        </ForkButton>
      }
    </div >
  );
}

export default ForkNode