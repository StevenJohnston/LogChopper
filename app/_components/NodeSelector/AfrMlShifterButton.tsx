import useFlow, { RFState } from "@/app/store/useFlow";
import NodeSelectorButton from "./NodeSelectorButton";
import { AfrMlShifterNodeFactory } from "@/app/_components/FlowNodes/AfrMlShifter/AfrMlShifterNodeFactory";
import { shallow } from "zustand/shallow";
import { useCallback } from "react";

const selector = (state: RFState) => ({
  addNode: state.addNode,
  reactFlowInstance: state.reactFlowInstance,
});

export function AfrMlShifterButton() {
  const { addNode, reactFlowInstance } = useFlow(selector, shallow);

  const getViewportPosition = useCallback((x: number = 0, y: number = 0) => {
    const viewPort = reactFlowInstance?.getViewport()
    return {
      x: (viewPort?.x || 0) * -1 + x,
      y: (viewPort?.y || 0) * -1 + y,
    }
  }, [reactFlowInstance]);

  const handleNewNode = () => {
    addNode(AfrMlShifterNodeFactory(getViewportPosition(100, 100)));
  };

  return (
    <NodeSelectorButton onClick={handleNewNode}>
      AFR ML Shifter
    </NodeSelectorButton>
  );
}
