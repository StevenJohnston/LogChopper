import useFlow, { MyNode } from '@/app/store/useFlow';
import { useCallback } from 'react';
import { Handle, Position, HandleProps, Connection } from 'reactflow';

interface CustomHandle extends HandleProps {
  dataType: "Log" | "1D" | "2D" | "3D"
  label?: string
  top?: string
  right?: string
}

const positionTranslation = {
  [Position.Right]: {
    right: "unset",
    left: "calc(100% - 5px)"
  },
  [Position.Bottom]: {
    bottom: "unset",
    top: "calc(100% - 5px)"
  },
  [Position.Left]: {
    left: "unset",
    right: "calc(100% - 5px)"
  },
  [Position.Top]: {
    top: "unset",
    bottom: "calc(100% - 5px)"
  },
}

export const CustomHandle = ({ id, type, position, isConnectable, dataType, label, top, right }: CustomHandle) => {
  const { nodes, updateNode } = useFlow()
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