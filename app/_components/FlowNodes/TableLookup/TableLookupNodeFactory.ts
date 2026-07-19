"use client";
import { v4 as uuid } from "uuid";
import { TableLookupData, TableLookupType } from "./TableLookupTypes";
import { XYPosition } from "reactflow";

export function TableLookupNodeFactory(position: XYPosition) {
  return {
    id: uuid(),
    type: TableLookupType,
    position,
    data: new TableLookupData(),
  };
}
