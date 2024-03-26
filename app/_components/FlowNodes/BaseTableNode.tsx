import { useCallback, useState } from 'react';
import { Handle, Position, NodeProps, Node, Edge } from 'reactflow';

import ModuleUI from '../Module';
import useRom, { useRomSelector } from '@/app/store/useRom';
import { shallow } from "zustand/shallow";
import { Scaling, Table } from "@/app/_lib/rom-metadata";
import { RefreshableNode, TableData } from '@/app/_components/FlowNodes';

import { getFilledTable } from "@/app/_lib/rom";
import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle';


interface BaseTableData extends TableData, RefreshableNode {
  // table: Table;
  selectedRom: FileSystemFileHandle | null;
  scalingMap: Record<string, Scaling>;
}

export const BaseTableType = "BaseTableNode"
export type BaseTableNodeType = Node<BaseTableData, "BaseTableNode">;

export function newBaseTableData(selectedRom: FileSystemFileHandle | null, table: Table, scalingMap: Record<string, Scaling>): BaseTableData {
  return {
    table,
    selectedRom,
    scalingMap,
    refresh: async function (node: Node, nodes: Node[], edges: Edge[]): Promise<void> {
      // TODO get this to trigger 
      // debugger
      if (!this.table) return
      this.table = await getFilledTable(node.data.selectedRom, this.scalingMap, this.table)
    }
  }
}

function BaseTableNode({ data, isConnectable }: NodeProps<BaseTableData>) {
  const {
    scalingMap,
  } = useRom(useRomSelector, shallow);
  const { selectedRom } = data
  const [expanded, setExpanded] = useState<boolean>()

  if (!data.table) {
    return (
      <div>//TODO should this be something else</div>
    )
  }
  return (
    <div className="flex flex-col p-2 border border-black rounded">
      <div className='flex justify-between drag-handle'>
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
          module={{ type: 'base', table: data.table }}
        />
      }
      <CustomHandle dataType={data.table.type} type="source" position={Position.Right} id="TableOut" isConnectable={isConnectable} />
    </div>
  );
}

export default BaseTableNode