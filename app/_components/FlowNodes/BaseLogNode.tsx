import { useCallback, useState } from 'react';
import { Handle, Position, NodeProps, Node, Edge } from 'reactflow';

import useRom, { useRomSelector } from '@/app/store/useRom';
import { shallow } from "zustand/shallow";
import { LogRecord, loadLogs } from "@/app/_lib/log";

import { LogData, RefreshableNode } from '@/app/_components/FlowNodes';
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle';

export interface BaseLogData extends LogData, RefreshableNode {
  selectedLogs: FileSystemFileHandle[];
}

export const BaseLogType = "BaseLogNode"
export type BaseLogNodeType = Node<BaseLogData, typeof BaseLogType>;

export const BASE_LOG_NODE_ID = "SELECTED_LOGS_NODE"
export const INIT_BASE_LOG_NODE: BaseLogNodeType = {
  id: BASE_LOG_NODE_ID,
  type: "BaseLogNode",
  position: { x: 100, y: 100 },
  data: newBaseLog()
}

export function newBaseLog(): BaseLogData {
  return {
    selectedLogs: [],
    logs: [],
    refresh: async function (node: Node, nodes: Node[], edges: Edge[]): Promise<void> {
      this.logs = await loadLogs(node.data.selectedLogs);
    }
  }
}


function BaseLogNode({ data, isConnectable }: NodeProps<BaseLogData>) {
  const { selectedLogs } = data
  const [expanded, setExpanded] = useState<boolean>(true)

  return (
    <div className="flex flex-col p-2 border border-black rounded">
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
            selectedLogs.map(l => <div>{l.name}</div>)
          }
        </div>
      }
      <CustomHandle type="source" dataType='Log' position={Position.Right} id="LogOut" isConnectable={isConnectable} />
    </div>
  );
}

export default BaseLogNode