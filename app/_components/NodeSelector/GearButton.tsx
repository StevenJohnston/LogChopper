import NodeSelectorButton from "@/app/_components/NodeSelector/NodeSelectorButton";
import useFlow, { RFState } from "@/app/store/useFlow";
import { useCallback } from "react";
import { shallow } from "zustand/shallow";
import { v4 as uuid } from "uuid";
import { GearData, GearNodeType, GearType } from "@/app/_components/FlowNodes/Gear/GearTypes";

const selector = (state: RFState) => ({
  reactFlowInstance: state.reactFlowInstance,
  updateNode: state.updateNode,
});

export const GearButton = () => {
  const { reactFlowInstance, updateNode } = useFlow(selector, shallow);

  const getViewportPosition = useCallback(
    (x: number = 0, y: number = 0) => {
      const viewPort = reactFlowInstance?.getViewport();
      return {
        x: (viewPort?.x || 0) * -1 + x,
        y: (viewPort?.y || 0) * -1 + y,
      };
    },
    [reactFlowInstance]
  );

  return (
    <NodeSelectorButton
      onClick={() => {
        const gearNode: GearNodeType = {
          position: getViewportPosition(100, 100),
          id: uuid(),
          type: GearType,
          data: new GearData({}),
          dragHandle: '.drag-handle',
        };
        updateNode(gearNode);
      }}
    >
      {`Gear Calculator`}
    </NodeSelectorButton>
  );
};

export default GearButton;
