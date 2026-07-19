"use client";

import { TableLookupType } from "@/app/_components/FlowNodes/TableLookup/TableLookupTypes";
import useFlow from "@/app/store/useFlow";
import { useCallback } from "react";
import { v4 as uuid } from "uuid";
import NodeSelectorButton from "./NodeSelectorButton";
import { TableLookupNodeFactory } from "@/app/_components/FlowNodes/TableLookup/TableLookupNodeFactory";

export function TableLookupButton() {
  const { addNode, getViewportPosition } = useFlow(
    (state) => ({
      addNode: state.addNode,
      getViewportPosition: state.getViewportPosition,
    }),
  );

  const handleCreateTableLookupNode = useCallback(() => {
    const position = getViewportPosition(100, 100);
    addNode(TableLookupNodeFactory(position));
  }, [addNode, getViewportPosition]);

  return (
    <NodeSelectorButton onClick={handleCreateTableLookupNode}>
      Table Lookup
    </NodeSelectorButton>
  );
}
