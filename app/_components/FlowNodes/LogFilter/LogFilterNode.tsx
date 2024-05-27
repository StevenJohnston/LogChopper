'use client'
import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react';
import { Position, NodeProps, Node, Edge } from 'reactflow';

import { LogRecord, filterLogs } from '@/app/_lib/log';
import { Row, createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual'
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { InitLogFilterData, LogFilterData, LogFilterSourceLogHandleId, LogFilterTargetLogHandleId, LogFilterType, LogFilterNodeType } from '@/app/_components/FlowNodes/LogFilter/LogFilterTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import { getParentsByHandleIds } from '@/app/_lib/react-flow-utils';
import { LogData } from '@/app/_components/FlowNodes';

export function newLogFilter({ func }: InitLogFilterData): LogFilterData {
  return {
    func,
    logs: [],
    refresh: async function (node: Node, nodes: Node[], edges: Edge[]): Promise<void> {
      const parentNodes = getParentsByHandleIds<[Node<LogData>]>(node, nodes, edges, [LogFilterTargetLogHandleId])
      if (!parentNodes) {
        this.logs = []
        return console.log("newLogFilter One or more parents are missing")
      }
      const [sourceLogNode] = parentNodes

      if (!this.func) return console.log("newLogFilter func missing")
      if (sourceLogNode.data.logs == null) return console.log("newLogFilter sourceLogNode missing logs")

      this.logs = filterLogs(sourceLogNode.data.logs, this.func)
    },

    getLoadable: function () {
      return {
        func: this.func
      }
    }
  }
}

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode
});

function LogFilterNode({ id, data, isConnectable }: NodeProps<LogFilterData>) {
  const [funcVal, setFuncVal] = useState(data.func || "")
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
    updateNode({ ...node, data: { ...node.data, func: event.target.value } })
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

export default LogFilterNode
