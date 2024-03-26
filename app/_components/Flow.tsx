import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Scaling, Table } from "../_lib/rom-metadata";
import TableUI from "./TableUI";
import { getFilledTable } from "../_lib/rom";
import Surface from "./Surface";
import { shallow } from 'zustand/shallow';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  OnConnect,
  OnConnectStart,
  OnConnectEnd,
  useReactFlow,
  ReactFlowInstance,
  Connection
} from 'reactflow';

import 'reactflow/dist/style.css';

import BaseTableNode from '@/app/_components/FlowNodes/BaseTableNode'
import BaseLogNode from "@/app/_components/FlowNodes/BaseLogNode";
import CombineNode, { CombineNodeType } from "@/app/_components/FlowNodes/CombineNode";
import useFlow, { RFState } from '@/app/store/useFlow';
import { uuid } from "uuidv4";
import LogFilterNode from "@/app/_components/FlowNodes/LogFilterNode";
import FillTableNode from "@/app/_components/FlowNodes/FillTableNode";

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  addNode: state.addNode,
  addEdge: state.addEdge
});

const Flow: React.FC = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, addEdge } = useFlow(selector, shallow);
  const nodeTypes = useMemo(() => ({ BaseTableNode, BaseLogNode, CombineNode, LogFilterNode, FillTableNode }), [])

  useEffect(() => { console.log("Flow rerendered") }, [])

  const connectingNodeId = useRef<string | null>(null);
  const connectingHandleId = useRef<string | null>(null);

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>()

  const onConnectWrapper: OnConnect = useCallback(
    (params) => {
      connectingNodeId.current = null;
      onConnect(params)
    },
    [onConnect],
  );

  const onConnectStart = useCallback<OnConnectStart>((event, { nodeId, handleId }) => {
    connectingNodeId.current = nodeId;
    connectingHandleId.current = handleId;
  }, []);

  const onConnectEnd = useCallback<OnConnectEnd>(
    (event) => {
      if (!reactFlowInstance) return;
      if (!connectingNodeId.current) return;

      const targetIsPane = event.target.classList.contains('react-flow__pane');

      if (targetIsPane) {
        // we need to remove the wrapper bounds, in order to get the correct position
        const id = uuid();
        const newNode: CombineNodeType = {
          id,
          type: "CombineNode",
          position: reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          }),
          data: {

          },
          origin: [0.5, 0.0],
        };

        addNode(newNode)

        addEdge({
          id: id,
          source: connectingNodeId.current,
          target: id,
          sourceHandle: connectingHandleId.current
        })
      }
    },
    [reactFlowInstance],
  );

  const isValidConnection = useCallback((c: Connection): boolean => {
    if (c.sourceHandle?.split("#")[0] != c.targetHandle?.split("#")[0]) return false

    if (edges.find(e => e.target == e.target && e.targetHandle == c.targetHandle)) {
      return false
    }
    return true
  }, [nodes, edges])

  return (
    <div className="w-full h-full">
      <ReactFlow
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnectWrapper}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        isValidConnection={isValidConnection}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default Flow;