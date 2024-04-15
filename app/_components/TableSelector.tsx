'use client'
import { Scaling, Table, isTable2DX, isTable2DY } from "../_lib/rom-metadata";
import GridSvg from "../icons/grid.svg"
import VerticalSvg from "../icons/vertical.svg"
import HorizontalSvg from "../icons/horizontal.svg"
import SingleSvg from "../icons/single.svg"

import useFlow, { RFState } from '@/app/store/useFlow';
import { shallow } from 'zustand/shallow';
import { v4 as uuid } from "uuid";
import { newBaseTableData } from "@/app/_components/FlowNodes/BaseTable/BaseTableNode";
import { BaseTableType } from "@/app/_components/FlowNodes/BaseTable/BaseTableTypes";

interface TableSelectorProps {
  scalingMap?: Record<string, Scaling>
  tableMap?: Record<string, Table<unknown>>
  className: string
}
function demensionToIcon(table: Table<unknown>) {
  switch (table.type) {
    case '1D':
      return <SingleSvg
        width={12}
        height={12}
        className="inline"
      />
    case '2D': {
      if (isTable2DX(table)) {
        return <HorizontalSvg
          width={12}
          height={12}
          className="inline"
        />;
      } else if (isTable2DY(table)) {
        return <VerticalSvg
          width={12}
          height={12}
          className="inline"
        />;
      }
      break
    }
    case '3D':
      return <GridSvg
        width={12}
        height={12}
        className="inline"
      />;
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

const TableSelector: React.FC<TableSelectorProps> = ({ tableMap, className }) => {
  const { updateNode } = useFlow(selector, shallow);

  return (
    <div className={`flex flex-col bg-slate-200 max-h-full overflow-auto ${className}`}>
      Table Selector
      {
        tableMap && Object.keys(tableMap).map((key) => {
          return (
            <button
              key={key}
              className="whitespace-nowrap text-left"
              onClick={() => {
                updateNode({
                  id: uuid(),
                  type: BaseTableType,
                  data: newBaseTableData({ tableKey: key }),
                  position: { x: 300, y: 25 },
                  dragHandle: '.drag-handle',
                  // extent: 'parent',
                })
              }}
            >
              {demensionToIcon(tableMap[key])}
              {`${tableMap[key].name}`}
            </button>
          )
        })
      }
    </div>
  );
}

export default TableSelector;