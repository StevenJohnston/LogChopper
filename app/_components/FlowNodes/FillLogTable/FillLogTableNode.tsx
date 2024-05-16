'use client'
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { Position, NodeProps, Node, Edge } from 'reactflow';

import { LogData, TableData } from '@/app/_components/FlowNodes';
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { getParentsByHandleIds } from '@/app/_lib/react-flow-utils';
import { FillTableFromLog, duplicateTable } from '@/app/_lib/rom';
import ModuleUI from '@/app/_components/Module';
import { FillLogTableData, FillLogTableNodeType, FillLogTableType, InitFillLogTableData, sourceLogHandleId, sourceTableHandleId } from '@/app/_components/FlowNodes/FillLogTable/FillLogTableTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';

export function newFillLogTable({ weighted }: InitFillLogTableData): FillLogTableData {
  return {
    table: null,
    weighted,
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

      const newTable = FillTableFromLog(table, logs, this.weighted)
      if (!newTable) return console.log("FillTableFromLog failed while NewFillLogTable.refresh")
      this.table = newTable
    },
    getLoadable: function () {
      return {
        weighted: this.weighted
      }
    }
  }
}

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode
});
function FillLogTableNode({ id, data, isConnectable }: NodeProps<FillLogTableData>) {
  const [expanded, setExpanded] = useState<boolean>(false)
  const { nodes, updateNode } = useFlow(selector, shallow);

  const table = useMemo(() => {
    const { table } = data
    if (!table) return console.log("FillLogTableNode table missing from data prop")

    const recordCountTable = duplicateTable(table, (c) => c.length)
    if (!recordCountTable) return console.log("FillLogTableNode failed to duplicatTable")
    return recordCountTable
  }, [data])


  const node: FillLogTableNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == FillLogTableType) {
        return n
      }
    }
  }, [id, nodes])

  const onWeightedChanged = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!node) return
    // setFuncVal(event.target.value)
    updateNode({ ...node, data: { ...node.data, weighted: event.target.checked } })
  }, [node, updateNode])

  // if (!table) return <div>Loading Table</div>
  return (
    <div className="flex flex-col p-2 border border-black rounded bg-orange-300">
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

      <div>
        <div className="max-w-sm">
          Weighted
          <input
            type='checkbox'
            className='m-2'
            // className={`focus:bg-transparent bg-inherit h-4 m-1`}
            checked={data.weighted}
            onChange={onWeightedChanged}
          // onBlur={onFuncChange}

          />
        </div>
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
