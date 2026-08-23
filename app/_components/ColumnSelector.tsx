'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import useLogColumns from '@/app/store/useLogColumns';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import { DEFAULT_LOG_FIELDS } from '@/app/_lib/log';
import { LogAlterNodeType, LogAlterType } from './FlowNodes/LogAlter/LogAlterTypes';
import { RunningLogAlterNodeType, RunningLogAlterType } from './FlowNodes/RunningLogAlter/RunningLogAlterTypes';

const flowSelector = (state: RFState) => ({
  nodes: state.nodes,
});

const columnSelector = (state: ReturnType<typeof useLogColumns.getState>) => ({
  knownColumns: state.knownColumns,
  columnVisibility: state.columnVisibility,
  toggleColumn: state.toggleColumn,
  moveColumn: state.moveColumn,
  selectAll: state.selectAll,
  deselectAll: state.deselectAll,
  resetToDefault: state.resetToDefault,
  registerDiscoveredColumns: state.registerDiscoveredColumns,
  isColumnVisible: state.isColumnVisible,
});

export const ColumnSelector: React.FC = () => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [filterText, setFilterText] = useState<string>('');
  const [draggedCol, setDraggedCol] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const {
    knownColumns,
    columnVisibility,
    toggleColumn,
    moveColumn,
    selectAll,
    deselectAll,
    resetToDefault,
    registerDiscoveredColumns,
  } = useLogColumns(columnSelector, shallow);

  const { nodes } = useFlow(flowSelector, shallow);

  // Proactively discover columns configured in active nodes on the canvas
  useEffect(() => {
    const discovered: string[] = [];
    for (const node of nodes) {
      if (node.type === LogAlterType) {
        const alterNode = node as LogAlterNodeType;
        if (alterNode.data?.newLogField?.trim()) {
          discovered.push(alterNode.data.newLogField.trim());
        }
      } else if (node.type === RunningLogAlterType) {
        const runningNode = node as RunningLogAlterNodeType;
        if (runningNode.data?.newFieldName?.trim()) {
          discovered.push(runningNode.data.newFieldName.trim());
        }
      }

      // Check if node data already contains loaded logs
      const nodeLogs = (node.data as any)?.logs;
      if (Array.isArray(nodeLogs) && nodeLogs.length > 0 && typeof nodeLogs[0] === 'object') {
        discovered.push(...Object.keys(nodeLogs[0]));
      }
    }

    if (discovered.length > 0) {
      registerDiscoveredColumns(discovered);
    }
  }, [nodes, registerDiscoveredColumns]);

  const defaultFieldSet = useMemo(() => new Set(DEFAULT_LOG_FIELDS), []);

  const filteredColumns = useMemo(() => {
    if (!filterText.trim()) return knownColumns;
    const lower = filterText.toLowerCase().trim();
    return knownColumns.filter((col) => col.toLowerCase().includes(lower));
  }, [knownColumns, filterText]);

  const visibleCount = useMemo(() => {
    return knownColumns.filter((col) => columnVisibility[col] !== false).length;
  }, [knownColumns, columnVisibility]);

  const handleSelectAll = useCallback(() => {
    selectAll();
  }, [selectAll]);

  const handleDeselectAll = useCallback(() => {
    deselectAll();
  }, [deselectAll]);

  const handleReset = useCallback(() => {
    resetToDefault();
  }, [resetToDefault]);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLLabelElement>, col: string) => {
      e.dataTransfer.setData('text/plain', col);
      e.dataTransfer.effectAllowed = 'move';
      setDraggedCol(col);
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLLabelElement>, col: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverCol !== col) {
        setDragOverCol(col);
      }
    },
    [dragOverCol]
  );

  const handleDragLeave = useCallback(
    (col: string) => {
      if (dragOverCol === col) {
        setDragOverCol(null);
      }
    },
    [dragOverCol]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>, targetCol: string) => {
      e.preventDefault();
      const sourceCol = e.dataTransfer.getData('text/plain') || draggedCol;
      if (sourceCol && sourceCol !== targetCol) {
        moveColumn(sourceCol, targetCol);
      }
      setDraggedCol(null);
      setDragOverCol(null);
    },
    [draggedCol, moveColumn]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedCol(null);
    setDragOverCol(null);
  }, []);

  return (
    <div className="border-t-2 border-slate-400 bg-slate-100 text-slate-800 shadow-md select-none">
      {/* Top Bar / Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"
        onDoubleClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center w-6 h-6 rounded border border-slate-500 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700"
            title={expanded ? 'Collapse column selector' : 'Expand column selector'}
          >
            {expanded ? '▼' : '▲'}
          </button>
          <span className="font-bold text-sm text-slate-800">
            Log Table Columns
          </span>
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-300 text-slate-800">
            {visibleCount} / {knownColumns.length} visible
          </span>
          <span className="text-xs text-slate-500 hidden md:inline">
            (Drag options to reorder table columns)
          </span>
        </div>

        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            placeholder="Search columns..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="px-2 py-1 text-xs rounded border border-slate-400 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-48"
          />

          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2 py-1 text-xs font-medium rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            All
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="px-2 py-1 text-xs font-medium rounded bg-slate-500 hover:bg-slate-600 text-white transition-colors"
          >
            None
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-2 py-1 text-xs font-medium rounded bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            title="Reset to default columns and order"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Expanded Body: Checkbox Grid with Drag & Drop */}
      {expanded && (
        <div className="p-3 bg-slate-50 max-h-64 overflow-y-auto border-t border-slate-300">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {filteredColumns.map((col) => {
              const isChecked = columnVisibility[col] !== false;
              const isCustom = !defaultFieldSet.has(col);
              const isDragging = draggedCol === col;
              const isDragOver = dragOverCol === col;

              return (
                <label
                  key={col}
                  htmlFor={`col-checkbox-${col}`}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, col)}
                  onDragOver={(e) => handleDragOver(e, col)}
                  onDragLeave={() => handleDragLeave(col)}
                  onDrop={(e) => handleDrop(e, col)}
                  onDragEnd={handleDragEnd}
                  title={`Drag to reorder "${col}" in tables, or click checkbox to toggle visibility`}
                  className={`flex items-center space-x-1.5 p-1.5 rounded border text-xs cursor-grab active:cursor-grabbing transition-all ${
                    isDragging
                      ? 'opacity-40 border-dashed border-blue-500 scale-95'
                      : isDragOver
                      ? 'border-blue-500 ring-2 ring-blue-400 bg-blue-100 scale-105 shadow-sm'
                      : isChecked
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-medium hover:border-blue-400'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {/* Grip drag handle icon */}
                  <span
                    className="text-slate-400 hover:text-slate-600 flex-shrink-0 cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                  >
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 16 16">
                      <circle cx="5" cy="3" r="1.5" />
                      <circle cx="11" cy="3" r="1.5" />
                      <circle cx="5" cy="8" r="1.5" />
                      <circle cx="11" cy="8" r="1.5" />
                      <circle cx="5" cy="13" r="1.5" />
                      <circle cx="11" cy="13" r="1.5" />
                    </svg>
                  </span>

                  <input
                    id={`col-checkbox-${col}`}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleColumn(col)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="truncate flex-1" title={col}>
                    {col}
                  </span>
                  {isCustom && (
                    <span
                      className="px-1 py-0.2 text-[10px] uppercase font-bold rounded bg-amber-200 text-amber-900 flex-shrink-0"
                      title="Custom / Altered column"
                    >
                      New
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          {filteredColumns.length === 0 && (
            <div className="text-center py-4 text-xs text-slate-500 italic">
              No columns match &quot;{filterText}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ColumnSelector;
