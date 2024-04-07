'use client'

import { GroupData } from "@/app/_components/FlowNodes/Group/GroupNodeTypes";
import useFlow, { RFState } from "@/app/store/useFlow";
import { useCallback, useMemo } from "react";
import { NodeProps, NodeResizer, Node, Edge } from "reactflow";
import { shallow } from "zustand/shallow";


export function newGroup(): GroupData {
  return {
    height: 400,
    width: 400,
    refresh: async function (node: Node): Promise<void> {
      console.log("Refresh newgroup")
    },
    save: function (node: Node, nodes: Node[], edges: Edge[]) {
      console.log("Saving Group")
      //TODO get children

      //TODO get Edges
      //TODO save to persistent zustand
      return "wow"
    },
    load: function (json: string) {
      console.log("Loading group")
      return
    }
  }
}

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  updateEdge: state.updateEdge,
  updateNode: state.updateNode
});

function GroupNode({ id, data }: NodeProps<GroupData>) {
  const { nodes, edges } = useFlow(selector, shallow);
  const node = useMemo(() => {
    return nodes.find(n => n.id == id)
  }, [data, nodes, edges])

  const onSave = useCallback(() => {
    if (!node) return console.log(`Error saving group node: could not find node in store ${id}`)
    data.save(node, nodes, edges)
  }, [node, nodes, edges, id, data])
  return (
    <>
      <NodeResizer color="red" minWidth={100} minHeight={100} handleStyle={{ width: 8, height: 8, borderRadius: 3, backgroundColor: "blue" }} />
      <div
        className={`drag-handle bg-red-500 bg-opacity-50 w-full h-full`}
      >

        <div
          className='flex justify-between'
        >

          <div className='pr-2'>Group Node</div>
          <button className='border rounded border-black p-1'
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}

export default GroupNode