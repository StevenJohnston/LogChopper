'use client'
import { ChangeEvent, useCallback, useState } from 'react';
import { Position, NodeProps, Node, Edge } from 'reactflow';

import { LogData, TableData } from '@/app/_components/FlowNodes';
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { getParentsByHandleIds } from '@/app/_lib/react-flow-utils';
import RomModuleUI from '@/app/_components/RomModuleUI';
import { FillTableData, FillTableNodeType, FillTableType, InitFillTableData, sourceTableHandleId } from '@/app/_components/FlowNodes/FillTable/FillTableTypes';
import { LogFields, LogRecord } from '@/app/_lib/log';
import useFlow, { MyNode, RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import { FillLogTableType } from '@/app/_components/FlowNodes/FillLogTable/FillLogTableTypes';
import { Aggregator } from '@/app/_lib/consts';

export function newFillTable({ logField, aggregator }: InitFillTableData): FillTableData {
  return {
    logField,
    aggregator,
    table: null,
    refresh: async function (node: MyNode, nodes: Node[], edges: Edge[]): Promise<void> {
      const parentNodes = getParentsByHandleIds<[Node<TableData<LogRecord[]>>, Node<LogData>]>(node, nodes, edges, [sourceTableHandleId])
      if (!parentNodes) {
        this.table = null
        return console.log("newFillTable One or more parents are missing")
      }
      const [parentTable] = parentNodes
      if (parentTable.type != FillLogTableType) {
        return console.log("newFillTable parent is not of type FillLogTableType")
      }

      if (node.type != logField) {
        return console.log("FillTable Node type missmatch on refresh")
      }

      switch (node.data.aggregator) {

      }

      const table = parentTable.data.table
      if (!table) {
        return console.log("table is missing from parent")
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

  const [expanded, setExpanded] = useState<boolean>(true)


  const onFilterSelect = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const logField = event.target.value as keyof LogRecord
    const node = nodes.find(n => n.id == id) as FillTableNodeType
    if (!node) return console.log('FillTableNode failed to find self node')
    updateNode({
      type: FillTableType,
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
      type: FillTableType,
      ...node,
      data: {
        ...node.data,
        aggregator
      }
    })
  }, [id, nodes, updateNode])

  return (
    <div className="flex flex-col p-2 border border-black rounded">
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
        <form className="max-w-sm mx-auto">
          <div className='flex'>
            <div className='mr-2'>
              <label htmlFor="logField" className="block mb-2 text-sm font-medium text-gray-900">Fill log field</label>
              <select
                id="logField"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onChange={onFilterSelect}
                value={data.logField}
              >
                {
                  LogFields.map((f) => {
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
        </form>
      </div>
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
    </div>
  );
}

export default FillTableNode