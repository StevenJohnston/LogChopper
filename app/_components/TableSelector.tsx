import { useEffect } from "react";
import { Scaling, Table } from "../_lib/rom-metadata";
import { Module } from "./Module";
import GridSvg from "../icons/grid.svg"
import VerticalSvg from "../icons/vertical.svg"
import HorizontalSvg from "../icons/horizontal.svg"
import SingleSvg from "../icons/single.svg"
import Image from 'next/image';

interface TableSelectorProps {
  scalingMap: Record<string, Scaling>
  tableMap: Record<string, Table>
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

const TableSelector: React.FC<TableSelectorProps> = ({ scalingMap, tableMap, addModule, className }) => {
  return (
    <div className={`flex flex-col bg-slate-200 max-h-full overflow-auto ${className}`}>
      Table Selector
      {
        tableMap && Object.keys(tableMap).map((key) => {
          return (
            <button
              className="whitespace-nowrap text-left"
              onClick={() => {
                addModule({
                  table: tableMap[key],
                  type: 'base'
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