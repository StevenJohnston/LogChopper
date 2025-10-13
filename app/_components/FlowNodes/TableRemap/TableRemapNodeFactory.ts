import { TableRemapData, TableRemapNodeType, TableRemapType } from "./TableRemapTypes";

let nodeCounter = 0;

export function NewTableRemapNode(): TableRemapNodeType {
  const nodeId = `${TableRemapType}_${nodeCounter}`;
  nodeCounter++;

  return {
    id: nodeId,
    type: TableRemapType,
    position: { x: 0, y: 0 },
    data: new TableRemapData({
      commonAxis: "y",
      lookupValueSource: "x",
      searchTarget: "v",
      outputSource: "x",
    }),
  };
}
