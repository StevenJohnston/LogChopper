'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Position, NodeProps, useUpdateNodeInternals } from 'reactflow';

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';

import { BaseTableData, BaseTableNodeType, BaseTableType, targetRomHandleId } from "@/app/_components/FlowNodes/BaseTable/BaseTableTypes"
import RomModuleUI from '@/app/_components/RomModuleUI';
import { Scaling } from '@/app/_lib/rom-metadata';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';


const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode,
  softUpdateNode: state.softUpdateNode
});
function BaseTableNode({ id, data, isConnectable }: NodeProps<BaseTableData>) {
  const { nodes, softUpdateNode } = useFlow(selector, shallow);

  const [expanded, setExpanded] = useState<boolean>()
  const childRef = useRef<HTMLTextAreaElement>(null)

  const onFocus = useCallback(() => {
    childRef.current?.focus()
  }, [])


  const node: BaseTableNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == BaseTableType) {
        return n
      }
    }
  }, [id, nodes])

  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    if (data.tableType && data.tableType != "Other") {
      updateNodeInternals(id)
    }
  }, [id, data.tableType, updateNodeInternals])


  const setScalingValue = useCallback((scalingValue: Scaling | undefined | null) => {
    if (!node) return
    softUpdateNode({
      ...node,
      data: node.data.clone({
        scalingValue: scalingValue
      })
    })
  }, [node, softUpdateNode])

  if (data?.table?.type == "Other") {
    return (
      <div>Other type table unrenderable</div>
    )
  }

  return (
    <div className={`flex flex-col p-2 border border-black rounded bg-red-400/75 ${data.loading && 'animate-pulse'}`} onClick={onFocus}>
      <CustomHandle dataType={"Rom"} type="target" position={Position.Left} id={targetRomHandleId} isConnectable={isConnectable} />

      <div
        className='flex justify-between drag-handle'
        onDoubleClick={() => setExpanded(!expanded)}
      >
        <div className='pr-2'>{data.tableKey}</div>
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>
      </div>
      {
        data.table
        && expanded
        && <RomModuleUI
          ref={childRef}
          table={data.table}
          scalingMap={data.scalingMap}
          scalingValue={data.scalingValue}
          setScalingValue={setScalingValue}
        />
      }
      {
        data.tableType &&
        <CustomHandle dataType={data.tableType} type="source" position={Position.Right} id="TableOut" isConnectable={isConnectable} />
      }
    </div>
  );
}

export default BaseTableNode
