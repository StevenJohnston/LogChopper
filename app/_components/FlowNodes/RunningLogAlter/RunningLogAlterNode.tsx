'use client'
import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react';
import { Position, NodeProps, Node, Edge } from 'reactflow';
import InfoSVG from "../../../icons/info.svg"

import { LogRecord, runningAlter } from '@/app/_lib/log';
import { Row, createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual'
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { InitRunningLogAlterData, RunningLogAlterData, RunningLogAlterSourceLogHandleId, RunningLogAlterTargetLogHandleId, RunningLogAlterType, RunningLogAlterNodeType } from '@/app/_components/FlowNodes/RunningLogAlter/RunningLogAlterTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import { getParentsByHandleIds } from '@/app/_lib/react-flow-utils';
import { LogData } from '@/app/_components/FlowNodes';
import Code from '@/app/_components/Code';

export function newRunningLogAlter({
  alterFunc,
  untilFunc,
  newFieldName

}: InitRunningLogAlterData): RunningLogAlterData {
  return {
    alterFunc,
    untilFunc,
    newFieldName,
    logs: [],
    refresh: async function (node: Node, nodes: Node[], edges: Edge[]): Promise<void> {
      const parentNodes = getParentsByHandleIds<[Node<LogData>]>(node, nodes, edges, [RunningLogAlterTargetLogHandleId])
      if (!parentNodes) {
        this.logs = []
        return console.log("newRunningLogAlter One or more parents are missing")
      }
      const [sourceLogNode] = parentNodes

      if (!this.newFieldName) return console.log("newFieldName func missing")
      if (!this.untilFunc) return console.log("untilFunc func missing")
      if (!this.alterFunc) return console.log("alterFunc func missing")
      if (sourceLogNode.data.logs == null) return console.log("newRunningLogAlter sourceLogNode missing logs")

      this.logs = runningAlter(sourceLogNode.data.logs, this.newFieldName, this.untilFunc, this.alterFunc)
    },

    getLoadable: function () {
      return {
        alterFunc: this.alterFunc,
        untilFunc: this.untilFunc,
        newFieldName: this.newFieldName,
      }
    }
  }
}

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

  const columnHelper = createColumnHelper<LogRecord>()
  const columns = (Object.keys(data.logs[0] || {})).map(c => {
    return columnHelper.accessor(c, {
      cell: info => info.getValue(),
      footer: info => info.column.id,
    })
  })

  const filteredLogs = useMemo(() => {
    return data.logs.filter(l => !l.delete)
  }, [data.logs])
  const table = useReactTable({ columns, data: filteredLogs, getCoreRowModel: getCoreRowModel(), })
  const { rows } = table.getRowModel()
  //The virtualizer needs to know the scrollable container element
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' &&
        navigator.userAgent.indexOf('Firefox') === -1
        ? element => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  })


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
    updateNode({ ...node, data: { ...node.data, alterFunc: event.target.value } })
  }, [node, updateNode])
  const onUntilFuncChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!node) return
    setUntilFuncVal(event.target.value)
    updateNode({ ...node, data: { ...node.data, untilFunc: event.target.value } })
  }, [node, updateNode])
  const onNewFieldNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!node) return
    setNewFieldNameVal(event.target.value)
    updateNode({ ...node, data: { ...node.data, newFieldName: event.target.value } })
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
                <p className='pl-2 mb-2'>The new filed that will be added to output log records</p>
                <p className='text-2xl'>Until Func</p>
                <p className='pl-2'>Loops through <Code>futureLogRecord</Code>&apos;s until <Code>stop</Code> is true returning <Code>accumulator</Code></p>
                <p className='text-lg'>Parameters</p>
                <p className='pl-2'><Code>logRecord</Code> The current log record</p>
                <p className='pl-2'><Code>futureLogRecord</Code> The value of the future log record being looped</p>
                <p className='pl-2 mb-2'><Code>accumulator</Code> The last return value from Alter Func</p>
                <p className='text-lg'>Return value</p>
                <p className='pl-2'><Code>[stop: boolean, nextAccumulator: Value]</Code> Tuple</p>
                <p className='pl-2'><Code>stop</Code> Whether or not to continue looping to future records</p>
                <p className='pl-2 mb-2'><Code>nextAccumulator</Code> The value of accumulator for the next loop</p>
                <p className='text-2xl'>Alter Func</p>
                <p className='pl-2'>The value to set the new field to</p>
                <p className='text-lg'>Parameters</p>
                <p className='pl-2'><Code>logRecord</Code> The current log record</p>
                <p className='pl-2'><Code>futureLogRecord</Code> The last log record from Alter Func</p>
                <p className='pl-2'><Code>accumulator</Code> The last return value from Alter Func</p>
                <p className='text-lg'>Return value</p>
                <p className='pl-2 mb-2'><Code>filedValue</Code> value for the new field</p>
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
                className='w-full p-1 text-md text-gray-900 bg-white border-0 dark:bg-gray-800 dark:text-white focus:ring-0 rounded-lg'
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
              <label htmlFor="logField" className="block mb-2 text-sm font-medium text-gray-900">Until Func</label>
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
              <label htmlFor="logField" className="block mb-2 text-sm font-medium text-gray-900">Alter Func</label>
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
        && <div
          className="container"
          ref={tableContainerRef}
          style={{
            overflow: 'auto', //our scrollable table container
            position: 'relative', //needed for sticky header
            height: '800px', //should be a fixed height
          }}
        >
          {/* Even though we're still using sematic table tags, we must use CSS grid and flexbox for dynamic row heights */}
          <table style={{ display: 'grid' }}>
            <thead
              style={{
                display: 'grid',
                position: 'sticky',
                top: 0,
                zIndex: 1,
              }}
            >
              {table.getHeaderGroups().map(headerGroup => (
                <tr
                  key={headerGroup.id}
                  style={{ display: 'flex', width: '100%' }}
                >
                  {headerGroup.headers.map(header => {
                    return (
                      <th
                        key={header.id}
                        style={{
                          display: 'flex',
                          width: header.getSize(),
                        }}
                      >
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? 'cursor-pointer select-none'
                              : '',
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {/* {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? null} */}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody
              style={{
                display: 'grid',
                height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
                position: 'relative', //needed for absolute positioning of rows
              }}
            >
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const row = rows[virtualRow.index] as Row<LogRecord>
                return (
                  <tr
                    data-index={virtualRow.index} //needed for dynamic row height measurement
                    // ref={node => rowVirtualizer.measureElement(node)} //measure dynamic row height
                    key={row.id}
                    style={{
                      display: 'flex',
                      position: 'absolute',
                      transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
                      width: '100%',
                    }}
                  >
                    {row.getVisibleCells().map(cell => {
                      return (
                        <td
                          key={cell.id}
                          style={{
                            display: 'flex',
                            width: cell.column.getSize(),
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      }
    </div >
  );
}

export default RunningLogAlterNode
