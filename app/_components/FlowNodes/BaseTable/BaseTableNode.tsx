'use client'
import { useCallback, useRef, useState } from 'react';
import { Position, NodeProps, Node } from 'reactflow';

import ModuleUI from '../../Module';
import { BasicTable, Scaling } from "@/app/_lib/rom-metadata";

import { getFilledTable } from "@/app/_lib/rom";
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';

import { BaseTableData } from "@/app/_components/FlowNodes/BaseTable/BaseTableTypes"

export function newBaseTableData(selectedRom: FileSystemFileHandle | null, table: BasicTable, scalingMap: Record<string, Scaling>): BaseTableData {
  return {
    table,
    selectedRom,
    scalingMap,
    refresh: async function (node: Node): Promise<void> {
      if (!this.table) return
      const filledTable = await getFilledTable(node.data.selectedRom, this.scalingMap, this.table)
      if (!filledTable) {
        return console.log("Failed to getFilledTable for newBaseTableData")
      }
      this.table = filledTable
    },
  }
}

function BaseTableNode({ data, isConnectable }: NodeProps<BaseTableData>) {
  const [expanded, setExpanded] = useState<boolean>()
  const childRef = useRef<HTMLTextAreaElement>(null)

  const onFocus = useCallback(() => {
    childRef.current?.focus()
  }, [])

  //TODO  should this be something else
  if (!data.table) {
    return (
      <div>Loading?</div>
    )
  }
  if (data.table.type == "Other") {
    return (
      <div>Other type table unrenderable</div>
    )
  }
  return (
    <div className="flex flex-col p-2 border border-black rounded bg-white" onClick={onFocus}>
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