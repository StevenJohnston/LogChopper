'use client'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Position, NodeProps, Node, Edge } from 'reactflow';

import { TableData } from '@/app/_components/FlowNodes';
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { getParentsByHandleIds } from '@/app/_lib/react-flow-utils';
import RomModuleUI from '@/app/_components/RomModuleUI';
import { CombineAdvancedTableData, InitCombineAdvancedTableData, sourceHandleId, destHandleId, CombineAdvancedTableNodeType, CombineAdvancedTableType } from '@/app/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableTypes';
import useFlow, { MyNode, RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import useRom from '@/app/store/useRom';
import { MapCombineAdv, SourceField } from '@/app/_lib/rom';

export function newCombineAdvanced({ matchCriteria }: InitCombineAdvancedTableData): CombineAdvancedTableData {
  return {
    sourceTable: null,
    destTable: null,
    matchCriteria: matchCriteria,
    table: null,
    scalingMap: {},
    refresh: async function (node: MyNode, nodes: Node[], edges: Edge[]): Promise<void> {
      const parentNodes = getParentsByHandleIds<[Node<TableData<string | number>>, Node<TableData<string | number>>]>(node, nodes, edges, [sourceHandleId, destHandleId])
      if (!parentNodes) {
        this.table = null
        return console.log("One or more parents are missing")
      }
      const [sourceTable, destTable] = parentNodes
      this.sourceTable = sourceTable.data.table
      this.destTable = destTable.data.table

      if (sourceTable.data.table == null) return
      if (destTable.data.table == null) return
      const newTable = MapCombineAdv(sourceTable.data.table, destTable.data.table, this.matchCriteria)
      if (!newTable) return console.log("newCombineAdvanced refresh failed to MapCombineAdv")
      this.table = newTable
    },
    getLoadable: function () {
      return {
        matchCriteria: this.matchCriteria
      }
    }
  }
}

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode
});

function CombineAdvancedNode({ id, data, isConnectable }: NodeProps<CombineAdvancedTableData>) {
  const { nodes, updateNode } = useFlow(selector, shallow);

  // const [funcVal, setFuncVal] = useState(data.func)

  const [expanded, setExpanded] = useState<boolean>(false)
  const { scalingMap } = useRom()

  const node: CombineAdvancedTableNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == CombineAdvancedTableType) {
        return n
      }
    }
  }, [id, nodes])

  useEffect(() => {
    if (!node) return console.log("CombineAdvancedNode node missing")
    if (!scalingMap) return console.log("CombineAdvancedNode scalingMap missing")

    if (scalingMap == data.scalingMap) return console.log("CombineAdvancedNode No update required")

    updateNode({
      ...node,
      data: {
        ...node.data,
        scalingMap,
      }
    } as CombineAdvancedTableNodeType)
  }, [node, scalingMap, updateNode, data])

  const destOptionsMap = useMemo(() => {
    if (data.destTable?.type != "3D") return null
    if (!data.destTable.scaling) return null
    return [
      { 'name': data.destTable.xAxis.name, 'source': 'XAxis' },
      { 'name': data.destTable.yAxis.name, 'source': 'YAxis' },
      { 'name': data.destTable.scaling, 'source': 'Value' }
    ]
  }, [data.destTable])


  const onXMatch = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const source = event.target.value as SourceField
    const node = nodes.find(n => n.id == id) as CombineAdvancedTableNodeType
    if (!node) return console.log('FillTableNode onXMatch failed to find self node')
    updateNode({
      ...node,
      data: {
        ...node.data,
        matchCriteria: [...node.data.matchCriteria.filter((m) => m.sourceSourceField != "XAxis"), {
          sourceSourceField: "XAxis",
          destSourceField: source
        }]
      }
    })
  }, [id, nodes, updateNode])

  const onYMatch = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const source = event.target.value as SourceField
    const node = nodes.find(n => n.id == id) as CombineAdvancedTableNodeType
    if (!node) return console.log('FillTableNode onYMatch failed to find self node')
    updateNode({
      ...node,
      data: {
        ...node.data,
        matchCriteria: [...node.data.matchCriteria.filter((m) => m.sourceSourceField != "YAxis"), {
          sourceSourceField: "YAxis",
          destSourceField: source
        }]
      }
    })
  }, [id, nodes, updateNode])

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
    <div className="flex flex-col p-2 border border-black rounded bg-blue-500 bg-opacity-50">
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
                table={data.table}
              />
            }
          </div>
        }
      </div>
      {
        data.table?.type == "3D" &&
        <CustomHandle dataType={data.table.type} type="source" position={Position.Right} id="TableOut" isConnectable={isConnectable} />
      }

    </div>
  );
}

export default CombineAdvancedNode