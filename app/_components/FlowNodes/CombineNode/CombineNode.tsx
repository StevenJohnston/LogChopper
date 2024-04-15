'use client'
import { useMemo } from 'react';
import {
  Position,
  NodeProps,
  Node,
  getIncomers,
  Connection,
} from 'reactflow';

import useFlow, { RFState } from '@/app/store/useFlow';
import { newLogFilter } from '@/app/_components/FlowNodes/LogFilter/LogFilterNode';
import { LogFilterType, LogFiltereNodeType } from '@/app/_components/FlowNodes/LogFilter/LogFilterTypes';
import { LogNodeTypes, TableNodeTypes } from '@/app/_components/FlowNodes'
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { newFillLogTable } from '@/app/_components/FlowNodes/FillLogTable/FillLogTableNode';
import { FillLogTableNodeType, FillLogTableType } from '@/app/_components/FlowNodes/FillLogTable/FillLogTableTypes';
import { shallow } from 'zustand/shallow';
import { CombineData } from '@/app/_components/FlowNodes/CombineNode/CombineTypes';
import { BaseTableType } from '@/app/_components/FlowNodes/BaseTable/BaseTableTypes';
import { FillTableNodeType, FillTableType } from '@/app/_components/FlowNodes/FillTable/FillTableTypes';
import { newFillTable } from '@/app/_components/FlowNodes/FillTable/FillTableNode';

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  updateEdge: state.updateEdge,
  updateNode: state.updateNode
});

export function newCombineData(): CombineData {
  return {
    getLoadable: () => ({})
  }
}

function CombineNode({ isConnectable, id }: NodeProps<CombineData>) {
  // function CombineNode(node: Node<CombineData>) {
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
      <CustomHandle type="target" dataType='Log' position={Position.Left} id="LogIn" isConnectable={isConnectable} />

      <div className='flex justify-between drag-handle'>
        <div className='pr-2'>New Combiner</div>
        {/* <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button> */}
      </div>

      {
        // parentNode.type == "BaseLogNode"
        parentNode?.type && LogNodeTypes.includes(parentNode.type)
        && <button
          onClick={() => {
            const logFilter: LogFiltereNodeType = {
              ...node,
              type: LogFilterType,
              data: newLogFilter()
            }
            updateNode(logFilter)
            // let i = getIncomers(node, nodes, edges)
            // let o = getOutgoers(node, nodes, edges)
            // let c = getConnectedEdges()
          }}
        >
          Log Filter
        </button>
      }
      {
        // parentNode.type == "BaseLogNode"
        (parentNode?.type && LogNodeTypes.includes(parentNode.type)
          || parentNode?.type == BaseTableType)
        && <button
          onClick={async () => {
            const fillTable: FillLogTableNodeType = {
              ...node,
              type: FillLogTableType,
              data: newFillLogTable(),
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
        </button>
      }
      {
        // parentNode.type == "BaseLogNode"
        (parentNode?.type && LogNodeTypes.includes(parentNode.type)
          || parentNode?.type == FillLogTableType)
        && <button
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
        </button>
      }
      {/* {
        expanded
        && <div>
          {
            selectedLogs.map(l => <div>{l.name}</div>)
          }
        </div>
      } */}
    </div>
  );
}

export default CombineNode