
'use client'
import { useMemo, useRef, useState } from 'react';
import { Position, NodeProps } from 'reactflow';

import { LogRecord } from '@/app/_lib/log';
import { Row, createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual'
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { TpsAfrDeleteData, TpsAfrDeleteSourceLogHandleId, TpsAfrDeleteTargetLogHandleId } from '@/app/_components/FlowNodes/TpsAfrDelete/TpsAfrDeleteTypes';


function TpsAfrDeleteNode({ data, isConnectable }: NodeProps<TpsAfrDeleteData>) {
  const [expanded, setExpanded] = useState<boolean>(false)
  const [showDeleted, setShowDeleted] = useState<boolean>(false)

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
    return data.logs.filter(l => showDeleted ? l.delete : !l.delete)
  }, [data.logs, showDeleted])

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
    </div>
  );
}

export default TpsAfrDeleteNode
