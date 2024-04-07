'use client'
import { useState } from 'react';
import { Position, NodeProps, Node, Edge } from 'reactflow';

import { LogData, TableData } from '@/app/_components/FlowNodes';
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { getParentsByHandleIds } from '@/app/_lib/react-flow-utils';
import { FillTableFromLog } from '@/app/_lib/rom';
import RomModuleUI from '@/app/_components/RomModuleUI';
import { FillTableData, sourceLogHandleId, sourceTableHandleId } from '@/app/_components/FlowNodes/FillTable/FillTableTypes';

export function newFillTable(): FillTableData {

  return {
    // logs: [],
    table: null,
    refresh: async function (node: Node, nodes: Node[], edges: Edge[]): Promise<void> {
      const parentNodes = getParentsByHandleIds<[Node<TableData<unknown>>, Node<LogData>]>(node, nodes, edges, [sourceTableHandleId, sourceLogHandleId])
      if (!parentNodes) {
        this.table = null
        return console.log("One or more parents are missing")
      }
      const [parentTable, parentLog] = parentNodes

      const table = parentTable.data.table
      if (!table) return console.log("table is missing from parent")
      const logs = parentLog.data.logs
      const filledTable = FillTableFromLog(table, logs)
      if (!filledTable) return console.log("failed to fill table for newFillTable")
      this.table = filledTable
    }
  }
}


function FillTableNode({ data, isConnectable }: NodeProps<FillTableData>) {
  const [expanded, setExpanded] = useState<boolean>(true)
  return (
    <div className="flex flex-col p-2 border border-black rounded">
      <CustomHandle dataType='Log' type="target" position={Position.Left} id={sourceLogHandleId} top="20px" isConnectable={isConnectable} />
      <CustomHandle dataType='3D' type="target" position={Position.Left} id={sourceTableHandleId} top="60px" isConnectable={isConnectable} />

      <div
        className='flex justify-between drag-handle'
        onDoubleClick={() => setExpanded(!expanded)}
      >
        <div className='pr-2'>Table Filler</div>
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>

      </div>
      <div>
        {data.table
          && <div>
            {
              expanded
              && <RomModuleUI
                table={data.table}
              />
            }
          </div>
        }
      </div>
    </div>
  );
}

export default FillTableNode