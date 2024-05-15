'use client'
import { useMemo, useState } from 'react';
import { Position, NodeProps, Node, Edge } from 'reactflow';

import { LogData, TableData } from '@/app/_components/FlowNodes';
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { getParentsByHandleIds } from '@/app/_lib/react-flow-utils';
import { FillTableFromLog, duplicateTable } from '@/app/_lib/rom';
import ModuleUI from '@/app/_components/Module';
import { FillLogTableData, sourceLogHandleId, sourceTableHandleId } from '@/app/_components/FlowNodes/FillLogTable/FillLogTableTypes';

export function newFillLogTable(): FillLogTableData {
  return {
    table: null,
    // tableType: LogTableDataType,
    refresh: async function (node: Node, nodes: Node[], edges: Edge[]): Promise<void> {
      const parentNodes = getParentsByHandleIds<[Node<TableData<string | number>>, Node<LogData>]>(node, nodes, edges, [sourceTableHandleId, sourceLogHandleId])
      if (!parentNodes) {
        this.table = null
        return console.log("One or more parents are missing")
      }
      const [parentTable, parentLog] = parentNodes

      const { table } = parentTable.data
      if (!table) return console.log("table is missing from parent")
      const logs = parentLog.data.logs

      const newTable = FillTableFromLog(table, logs)
      if (!newTable) return console.log("FillTableFromLog failed while NewFillLogTable.refresh")
      this.table = newTable
    },
    getLoadable: () => ({})
  }
}

function FillLogTableNode({ data, isConnectable }: NodeProps<FillLogTableData>) {
  const [expanded, setExpanded] = useState<boolean>(false)

  const table = useMemo(() => {
    const { table } = data
    if (!table) return console.log("FillLogTableNode table missing from data prop")

    const recordCountTable = duplicateTable(table, (c) => c.length)
    if (!recordCountTable) return console.log("FillLogTableNode failed to duplicatTable")
    return recordCountTable
  }, [data])

  // if (!table) return <div>Loading Table</div>
  return (
    <div className="flex flex-col p-2 border border-black rounded">
      <CustomHandle dataType='Log' type="target" position={Position.Left} id={sourceLogHandleId} top="20px" isConnectable={isConnectable} />
      <CustomHandle dataType='3D' type="target" position={Position.Left} id={sourceTableHandleId} top="60px" isConnectable={isConnectable} />

      <div
        className='flex justify-between drag-handle'
        onDoubleClick={() => setExpanded(!expanded)}
      >
        <div className='pr-2'>Log Table Filler - {data.table?.name}</div>
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>

      </div>
      {!!table
        && <div>
          {
            expanded
            && <ModuleUI
              module={{ type: 'base', table }}
            />
          }
        </div>
      }

      <CustomHandle dataType='3D' type="source" position={Position.Right} id="TableOut" top="60px" isConnectable={isConnectable} />
    </div>
  );
}

export default FillLogTableNode
