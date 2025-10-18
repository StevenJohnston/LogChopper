'use client'
import { memo, useCallback, ChangeEvent } from 'react';
import { Position, NodeProps } from 'reactflow';
import { shallow } from 'zustand/shallow';

import { CustomHandle } from '@/app/_components/FlowNodes/CustomHandle/CustomHandle';
import { AfrMlShifterData, AfrMlShifterNodeType, AfrShiftMethod, AfrMlShifterTargetLogHandleId, AfrMlShifterSourceLogHandleId } from './AfrMlShifterTypes';
import useFlow from '@/app/store/useFlow';
import { RefreshableNode } from '@/app/_components/FlowNodes/FlowNodesTypes';

const AfrMlShifterNode = ({ id }: NodeProps<AfrMlShifterData>) => {
  const { updateNode, nodeData } = useFlow(state => ({
    updateNode: state.updateNode,
    nodeData: state.nodes.find(n => n.id === id)?.data,
    updateNodeData: state.updateNodeData,
  }), shallow);

  const handleTrainClick = useCallback(() => {
    const node = useFlow.getState().nodes.find(n => n.id === id) as AfrMlShifterNodeType;
    if (!node) {
      console.error('Could not find self node in store');
      return;
    }

    // Incrementing runCounter will trigger the useFlow effect to re-run the worker
    updateNode({
      ...node,
      data: node.data.clone({
        runCounter: node.data.runCounter + 1,
        loading: true, // Set loading state
      })
    });
  }, [id, updateNode]);

  const handleMethodChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const node = useFlow.getState().nodes.find(n => n.id === id) as AfrMlShifterNodeType;
    if (!node) return;

    updateNode({
      ...node,
      data: node.data.clone({ method: event.target.value as AfrShiftMethod })
    });
  }, [id, updateNode]);

  const isTraining = nodeData instanceof RefreshableNode ? nodeData.loading : false;
  const hasInput = nodeData instanceof RefreshableNode ? nodeData.activeUpdate !== null : false; // A better check for input connection

  if (!nodeData) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`rounded-md border border-gray-600 bg-gray-800 p-2 text-white shadow-lg ${isTraining ? 'animate-pulse' : ''}`}>
      <CustomHandle type="target" position={Position.Left} dataType="Log" id={AfrMlShifterTargetLogHandleId} />
      <div className="p-2">
        <div className="drag-handle font-bold text-center">AFR ML Shifter</div>

        <div className="my-2">
          <label htmlFor="afr-method" className="block text-sm font-medium text-gray-300">Method</label>
          <select
            value={nodeData instanceof AfrMlShifterData ? nodeData.method : AfrShiftMethod.CrossCorrelation}
            onChange={handleMethodChange}
            className="nodrag nopan w-full rounded-md bg-gray-700 p-1" // Prevent dragging and panning when interacting with the select
          >
            <option value={AfrShiftMethod.CrossCorrelation}>Cross-Correlation</option>
            <option value={AfrShiftMethod.FlowBasedVariableDelay}>Flow-Based Variable Delay</option>
            <option value={AfrShiftMethod.ThrottleTriggered}>Throttle-Triggered</option>
            <option value={AfrShiftMethod.SavitzkyGolay}>Savitzky-Golay</option>
            <option value={AfrShiftMethod.MachineLearning}>Machine Learning</option>
            <option value={AfrShiftMethod.PredictiveModel}>Predictive Model</option>
            <option value={AfrShiftMethod.PredictiveModelMAF}>Predictive Model (MAF)</option>
            <option value={AfrShiftMethod.OffsetRegression}>Offset Regression</option>
          </select>
        </div>

        <div className="my-2">
          <button
            onClick={handleTrainClick}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-500"
            disabled={isTraining || !hasInput}
          >
            {isTraining ? 'Processing...' : 'Run Shift'}
          </button>
        </div>
        <div className="text-sm text-gray-400">
          <div>Status: {nodeData instanceof AfrMlShifterData ? nodeData.status : 'N/A'}</div>
          {isTraining && (
            <div className="mt-1 w-full bg-gray-600 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${nodeData instanceof AfrMlShifterData ? nodeData.progress : 0}%` }}></div>
            </div>
          )}
        </div>
      </div>
      <CustomHandle type="source" position={Position.Right} dataType="Log" id={AfrMlShifterSourceLogHandleId} />
    </div>
  );
};

export default memo(AfrMlShifterNode);
