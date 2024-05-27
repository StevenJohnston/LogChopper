'use client'

import { BaseLogData, BaseLogNodeType, BaseLogType } from "@/app/_components/FlowNodes/BaseLog/BaseLogTypes";
import { CustomHandle } from "@/app/_components/FlowNodes/CustomHandle/CustomHandle";
import { loadLogs } from "@/app/_lib/log";
import useFlow, { RFState } from "@/app/store/useFlow";
import useRom from "@/app/store/useRom";
import { useEffect, useMemo, useState } from "react";
import { NodeProps, Node, Position } from "reactflow";
import { shallow } from "zustand/shallow";

export function newBaseLogData(): BaseLogData {
  return {
    logs: [],
    refresh: async function (node: Node): Promise<void> {
      this.logs = await loadLogs(node.data.selectedLogs);
    },
    getLoadable: () => ({})
  }
}

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  updateEdge: state.updateEdge,
  updateNode: state.updateNode,
  flowInstance: state.reactFlowInstance
});

function BaseLogNode({ id, data, isConnectable }: NodeProps<BaseLogData>) {
  const [expanded, setExpanded] = useState<boolean>(true)

  const { nodes, updateNode } = useFlow(selector, shallow);
  const { selectedLogs } = useRom()

  const node: BaseLogNodeType | undefined = useMemo(() => {
    for (const n of nodes) {
      if (n.id == id && n.type == BaseLogType) {
        return n
      }
    }
  }, [id, nodes])


  useEffect(() => {
    if (!node) return console.log("BaseLogNode node missing")
    if (!selectedLogs) return console.log("BaseLogNode selectedLogs missing")

    updateNode({
      ...node,
      data: {
        ...node.data,
        selectedLogs
      }
    } as BaseLogNodeType)
  }, [selectedLogs, updateNode])

  return (
    <div
      className={`flex flex-col p-2 border border-black rounded bg-blue-400/50 ${data.loading && 'animate-pulse'}`}
      onDoubleClick={() => setExpanded(!expanded)}
    >
      <div className='flex justify-between drag-handle'>
        <div className='pr-2'>Selected Logs</div>
        <button className='border-2 border-black w-8 h-8'
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "_" : "^"}
        </button>

      </div>
      {
        expanded
        && <div>
          {
            selectedLogs.map(l => <div key={`${l.kind}-${l.name}`}>{l.name}</div>)
          }
        </div>
      }
      <CustomHandle type="source" dataType='Log' position={Position.Right} id="LogOut" isConnectable={isConnectable} />
    </div>
  );
}

export default BaseLogNode