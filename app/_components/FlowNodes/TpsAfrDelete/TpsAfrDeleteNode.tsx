
'use client'
import { useMemo, useState } from 'react';
import { Position, NodeProps } from 'reactflow';

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { TpsAfrDeleteData, TpsAfrDeleteSourceLogHandleId, TpsAfrDeleteTargetLogHandleId } from '@/app/_components/FlowNodes/TpsAfrDelete/TpsAfrDeleteTypes';
import LogTable from '@/app/_components/LogTable';

function TpsAfrDeleteNode({ data, isConnectable }: NodeProps<TpsAfrDeleteData>) {
  const [expanded, setExpanded] = useState<boolean>(false)
  const [showDeleted, setShowDeleted] = useState<boolean>(false)

  const filteredLogs = useMemo(() => {
    if (!data.logs) return []
    return data.logs.filter(l => showDeleted ? l.delete : !l.delete)
  }, [data.logs, showDeleted])

  return (
    <div className={`flex flex-col p-2 border border-black rounded nowheel bg-emerald-400/75 bg-opacity-50 ${data.loading && 'animate-pulse'}`}>
      <CustomHandle dataType="Log" type="target" position={Position.Left} id={TpsAfrDeleteTargetLogHandleId} isConnectable={isConnectable} top='20px' />
      <CustomHandle dataType="Log" type="source" position={Position.Right} id={TpsAfrDeleteSourceLogHandleId} isConnectable={isConnectable} top="20px" />

      <div
        onDoubleClick={() => setExpanded(!expanded)}
        className='flex justify-between drag-handle'
      >
        <div className='pr-2'>TPS AFR Delete</div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            className="form-checkbox"
          />
          <span>Show Deleted</span>
        </label>
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>

      </div>
      {
        expanded
        && <LogTable logs={filteredLogs} />
      }
    </div>
  );
}

export default TpsAfrDeleteNode

