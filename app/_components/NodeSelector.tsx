'use client'

import { newGroup } from "@/app/_components/FlowNodes/Group/GroupNode"
import { GroupNodeType, GroupType } from "@/app/_components/FlowNodes/Group/GroupNodeTypes"
import { newLogFilter } from "@/app/_components/FlowNodes/LogFilter/LogFilterNode"
import { LogFilterType, LogFiltereNodeType } from "@/app/_components/FlowNodes/LogFilter/LogFilterTypes"
import useFlow, { RFState } from "@/app/store/useFlow"
import useNodeStorage, { NodeStorageState, SavedGroup, cloneSavedGroup } from "@/app/store/useNodeStorage"
import { MouseEventHandler, ReactNode, useCallback, useMemo, useState } from "react"
import { Viewport } from "reactflow"
import { uuid } from "uuidv4"
import { shallow } from "zustand/shallow"

interface NodeSelectorButtonProps {
  onClick: MouseEventHandler<HTMLElement>;
  children: ReactNode
}
const NodeSelectorButton = ({ onClick, children }: NodeSelectorButtonProps) => {
  return (
    <button
      className="bg-white hover:bg-blue-500 text-blue-700 border border-blue-500 hover:text-white hover:border-transparent rounded-md h-20 w-[50%] box-border"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

const selector = (state: RFState) => ({
  reactFlowInstance: state.reactFlowInstance,
  updateNode: state.updateNode,
  addNode: state.addNode,
  addEdge: state.addEdge
});

const nodeStorageSelector = (state: NodeStorageState) => ({
  savedGroups: state.savedGroups,
  saveGroup: state.saveGroup,
});


const NodeSelector = () => {
  const { reactFlowInstance, updateNode, addNode, addEdge } = useFlow(selector, shallow);
  const { savedGroups } = useNodeStorage(nodeStorageSelector, shallow)


  const [expanded, setExpanded] = useState<boolean>()
  // const { x, y, zoom } = useViewport();

  const viewPort = useMemo<Viewport | undefined>(() => {
    return reactFlowInstance?.getViewport()
  }, [reactFlowInstance])

  const getViewportPosition = useCallback((x: number = 0, y: number = 0) => {
    const viewPort = reactFlowInstance?.getViewport()
    return {
      x: (viewPort?.x || 0) * -1 + x,
      y: (viewPort?.y || 0) * -1 + y,
    }
  }, [reactFlowInstance])

  const onLoadSavedGroup = useCallback((savedGroup: SavedGroup) => {
    const newGroup = cloneSavedGroup(savedGroup)

    for (const node of newGroup.nodes) {
      addNode(node)
    }
    for (const edge of newGroup.edges) {
      addEdge(edge)
    }
  }, [addNode, addEdge])

  return (
    <div className={`fixed flex top-0 right-0 bg-opacity-50 bg-blue-200 p-2 ${expanded ? 'w-[200px]' : ''} flex-col max-h-[calc(100%-200px)] m-[15px]`}>
      <div
        onDoubleClick={() => setExpanded(!expanded)}
        className='flex justify-between drag-handle w-full'
      >
        {expanded && <div className='pr-2'>Node Selector</div>}
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>

      </div>
      {expanded
        && <div
          className="max-h-[10%] flex-wrap content-start w-full mt-2"
        >
          <div>Base Nodes</div>
          <NodeSelectorButton
            onClick={() => {
              const logFilter: LogFiltereNodeType = {
                position: getViewportPosition(100, 100),
                id: uuid(),
                type: LogFilterType,
                data: newLogFilter()
              }
              updateNode(logFilter)
            }}
          // text={"Log Filter"}
          >
            Log Filter
          </NodeSelectorButton>
          <div>Group Node</div>
          <NodeSelectorButton
            onClick={() => {
              const group: GroupNodeType = {
                position: getViewportPosition(100, 100),
                id: uuid(),
                type: GroupType,
                data: newGroup({ name: "New Group", locked: false }),
                style: { width: 400, height: 400, zIndex: -1 }
              }
              updateNode(group)
            }}
          // text={"Log Filter"}
          >
            Group
          </NodeSelectorButton>
          <div>Saved Groups</div>
          {savedGroups.map((savedGroup) => {
            return (
              <NodeSelectorButton
                key={savedGroup.groupName}
                onClick={() => {
                  onLoadSavedGroup(savedGroup)
                  // savedGroup.nodes.forEach()
                  // // const group: GroupNodeType = {
                  // //   position: getViewportPosition(100, 100),
                  // //   id: uuid(),
                  // //   type: GroupType,
                  // //   data: newGroup({ name: "New Group", locked: false }),
                  // //   style: { width: 400, height: 400, zIndex: -1 }
                  // // }
                  // updateNode(group)
                }}
              // text={"Log Filter"}
              >
                {savedGroup.groupName}
              </NodeSelectorButton>
            )
          })}
        </div>
      }
      {/* <button
        className="bg-transparent hover:bg-blue-500 text-blue-700 border border-blue-500 hover:text-white hover:border-transparent bg-opacity-50 rounded-md h-20 w-20"
        onClick={}
        >
        Log Filter
      </button> */}
    </div>
  )
}

export default NodeSelector