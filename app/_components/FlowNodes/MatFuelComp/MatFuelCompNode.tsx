'use client'

import { ChangeEvent, useCallback, useMemo, useRef, useState } from 'react';
import { Position, NodeProps } from 'reactflow';

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import RomModuleUI from '@/app/_components/RomModuleUI';
import {
  MatCompActiveView,
  MatFuelCompData,
  MatFuelCompNodeType,
  MatFuelCompType,
  sourceLogHandleId,
  sourceTableHandleId,
  targetTableHandleId,
} from '@/app/_components/FlowNodes/MatFuelComp/MatFuelCompTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import { Scaling, Table, Table3D } from '@/app/_lib/rom-metadata';
import InfoSVG from '../../../icons/info.svg';

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode,
});

function MatFuelCompNode({ id, data, isConnectable }: NodeProps<MatFuelCompData>) {
  const { nodes, updateNode } = useFlow(selector, shallow);
  const childRef = useRef<HTMLTextAreaElement>(null);
  const [expanded, setExpanded] = useState<boolean>(true);

  const node: MatFuelCompNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id === id && n.type === MatFuelCompType) {
        return n;
      }
    }
  }, [id, nodes]);

  const handleUpdate = useCallback(
    (config: Partial<MatFuelCompData>) => {
      if (!node) return;
      updateNode({ ...node, data: node.data.clone(config) });
    },
    [node, updateNode]
  );

  const setScalingValue = useCallback(
    (scalingValue: Scaling | undefined | null) => {
      handleUpdate({ scalingValue });
    },
    [handleUpdate]
  );

  const onRefTempChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const val = event.target.value;
      const refTemp = val === "auto" ? undefined : parseFloat(val);
      handleUpdate({ refTemp });
    },
    [handleUpdate]
  );

  const onMaxCorrectionChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const maxCorrectionRatio = parseFloat(event.target.value);
      handleUpdate({ maxCorrectionRatio });
    },
    [handleUpdate]
  );

  const onDampingToggle = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleUpdate({ enableDamping: event.target.checked });
    },
    [handleUpdate]
  );

  const onActiveViewChange = useCallback(
    (activeView: MatCompActiveView) => {
      handleUpdate({ activeView });
    },
    [handleUpdate]
  );

  const availableTemps = useMemo(() => {
    if (data.sourceTable && data.sourceTable.type === "3D") {
      const t3d = data.sourceTable as Table3D<number>;
      if (t3d.yAxis && Array.isArray(t3d.yAxis.values)) {
        return t3d.yAxis.values;
      }
    }
    return [14, 41, 68, 104, 140, 176, 212];
  }, [data.sourceTable]);

  const isFahrenheit = useMemo(() => {
    if (data.sourceTable && data.sourceTable.type === "3D") {
      const t3d = data.sourceTable as Table3D<number>;
      return t3d.yAxis?.scaling === "Temp" || (t3d.yAxis?.values?.some((v) => v > 100) ?? false);
    }
    return true;
  }, [data.sourceTable]);

  // Determine active table to display in RomModuleUI
  const displayTable = useMemo((): Table<number | string> | null => {
    if (data.activeView === "drift" && data.deltaPercentTable) {
      return data.deltaPercentTable;
    }
    if (data.activeView === "counts" && data.countTable) {
      return data.countTable;
    }
    return (data.correctedTable || data.table || data.sourceTable) as Table<number | string> | null;
  }, [data.activeView, data.deltaPercentTable, data.countTable, data.correctedTable, data.table, data.sourceTable]);

  const resolvedScaling: Scaling | null = useMemo(() => {
    if (data.scalingValue) return data.scalingValue;
    if (!displayTable) return null;
    if (typeof displayTable.scaling === "object" && displayTable.scaling !== null) {
      return displayTable.scaling as Scaling;
    }
    if (typeof displayTable.scaling === "string" && data.scalingMap) {
      return data.scalingMap[displayTable.scaling] || null;
    }
    return null;
  }, [data.scalingValue, displayTable, data.scalingMap]);

  const hasInputs = Boolean(data.sourceTable && data.logs && data.logs.length > 0);

  return (
    <div
      className={`flex flex-col p-3 border-2 border-slate-700 rounded-lg shadow-md nowheel bg-amber-50/95 min-w-[380px] ${
        data.loading ? 'animate-pulse' : ''
      }`}
    >
      {/* Input Handles */}
      <CustomHandle
        dataType="3D"
        type="target"
        position={Position.Left}
        id={sourceTableHandleId}
        isConnectable={isConnectable}
        top="35px"
        label="MAT Table"
      />
      <CustomHandle
        dataType="Log"
        type="target"
        position={Position.Left}
        id={sourceLogHandleId}
        isConnectable={isConnectable}
        top="75px"
        label="Logs"
      />

      {/* Output Handle: Always outputs the calibrated 3D table */}
      <CustomHandle
        dataType="3D"
        type="source"
        position={Position.Right}
        id={targetTableHandleId}
        isConnectable={isConnectable}
        top="35px"
        label="Corrected MAT"
      />

      {/* Header */}
      <div className="flex justify-between items-center drag-handle pb-2 border-b border-slate-300">
        <div className="pr-2 font-bold text-sm text-slate-900 flex items-center gap-1.5">
          <span>MAT Fuel Comp</span>
          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-400">
            Temp Invariance
          </span>
        </div>
        <div className="flex items-center">
          <div className="relative">
            <InfoSVG className="mx-2 anchor cursor-help" width={20} height={20} />
            <div className="tooltip">
              <div className="bg-white rounded-lg p-4 min-w-[500px] border-black border-2 font-normal text-xs text-gray-800 shadow-xl">
                <p className="text-base font-bold mb-1 text-slate-900">MAT Temperature Invariance Calibration</p>
                <p className="mb-2 text-slate-700">
                  Equalizes fueling across intake manifold air temperatures (MAT) so higher temperatures match the cooler base MAT calibration.
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-2 my-2 text-xs">
                  <p className="font-semibold text-amber-900">Core Principle:</p>
                  <p className="text-amber-800">
                    • <strong>Base MAT ({isFahrenheit ? "68°F / 20°C row" : "20°C row"})</strong> is the tuning anchor (multiplier locked at 1.0000).<br />
                    • <strong>Higher MAT rows ({isFahrenheit ? "104°F, 140°F" : "40°C, 60°C"}, etc.)</strong> are adjusted so their delivered AFR matches the cool baseline.<br />
                    • <strong>MAF &amp; MAP tables</strong> tune absolute fueling (<span className="font-mono">AFR → AFRMAP</span>).
                  </p>
                </div>
                <p className="font-semibold text-slate-900 mt-2">Safety Features:</p>
                <ul className="list-disc pl-5 text-slate-700 space-y-1">
                  <li><strong>Anchor Protection:</strong> Fueling at base reference temp ({isFahrenheit ? "68°F / 20°C" : "20°C"} baseline) is locked at 1.0000 (0% drift).</li>
                  <li><strong>Variety Gating:</strong> Requires logs with temperature spread ≥ 10°C (18°F) across ≥ 2 distinct bins before applying corrections.</li>
                  <li><strong>Confidence Damping:</strong> Uses Hill weighting to prevent low-sample cells from introducing spikes.</li>
                </ul>
              </div>
            </div>
          </div>
          <button
            className="border-2 border-black w-7 h-7 text-xs font-bold bg-white/80 rounded hover:bg-slate-200 flex items-center justify-center transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '_' : 'V'}
          </button>
        </div>
      </div>

      {/* Variety Gating Status Banner */}
      <div className="mt-2 text-xs">
        {!hasInputs ? (
          <div className="p-2 rounded bg-slate-200 text-slate-700 border border-slate-300">
            Connect 3D MAT Table &amp; Datalogs to begin analysis.
          </div>
        ) : data.sufficient ? (
          <div className="p-2 rounded bg-emerald-100 border border-emerald-400 text-emerald-900">
            <div className="font-bold flex items-center gap-1">
              <span>✓ Temperature Variety OK</span>
              <span className="text-[10px] font-normal px-1 rounded bg-emerald-200">PASS</span>
            </div>
            <div className="text-[11px] text-emerald-800 mt-0.5">
              Spread: <span className="font-semibold">{data.spread.toFixed(1)}°C / {(data.spread * 1.8).toFixed(1)}°F</span> (min {data.minTempSpread}°C) | Base MAT: <span className="font-semibold">{data.refTempUsed}{isFahrenheit ? "°F" : "°C"} ({isFahrenheit ? `${Math.round((data.refTempUsed - 32) / 1.8)}°C` : `${Math.round(data.refTempUsed * 1.8 + 32)}°F`})</span>
            </div>
          </div>
        ) : (
          <div className="p-2 rounded bg-rose-100 border border-rose-400 text-rose-900">
            <div className="font-bold flex items-center gap-1">
              <span>⚠ Calibration Gated (Single Temp / Low Variety)</span>
            </div>
            <div className="text-[11px] text-rose-800 mt-0.5">
              {data.reason || `Temperature spread ${data.spread.toFixed(1)}°C < ${data.minTempSpread}°C.`} Table locked at baseline to prevent curve distortion.
            </div>
          </div>
        )}
      </div>

      {/* Controls & Configuration */}
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="block font-medium text-slate-800 mb-1">Base MAT (Anchor):</label>
          <select
            className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono text-xs focus:ring-1 focus:ring-amber-500"
            value={data.refTemp === undefined ? "auto" : String(data.refTemp)}
            onChange={onRefTempChange}
          >
            <option value="auto">
              Auto ({isFahrenheit ? "68°F / 20°C Baseline" : "20°C Baseline"})
            </option>
            {availableTemps.map((temp) => {
              const tempF = isFahrenheit ? temp : Math.round(temp * 1.8 + 32);
              const tempC = isFahrenheit ? Math.round((temp - 32) / 1.8) : temp;
              let desc = "";
              if (isFahrenheit) {
                if (temp === 68) desc = "(Baseline / Cool Commute)";
                else if (temp === 104) desc = "(Warm Commute / Heat Soak)";
                else if (temp === 140) desc = "(High Heat Soak)";
                else if (temp === 41) desc = "(Cold Ambient)";
                else if (temp === 14) desc = "(Sub-Zero Winter Freeze)";
              } else {
                if (temp === 20) desc = "(Baseline / Cool Commute)";
                else if (temp === 40) desc = "(Warm Commute / Heat Soak)";
                else if (temp === 60) desc = "(High Heat Soak)";
                else if (temp === 5) desc = "(Cold Ambient)";
                else if (temp === -10) desc = "(Sub-Zero Winter Freeze)";
              }
              return (
                <option key={temp} value={temp}>
                  {tempF}°F / {tempC}°C {desc}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block font-medium text-slate-800 mb-1">Max Correction:</label>
          <select
            className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono text-xs focus:ring-1 focus:ring-amber-500"
            value={data.maxCorrectionRatio}
            onChange={onMaxCorrectionChange}
          >
            <option value={0.10}>±10% Clamp</option>
            <option value={0.15}>±15% Clamp (Default)</option>
            <option value={0.20}>±20% Clamp</option>
            <option value={0.25}>±25% Clamp</option>
          </select>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs pt-1 border-t border-slate-200">
        <label className="flex items-center gap-1.5 cursor-pointer text-slate-800">
          <input
            type="checkbox"
            className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
            checked={data.enableDamping}
            onChange={onDampingToggle}
          />
          <span>Confidence Damping</span>
        </label>
        <span className="text-[11px] text-slate-500">
          Min Samples: <span className="font-semibold text-slate-700">{data.minCellSamples}</span>
        </span>
      </div>

      {/* View Mode Tabs */}
      <div className="mt-3 flex rounded-md bg-slate-200 p-0.5 text-xs font-medium">
        <button
          className={`flex-1 py-1 rounded transition-colors text-center ${
            data.activeView === "corrected"
              ? "bg-white text-slate-900 shadow-sm font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => onActiveViewChange("corrected")}
        >
          Corrected Table
        </button>
        <button
          className={`flex-1 py-1 rounded transition-colors text-center ${
            data.activeView === "drift"
              ? "bg-white text-slate-900 shadow-sm font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => onActiveViewChange("drift")}
        >
          Temp AFR Drift %
        </button>
        <button
          className={`flex-1 py-1 rounded transition-colors text-center ${
            data.activeView === "counts"
              ? "bg-white text-slate-900 shadow-sm font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => onActiveViewChange("counts")}
        >
          Sample Counts
        </button>
      </div>

      {/* Render Active Table */}
      {expanded && displayTable && (
        <div className="mt-3 pt-2 border-t border-slate-300">
          <RomModuleUI
            ref={childRef}
            table={displayTable}
            tableName={displayTable.name || id}
            scalingMap={data.scalingMap}
            scalingValue={resolvedScaling}
            setScalingValue={setScalingValue}
            distributionData={null}
            records={null}
          />
        </div>
      )}
    </div>
  );
}

export default MatFuelCompNode;
