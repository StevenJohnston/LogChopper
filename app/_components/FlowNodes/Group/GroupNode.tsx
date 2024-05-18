'use client'

import { GroupData, GroupNodeType, GroupType, InitGroupData } from "@/app/_components/FlowNodes/Group/GroupNodeTypes";
import useFlow, { MyNode, RFState } from "@/app/store/useFlow";
import useNodeStorage, { NodeStorageState } from "@/app/store/useNodeStorage";
import { ChangeEvent, useCallback, useEffect, useMemo } from "react";
import { NodeProps, NodeResizer, Edge, Node } from "reactflow";
import { shallow } from "zustand/shallow";


export function newGroup({ name, locked }: InitGroupData): GroupData<InitGroupData> {
  return {
    name,
    locked,
    getLoadable: function (): InitGroupData {
      return {
        name: this.name,
        locked: this.locked
      }
    },
  }
}

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  updateEdge: state.updateEdge,
  updateNode: state.updateNode,
  flowInstance: state.reactFlowInstance
});

const nodeStorageSelector = (state: NodeStorageState) => ({
  savedGroups: state.savedGroups,
  saveGroup: state.saveGroup,
});

function GroupNode({ id, data }: NodeProps<GroupData<InitGroupData>>) {
  const { flowInstance, nodes, edges, updateNode } = useFlow(selector, shallow);
  const { savedGroups, saveGroup } = useNodeStorage(nodeStorageSelector, shallow)
  useEffect(() => {
    console.log("savedGroups", savedGroups)
  }, [savedGroups])

  const node: GroupNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == GroupType) {
        return n
      }
    }
  }, [id, nodes])

  const onSave = useCallback(() => {
    if (!flowInstance) return console.log("Error saving due to missing flowInstance")
    if (!node) return console.log(`Error saving group node: could not find node in store ${id}`)
    if (!node.data) return console.log("Error saving group node: Missing data")
    const saveNodes: Node[] = []
    const saveEdges: Edge[] = []
    saveNodes.push({
      ...node,
      data: node.data.getLoadable()
    })

    const interNodes: MyNode[] = flowInstance.getIntersectingNodes(
      node
    ) as MyNode[];

    const interNodeIds: Record<string, boolean> = {}

    for (const interNode of interNodes) {
      interNodeIds[interNode.id] = true
      saveNodes.push({
        ...interNode,
        data: interNode.data.getLoadable()
      })
    }

    for (const edge of edges) {
      if (interNodeIds[edge.source] && interNodeIds[edge.target]) {
        saveEdges.push(edge)
      }
    }
    saveGroup({ groupName: data.name, nodes: saveNodes as MyNode[], edges: saveEdges })
  }, [flowInstance, node, edges, id, data, saveGroup])


  const onGroupNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!node) return
    updateNode({ ...node, data: { ...node.data, name: event.target.value } })
  }, [node, updateNode])

  if (!node) {
    return <div>Loading Group Node</div>
  }
  return (
    <>
      <NodeResizer color="red" minWidth={100} minHeight={100} handleStyle={{ width: 8, height: 8, borderRadius: 3, backgroundColor: "blue" }} />
      <div
        className={`drag-handle bg-red-500 bg-opacity-50 w-full h-full`}
      >

        <div
          className='flex justify-between'
        >
          {/* <div className='pr-2'>{data.name}</div> */}
          <input
            className={`focus:bg-transparent bg-inherit h-4 m-1`}
            type="text"
            value={data.name}
            onChange={onGroupNameChange}
          />
          <div>

            <button className='border rounded border-black p-1'
              onClick={() => {
                updateNode({ ...node, data: { ...node.data, locked: !node.data.locked } })
              }}
            >
              {data.locked ? "Locked" : "Unlocked"}
            </button>
            <button className='border rounded border-black p-1'
              onClick={onSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default GroupNode