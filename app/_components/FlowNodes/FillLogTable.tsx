import { useState } from 'react';
import { Position, NodeProps, Node, Edge } from 'reactflow';

import { BasicTableDataType, LogData, LogTableData, LogTableDataType, RefreshableNode, TableData } from '@/app/_components/FlowNodes';
import { LogTable } from '@/app/_lib/rom-metadata';
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle';
import { getParentsByHandleIds } from '@/app/_lib/react-flow-utils';
import { FillTableFromLog } from '@/app/_lib/rom';
import ModuleUI from '@/app/_components/Module';


export interface FillLogTableData extends LogTableData, RefreshableNode {
  table: LogTable | null
}

export const FillLogTableType = "FillLogTableNode";
export type FillLogTableNodeType = Node<FillLogTableData, typeof FillLogTableType>;
const sourceTableHandleId = "TableIn"
const sourceLogHandleId = "LogIn"
export const FillLogTableSources = [sourceTableHandleId, sourceLogHandleId]

export function newFillLogTable(): FillLogTableData {
  return {
    table: null,
    tableType: LogTableDataType,
    refresh: async function (node: Node, nodes: Node[], edges: Edge[]): Promise<void> {
      const parentNodes = getParentsByHandleIds<[Node<TableData>, Node<LogData>]>(node, nodes, edges, [sourceTableHandleId, sourceLogHandleId])
      if (!parentNodes) {
        this.table = null
        return console.log("One or more parents are missing")
      }
      const [parentTable, parentLog] = parentNodes

      const { table, tableType } = parentTable.data
      if (!table) return console.log("table is missing from parent")
      if (tableType !== BasicTableDataType) return console.log(`FillLogTable source table is not of type '${BasicTableDataType}'`)
      const logs = parentLog.data.logs

      const newTable = FillTableFromLog(table, logs)
      if (!newTable) return console.log("FillTableFromLog failed while NewFillLogTable.refresh")
      this.table = newTable
    }
  }
}


function FillLogTableNode({ data, isConnectable }: NodeProps<FillLogTableData>) {
  const [expanded, setExpanded] = useState<boolean>(true)
  // if (!data.table) {
  //   return (
  //     <div>//TODO should this be something else</div>
  //   )
  // }
  // if (!data.table) {
  //   return (
  //     <div>//TODO should this be something else</div>
  //   )
  // }
  return (
    <div className="flex flex-col p-2 border border-black rounded">
      <CustomHandle dataType='Log' type="target" position={Position.Left} id={sourceLogHandleId} top="20px" isConnectable={isConnectable} />
      <CustomHandle dataType='3D' type="target" position={Position.Left} id={sourceTableHandleId} top="60px" isConnectable={isConnectable} />

      <div className='flex justify-between drag-handle'>
        <div className='pr-2'>Table Filler</div>
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>
        {data.table
          && <div>
            {
              expanded
              && <ModuleUI
                module={{ type: 'base', table: data.table }}
              />
            }
          </div>
        }
      </div>
    </div>
  );
}

export default FillLogTableNode