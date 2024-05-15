'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { shallow } from 'zustand/shallow';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  OnConnect,
  OnConnectStart,
  OnConnectEnd,
  ReactFlowInstance,
  Connection
} from 'reactflow';
import { v4 as uuid } from "uuid";

import 'reactflow/dist/style.css';

import BaseTableNode from '@/app/_components/FlowNodes/BaseTable/BaseTableNode'
import BaseLogNode from "@/app/_components/FlowNodes/BaseLog/BaseLogNode";
import ForkNode, { newForkData } from "@/app/_components/FlowNodes/ForkNode/ForkNode";
import useFlow, { RFState } from '@/app/store/useFlow';
import LogFilterNode from "@/app/_components/FlowNodes/LogFilter/LogFilterNode";
import FillTableNode from "@/app/_components/FlowNodes/FillTable/FillTableNode";
import FillLogTableNode from "@/app/_components/FlowNodes/FillLogTable/FillLogTableNode";
import GroupNode from "@/app/_components/FlowNodes/Group/GroupNode";
import { ForkNodeType, ForkType } from "@/app/_components/FlowNodes/ForkNode/ForkTypes";
import CombineNode from "@/app/_components/FlowNodes/Combine/CombineNode";
import CombineAdvancedTableNode from "@/app/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableNode";
import LogAlterNode from "@/app/_components/FlowNodes/LogAlter/LogAlterNode";

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  addNode: state.addNode,
  addEdge: state.addEdge,
  reactFlowInstance: state.reactFlowInstance,
  setReactFlowInstance: state.setReactFlowInstance,
  onNodeDragStop: state.onNodeDragStop,
});

const Flow: React.FC = () => {
  const { nodes, edges, reactFlowInstance, onNodeDragStop, setReactFlowInstance, onNodesChange, onEdgesChange, onConnect, addNode, addEdge } = useFlow(selector, shallow);
  const nodeTypes = useMemo(() => {
    return { BaseTableNode, BaseLogNode, ForkNode, LogFilterNode, LogAlterNode, FillTableNode, FillLogTableNode, GroupNode, CombineNode, CombineAdvancedTableNode }
  }, [])



  const connectingNodeId = useRef<string | null>(null);
  const connectingHandleId = useRef<string | null>(null);

  // const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance>()

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
      if (event?.target instanceof HTMLElement && event instanceof MouseEvent) {
        const targetIsPane = event?.target?.classList.contains('react-flow__pane');

        if (targetIsPane) {
          // we need to remove the wrapper bounds, in order to get the correct position
          const id = uuid();
          const newNode: ForkNodeType = {
            id,
            type: ForkType,
            position: reactFlowInstance.screenToFlowPosition({
              x: event.clientX,
              y: event.clientY,
            }),
            data: newForkData(),
          };

          addNode(newNode)

          addEdge({
            id: id,
            source: connectingNodeId.current,
            target: id,
            sourceHandle: connectingHandleId.current,
            style: {
              stroke: "black"
            }
          })
        }
      }
    },
    [addEdge, addNode, reactFlowInstance],
  );

  const [realReactFlowInstance, setRealReactFlowInstance] = useState<ReactFlowInstance>()

  // Ensures after store refrest reactFlowInstance is synced
  useEffect(() => {
    if (!realReactFlowInstance) return
    if (reactFlowInstance != realReactFlowInstance) {
      setReactFlowInstance(realReactFlowInstance)
    }
  }, [reactFlowInstance, realReactFlowInstance])

  const isValidConnection = useCallback((c: Connection): boolean => {
    if (c.sourceHandle?.split("#")[0] != c.targetHandle?.split("#")[0]) {
      return false
    }
    // Don't allow duplicate connections
    if (edges.find(e => e.target == c.target && e.targetHandle == c.targetHandle)) {
      console.log('isValidConnection duplicate connection not allowed')
      return false
    }
    return true
  }, [edges])

  useEffect(() => {
    if (!realReactFlowInstance) return
    if (reactFlowInstance != realReactFlowInstance) {
      setReactFlowInstance(realReactFlowInstance)
    }
  }, [reactFlowInstance, realReactFlowInstance])

  useEffect(() => { console.log("Flow Full rerendered") }, [])

  return (
    <div className="w-full h-full">

      <ReactFlow
        onInit={setRealReactFlowInstance}
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodeDragStop={onNodeDragStop}
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