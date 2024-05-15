'use client'

import { BaseLogData } from "@/app/_components/FlowNodes/BaseLog/BaseLogTypes";
import { CustomHandle } from "@/app/_components/FlowNodes/CustomHandle/CustomHandle";
import { loadLogs } from "@/app/_lib/log";
import { useState } from "react";
import { NodeProps, Node, Position } from "reactflow";

interface InitBaseLogData {
  selectedLogs?: FileSystemFileHandle[]
}

export function newBaseLogData({ selectedLogs }: InitBaseLogData): BaseLogData {
  return {
    selectedLogs: selectedLogs || [],
    logs: [],
    refresh: async function (node: Node): Promise<void> {
      this.logs = await loadLogs(node.data.selectedLogs);
    },
    getLoadable: () => ({})
  }
}


function BaseLogNode({ data, isConnectable }: NodeProps<BaseLogData>) {
  const { selectedLogs } = data
  const [expanded, setExpanded] = useState<boolean>(true)

  return (
    <div
      className={`flex flex-col p-2 border border-black rounded bg-white`}
      onDoubleClick={() => setExpanded(!expanded)}
    >
      <div className='flex justify-between drag-handle'>
        <div className='pr-2'>Selected Logs</div>
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>

      </div>
      {
        expanded
        && <div>
          {
            selectedLogs.map(l => <div key={`${l.kind}-${l.name}`}>{l.name}</div>)
          }
        </div>
      }
      <CustomHandle type="source" dataType='Log' position={Position.Right} id="LogOut" isConnectable={isConnectable} />
    </div>
  );
}

export default BaseLogNode