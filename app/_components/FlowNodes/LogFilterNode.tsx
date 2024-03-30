import { useState } from 'react';
import { Handle, Position, NodeProps, Node, Edge, getIncomers } from 'reactflow';

import { LogRecord } from '@/app/_lib/log';
import { LogData, RefreshableNode } from '@/app/_components/FlowNodes';


export interface LogFilterData extends LogData, RefreshableNode { }
export type LogFiltereNodeType = Node<LogFilterData, "LogFilterNode">;

export function newLogFilter(): LogFilterData {
  return {
    logs: [],
    refresh: async function (node: Node, nodes: Node[], edges: Edge[]): Promise<void> {
      // this.logs = await loadLogs(node.data.selectedLogs);
      console.log('refreshed', node.id)
      const parents = getIncomers(node, nodes, edges)
      // TODO Other filter methods
      this.logs = parents[0].data.logs.map((l: LogRecord) => ({
        ...l,
        delete: l.delete || l.IPW == 0
      }))
    }
  }
}


function LogFilterNode({ data, isConnectable }: NodeProps<LogFilterData>) {
  const [expanded, setExpanded] = useState<boolean>(true)

  return (
    <div className="flex flex-col p-2 border border-black rounded">
      <Handle type="target" position={Position.Left} id="LogIn" isConnectable={isConnectable} />

      <div className='flex justify-between drag-handle'>
        <div className='pr-2'>Log Filter</div>
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>

      </div>
      {
        expanded
        && <div>
          EXPANDED LOGFILTERNODE
          {data.logs?.filter(l => !l.delete).length}
        </div>
      }
      <Handle type="source" position={Position.Right} id="LogOut" isConnectable={isConnectable} />
    </div>
  );
}

export default LogFilterNode