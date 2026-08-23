'use client'
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { Position, NodeProps } from 'reactflow';
import InfoSVG from "../../../icons/info.svg"

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { RunningLogAlterData, RunningLogAlterSourceLogHandleId, RunningLogAlterTargetLogHandleId, RunningLogAlterType, RunningLogAlterNodeType } from '@/app/_components/FlowNodes/RunningLogAlter/RunningLogAlterTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import Code from '@/app/_components/Code';
import LogTable from '@/app/_components/LogTable';


const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode
});

function RunningLogAlterNode({ id, data, isConnectable }: NodeProps<RunningLogAlterData>) {
  const [alterFuncVal, setAlterFuncVal] = useState(data.alterFunc || "")
  const [untilFuncVal, setUntilFuncVal] = useState(data.untilFunc || "")
  const [newFieldNameVal, setNewFieldNameVal] = useState(data.newFieldName || "")


  const { nodes, updateNode } = useFlow(selector, shallow);
  const [expanded, setExpanded] = useState<boolean>(false)

  const filteredLogs = useMemo(() => {
    if (!data.logs) return []
    return data.logs.filter(l => !l.delete)
  }, [data.logs])


  const node: RunningLogAlterNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == RunningLogAlterType) {
        return n
      }
    }
  }, [id, nodes])

  const onAlterFuncChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!node) return
    setAlterFuncVal(event.target.value)
    updateNode({ ...node, data: node.data.clone({ ...node.data, alterFunc: event.target.value }) })
  }, [node, updateNode])
  const onUntilFuncChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!node) return
    setUntilFuncVal(event.target.value)
    updateNode({ ...node, data: node.data.clone({ ...node.data, untilFunc: event.target.value }) })
  }, [node, updateNode])
  const onNewFieldNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!node) return
    setNewFieldNameVal(event.target.value)
    updateNode({ ...node, data: node.data.clone({ ...node.data, newFieldName: event.target.value }) })
  }, [node, updateNode])

  return (
    <div className={`flex flex-col p-2 border border-black rounded nowheel bg-teal-400/75 bg-opacity-50 ${data.loading && 'animate-pulse'}`}>
      <CustomHandle dataType="Log" type="target" position={Position.Left} id={RunningLogAlterTargetLogHandleId} isConnectable={isConnectable} top='20px' />
      <CustomHandle dataType="Log" type="source" position={Position.Right} id={RunningLogAlterSourceLogHandleId} isConnectable={isConnectable} top="20px" />

      <div
        onDoubleClick={() => setExpanded(!expanded)}
        className='flex justify-between drag-handle'
      >
        <div className='pr-2'>Running Log Alter</div>

        <div className='flex'>
          <div className=''>
            <InfoSVG
              className='mx-2 anchor'
              width={24}
              height={24}
            />
            <div className='tooltip'>
              <div className='bg-white rounded-lg p-4 min-w-[600px] border-black border-2'>
                <p className='text-2xl'>New Field Name</p>
                <p className='pl-2 mb-2'>The new field that will be added to output log records</p>
                <p className='text-2xl'>Until Func</p>
                <p className='pl-2'>Loops through <Code>currentLogRecord</Code>&apos;s until <Code>stop</Code> is true returning <Code>accumulator</Code></p>
                <p className='text-lg'>Parameters</p>
                <p className='pl-2'><Code>logRecord</Code> The current log record</p>
                <p className='pl-2'><Code>currentLogRecord</Code> The value of the future log record being looped</p>
                <p className='pl-2'><Code>currentIndex</Code> Current index of currentLogRecord in logs</p>
                <p className='pl-2 mb-2'><Code>accumulator</Code> The last return value from Alter Func</p>
                <p className='text-lg'>Return value</p>
                <p className='pl-2'><Code>[stop: boolean, nextIndex: number, nextAccumulator: Value]</Code> Tuple</p>
                <p className='pl-2'><Code>stop</Code> Whether or not to continue looping to future records</p>
                <p className='pl-2'><Code>nextIndex</Code> Index for the next value of currentLogRecord</p>
                <p className='pl-2 mb-2'><Code>nextAccumulator</Code> The value of accumulator for the next loop</p>
                <p className='text-2xl'>Alter Func</p>
                <p className='pl-2'>The value to set the new field to</p>
                <p className='text-lg'>Parameters</p>
                <p className='pl-2'><Code>logRecord</Code> The current log record</p>
                <p className='pl-2'><Code>currentLogRecord</Code> The last log record from Alter Func</p>
                <p className='pl-2'><Code>accumulator</Code> The last return value from Alter Func</p>
                <p className='text-lg'>Return value</p>
                <p className='pl-2 mb-2'><Code>fieldValue</Code> value for the new field</p>
              </div>
            </div>
          </div>
          <button className='border-2 border-black w-8 h-8'
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "_" : "^"}
          </button>
        </div>

      </div>
      <div>
        <div className="max-w-sm">
          <div className='flex flex-col'>
            <div className='mr-2'>
              <label htmlFor="logField" className="block mb-2 text-sm font-medium text-gray-900">New Field Name</label>
              <input
                className='w-full p-1 text-md text-gray-900 bg-white border-0 dark:bg-gray-800 dark:text-white focus:ring-0 rounded-lg mb-2'
                type="text"
                value={newFieldNameVal}
                onChange={onNewFieldNameChange}
              />
            </div>
          </div>
        </div>
        <div className="max-w-sm">
          <div className='flex flex-col'>
            <div className='mr-2'>
              <label htmlFor="logField" className="block text-sm font-medium text-gray-900">Until Func</label>
              <div className='ml-2 mb-2'>
                <p className='text-xs text-gray-700 whitespace-nowrap'>params: [logRecord, currentLogRecord, accumulator, currentIndex]</p>
                <p className='text-xs text-gray-700 whitespace-nowrap'>return: [stop, nextIndex, nextAccumulator]</p>
              </div>
              <textarea
                value={untilFuncVal}
                onChange={onUntilFuncChange}
                className='w-full auto-expand-textarea p-1 pb-4 text-md text-gray-900 bg-white border-0 dark:bg-gray-800 dark:text-white focus:ring-0 rounded-lg'
              />
            </div>
          </div>
        </div>
        <div className="max-w-sm">
          <div className='flex flex-col'>
            <div className='mr-2'>
              <label htmlFor="logField" className="block text-sm font-medium text-gray-900">Alter Func</label>
              <div className='ml-2 mb-2'>
                <p className='text-xs text-gray-700 whitespace-nowrap'>params: [logRecord, currentLogRecord, accumulator]</p>
              </div>
              <input
                className='w-full p-1 text-md text-gray-900 bg-white border-0 dark:bg-gray-800 dark:text-white focus:ring-0 rounded-lg'
                type="text"
                value={alterFuncVal}
                onChange={onAlterFuncChange}
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

export default RunningLogAlterNode
