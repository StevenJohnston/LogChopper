'use client'
import { useMemo, useState } from 'react';
import { Position, NodeProps } from 'reactflow';

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { AfrShiftData, AfrShiftSourceLogHandleId, AfrShiftTargetLogHandleId } from '@/app/_components/FlowNodes/AfrShift/AfrShiftTypes';
import LogTable from '@/app/_components/LogTable';

function AfrShiftNode({ data, isConnectable }: NodeProps<AfrShiftData>) {
  const [expanded, setExpanded] = useState<boolean>(false)

  const filteredLogs = useMemo(() => {
    if (!data.logs) return []
    return data.logs.filter(l => !l.delete)
  }, [data.logs])

  return (
    <div className={`flex flex-col p-2 border border-black rounded nowheel bg-emerald-400/75 bg-opacity-50 ${data.loading && 'animate-pulse'}`}>
      <CustomHandle dataType="Log" type="target" position={Position.Left} id={AfrShiftTargetLogHandleId} isConnectable={isConnectable} top='20px' />
      <CustomHandle dataType="Log" type="source" position={Position.Right} id={AfrShiftSourceLogHandleId} isConnectable={isConnectable} top="20px" />

      <div
        onDoubleClick={() => setExpanded(!expanded)}
        className='flex justify-between drag-handle'
      >
        <div className='pr-2'>AFR Shifter</div>
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

export default AfrShiftNode

