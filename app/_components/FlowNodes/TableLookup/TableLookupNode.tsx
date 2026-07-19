"use client";

import { memo, useEffect, useState } from "react";
import { NodeProps, Position } from "reactflow";

import useFlow, { RFState } from "@/app/store/useFlow";
import { shallow } from "zustand/shallow";
import { CustomHandle } from "../CustomHandle/CustomHandle";
import { LookupMode, TableLookupData } from "./TableLookupTypes";
import InfoSVG from "../../../icons/info.svg";
import Code from "@/app/_components/Code";

const selector = (state: RFState) => ({
  updateTableLookupNodeConfig: state.updateTableLookupNodeConfig,
});

function TableLookupNode({ id, data }: NodeProps<TableLookupData>) {
  data = new TableLookupData(data);
  const { updateTableLookupNodeConfig } = useFlow(selector, shallow);
  const [newColumnName, setNewColumnName] = useState(data.newColumnName || "");
  const [lookupMode, setLookupMode] = useState<LookupMode>(
    data.lookupMode || "value"
  );
  const [targetValueColumnName, setTargetValueColumnName] = useState(
    data.targetValueColumnName || ""
  );

  useEffect(() => {
    if (
      data.newColumnName !== newColumnName ||
      data.lookupMode !== lookupMode ||
      data.targetValueColumnName !== targetValueColumnName
    ) {
      updateTableLookupNodeConfig(id, {
        newColumnName,
        lookupMode,
        targetValueColumnName,
      });
    }
  }, [
    id,
    newColumnName,
    data.newColumnName,
    lookupMode,
    data.lookupMode,
    targetValueColumnName,
    data.targetValueColumnName,
    updateTableLookupNodeConfig,
  ]);

  return (
    <div className="flex flex-col p-2 border border-black rounded bg-blue-400/75">
      <div className="flex flex-row items-center justify-between drag-handle">
        <h1 className="text-lg font-bold">Table Lookup</h1>
        <InfoSVG className="mx-2 anchor" width={24} height={24} />
        <div className="tooltip">
          <div className="bg-white rounded-lg p-4 min-w-[600px] border-black border-2">
            <p className="text-2xl">Table Lookup</p>
            <p className="pl-2 mb-2">
              Looks up values from a 3D table and adds them to a log as a new
              column.
            </p>
            <p className="text-lg">Example: Add AFR values to a log</p>
            <p className="pl-2">
              <Code>Log</Code>: Contains RPM and MAP columns
            </p>
            <p className="pl-2 mb-2">
              <Code>Table</Code>: AFR table with RPM and MAP axes
            </p>
            <p className="text-2xl">Configuration</p>
            <p className="pl-2">
              <Code>New Column Name</Code>: The name of the new column to be
              added to the log.
            </p>
          </div>
        </div>
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <label htmlFor="lookup-mode">Lookup Mode</label>
        <select
          id="lookup-mode"
          value={lookupMode}
          onChange={(e) => setLookupMode(e.target.value as LookupMode)}
          className="nodrag"
        >
          <option value="value">Value</option>
          <option value="xAxis">X-Axis</option>
        </select>
        {lookupMode === "xAxis" && (
          <>
            <label htmlFor="target-value-column-name">
              Target Value Column Name
            </label>
            <input
              id="target-value-column-name"
              value={targetValueColumnName}
              onChange={(e) => setTargetValueColumnName(e.target.value)}
              className="nodrag"
            />
          </>
        )}
        <label htmlFor="new-column-name">New Column Name</label>
        <input
          id="new-column-name"
          value={newColumnName || ""}
          onChange={(e) => setNewColumnName(e.target.value)}
          className="nodrag"
        />
        <CustomHandle
          type="target"
          position={Position.Left}
          id="table"
          dataType="3D"
          top="40px"
        />
        <CustomHandle
          type="target"
          position={Position.Left}
          id="log"
          dataType="Log"
          top="80px"
        />
        <CustomHandle
          type="source"
          position={Position.Right}
          id="output"
          dataType="Log"
        />
      </div>
    </div>
  );
}

export default memo(TableLookupNode);
