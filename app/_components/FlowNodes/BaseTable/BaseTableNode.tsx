'use client'
import { useCallback, useEffect, useRef, useState } from 'react';
import { Position, NodeProps, useUpdateNodeInternals } from 'reactflow';

import ModuleUI from '../../Module';

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';

import { BaseTableData, targetRomHandleId } from "@/app/_components/FlowNodes/BaseTable/BaseTableTypes"


function BaseTableNode({ id, data, isConnectable }: NodeProps<BaseTableData>) {

  const [expanded, setExpanded] = useState<boolean>()
  const childRef = useRef<HTMLTextAreaElement>(null)

  const onFocus = useCallback(() => {
    childRef.current?.focus()
  }, [])

  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    if (data.tableType && data.tableType != "Other") {
      updateNodeInternals(id)
    }
  }, [id, data.tableType, updateNodeInternals])

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
        && <ModuleUI
          ref={childRef}
          module={{ type: 'base', table: data.table }}
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
