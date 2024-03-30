import { useState } from 'react';
import { Position, NodeProps, Node, Edge } from 'reactflow';

import { LogData, RefreshableNode, TableData } from '@/app/_components/FlowNodes';
import { Table } from '@/app/_lib/rom-metadata';
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle';
import { getParentsByHandleIds } from '@/app/_lib/react-flow-utils';
import { FillTableFromLog } from '@/app/_lib/rom';
import ModuleUI from '@/app/_components/Module';


export interface FillTableData extends TableData, RefreshableNode {
  table: Table | null
}

export const FillTableType = "FillTableNode";
export type FillTableNodeType = Node<FillTableData, typeof FillTableType>;
const sourceTableHandleId = "TableIn"
const sourceLogHandleId = "LogIn"
export const FillTableSources = [sourceTableHandleId, sourceLogHandleId]

export function newFillTable(): FillTableData {

  return {
    // logs: [],
    table: null,
    refresh: async function (node: Node, nodes: Node[], edges: Edge[]): Promise<void> {
      const parentNodes = getParentsByHandleIds<[Node<TableData>, Node<LogData>]>(node, nodes, edges, [sourceTableHandleId, sourceLogHandleId])
      if (!parentNodes) {
        this.table = null
        return console.log("One or more parents are missing")
      }
      const [parentTable, parentLog] = parentNodes

      const table = parentTable.data.table
      if (!table) return console.log("table is missing from parent")
      const logs = parentLog.data.logs

      this.table = FillTableFromLog(table, logs)
    }
  }
}


function FillTableNode({ data, isConnectable }: NodeProps<FillTableData>) {
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

export default FillTableNode