'use client'
import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react';
import { Position, NodeProps } from 'reactflow';
import InfoSVG from "../../../icons/info.svg"

import { Direction, LogRecord } from '@/app/_lib/log';
import { HeaderGroup, Row, createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual'
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { MovingAverageLogFilterData, MovingAverageLogFilterSourceLogHandleId, MovingAverageLogFilterTargetLogHandleId, MovingAverageLogFilterType, MovingAverageLogFilterNodeType } from '@/app/_components/FlowNodes/MovingAverageLogFilter/MovingAverageLogFilterTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import Code from '@/app/_components/Code';


const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode
});

function MovingAverageLogFilterNode({ id, data, isConnectable }: NodeProps<MovingAverageLogFilterData>) {

  const [durationSeconds, setDurationSeconds] = useState(data.durationSeconds || 1)
  const [maxDeviation, setMaxDeviation] = useState(data.maxDeviation || "")


  const { nodes, updateNode } = useFlow(selector, shallow);
  const [expanded, setExpanded] = useState<boolean>(false)

  const columnHelper = createColumnHelper<LogRecord>()
  const columns = useMemo(() => {
    if (!data.logs) return []
    return Object.keys(data.logs[0] || {}).map(c => {
      return columnHelper.accessor(c, {
        cell: info => info.getValue(),
        footer: info => info.column.id,
      })
    })
  }, [data.logs, columnHelper])


  const filteredLogs = useMemo(() => {
    if (!data.logs) return []
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


  const node: MovingAverageLogFilterNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == MovingAverageLogFilterType) {
        return n
      }
    }
  }, [id, nodes])



  const onFieldSelect = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const logField = event.target.value as keyof LogRecord
    if (!node) return console.log('FillTableNode failed to find self node')
    updateNode({
      ...node,
      data: node.data.clone({
        ...node.data,
        logField
      })
    })
  }, [node, updateNode])

  const onDirectionSelect = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const direction = event.target.value as Direction
    if (!node) return console.log('FillTableNode failed to find self node')
    updateNode({
      ...node,
      data: node.data.clone({
        ...node.data,
        direction
      })
    })
  }, [node, updateNode])


  const onDurationSecondsChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!node) return
    const durationSeconds = parseFloat(event.target.value);
    setDurationSeconds(durationSeconds)
    updateNode({ ...node, data: node.data.clone({ ...node.data, durationSeconds }) })
  }, [node, updateNode])

  const onMaxDeviationChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!node) return
    const maxDeviation = parseFloat(event.target.value);
    setMaxDeviation(maxDeviation)
    updateNode({ ...node, data: node.data.clone({ ...node.data, maxDeviation }) })
  }, [node, updateNode])




  const fields: string[] | void = useMemo(() => {
    return Object.keys(node?.data?.logs?.[0] || {})
  }, [node?.data.logs])

  let headerGroups: HeaderGroup<LogRecord>[] = [];

  try {
    headerGroups = table.getHeaderGroups()
  } catch (e) {
    console.log()
  }

  return (
    <div className={`flex flex-col p-2 border border-black rounded nowheel bg-teal-400/75 bg-opacity-50 ${data.loading && 'animate-pulse'}`}>
      <CustomHandle dataType="Log" type="target" position={Position.Left} id={MovingAverageLogFilterTargetLogHandleId} isConnectable={isConnectable} top='20px' />
      <CustomHandle dataType="Log" type="source" position={Position.Right} id={MovingAverageLogFilterSourceLogHandleId} isConnectable={isConnectable} top="20px" />

      <div
        onDoubleClick={() => setExpanded(!expanded)}
        className='flex justify-between drag-handle'
      >
        <div className='pr-2'>Moving Average Log Filter</div>

        <div className='flex'>
          <div className=''>
            <InfoSVG
              className='mx-2 anchor'
              width={24}
              height={24}
            />
            <div className='tooltip'>
              <div className='bg-white rounded-lg p-4 min-w-[600px] border-black border-2'>
                <p className='pl-2 mb-2'>Uses Moving Average to filter out Log Records. Useful for removing swings in data.</p>
                <p className='text-2xl'>Field</p>
                <p className='pl-2 mb-2'>Log Record Field to compare in Moving Average</p>
                <p className='text-2xl'>Direction</p>
                <p className='pl-2'>Which direction to build Moving Average</p>
                <p className='text-2xl'>Time Window (Seconds)</p>
                <p className='pl-2'>A duration in seconds to collect <Code>Field</Code>&apos;s Average</p>
                <p className='text-2xl'>Max Average Difference (% as decimal)</p>
                <p className='pl-2'>The maximum difference between <Code>Field</Code> and the Average over <Code>Time Window (Seconds)</Code></p>
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


        <div className='mb-2'>
          <label htmlFor="logField" className="block mb-1 text-sm font-medium text-gray-900">Field</label>
          <select
            id="logField"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            onChange={onFieldSelect}
            value={data.logField}
          >
            <option>Select field</option>
            {
              fields?.map((f) => {
                return (
                  <option key={f} value={f}>{f}</option>
                )
              })
            }
          </select>
        </div>
        <div className='mb-2'>
          <label htmlFor="direction" className="block mb-1 text-sm font-medium text-gray-900">Direction</label>
          <select
            id="direction"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            onChange={onDirectionSelect}
            value={data.direction}
          >
            <option>Select Direction</option>
            {
              Object.keys(Direction).map((f) => {
                return (
                  <option key={f} value={f}>{f}</option>
                )
              })
            }
          </select>
        </div>

        <div className="mb-2 max-w-sm">
          <div className='flex flex-col'>
            <div className='mr-2'>
              <label htmlFor="logField" className="block mb-1 text-sm font-medium text-gray-900">Time Window (Seconds)</label>
              <input
                className='pl-4 w-full auto-expand-textarea p-1 text-md text-gray-900 bg-white border-0 dark:bg-gray-800 dark:text-white focus:ring-0 rounded-lg'
                type="number"
                value={durationSeconds}
                onChange={onDurationSecondsChange}
              />
            </div>
          </div>
        </div>

        <div className="mb-2 max-w-sm">
          <div className='flex flex-col'>
            <div className='mr-2'>
              <label htmlFor="logField" className="block mb-1 text-sm font-medium text-gray-900">Max Average Difference (% as decimal)</label>
              <input
                className='pl-4 w-full auto-expand-textarea p-1 text-md text-gray-900 bg-white border-0 dark:bg-gray-800 dark:text-white focus:ring-0 rounded-lg'
                type="number"
                value={maxDeviation}
                onChange={onMaxDeviationChange}
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
              {headerGroups.map(headerGroup => (
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

export default MovingAverageLogFilterNode
