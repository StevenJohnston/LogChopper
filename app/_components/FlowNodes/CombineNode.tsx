import { useCallback, useMemo, useState } from 'react';
import {
  Handle,
  Position,
  NodeProps,
  Node,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
  Connection,
} from 'reactflow';

import useRom, { useRomSelector } from '@/app/store/useRom';
import { shallow } from "zustand/shallow";
import useFlow from '@/app/store/useFlow';
import { LogFiltereNodeType, newLogFilter } from '@/app/_components/FlowNodes/LogFilterNode';
import { LogNodeTypes, RefreshableNode, TableNodeTypes } from '@/app/_components/FlowNodes'
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle';
import { FillTableNodeType, FillTableType, newFillTable } from '@/app/_components/FlowNodes/FillTableNode';


export interface CombineData extends RefreshableNode { }
export type CombineNodeType = Node<CombineData, "CombineNode">;

function CombineNode({ data, isConnectable, id, type }: NodeProps<CombineData>) {
  // function CombineNode(node: Node<CombineData>) {
  const { nodes, edges, updateNode, updateEdge } = useFlow()

  // function CombineNode(node: NodeProps<CombineData>) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  // let i = getInco÷
  const [node, parentNode]: (Node | undefined)[] = useMemo(() => {
    const node = nodes.find(n => n.id == id)
    if (!node) return [node]
    let i = getIncomers(node, nodes, edges)
    return [node, i[0]]
  }, [nodes, edges])

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
              type: "LogFilterNode",
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
          || parentNode?.type && TableNodeTypes.includes(parentNode.type))
        && <button
          onClick={async () => {
            const fillTable: FillTableNodeType = {
              ...node,
              type: FillTableType,
              data: newFillTable()
            }
            await updateNode(fillTable)
            // let c = getConnectedEdges()
            // TODO Update edges 
            const edge = edges.find(e => e.target == node.id)
            if (!edge) return
            const targetType = edge?.sourceHandle?.split("#")[0]
            const newConenction: Connection = {
              source: edge?.source,
              target: edge?.target,
              sourceHandle: edge.sourceHandle || null,
              // sourceHandle: parentNode?.type && LogNodeTypes.includes(parentNode.type) ? "LogIn" : `${targetType}#TableIn`,
              targetHandle: parentNode?.type && LogNodeTypes.includes(parentNode.type) ? `${targetType}#LogIn` : `${targetType}#TableIn`
            }
            console.log(edge)

            updateEdge(edge, newConenction)
            // let i = getIncomers(node, nodes, edges)
            // let o = getOutgoers(node, nodes, edges)
            // let c = getConnectedEdges()
          }}
        >
          Map Filler
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