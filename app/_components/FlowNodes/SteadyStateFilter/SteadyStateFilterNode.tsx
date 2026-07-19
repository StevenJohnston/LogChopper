'use client'
import { useCallback, useMemo, useRef, useState } from 'react';
import { Position, NodeProps } from 'reactflow';

import { LogRecord } from '@/app/_lib/log';
import { Row, createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual'
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { SteadyStateFilterData, SteadyStateFilterSourceLogHandleId, SteadyStateFilterTargetLogHandleId, SteadyStateFilterType, SteadyStateFilterNodeType } from '@/app/_components/FlowNodes/SteadyStateFilter/SteadyStateFilterTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import InfoSVG from '../../../icons/info.svg';
import Code from '@/app/_components/Code';

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode
});

function SteadyStateFilterNode({ id, data, isConnectable }: NodeProps<SteadyStateFilterData>) {
  const { nodes, updateNode } = useFlow(selector, shallow);
  const [expanded, setExpanded] = useState<boolean>(false)

  const columnHelper = createColumnHelper<LogRecord>()
  const columns = useMemo(() => {
    if (!data.logs || data.logs.length === 0) return []
    return Object.keys(data.logs[0] || {}).map(c => {
      return columnHelper.accessor(c, {
        cell: info => {
          const val = info.getValue()
          if (typeof val === 'number') return val.toFixed(2)
          return val
        },
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
  const tableContainerRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 33,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== 'undefined' &&
        navigator.userAgent.indexOf('Firefox') === -1
        ? element => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  })

  const node: SteadyStateFilterNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == SteadyStateFilterType) {
        return n
      }
    }
  }, [id, nodes])

  const handleUpdate = useCallback((config: Partial<SteadyStateFilterData>) => {
    if (!node) return
    updateNode({ ...node, data: node.data.clone(config) })
  }, [node, updateNode])

  return (
    <div className={`flex flex-col p-2 border border-black rounded nowheel bg-emerald-400/75 bg-opacity-50 ${data.loading && 'animate-pulse'}`}>
      <CustomHandle dataType="Log" type="target" position={Position.Left} id={SteadyStateFilterTargetLogHandleId} isConnectable={isConnectable} top='20px' />
      <CustomHandle dataType="Log" type="source" position={Position.Right} id={SteadyStateFilterSourceLogHandleId} isConnectable={isConnectable} top="20px" />

      <div className='flex justify-between items-center drag-handle'>
        <div className='pr-2 font-bold'>Steady State Filter</div>
        <div className='flex'>
          <div className=''>
            <InfoSVG className='mx-2 anchor' width={24} height={24} />
            <div className='tooltip'>
              <div className='bg-white rounded-lg p-4 min-w-[600px] border-black border-2 font-normal'>
                <p className='text-2xl'>Steady State Filter</p>
                <p className='pl-2 mb-2'>Filters out non-steady rows based on TPS and shifts AFR based on dynamic MAF lag.</p>
                <p className='text-lg'>Rules for non-steady rows:</p>
                <p className='pl-2'><Code>Off-Throttle</Code>: TPS below threshold</p>
                <p className='pl-2'><Code>Fluctuation</Code>: TPS fluctuates more than threshold within 1 second</p>
                <p className='pl-2'><Code>Deceleration</Code>: TPS drops more than buffer compared to 1 second ago</p>
                <p className='mt-2'>Creates columns <Code>Is_Steady</Code>, <Code>AFR_SHIFTED</Code>, and <Code>Calculated_Lag</Code>.</p>
              </div>
            </div>
          </div>
          <button className='border-2 border-black w-8 h-8' onClick={() => setExpanded(!expanded)}>
            {expanded ? "_" : "V"}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <label className="block mb-1 text-xs font-medium text-gray-900">MAF Points (g/s)</label>
          <input
            className='w-full p-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:ring-blue-500'
            type="text"
            value={data.mafPointsStr}
            onChange={(e) => handleUpdate({ mafPointsStr: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-medium text-gray-900">Lag Points (sec)</label>
          <input
            className='w-full p-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:ring-blue-500'
            type="text"
            value={data.lagPointsStr}
            onChange={(e) => handleUpdate({ lagPointsStr: e.target.value })}
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-medium text-gray-900">Off-Throttle TPS (%)</label>
          <input
            className='w-full p-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:ring-blue-500'
            type="number" step="0.1"
            value={data.offThrottleThreshold}
            onChange={(e) => handleUpdate({ offThrottleThreshold: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-medium text-gray-900">TPS Fluctuation (%)</label>
          <input
            className='w-full p-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:ring-blue-500'
            type="number" step="0.1"
            value={data.tpsFluctuationThreshold}
            onChange={(e) => handleUpdate({ tpsFluctuationThreshold: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-medium text-gray-900">Decel Buffer (%)</label>
          <input
            className='w-full p-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:ring-blue-500'
            type="number" step="0.1"
            value={data.decelBuffer}
            onChange={(e) => handleUpdate({ decelBuffer: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="flex items-center mt-4">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            checked={data.filterIpwZero}
            onChange={(e) => handleUpdate({ filterIpwZero: e.target.checked })}
          />
          <label className="ml-2 text-xs font-medium text-gray-900">Filter out IPW &lt;= 0</label>
        </div>
        <div className="flex items-center mt-4">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            checked={data.filterEctCold}
            onChange={(e) => handleUpdate({ filterEctCold: e.target.checked })}
          />
          <label className="ml-2 text-xs font-medium text-gray-900">Filter out ECT &lt; 80</label>
        </div>
      </div>

      {
        expanded
        && <div
          className="container mt-2 bg-white"
          ref={tableContainerRef}
          style={{
            overflow: 'auto',
            position: 'relative',
            height: '400px',
            border: '1px solid black'
          }}
        >
          <table style={{ display: 'grid' }}>
            <thead
              style={{
                display: 'grid',
                position: 'sticky',
                top: 0,
                zIndex: 1,
                background: '#f3f4f6'
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
                          padding: '4px',
                          borderRight: '1px solid #e5e7eb',
                          borderBottom: '1px solid #e5e7eb'
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
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const row = rows[virtualRow.index] as Row<LogRecord>
                return (
                  <tr
                    data-index={virtualRow.index}
                    key={row.id}
                    style={{
                      display: 'flex',
                      position: 'absolute',
                      transform: `translateY(${virtualRow.start}px)`,
                      width: '100%',
                      borderBottom: '1px solid #e5e7eb'
                    }}
                  >
                    {row.getVisibleCells().map(cell => {
                      return (
                        <td
                          key={cell.id}
                          style={{
                            display: 'flex',
                            width: cell.column.getSize(),
                            padding: '4px',
                            borderRight: '1px solid #e5e7eb'
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

export default SteadyStateFilterNode
