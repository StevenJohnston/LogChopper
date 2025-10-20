import useFlow, { RFState } from "@/app/store/useFlow";
import NodeSelectorButton from "./NodeSelectorButton";
import { LogSelectorNodeFactory } from "@/app/_components/FlowNodes/LogSelector/LogSelectorNodeFactory";
import { shallow } from "zustand/shallow";

const selector = (state: RFState) => ({
  addNode: state.addNode,
});

export function LogSelectorButton() {
  const { addNode } = useFlow(selector, shallow);

  const handleNewNode = () => {
    addNode(LogSelectorNodeFactory({ x: 200, y: 200 }));
  };

  return (
    <NodeSelectorButton onClick={handleNewNode}>
      Log Selector
    </NodeSelectorButton>
  );
}
