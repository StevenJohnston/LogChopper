'use client'
import { Scaling, Table } from "../_lib/rom-metadata";
import { LogRecord } from "../_lib/log";
import TableUI from "./TableUI";
import Surface from "./Surface";
import { forwardRef, useState } from "react";
import DistributionChart from "./DistributionChart";
import LogTable from "./LogTable";

interface RomModuleUIProps {
  table: Table<string | number>
  tableName?: string
  scalingMap?: Record<string, Scaling> | null
  scalingValue?: Scaling | null
  setScalingValue?: (scalingValue: Scaling | undefined | null) => void
  distributionData?: number[] | null
  records?: LogRecord[] | null
}

const RomModuleUI = forwardRef<HTMLTextAreaElement, RomModuleUIProps>(({ table, tableName, scalingMap, scalingValue, setScalingValue, distributionData, records }, ref) => {
  const [showSurface, setShowSurface] = useState<boolean>(false)
  const [showRecords, setShowRecords] = useState<boolean>(false)

  const hasDistribution = Boolean(distributionData && distributionData.length > 0)
  const hasRecords = Boolean(records && records.length > 0)

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-start">
        <TableUI
          table={table}
          tableName={tableName || table.name || "unknown"}
          scalingValue={scalingValue}
          scalingMap={scalingMap}
          setScalingValue={setScalingValue}
          ref={ref}
        />
        {hasDistribution && (
          <div className="w-[500px] h-[350px] p-2 bg-white/70 rounded border border-gray-300 ml-2">
            <DistributionChart values={distributionData!} />
          </div>
        )}
        {!hasDistribution && showSurface && table.type == "3D" && (
          <div className="my-auto w-[500px] h-[400px] ml-2">
            <Surface table={table} />
          </div>
        )}
      </div>

      {hasRecords && (
        <div className="flex flex-col w-full mt-3">
          <div className="flex items-center justify-between py-1 px-2 bg-gray-100 rounded border border-gray-200">
            <span className="font-semibold text-xs text-gray-800">
              Cell Records ({records!.length})
            </span>
            <button
              type="button"
              onClick={() => setShowRecords(!showRecords)}
              className="text-xs px-2 py-0.5 bg-white hover:bg-gray-50 active:bg-gray-200 text-gray-700 border border-gray-300 rounded shadow-xs transition-colors font-medium"
            >
              {showRecords ? "Hide Records Table" : "Show Records Table"}
            </button>
          </div>
          {showRecords && (
            <LogTable
              logs={records!}
              height="300px"
              className="nodrag nowheel"
            />
          )}
        </div>
      )}

      {table.type == "3D" && !hasDistribution && (
        <button
          className="border-2 border-black w-8 h-8 mt-1 self-end"
          onClick={() => setShowSurface(!showSurface)}
        >
          {showSurface ? "<" : ">"}
        </button>
      )}
    </div>
  );
})

RomModuleUI.displayName = "RomModuleUI"

export default RomModuleUI;