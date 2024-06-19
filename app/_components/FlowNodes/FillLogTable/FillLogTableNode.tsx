'use client'
import { ChangeEvent, useCallback, useMemo, useState } from 'react';
import { Position, NodeProps } from 'reactflow';

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { duplicateTable } from '@/app/_lib/rom';
import ModuleUI from '@/app/_components/Module';
import { FillLogTableData, FillLogTableNodeType, FillLogTableType, sourceLogHandleId, sourceTableHandleId } from '@/app/_components/FlowNodes/FillLogTable/FillLogTableTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';

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
    updateNode({
      ...node,
      data: node.data.clone({
        ...node.data,
        weighted: event.target.checked
      })
    })
  }, [node, updateNode])

  return (
    <div className={`flex flex-col p-2 border border-black rounded bg-violet-300/75 ${data.loading && 'animate-pulse'}`}>
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
            checked={data.weighted}
            onChange={onWeightedChanged}
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
