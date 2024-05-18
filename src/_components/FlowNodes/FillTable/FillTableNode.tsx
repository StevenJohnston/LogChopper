'use client'
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Position, NodeProps, Node, Edge } from 'reactflow';

import { TableData } from '@/src/_components/FlowNodes';
import { CustomHandle } from '@/src/_components/FlowNodes/CustomHandle/CustomHandle';
import { getParentsByHandleIds } from '@/src/_lib/react-flow-utils';
import RomModuleUI from '@/src/_components/RomModuleUI';
import { FillTableData, FillTableNodeType, FillTableType, InitFillTableData, sourceTableHandleId, targetTableHandleId } from '@/src/_components/FlowNodes/FillTable/FillTableTypes';
import { LogRecord } from '@/src/_lib/log';
import useFlow, { MyNode, RFState } from '@/src/store/useFlow';
import { shallow } from 'zustand/shallow';
import { FillLogTableType } from '@/src/_components/FlowNodes/FillLogTable/FillLogTableTypes';
import { Aggregator } from '@/src/_lib/consts';
import { FillLogTable } from '@/src/_lib/rom';
import useRom from '@/src/store/useRom';

export function newFillTable({ logField, aggregator }: InitFillTableData): FillTableData {
  return {
    logField,
    aggregator,
    table: null,
    scalingMap: {},
    parentTable: null,

    refresh: async function (node: MyNode, nodes: Node[], edges: Edge[]): Promise<void> {
      if (!this.scalingMap) return console.log("newFillTable: missing this.scalingMap")
      const parentNodes = getParentsByHandleIds<[Node<TableData<LogRecord[]>>]>(node, nodes, edges, [sourceTableHandleId])
      if (!parentNodes) {
        this.table = null
        return console.log("newFillTable One or more parents are missing")
      }
      const [parentTable] = parentNodes
      if (parentTable.type != FillLogTableType) {
        return console.log("newFillTable parent is not of type FillLogTableType")
      }
      this.parentTable = parentTable.data.table

      if (node.type != FillTableType) {
        return console.log("FillTable Node type missmatch on refresh")
      }
      if (parentTable.data.table == null) {
        return console.log("newFilleTable parent node missing table")
      }
      if (!this.logField) {
        return console.log("newFilleTable missing log field")
      }
      if (!this.aggregator) {
        return console.log("newFilleTable missing aggregator")
      }
      const newTable = FillLogTable(parentTable.data.table, this.logField, this.aggregator)
      if (newTable == null) {
        return console.log("newFilleTable failed to create aggregate table")
      }

      this.table = newTable
      if (this.scalingMap[this.logField]) {
        this.table.scalingValue = this.scalingMap[this.logField]
      } else {
        this.table.scalingValue = {
          format: "%.2f",
        }
      }
    },
    getLoadable: function () {
      return {
        logField: this.logField,
        aggregator: this.aggregator
      }
    }
  }
}

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode
});
function FillTableNode({ id, data, isConnectable }: NodeProps<FillTableData>) {
  const { nodes, updateNode } = useFlow(selector, shallow);
  const childRef = useRef<HTMLTextAreaElement>(null)

  const [expanded, setExpanded] = useState<boolean>(false)
  const { scalingMap } = useRom()

  const node: FillTableNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == FillTableType) {
        return n
      }
    }
  }, [id, nodes])

  useEffect(() => {
    if (!node) return console.log("FillTableNode node missing")
    if (!scalingMap) return console.log("FillTableNode scalingMap missing")

    if (scalingMap == data.scalingMap) return console.log("FillTableNode No update required")

    updateNode({
      ...node,
      data: {
        ...node.data,
        scalingMap,
      }
    } as FillTableNodeType)
  }, [node, scalingMap, updateNode, data])


  const onFilterSelect = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const logField = event.target.value as keyof LogRecord
    const node = nodes.find(n => n.id == id) as FillTableNodeType
    if (!node) return console.log('FillTableNode failed to find self node')
    updateNode({
      ...node,
      data: {
        ...node.data,
        logField
      }
    })
  }, [id, nodes, updateNode])

  const onAggregatorSelect = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const aggregator = event.target.value as Aggregator
    const node = nodes.find(n => n.id == id) as FillTableNodeType
    if (!node) return console.log('FillTableNode failed to find self node')
    updateNode({
      ...node,
      data: {
        ...node.data,
        aggregator
      }
    })
  }, [id, nodes, updateNode])


  const fields: string[] | void = useMemo(() => {
    if (node?.data.parentTable?.type != "3D") {
      return console.log("FillTableNode only handels 3d tables")
    }
    for (let y = 0; y < node.data.parentTable.values.length; y++) {
      for (let x = 0; x < node.data.parentTable.values[y].length; x++) {
        const logRecords = node.data.parentTable.values[y][x]
        if (logRecords.length != 0)
          return Object.keys(logRecords[0])
      }
    }
  }, [node?.data.parentTable])

  return (
    <div className="flex flex-col p-2 border border-black rounded bg-green-400">
      <CustomHandle dataType='3D' type="target" position={Position.Left} id={sourceTableHandleId} top="20px" isConnectable={isConnectable} />

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
                onChange={onFilterSelect}
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
              />
            }
          </div>
        }
      </div>
      <CustomHandle dataType='3D' type="source" position={Position.Right} id={targetTableHandleId} top="20px" isConnectable={isConnectable} />

    </div>
  );
}

export default FillTableNode