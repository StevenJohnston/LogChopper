'use client'
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Position, NodeProps, useUpdateNodeInternals } from 'reactflow';

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import RomModuleUI from '@/app/_components/RomModuleUI';
import { FillTableData, FillTableNodeType, FillTableType, sourceTableHandleId, targetTableHandleId } from '@/app/_components/FlowNodes/FillTable/FillTableTypes';
import { LogRecord } from '@/app/_lib/log';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import { Aggregator } from '@/app/_lib/consts';
import { Scaling } from '@/app/_lib/rom-metadata';

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode,
  softUpdateNode: state.softUpdateNode
});
function FillTableNode({ id, data, isConnectable }: NodeProps<FillTableData>) {
  const { nodes, updateNode, softUpdateNode } = useFlow(selector, shallow);
  const childRef = useRef<HTMLTextAreaElement>(null)

  const [expanded, setExpanded] = useState<boolean>(false)

  const node: FillTableNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == FillTableType) {
        return n
      }
    }
  }, [id, nodes])

  const onFieldSelect = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const logField = event.target.value as keyof LogRecord
    if (!node) return console.log('FillTableNode failed to find self node')
    updateNode({
      ...node,
      data: node.data.clone({
        ...node.data,
        logField
      })
    })
  }, [node, updateNode])

  const onAggregatorSelect = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const aggregator = event.target.value as Aggregator
    if (!node) return console.log('FillTableNode failed to find self node')
    updateNode({
      ...node,
      data: node.data.clone({
        ...node.data,
        aggregator
      })
    })
  }, [node, updateNode])

  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    if (data.tableType && data.tableType != "Other") {
      updateNodeInternals(id)
    }
  }, [id, data.tableType, updateNodeInternals])

  const fields: string[] | void = useMemo(() => {
    if (node?.data.sourceTable?.type != "3D") {
      return console.log("FillTableNode only handels 3d tables")
    }
    for (let y = 0; y < node.data.sourceTable.values.length; y++) {
      for (let x = 0; x < node.data.sourceTable.values[y].length; x++) {
        const logRecords = node.data.sourceTable.values[y][x]
        if (logRecords.length != 0)
          return Object.keys(logRecords[0])
      }
    }
  }, [node?.data.sourceTable])

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
    <div className={`flex flex-col p-2 border border-black rounded bg-cyan-400/75 ${data.loading && 'animate-pulse'}`}>
      {
        data.tableType
        && <CustomHandle dataType={data.tableType} type="target" position={Position.Left} id={sourceTableHandleId} top="20px" isConnectable={isConnectable} />
      }

      <div
        className='flex justify-between drag-handle'
        onDoubleClick={() => setExpanded(!expanded)}
      >
        <div className='pr-2'>Table Filler - {data.table?.name}</div>
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>

      </div>
      <div>
        <div className="max-w-sm">
          <div className='flex'>
            <div className='mr-2'>
              <label htmlFor="logField" className="block mb-2 text-sm font-medium text-gray-900">Fill log field</label>
              <select
                id="logField"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onChange={onFieldSelect}
                value={data.logField}
              >
                <option>Select field</option>
                {
                  fields?.map((f) => {
                    return (
                      <option key={f} value={f}>{f}</option>
                    )
                  })
                }
              </select>
            </div>
            <div>

              <label htmlFor="aggregator" className="block mb-2 text-sm font-medium text-gray-900">Aggregator</label>
              <select
                id="aggregator"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onChange={onAggregatorSelect}
                value={data.aggregator}
              >
                <option>Select aggregator</option>
                {
                  Object.keys(Aggregator).map((f) => {
                    return (
                      <option key={f} value={f}>{f}</option>
                    )
                  })
                }
              </select>
            </div>
          </div>
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
        && <CustomHandle dataType={data.tableType} type="source" position={Position.Right} id={targetTableHandleId} top="20px" isConnectable={isConnectable} />
      }

    </div>
  );
}

export default FillTableNode