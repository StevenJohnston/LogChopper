import { LogFilterType, LogFilterNodeType } from "@/src/_components/FlowNodes/LogFilter/LogFilterTypes"
import NodeSelectorButton from "@/src/_components/NodeSelector/NodeSelectorButton"
import useFlow, { RFState } from "@/src/store/useFlow";
import { useCallback } from "react";
import { shallow } from "zustand/shallow";
import { v4 as uuid } from "uuid";
import { newLogFilter } from "@/src/_components/FlowNodes/LogFilter/LogFilterNode";

const selector = (state: RFState) => ({
  reactFlowInstance: state.reactFlowInstance,
  updateNode: state.updateNode,
  addNode: state.addNode,
  addEdge: state.addEdge
});

const IPW = () => {
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
        const logFilter: LogFilterNodeType = {
          position: getViewportPosition(100, 100),
          id: uuid(),
          type: LogFilterType,
          data: newLogFilter({ func: "IPW > 0" })
        }
        updateNode(logFilter)
      }}
    >
      {`IPW > 0`}
    </NodeSelectorButton>
  )
}

export default IPW