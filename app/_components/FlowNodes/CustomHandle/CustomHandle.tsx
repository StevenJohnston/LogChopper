'use client'
import useFlow, { MyNode, RFState } from '@/app/store/useFlow';
import { useCallback } from 'react';
import { Handle, Connection } from 'reactflow';
import { shallow } from 'zustand/shallow';

import { CustomHandleProps, positionTranslation } from '@/app/_components/FlowNodes/CustomHandle/CustomType';

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode
});

export const CustomHandle = ({ id, type, position, isConnectable, dataType, label, top, right }: CustomHandleProps) => {
  const { nodes, updateNode } = useFlow(selector, shallow)
  const onConnect = useCallback((c: Connection) => {
    const node = nodes.find(n => n.id == c.target)
    if (!node) return console.log(`Handle onConnect could not find target node.`, "Connection", c, "Nodes", nodes)
    updateNode(node as MyNode)
  }, [nodes, updateNode])

  id = `${dataType}#${id}`
  const positionStyle: Record<string, string> = {}
  if (top) positionStyle["top"] = top
  if (right) positionStyle["right"] = right
  return (
    <Handle
      id={id}
      type={type}
      position={position}
      onConnect={onConnect}
      isConnectable={isConnectable}
      className='p-1'
      style={{
        backgroundColor: type == "source" ? "#dda559" : "#5980dd",
        width: "unset",
        height: "unset",
        // borderRadius: type == "source" ? "0px" : "50%",
        borderRadius: "8px",
        ...positionTranslation[position],
        ...positionStyle
      }}
    >
      <div className={`${type} text-white text-nowrap`}>
        {label && `${label} - `}{dataType}
      </div>
    </Handle>
  )
};