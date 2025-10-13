import useFlow, { RFState } from "@/app/store/useFlow";
import NodeSelectorButton from "./NodeSelectorButton";
import { RomSelectorNodeFactory } from "@/app/_components/FlowNodes/RomSelector/RomSelectorNodeFactory";
import { shallow } from "zustand/shallow";

const selector = (state: RFState) => ({
  addNode: state.addNode,
});

export function RomSelectorButton() {
  const { addNode } = useFlow(selector, shallow);

  const handleNewNode = () => {
    addNode(RomSelectorNodeFactory({ x: 200, y: 200 }));
  };

  return (
    <NodeSelectorButton onClick={handleNewNode}>
      Rom Selector
    </NodeSelectorButton>
  );
}
