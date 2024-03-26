import { Scaling, Table } from "../_lib/rom-metadata";
import { Module } from "./Module";
import GridSvg from "../icons/grid.svg"
import VerticalSvg from "../icons/vertical.svg"
import HorizontalSvg from "../icons/horizontal.svg"
import SingleSvg from "../icons/single.svg"
import Image from 'next/image';

import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import { uuid } from 'uuidv4';
import useRom from "@/app/store/useRom";
import { newBaseTableData } from "@/app/_components/FlowNodes/BaseTableNode";

interface TableSelectorProps {
  scalingMap?: Record<string, Scaling>
  tableMap?: Record<string, Table>
  addModule: (moudule: Module) => void
  className: string
}
function demensionToIcon(table: Table) {
  switch (table.type) {
    case '1D':
      return SingleSvg;
    case '2D':
      if (table.yAxis) {
        return VerticalSvg;
      } else {
        return HorizontalSvg;
      }
    case '3D':
      return GridSvg;
  }
  return ""
}

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  addNode: state.addNode,
  updateNode: state.updateNode
});

const TableSelector: React.FC<TableSelectorProps> = ({ tableMap, addModule, className }) => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, updateNode } = useFlow(selector, shallow);

  const { selectedRom, scalingMap } = useRom()
  return (
    <div className={`flex flex-col bg-slate-200 max-h-full overflow-auto ${className}`}>
      Table Selector
      {
        tableMap && Object.keys(tableMap).map((key) => {
          return (
            <button
              className="whitespace-nowrap text-left"
              onClick={() => {
                updateNode({
                  id: uuid(),
                  type: "BaseTableNode",
                  data: newBaseTableData(selectedRom, tableMap[key], scalingMap),
                  position: { x: 300, y: 25 },
                  dragHandle: '.drag-handle'
                })
              }}
            >
              <Image
                alt="open table"
                src={demensionToIcon(tableMap[key])}
                width={12}
                height={12}
                className="inline"
              />
              {`${tableMap[key].name}`}
            </button>
          )
        })
      }
    </div>
  );
}

export default TableSelector;