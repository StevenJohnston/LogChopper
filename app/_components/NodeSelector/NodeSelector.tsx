'use client'

import { GroupData, GroupNodeType, GroupType } from "@/app/_components/FlowNodes/Group/GroupNodeTypes"
import { LogFilterType, LogFilterNodeType, LogFilterData } from "@/app/_components/FlowNodes/LogFilter/LogFilterTypes"
import useFlow, { MyNode, RFState } from "@/app/store/useFlow"
import useNodeStorage, { NodeStorageState, SavedGroup, cloneSavedGroup } from "@/app/store/useNodeStorage"
import { useCallback, useState } from "react"
import { v4 as uuid } from "uuid";

import GearSvg from "../../icons/gear.svg"
import TrashSvg from "../../icons/trash.svg"

import { shallow } from "zustand/shallow"
import NodeSelectorButton from "@/app/_components/NodeSelector/NodeSelectorButton"
import IPW from "@/app/_components/NodeSelector/IPW"
import MapAfrGroup from "@/app/_components/NodeSelector/MapAfrGroup"
import AccelFilter from "@/app/_components/NodeSelector/AccelFilter"
import SelectedRom from "@/app/_components/NodeSelector/SelectedRom"
import AfrMapGroup from "@/app/_components/NodeSelector/AfrMapGroup"
import AfrShifter from "@/app/_components/NodeSelector/AfrShifter"

const selector = (state: RFState) => ({
  reactFlowInstance: state.reactFlowInstance,
  updateNode: state.updateNode,
  addNode: state.addNode,
  addEdge: state.addEdge
});

const nodeStorageSelector = (state: NodeStorageState) => ({
  savedGroups: state.savedGroups,
  saveGroup: state.saveGroup,
  deleteGroup: state.deleteGroup,
});


const NodeSelector = () => {
  const { reactFlowInstance, updateNode, addNode, addEdge } = useFlow(selector, shallow);
  const { savedGroups, deleteGroup } = useNodeStorage(nodeStorageSelector, shallow)

  const [groupDelete, setGroupDelete] = useState<boolean>(false);

  const [expanded, setExpanded] = useState<boolean>()

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
      addNode(node as MyNode)
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
          className="flex max-h-[10%] flex-wrap content-start w-full mt-2"
        >
          <div className="w-full">Log Filters</div>
          <NodeSelectorButton
            onClick={() => {
              const logFilter: LogFilterNodeType = {
                position: getViewportPosition(100, 100),
                id: uuid(),
                type: LogFilterType,
                data: new LogFilterData({}),
                dragHandle: '.drag-handle',
              }
              updateNode(logFilter)
            }}
          >
            Base Log Filter
          </NodeSelectorButton>
          <IPW />
          <AfrShifter />
          <AccelFilter />

          <div className="w-full">Rom</div>
          <SelectedRom />
          <div className="w-full">Group Node</div>
          <NodeSelectorButton
            onClick={() => {
              const group: GroupNodeType = {
                position: getViewportPosition(100, 100),
                id: uuid(),
                type: GroupType,
                data: new GroupData({ name: "New Group", locked: false }),
                style: { width: 400, height: 400, zIndex: -1 },
                dragHandle: '.drag-handle',
              }
              updateNode(group)
            }}
          >
            Group
          </NodeSelectorButton>
          <MapAfrGroup />
          <AfrMapGroup />
          {
            savedGroups.length > 0 &&
            <div
              className='flex justify-between'
            >
              Saved Groups
              <button
                onClick={() => { setGroupDelete(!groupDelete) }}
              >

                <GearSvg
                  className='inline stroke-black hover:stroke-blue-500 border border-black rounded-md'
                  width={24}
                  height={24}
                />
              </button>
            </div>
          }
          {savedGroups.map((savedGroup) => {
            return (
              <NodeSelectorButton
                deleteMode={groupDelete}
                key={savedGroup.groupName}
                onClick={() => {
                  groupDelete
                    ? deleteGroup(savedGroup.groupName)
                    : onLoadSavedGroup(savedGroup)
                }}
              >
                {
                  groupDelete &&
                  <TrashSvg
                    className='stroke-red hover:stroke-white'
                    width={24}
                    height={24}
                  />
                }
                <div>
                  {savedGroup.groupName}
                </div>
              </NodeSelectorButton>
            )
          })}
        </div>
      }
    </div>
  )
}

export default NodeSelector