import useFlow, { RFState } from "@/app/store/useFlow";
import NodeSelectorButton from "./NodeSelectorButton";
import { NewTableRemapNode } from "@/app/_components/FlowNodes/TableRemap/TableRemapNodeFactory";
import { shallow } from "zustand/shallow";

const selector = (state: RFState) => ({
  addNode: state.addNode,
});

export function TableRemapper() {
  const { addNode } = useFlow(selector, shallow);

  const handleNewTableRemapNode = () => {
    addNode(NewTableRemapNode());
  };

  return (
    <NodeSelectorButton onClick={handleNewTableRemapNode}>
      Table Remap
    </NodeSelectorButton>
  );
}