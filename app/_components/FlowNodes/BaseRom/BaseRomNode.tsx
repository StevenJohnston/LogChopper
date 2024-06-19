'use client'

import { BaseRomData, BaseRomNodeType, BaseRomType } from "@/app/_components/FlowNodes/BaseRom/BaseRomTypes";
import { CustomHandle } from "@/app/_components/FlowNodes/CustomHandle/CustomHandle";
import useFlow, { RFState } from "@/app/store/useFlow";
import useRom from "@/app/store/useRom";
import { useEffect, useMemo, useState } from "react";
import { NodeProps, Position } from "reactflow";
import { shallow } from "zustand/shallow";

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  updateEdge: state.updateEdge,
  updateNode: state.updateNode,
  flowInstance: state.reactFlowInstance
});

function BaseRomNode({ id, data, isConnectable }: NodeProps<BaseRomData>) {
  const [expanded, setExpanded] = useState<boolean>(true)

  const { nodes, updateNode } = useFlow(selector, shallow);
  const { tableMap, selectedRom, scalingMap } = useRom()


  const node: BaseRomNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == BaseRomType) {
        return n
      }
    }
  }, [id, nodes])


  useEffect(() => {
    if (!node) return console.log("BaseRomNode node missing")
    if (!selectedRom) return console.log("BaseRomNode selectedRom missing")
    if (!scalingMap) return console.log("BaseRomNode scalingMap missing")
    if (!tableMap) return console.log("BaseRomNode tableMap missing");

    // if (scalingMap == data.scalingMap && tableMap == data.tableMap && selectedRom == data.s) return console.log("BaseRomNode No update required");

    (async () => {
      const selectedRomFile = await selectedRom.getFile()
      const typeSafeUpdateNode: BaseRomNodeType = {
        ...node,
        data: node.data.clone({
          selectedRomFile,
          scalingMap,
          tableMap,
          loading: false,
        })
      }
      updateNode(typeSafeUpdateNode)
    })()
  }, [selectedRom, scalingMap, tableMap, updateNode])

  return (
    <div
      className={`flex flex-col p-2 border border-black rounded bg-blue-400/50 ${data.loading && 'animate-pulse'}`}
      onDoubleClick={() => setExpanded(!expanded)}
    >
      <div className='flex justify-between drag-handle'>
        <div className='pr-2'>Selected Rom</div>
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>

      </div>
      {
        expanded
        && <div>
          {
            selectedRom?.name || "Select Rom"
          }
        </div>
      }
      <CustomHandle type="source" dataType='Rom' position={Position.Right} id="RomOut" isConnectable={isConnectable} />
    </div>
  );
}

export default BaseRomNode