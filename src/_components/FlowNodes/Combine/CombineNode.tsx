'use client'
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Position, NodeProps, Node, Edge } from 'reactflow';

import { TableData } from '@/src/_components/FlowNodes';
import { CustomHandle } from '@/src/_components/FlowNodes/CustomHandle/CustomHandle';
import { getParentsByHandleIds } from '@/src/_lib/react-flow-utils';
import RomModuleUI from '@/src/_components/RomModuleUI';
import { CombineData, CombineNodeType, CombineType, InitCombineData, targetTableOneHandleID, targetTableTwoHandleID } from '@/src/_components/FlowNodes/Combine/CombineTypes';
import useFlow, { MyNode, RFState } from '@/src/store/useFlow';
import { shallow } from 'zustand/shallow';
import useRom from '@/src/store/useRom';
import { MapCombine } from '@/src/_lib/rom';

export function newCombine({ func }: InitCombineData): CombineData {
  return {
    func: func || "sourceTable[y][x] > 0 ? 1 : 0",
    table: null,
    scalingMap: {},
    refresh: async function (node: MyNode, nodes: Node[], edges: Edge[]): Promise<void> {
      const parentNodes = getParentsByHandleIds<[Node<TableData<string | number>>, Node<TableData<string | number>>]>(node, nodes, edges, [targetTableOneHandleID, targetTableTwoHandleID])
      if (!parentNodes) {
        this.table = null
        return console.log("One or more parents are missing")
      }
      const [sourceTable, joinTable] = parentNodes

      if (!this.func) return console.log("newCombine func missing")
      if (sourceTable.data.table == null) return console.log("newCombine sourceTable missing table")
      if (joinTable.data.table == null) return console.log("newCombine joinTable missing table")
      if (sourceTable.data.table.type == "3D" && joinTable.data.table.type == "3D") {
        const newTable = MapCombine(sourceTable.data.table, joinTable.data.table, this.func)
        if (!newTable) return console.log("Failed to create new table for combine")
        this.table = newTable
      } else {
        console.log("TODO newCombine only supports 3D")
      }

      // displayValue = parser.evaluate(this.func, { t1 });

    },
    getLoadable: function () {
      return {
        func: this.func
      }
    }
  }
}

const selector = (state: RFState) => ({
  nodes: state.nodes,
  updateNode: state.updateNode
});
function CombineNode({ id, data, isConnectable }: NodeProps<CombineData>) {
  const childRef = useRef<HTMLTextAreaElement>(null)
  const { nodes, updateNode } = useFlow(selector, shallow);

  const [funcVal, setFuncVal] = useState(data.func)

  const [expanded, setExpanded] = useState<boolean>(false)
  const { scalingMap } = useRom()

  const node: CombineNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == CombineType) {
        return n
      }
    }
  }, [id, nodes])

  useEffect(() => {
    if (!node) return console.log("CombineNode node missing")
    if (!scalingMap) return console.log("CombineNode scalingMap missing")

    if (scalingMap == data.scalingMap) return console.log("CombineNode No update required")

    updateNode({
      ...node,
      data: {
        ...node.data,
        scalingMap,
      }
    } as CombineNodeType)
  }, [node, scalingMap, updateNode, data])


  const onFuncChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!node) return
    setFuncVal(event.target.value)
    updateNode({ ...node, data: { ...node.data, func: event.target.value } })
  }, [node, updateNode])

  return (
    <div className="flex flex-col p-2 border border-black rounded bg-blue-500 bg-opacity-50">
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
        <div className="max-w-sm">
          <textarea
            className='w-full'
            // className={`focus:bg-transparent bg-inherit h-4 m-1`}
            value={funcVal}
            onChange={onFuncChange}
          // onBlur={onFuncChange}

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

export default CombineNode