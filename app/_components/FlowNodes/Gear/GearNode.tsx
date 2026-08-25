'use client'
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { Position, NodeProps } from 'reactflow';

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { GearData, GearSourceLogHandleId, GearTargetLogHandleId, GearType, GearNodeType } from '@/app/_components/FlowNodes/Gear/GearTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import LogTable from '@/app/_components/LogTable';

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
  const [enableFilter, setEnableFilter] = useState(data.enableFilter ?? true);
  const [invertFilter, setInvertFilter] = useState(data.invertFilter ?? false);
  const [maxAccuracy, setMaxAccuracy] = useState(data.maxAccuracy ?? 5);
  const [filterWindowSeconds, setFilterWindowSeconds] = useState(data.filterWindowSeconds ?? 0.5);

  const { nodes, updateNode } = useFlow(selector, shallow);
  const [expanded, setExpanded] = useState<boolean>(false);

  const node: GearNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == GearType) {
        return n as GearNodeType;
      }
    }
  }, [id, nodes]);

  const handleUpdate = useCallback(
    (updates: Partial<GearData>) => {
      if (!node) return;
      updateNode({
        ...node,
        data: node.data.clone({ ...node.data, ...updates }),
      });
    },
    [node, updateNode]
  );

  const filteredLogs = useMemo(() => {
    if (!data.logs) return [];
    return data.logs.filter((l) => !l.delete);
  }, [data.logs]);

  const onGearChange = useCallback(
    (gearNum: 1 | 2 | 3 | 4 | 5, val: number) => {
      handleUpdate({ [`gear${gearNum}Ratio` as keyof GearData]: val });
    },
    [handleUpdate]
  );

  const onLookaheadChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(event.target.value, 10) || 16;
      setLookahead(val);
      handleUpdate({ lookahead: val });
    },
    [handleUpdate]
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

        <div className="border-t border-black/20 pt-2 mt-2 space-y-2 max-w-xs">
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`enableFilter-${id}`}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              checked={enableFilter}
              onChange={(e) => {
                const checked = e.target.checked;
                setEnableFilter(checked);
                handleUpdate({ enableFilter: checked });
              }}
            />
            <label htmlFor={`enableFilter-${id}`} className="ml-2 text-xs font-medium text-gray-900 cursor-pointer">
              Enable Gear Accuracy Filter
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id={`invertFilter-${id}`}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              checked={invertFilter}
              onChange={(e) => {
                const checked = e.target.checked;
                setInvertFilter(checked);
                handleUpdate({ invertFilter: checked });
              }}
            />
            <label htmlFor={`invertFilter-${id}`} className="ml-2 text-xs font-medium text-gray-900 cursor-pointer">
              Invert Filter
            </label>
          </div>

          <div className="grid grid-cols-2 gap-1">
            <div>
              <label className="block text-gray-900 font-medium">Max Accuracy (%)</label>
              <input
                className="w-full p-1 text-sm bg-white border rounded"
                type="number"
                step="0.5"
                min="0"
                value={maxAccuracy}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setMaxAccuracy(val);
                  handleUpdate({ maxAccuracy: val });
                }}
              />
            </div>
            <div>
              <label className="block text-gray-900 font-medium">
                Window: {filterWindowSeconds.toFixed(1)}s
              </label>
              <input
                className="w-full h-7 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={filterWindowSeconds}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setFilterWindowSeconds(val);
                  handleUpdate({ filterWindowSeconds: val });
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <LogTable logs={filteredLogs} />
      )}
    </div>
  );
}

export default GearNode;
