import NodeSelectorButton from "@/app/_components/NodeSelector/NodeSelectorButton"
import useFlow, { RFState } from "@/app/store/useFlow";
import { useCallback } from "react";
import { shallow } from "zustand/shallow";
import { v4 as uuid } from "uuid";
import { RunningLogAlterData, RunningLogAlterNodeType, RunningLogAlterType } from "@/app/_components/FlowNodes/RunningLogAlter/RunningLogAlterTypes";

const selector = (state: RFState) => ({
  reactFlowInstance: state.reactFlowInstance,
  updateNode: state.updateNode,
  addNode: state.addNode,
  addEdge: state.addEdge
});

const AccelFilter = () => {
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
        const runningLogAlter: RunningLogAlterNodeType = {
          position: getViewportPosition(100, 100),
          id: uuid(),
          type: RunningLogAlterType,
          data: new RunningLogAlterData({
            alterFunc: `logRecord.delete or logRecord.RPM + 50 < accumulator`,
            untilFunc: `accumulator = accumulator + currentLogRecord.RPM / 3;
[logRecord.LogID + 3 <= currentLogRecord.LogID, currentIndex + 1, accumulator]`,
            newFieldName: `delete`
          }),
          dragHandle: '.drag-handle',

        }
        updateNode(runningLogAlter)
      }}
    >
      {`Accel Filter`}
    </NodeSelectorButton>
  )
}

export default AccelFilter