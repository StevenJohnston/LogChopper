'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Position, NodeProps, Node } from 'reactflow';

import ModuleUI from '../../Module';

import { getFilledTable } from "@/app/_lib/rom";
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';

import { BaseTableData, BaseTableNodeType, BaseTableType, InitBaseTableData } from "@/app/_components/FlowNodes/BaseTable/BaseTableTypes"
import useRom from '@/app/store/useRom';
import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';

// export function newBaseTableData(selectedRom: FileSystemFileHandle | null, table: BasicTable, scalingMap: Record<string, Scaling>): BaseTableData {
export function newBaseTableData({ tableKey }: InitBaseTableData): BaseTableData<InitBaseTableData> {
  return {
    tableKey,
    selectedRom: null,
    scalingMap: {},
    table: null,
    tableMap: {},
    // table,
    // selectedRom,
    // scalingMap,
    refresh: async function (node: Node): Promise<void> {
      if (!this.tableKey) return console.log("newBaseTableData: missing this.tableKey")
      if (!this.selectedRom) return console.log("newBaseTableData: missing this.selectedRom")
      if (!this.scalingMap) return console.log("newBaseTableData: missing this.scalingMap")
      if (!this.tableMap) return console.log("newBaseTableData: missing this.tableMap")

      if (!this.tableMap[this.tableKey]) return console.log("newBaseTableData: missing this.tableMap")
      const selectedTable = this.tableMap[this.tableKey]

      const filledTable = await getFilledTable(node.data.selectedRom, this.scalingMap, selectedTable)
      if (!filledTable) {
        return console.log("Failed to getFilledTable for newBaseTableData")
      }
      this.table = filledTable
    },
    getLoadable: function (): InitBaseTableData {
      return {
        tableKey: this.tableKey
      }
    }
  }
}

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  updateEdge: state.updateEdge,
  updateNode: state.updateNode,
  flowInstance: state.reactFlowInstance
});

function BaseTableNode({ id, data, isConnectable }: NodeProps<BaseTableData<InitBaseTableData>>) {
  const [expanded, setExpanded] = useState<boolean>()
  const childRef = useRef<HTMLTextAreaElement>(null)

  const { nodes, updateNode } = useFlow(selector, shallow);
  const { tableMap, selectedRom, scalingMap } = useRom()

  const node: BaseTableNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == BaseTableType) {
        return n
      }
    }
  }, [id, nodes])

  useEffect(() => {
    if (!node) return console.log("BaseTableNode node missing")
    if (!selectedRom) return console.log("BaseTableNode selectedRom missing")
    if (!scalingMap) return console.log("BaseTableNode scalingMap missing")
    if (!tableMap) return console.log("BaseTableNode tableMap missing")

    if (scalingMap == data.scalingMap && selectedRom == data.selectedRom && tableMap == data.tableMap) return console.log("BaseTableNode No update required")

    updateNode({
      ...node,
      data: {
        ...node.data,
        selectedRom,
        scalingMap,
        tableMap
      }
    } as BaseTableNodeType)
  }, [selectedRom, scalingMap, tableMap, updateNode])

  const onFocus = useCallback(() => {
    childRef.current?.focus()
  }, [])

  //TODO  should this be something else
  if (!data.table) {
    return (
      <div className='flex flex-col p-2 border border-black rounded bg-white'>Select a Rom</div>
    )
  }
  if (data.table.type == "Other") {
    return (
      <div>Other type table unrenderable</div>
    )
  }
  return (
    <div className={`flex flex-col p-2 border border-black rounded bg-red-400/75 ${data.loading && 'animate-pulse'}`} onClick={onFocus}>
      <div
        className='flex justify-between drag-handle'
        onDoubleClick={() => setExpanded(!expanded)}
      >
        <div className='pr-2'>{data.table?.name}</div>
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>
      </div>
      {
        expanded
        && <ModuleUI
          ref={childRef}
          module={{ type: 'base', table: data.table }}
        />
      }
      <CustomHandle dataType={data.table.type} type="source" position={Position.Right} id="TableOut" isConnectable={isConnectable} />
    </div>
  );
}

export default BaseTableNode
