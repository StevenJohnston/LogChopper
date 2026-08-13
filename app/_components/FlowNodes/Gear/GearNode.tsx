'use client'
import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react';
import { Position, NodeProps } from 'reactflow';

import { LogRecord } from '@/app/_lib/log';
import { Row, createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { GearData, GearSourceLogHandleId, GearTargetLogHandleId, GearType, GearNodeType } from '@/app/_components/FlowNodes/Gear/GearTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode,
});

function GearNode({ id, data, isConnectable }: NodeProps<GearData>) {
  const [gear1Ratio, setGear1Ratio] = useState(data.gear1Ratio ?? 130);
  const [gear2Ratio, setGear2Ratio] = useState(data.gear2Ratio ?? 80);
  const [gear3Ratio, setGear3Ratio] = useState(data.gear3Ratio ?? 57);
  const [gear4Ratio, setGear4Ratio] = useState(data.gear4Ratio ?? 42);
  const [gear5Ratio, setGear5Ratio] = useState(data.gear5Ratio ?? 30);
  const [lookahead, setLookahead] = useState(data.lookahead ?? 20);

  const { nodes, updateNode } = useFlow(selector, shallow);
  const [expanded, setExpanded] = useState<boolean>(false);

  const columnHelper = createColumnHelper<LogRecord>();
  const columns = useMemo(() => {
    if (!data.logs) return [];
    return Object.keys(data.logs[0] || {}).map((c) => {
      return columnHelper.accessor(c, {
        cell: (info) => info.getValue(),
        footer: (info) => info.column.id,
      });
    });
  }, [data.logs, columnHelper]);

  const filteredLogs = useMemo(() => {
    if (!data.logs) return [];
    return data.logs.filter((l) => !l.delete);
  }, [data.logs]);

  const table = useReactTable({
    columns,
    data: filteredLogs,
    getCoreRowModel: getCoreRowModel(),
  });
  const { rows } = table.getRowModel();
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 33,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  const node: GearNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == GearType) {
        return n as GearNodeType;
      }
    }
  }, [id, nodes]);

  const onGearChange = useCallback(
    (gearNum: 1 | 2 | 3 | 4 | 5, val: number) => {
      if (!node) return;
      const key = `gear${gearNum}Ratio` as keyof GearData;
      updateNode({
        ...node,
        data: node.data.clone({ ...node.data, [key]: val }),
      });
    },
    [node, updateNode]
  );

  const onLookaheadChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!node) return;
      const val = parseInt(event.target.value, 10) || 16;
      setLookahead(val);
      updateNode({
        ...node,
        data: node.data.clone({ ...node.data, lookahead: val }),
      });
    },
    [node, updateNode]
  );

  return (
    <div
      className={`flex flex-col p-2 border border-black rounded nowheel bg-emerald-400/75 bg-opacity-50 ${
        data.loading && 'animate-pulse'
      }`}
    >
      <CustomHandle
        dataType="Log"
        type="target"
        position={Position.Left}
        id={GearTargetLogHandleId}
        isConnectable={isConnectable}
        top="20px"
      />
      <CustomHandle
        dataType="Log"
        type="source"
        position={Position.Right}
        id={GearSourceLogHandleId}
        isConnectable={isConnectable}
        top="20px"
      />

      <div
        onDoubleClick={() => setExpanded(!expanded)}
        className="flex justify-between drag-handle"
      >
        <div className="pr-2 font-semibold">Gear Calculator</div>
        <button
          className="border-2 border-black w-8 h-8"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '_' : '^'}
        </button>
      </div>

      <div className="mt-2 text-xs space-y-1">
        <div className="grid grid-cols-2 gap-1 max-w-xs">
          <div>
            <label className="block text-gray-900 font-medium">Gear 1 Ratio</label>
            <input
              className="w-full p-1 text-sm bg-white border rounded"
              type="number"
              value={gear1Ratio}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                setGear1Ratio(v);
                onGearChange(1, v);
              }}
            />
          </div>
          <div>
            <label className="block text-gray-900 font-medium">Gear 2 Ratio</label>
            <input
              className="w-full p-1 text-sm bg-white border rounded"
              type="number"
              value={gear2Ratio}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                setGear2Ratio(v);
                onGearChange(2, v);
              }}
            />
          </div>
          <div>
            <label className="block text-gray-900 font-medium">Gear 3 Ratio</label>
            <input
              className="w-full p-1 text-sm bg-white border rounded"
              type="number"
              value={gear3Ratio}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                setGear3Ratio(v);
                onGearChange(3, v);
              }}
            />
          </div>
          <div>
            <label className="block text-gray-900 font-medium">Gear 4 Ratio</label>
            <input
              className="w-full p-1 text-sm bg-white border rounded"
              type="number"
              value={gear4Ratio}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                setGear4Ratio(v);
                onGearChange(4, v);
              }}
            />
          </div>
          <div>
            <label className="block text-gray-900 font-medium">Gear 5 Ratio</label>
            <input
              className="w-full p-1 text-sm bg-white border rounded"
              type="number"
              value={gear5Ratio}
              onChange={(e) => {
                const v = parseFloat(e.target.value) || 0;
                setGear5Ratio(v);
                onGearChange(5, v);
              }}
            />
          </div>
          <div>
            <label className="block text-gray-900 font-medium">Lookahead</label>
            <input
              className="w-full p-1 text-sm bg-white border rounded"
              type="number"
              value={lookahead}
              onChange={onLookaheadChange}
            />
          </div>
        </div>
      </div>

      {expanded && (
        <div
          className="container mt-2 bg-white"
          ref={tableContainerRef}
          style={{
            overflow: 'auto',
            position: 'relative',
            height: '400px',
            border: '1px solid black',
          }}
        >
          <table style={{ display: 'grid' }}>
            <thead
              style={{
                display: 'grid',
                position: 'sticky',
                top: 0,
                zIndex: 1,
                background: '#f3f4f6',
              }}
            >
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} style={{ display: 'flex', width: '100%' }}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{
                        display: 'flex',
                        width: header.getSize(),
                        padding: '4px',
                        borderRight: '1px solid #e5e7eb',
                        borderBottom: '1px solid #e5e7eb',
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
                  ))}
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
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index] as Row<LogRecord>;
                return (
                  <tr
                    key={row.id}
                    style={{
                      display: 'flex',
                      position: 'absolute',
                      transform: `translateY(${virtualRow.start}px)`,
                      width: '100%',
                      borderBottom: '1px solid #e5e7eb',
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={{
                          display: 'flex',
                          width: cell.column.getSize(),
                          padding: '4px',
                          borderRight: '1px solid #e5e7eb',
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GearNode;
