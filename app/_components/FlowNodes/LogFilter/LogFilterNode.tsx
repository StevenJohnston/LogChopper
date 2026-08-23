'use client'
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { Position, NodeProps } from 'reactflow';

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { LogFilterData, LogFilterSourceLogHandleId, LogFilterTargetLogHandleId, LogFilterType, LogFilterNodeType } from '@/app/_components/FlowNodes/LogFilter/LogFilterTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import LogTable from '@/app/_components/LogTable';

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode
});

function LogFilterNode({ id, data, isConnectable }: NodeProps<LogFilterData>) {
  const [funcVal, setFuncVal] = useState(data.func || "")
  const { nodes, updateNode } = useFlow(selector, shallow);
  const [expanded, setExpanded] = useState<boolean>(false)

  const filteredLogs = useMemo(() => {
    if (!data.logs) return []
    return data.logs.filter(l => !l.delete)
  }, [data.logs])

  const node: LogFilterNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == LogFilterType) {
        return n
      }
    }
  }, [id, nodes])

  const onFuncChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!node) return
    setFuncVal(event.target.value)
    updateNode({ ...node, data: node.data.clone({ ...node.data, func: event.target.value }) })
  }, [node, updateNode])

  return (
    <div className={`flex flex-col p-2 border border-black rounded nowheel bg-emerald-400/75 bg-opacity-50 ${data.loading && 'animate-pulse'}`}>
      <CustomHandle dataType="Log" type="target" position={Position.Left} id={LogFilterTargetLogHandleId} isConnectable={isConnectable} top='20px' />
      <CustomHandle dataType="Log" type="source" position={Position.Right} id={LogFilterSourceLogHandleId} isConnectable={isConnectable} top="20px" />

      <div
        onDoubleClick={() => setExpanded(!expanded)}
        className='flex justify-between drag-handle'
      >
        <div className='pr-2'>Log Filter</div>
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>

      </div>
      <div>
        <div className="max-w-sm">
          <div className='flex flex-col'>
            <div className='mr-2'>
              <label htmlFor="logField" className="block mb-2 text-sm font-medium text-gray-900">Filter Func</label>
              <input
                className='w-full auto-expand-textarea p-1 text-md text-gray-900 bg-white border-0 dark:bg-gray-800 dark:text-white focus:ring-0 rounded-lg'
                type="text"
                value={funcVal}
                onChange={onFuncChange}
              />
            </div>
          </div>
        </div>
      </div>
      {
        expanded
        && (data.func ? (
          <LogTable logs={filteredLogs} />
        ) : (
          <div>Filter Func required</div>
        ))
      }
    </div>
  );
}

export default LogFilterNode

