'use client'
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Position, NodeProps, useUpdateNodeInternals } from 'reactflow';

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import RomModuleUI from '@/app/_components/RomModuleUI';
import { CombineAdvancedTableData, sourceHandleId, destHandleId, CombineAdvancedTableNodeType, CombineAdvancedTableType } from '@/app/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableTypes';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import { SourceField } from '@/app/_lib/rom';
import { Scaling } from '@/app/_lib/rom-metadata';


const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode,
  softUpdateNode: state.softUpdateNode
});

function CombineAdvancedNode({ id, data, isConnectable }: NodeProps<CombineAdvancedTableData>) {
  const childRef = useRef<HTMLTextAreaElement>(null)

  const { nodes, updateNode, softUpdateNode } = useFlow(selector, shallow);

  const [expanded, setExpanded] = useState<boolean>(false)

  const destOptionsMap = useMemo(() => {
    if (data.destTable?.type != "3D") return null
    if (!data.destTable.scaling) return null
    return [
      { 'name': data.destTable.xAxis.name, 'source': 'XAxis' },
      { 'name': data.destTable.yAxis.name, 'source': 'YAxis' },
      { 'name': data.destTable.scaling, 'source': 'Value' }
    ]
  }, [data.destTable])


  const node: CombineAdvancedTableNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == CombineAdvancedTableType) {
        return n
      }
    }
  }, [id, nodes])

  const onXMatch = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const source = event.target.value as SourceField
    const node = nodes.find(n => n.id == id) as CombineAdvancedTableNodeType
    if (!node) return console.log('FillTableNode onXMatch failed to find self node')
    updateNode({
      ...node,
      data: node.data.clone({
        matchCriteria: [...node.data.matchCriteria.filter((m) => m.sourceSourceField != "XAxis"), {
          sourceSourceField: "XAxis",
          destSourceField: source
        }]
      })
    })
  }, [id, nodes, updateNode])

  const onYMatch = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const source = event.target.value as SourceField
    const node = nodes.find(n => n.id == id) as CombineAdvancedTableNodeType
    if (!node) return console.log('FillTableNode onYMatch failed to find self node')
    updateNode({
      ...node,
      data: node.data.clone({
        matchCriteria: [...node.data.matchCriteria.filter((m) => m.sourceSourceField != "YAxis"), {
          sourceSourceField: "YAxis",
          destSourceField: source
        }]
      })
    })
  }, [id, nodes, updateNode])


  const updateNodeInternals = useUpdateNodeInternals()

  useEffect(() => {
    if (data.tableType && data.tableType != "Other") {
      updateNodeInternals(id)
    }
  }, [id, data.tableType, updateNodeInternals])


  const setScalingValue = useCallback((scalingValue: Scaling | undefined | null) => {
    if (!node) return
    softUpdateNode({
      ...node,
      data: node.data.clone({
        scalingValue: scalingValue
      })
    })
  }, [node, softUpdateNode])

  if (data.destTable?.type != "3D") {
    console.log(
      <div>Dest table not 3D</div>
    )
  }
  if (data.sourceTable?.type != "3D") {
    console.log(
      <div>Source table not 3D</div>
    )
  }

  if (!destOptionsMap) {
    console.log(
      <div>destOptionMap missing - source table is likely missing scalling information in xml</div>
    )
  }

  return (
    <div className={`flex flex-col p-2 border border-black rounded bg-rose-400/75 ${data.loading && 'animate-pulse'}`}>
      <CustomHandle dataType='3D' type="target" position={Position.Left} id={destHandleId} top="20px" isConnectable={isConnectable} />
      <CustomHandle dataType='3D' type="target" position={Position.Left} id={sourceHandleId} top="60px" isConnectable={isConnectable} />

      <div
        className='flex justify-between drag-handle'
        onDoubleClick={() => setExpanded(!expanded)}
      >
        <div className='pr-2'>Table Advanced Combiner - {data.table?.name}</div>
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>

      </div>
      {
        data.destTable?.type == "3D"
        && data.sourceTable?.type == "3D"
        && destOptionsMap
        &&
        <div>
          <div className="max-w-sm">
            <div>
              {"X Match "}
              {data.sourceTable.xAxis.name}
              {" = "}
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onChange={onXMatch}
                value={data.matchCriteria.find(m => m.sourceSourceField == "XAxis")?.destSourceField}

              >
                <option>Select scaling</option>
                {
                  destOptionsMap.map((d) => {
                    return (
                      <option key={d.source} value={d.source}>{d.name}</option>
                    )
                  })
                }
              </select>
            </div>
            <div>
              {"Y Match "}
              {data.sourceTable.yAxis.name}
              {" = "}
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onChange={onYMatch}
                value={data.matchCriteria.find(m => m.sourceSourceField == "YAxis")?.destSourceField}
              >
                <option>Select scaling</option>
                {
                  destOptionsMap.map((d) => {
                    return (
                      <option key={d.source} value={d.source}>{d.name}</option>
                    )
                  })
                }
              </select>
            </div>
          </div>
        </div>
      }

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
        data.tableType &&
        <CustomHandle dataType={data.tableType} type="source" position={Position.Right} id="TableOut" isConnectable={isConnectable} />
      }

    </div>
  );
}

export default CombineAdvancedNode