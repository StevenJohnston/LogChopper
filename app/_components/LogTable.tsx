'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { LogRecord } from '@/app/_lib/log';
import {
  Row,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import useLogColumns from '@/app/store/useLogColumns';
import { shallow } from 'zustand/shallow';

export interface LogTableProps {
  logs?: LogRecord[];
  height?: string;
  className?: string;
}

const columnStoreSelector = (state: ReturnType<typeof useLogColumns.getState>) => ({
  knownColumns: state.knownColumns,
  columnVisibility: state.columnVisibility,
  registerDiscoveredColumns: state.registerDiscoveredColumns,
  isColumnVisible: state.isColumnVisible,
});

const GROUP_BG_COLORS = [
  'rgba(239, 246, 255, 0.85)', // Soft Sky Blue (blue-50)
  'rgba(236, 253, 245, 0.85)', // Soft Emerald (emerald-50)
  'rgba(254, 243, 199, 0.85)', // Soft Amber (amber-50)
  'rgba(250, 245, 255, 0.85)', // Soft Lavender (purple-50)
  'rgba(255, 241, 242, 0.85)', // Soft Rose (rose-50)
  'rgba(240, 253, 250, 0.85)', // Soft Teal (teal-50)
];

export const LogTable: React.FC<LogTableProps> = ({
  logs,
  height = '400px',
  className = '',
}) => {
  const { knownColumns, columnVisibility, registerDiscoveredColumns } = useLogColumns(
    columnStoreSelector,
    shallow
  );

  const rawKeys = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    return Object.keys(logs[0] || {});
  }, [logs]);

  // Proactively register all discovered keys into the column store
  useEffect(() => {
    if (rawKeys.length > 0) {
      registerDiscoveredColumns(rawKeys);
    }
  }, [rawKeys, registerDiscoveredColumns]);

  const columnHelper = useMemo(() => createColumnHelper<LogRecord>(), []);

  const columns = useMemo(() => {
    if (rawKeys.length === 0) return [];

    const visibleKeys = rawKeys.filter((key) => columnVisibility[key] !== false);

    // Sort visible columns according to user defined knownColumns order
    const keyIndexMap = new Map<string, number>();
    knownColumns.forEach((col, idx) => keyIndexMap.set(col, idx));

    const sortedVisibleKeys = [...visibleKeys].sort((a, b) => {
      const idxA = keyIndexMap.has(a) ? keyIndexMap.get(a)! : 9999;
      const idxB = keyIndexMap.has(b) ? keyIndexMap.get(b)! : 9999;
      return idxA - idxB;
    });

    return sortedVisibleKeys.map((c) => {
      return columnHelper.accessor(c, {
        cell: (info) => {
          const val = info.getValue();
          if (typeof val === 'number') {
            return Number.isInteger(val) ? val : val.toFixed(2);
          }
          if (typeof val === 'boolean') {
            return val ? 'true' : 'false';
          }
          return val ?? '';
        },
        header: () => c,
        footer: (info) => info.column.id,
      });
    });
  }, [rawKeys, columnVisibility, knownColumns, columnHelper]);

  const tableData = useMemo(() => logs || [], [logs]);

  // Group consecutive records so gaps (e.g. from deleted rows) are clearly visible by background tint
  const groupIndices = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];
    const groups: number[] = new Array(tableData.length);
    let currentGroup = 0;
    groups[0] = currentGroup;

    for (let i = 1; i < tableData.length; i++) {
      const prev = tableData[i - 1];
      const curr = tableData[i];

      let isConsecutive = true;

      if (prev.LogID !== undefined && curr.LogID !== undefined) {
        isConsecutive = Number(curr.LogID) === Number(prev.LogID) + 1;
      } else if (prev.LogEntrySeconds !== undefined && curr.LogEntrySeconds !== undefined) {
        isConsecutive = Math.abs(Number(curr.LogEntrySeconds) - Number(prev.LogEntrySeconds)) <= 0.3;
      }

      if (!isConsecutive) {
        currentGroup++;
      }
      groups[i] = currentGroup;
    }

    return groups;
  }, [tableData]);

  const table = useReactTable({
    columns,
    data: tableData,
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

  if (!logs || logs.length === 0) {
    return <div className="p-2 text-sm text-gray-500 italic">No log entries</div>;
  }

  if (columns.length === 0) {
    return (
      <div className="p-3 text-sm bg-yellow-50 text-amber-800 border border-amber-200 rounded mt-2">
        No columns currently selected for display. Enable columns in the Column Selector toolbar at the bottom.
      </div>
    );
  }

  return (
    <div
      className={`container mt-2 bg-white log-table-container ${className}`}
      ref={tableContainerRef}
      style={{
        overflow: 'auto',
        position: 'relative',
        height,
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
              {headerGroup.headers.map((header) => {
                return (
                  <th
                    key={header.id}
                    style={{
                      display: 'flex',
                      width: header.getSize(),
                      padding: '4px',
                      borderRight: '1px solid #e5e7eb',
                      borderBottom: '1px solid #e5e7eb',
                      whiteSpace: 'nowrap',
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
                );
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
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index] as Row<LogRecord>;
            const groupIndex = groupIndices[virtualRow.index] ?? 0;
            const isGroupStart =
              virtualRow.index > 0 &&
              groupIndex !== (groupIndices[virtualRow.index - 1] ?? 0);
            const rowBg = GROUP_BG_COLORS[groupIndex % GROUP_BG_COLORS.length];

            return (
              <tr
                data-index={virtualRow.index}
                key={row.id}
                style={{
                  display: 'flex',
                  position: 'absolute',
                  transform: `translateY(${virtualRow.start}px)`,
                  width: '100%',
                  backgroundColor: rowBg,
                  borderBottom: '1px solid #e5e7eb',
                  borderTop: isGroupStart ? '2px solid #64748b' : undefined,
                }}
                className="hover:brightness-95 transition-colors"
              >
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td
                      key={cell.id}
                      style={{
                        display: 'flex',
                        width: cell.column.getSize(),
                        padding: '4px',
                        borderRight: '1px solid #e5e7eb',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LogTable;
