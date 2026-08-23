'use client'
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { Position, NodeProps } from 'reactflow';

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { LogAlterData, LogAlterSourceLogHandleId, LogAlterTargetLogHandleId, LogAlterType, LogAlterNodeType } from '@/app/_components/FlowNodes/LogAlter/LogAlterTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import LogTable from '@/app/_components/LogTable';

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode
});

function LogAlterNode({ id, data, isConnectable }: NodeProps<LogAlterData>) {
  const [funcVal, setFuncVal] = useState(data.func || "")
  const [newLogFieldVal, setNewLogFieldVal] = useState(data.newLogField || "")
  const { nodes, updateNode } = useFlow(selector, shallow);
  const [expanded, setExpanded] = useState<boolean>(false)

  const filteredLogs = useMemo(() => {
    if (!data.logs) return []
    return data.logs.filter(l => !l.delete)
  }, [data.logs])

  const node: LogAlterNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == LogAlterType) {
        return n
      }
    }
  }, [id, nodes])

  const onFuncChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!node) return
    setFuncVal(event.target.value)
    updateNode({ ...node, data: node.data.clone({ ...node.data, func: event.target.value }) })
  }, [node, updateNode])

  const onNewLogFieldChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!node) return
    setNewLogFieldVal(event.target.value)
    updateNode({ ...node, data: node.data.clone({ ...node.data, newLogField: event.target.value }) })
  }, [node, updateNode])

  return (
    <div className={`flex flex-col p-2 border border-black rounded nowheel bg-sky-400/75 bg-opacity-50 ${data.loading && 'animate-pulse'}`}>
      <CustomHandle dataType="Log" type="target" position={Position.Left} id={LogAlterTargetLogHandleId} isConnectable={isConnectable} top='20px' />
      <CustomHandle dataType="Log" type="source" position={Position.Right} id={LogAlterSourceLogHandleId} isConnectable={isConnectable} top="20px" />

      <div
        onDoubleClick={() => setExpanded(!expanded)}
        className='flex justify-between drag-handle'
      >
        <div className='pr-2'>Log Alter</div>
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
              <label className="block mb-2 text-sm font-medium text-gray-900">New Field Name</label>
              <input
                className='w-full p-1 text-md text-gray-900 bg-white border-0 dark:bg-gray-800 dark:text-white focus:ring-0 rounded-lg'
                type="text"
                value={newLogFieldVal}
                onChange={onNewLogFieldChange}
              />
            </div>
          </div>
          <div className='flex flex-col'>
            <div className='mr-2'>
              <label className="block mb-2 text-sm font-medium text-gray-900">Filter Func</label>
              <input
                className='w-full p-1 text-md text-gray-900 bg-white border-0 dark:bg-gray-800 dark:text-white focus:ring-0 rounded-lg'
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
        && <LogTable logs={filteredLogs} />
      }
    </div>
  );
}

export default LogAlterNode

