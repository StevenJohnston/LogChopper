import NodeSelectorButton from "@/app/_components/NodeSelector/NodeSelectorButton"
import useFlow, { RFState } from "@/app/store/useFlow";
import { useCallback } from "react";
import { shallow } from "zustand/shallow";
import { v4 as uuid } from "uuid";
import { BaseRomData, BaseRomNodeType, BaseRomType } from "@/app/_components/FlowNodes/BaseRom/BaseRomTypes";

const selector = (state: RFState) => ({
  reactFlowInstance: state.reactFlowInstance,
  updateNode: state.updateNode,
  addNode: state.addNode,
  addEdge: state.addEdge
});

const SelectedRom = () => {
  const { reactFlowInstance, updateNode } = useFlow(selector, shallow);


  const getViewportPosition = useCallback((x: number = 0, y: number = 0) => {
    const viewPort = reactFlowInstance?.getViewport()
    return {
      x: (viewPort?.x || 0) * -1 + x,
      y: (viewPort?.y || 0) * -1 + y,
    }
  }, [reactFlowInstance])
  return (

    <NodeSelectorButton
      onClick={() => {
        const selectedRom: BaseRomNodeType = {
          position: getViewportPosition(100, 100),
          id: uuid(),
          type: BaseRomType,
          data: new BaseRomData({}),
          dragHandle: '.drag-handle',
          // extent: 'parent',
        }
        updateNode(selectedRom)
      }}
    >
      {`Selected Rom`}
    </NodeSelectorButton>
  )
}

export default SelectedRom