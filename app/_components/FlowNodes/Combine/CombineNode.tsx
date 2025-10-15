'use client'
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Position, NodeProps, useUpdateNodeInternals } from 'reactflow';

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import RomModuleUI from '@/app/_components/RomModuleUI';
import { CombineData, CombineNodeType, CombineType, targetTableOneHandleID, targetTableTwoHandleID } from '@/app/_components/FlowNodes/Combine/CombineTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import { Scaling } from '@/app/_lib/rom-metadata';

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode,
  softUpdateNode: state.softUpdateNode
});
function CombineNode({ id, data, isConnectable }: NodeProps<CombineData>) {
  const childRef = useRef<HTMLTextAreaElement>(null)
  const { nodes, updateNode, softUpdateNode } = useFlow(selector, shallow);

  const [funcVal, setFuncVal] = useState(data.func)

  const [expanded, setExpanded] = useState<boolean>(false)

  const node: CombineNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == CombineType) {
        return n
      }
    }
  }, [id, nodes])


  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    if (data.tableType && data.tableType != "Other") {
      updateNodeInternals(id)
    }
  }, [id, data.tableType, updateNodeInternals])

  const onFuncChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!node) return
    setFuncVal(event.target.value)
    updateNode({
      ...node,
      data: node.data.clone({
        func: event.target.value
      })
    })
  }, [node, updateNode])

  const setScalingValue = useCallback((scalingValue: Scaling | undefined | null) => {
    if (!node) return
    softUpdateNode({
      ...node,
      data: node.data.clone({
        scalingValue: scalingValue
      })
    })
  }, [node, softUpdateNode])

  return (
    <div className={`flex flex-col p-2 border border-black rounded bg-amber-400/75 ${data.loading && 'animate-pulse'}`}>
      <CustomHandle dataType='3D' type="target" position={Position.Left} id={targetTableOneHandleID} top="20px" isConnectable={isConnectable} />
      <CustomHandle dataType='3D' type="target" position={Position.Left} id={targetTableTwoHandleID} top="60px" isConnectable={isConnectable} />

      <div
        className='flex justify-between drag-handle'
        onDoubleClick={() => setExpanded(!expanded)}
      >
        <div className='pr-2'>Table Combiner - {data.table?.name}</div>
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>

      </div>
      <div>
        <div className="w-full">
          <textarea
            className='w-full auto-expand-textarea p-1 pb-4 text-md text-gray-900 bg-white border-0 dark:bg-gray-800 dark:text-white focus:ring-0 rounded-lg'
            value={funcVal}
            onChange={onFuncChange}
          />
        </div>
      </div>
      <div>
        {data.table
          && <div>
            {
              expanded
              && <RomModuleUI
                ref={childRef}
                table={data.table}
                scalingMap={data.scalingMap}
                scalingValue={data.scalingValue}
                setScalingValue={setScalingValue}
              />
            }
          </div>
        }
      </div>
      {
        data.tableType
        && <CustomHandle dataType={data.tableType} type="source" position={Position.Right} id="TableOut" isConnectable={isConnectable} />
      }
    </div>
  );
}

export default CombineNode