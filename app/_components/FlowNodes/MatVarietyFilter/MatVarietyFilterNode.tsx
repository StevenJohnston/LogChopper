'use client'
import { useCallback, useMemo, useState } from 'react';
import { Position, NodeProps } from 'reactflow';

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import {
  MatVarietyFilterData,
  MatVarietyFilterSourceLogHandleId,
  MatVarietyFilterTargetLogHandleId,
  MatVarietyFilterType,
  MatVarietyFilterNodeType,
} from '@/app/_components/FlowNodes/MatVarietyFilter/MatVarietyFilterTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import InfoSVG from '../../../icons/info.svg';
import LogTable from '@/app/_components/LogTable';

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode,
});

function MatVarietyFilterNode({ id, data, isConnectable }: NodeProps<MatVarietyFilterData>) {
  const { nodes, updateNode } = useFlow(selector, shallow);
  const [expanded, setExpanded] = useState<boolean>(false);

  const filteredLogs = useMemo(() => {
    if (!data.logs) return [];
    return data.logs.filter((l) => !l.delete);
  }, [data.logs]);

  const node: MatVarietyFilterNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == MatVarietyFilterType) {
        return n;
      }
    }
  }, [id, nodes]);

  const handleUpdate = useCallback(
    (config: Partial<MatVarietyFilterData>) => {
      if (!node) return;
      updateNode({ ...node, data: node.data.clone(config) });
    },
    [node, updateNode]
  );

  const res = data.varietyResult;
  const isSufficient = res?.sufficient ?? false;

  return (
    <div
      className={`flex flex-col p-2 border border-black rounded nowheel bg-cyan-400/80 bg-opacity-60 ${
        data.loading && 'animate-pulse'
      }`}
    >
      <CustomHandle
        dataType="Log"
        type="target"
        position={Position.Left}
        id={MatVarietyFilterTargetLogHandleId}
        isConnectable={isConnectable}
        top="20px"
      />
      <CustomHandle
        dataType="Log"
        type="source"
        position={Position.Right}
        id={MatVarietyFilterSourceLogHandleId}
        isConnectable={isConnectable}
        top="20px"
      />

      <div className="flex justify-between items-center drag-handle">
        <div className="pr-2 font-bold text-sm">MAT Variety Filter</div>
        <div className="flex items-center">
          <div className="relative">
            <InfoSVG className="mx-2 anchor" width={20} height={20} />
            <div className="tooltip">
              <div className="bg-white rounded-lg p-4 min-w-[500px] border-black border-2 font-normal text-xs text-gray-800">
                <p className="text-base font-bold mb-1">MAT Temperature Variety Check</p>
                <p className="mb-2">
                  Ensures datalogs contain a broad temperature spread before allowing MAT Fuel Compensation updates.
                </p>
                <p className="font-semibold">Safety Rule:</p>
                <p className="pl-2">
                  Tuning MAT compensation without wide temperature variety causes single-temperature overfitting,
                  which corrupts baseline fuel curves at untested ambient temperatures.
                </p>
                <p className="mt-2 text-gray-600">
                  Blocks downstream calibration if temperature spread &lt; threshold or distinct bins &lt; required.
                </p>
              </div>
            </div>
          </div>
          <button
            className="border-2 border-black w-7 h-7 text-xs font-bold bg-white/80 rounded"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '_' : 'V'}
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className="mt-2">
        {res ? (
          isSufficient ? (
            <div className="p-1.5 bg-emerald-100 border border-emerald-500 rounded text-emerald-900 text-xs">
              <div className="font-bold">✓ Variety Verified</div>
              <div>
                MAT: {res.minMat.toFixed(1)}°C to {res.maxMat.toFixed(1)}°C (Spread: {res.spread.toFixed(1)}°C across {res.activeBinsCount} bins)
              </div>
            </div>
          ) : (
            <div className="p-1.5 bg-rose-100 border border-rose-500 rounded text-rose-900 text-xs">
              <div className="font-bold">⚠️ Insufficient Variety</div>
              <div>{res.reason || `MAT spread ${res.spread.toFixed(1)}°C < ${data.minTempSpread}°C.`}</div>
              <div className="font-semibold text-rose-700 mt-0.5">Corrections blocked.</div>
            </div>
          )
        ) : (
          <div className="p-1.5 bg-amber-100 border border-amber-400 rounded text-amber-900 text-xs">
            Connect log source to evaluate MAT temperature variety.
          </div>
        )}
      </div>

      {/* Threshold Controls */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <label className="block mb-1 text-[11px] font-medium text-gray-900">
            Min Temp Spread (°C)
          </label>
          <input
            className="w-full p-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:ring-blue-500"
            type="number"
            step="1"
            value={data.minTempSpread}
            onChange={(e) =>
              handleUpdate({ minTempSpread: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
        <div>
          <label className="block mb-1 text-[11px] font-medium text-gray-900">
            Min Distinct Bins
          </label>
          <input
            className="w-full p-1 text-xs text-gray-900 bg-white border border-gray-300 rounded focus:ring-blue-500"
            type="number"
            step="1"
            value={data.minDistinctBins}
            onChange={(e) =>
              handleUpdate({ minDistinctBins: parseInt(e.target.value, 10) || 1 })
            }
          />
        </div>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-2">
          {res && res.binSummary.length > 0 && (
            <div className="bg-white/90 p-2 rounded border border-gray-300 text-xs">
              <div className="font-bold mb-1">Temperature Bin Distribution:</div>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                {res.binSummary.map((b) => (
                  <div
                    key={b.binStart}
                    className={`p-1 rounded ${
                      b.count >= data.minSamplesPerBin
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {b.binStart}°C - {b.binEnd}°C: <strong>{b.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.logs && (
            <div className="w-[500px]">
              <div className="text-xs font-semibold mb-1">
                Active Logs ({filteredLogs.length} / {data.logs.length})
              </div>
              <LogTable logs={data.logs} height="240px" className="nodrag nowheel" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MatVarietyFilterNode;
