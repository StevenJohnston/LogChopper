'use client'

import { Node } from 'reactflow';
import { MyNode } from '@/app/store/useFlow';
import { Edge } from 'reactflow';
import { getParentsByHandleIds, orderAndTypeArray } from '@/app/_lib/react-flow-utils';
import { LogRecord } from '@/app/_lib/log';
import { RefreshableNode, SaveableNode, LogNode, isRefreshableLogNode, RefreshableLogNode } from '@/app/_components/FlowNodes/FlowNodesTypes';
import { AfrMlShifterWorker, AfrMlShifterWorkerMessage, AfrMlShifterWorkerResult } from './AfrMlShifterWorkerTypes';

export const AfrMlShifterType = "afrMlShifter";

export enum AfrShiftMethod {
  CrossCorrelation = "Cross-Correlation",
  FlowBasedVariableDelay = "Flow-Based Variable Delay",
  ThrottleTriggered = "Throttle-Triggered",
  SavitzkyGolay = "Savitzky-Golay",
  MachineLearning = "Machine Learning",
  PredictiveModel = "Predictive Model",
  PredictiveModelMAF = "Predictive Model (MAF)",
  OffsetRegression = "Offset Regression",
}

export type AfrMlShifterNodeType = Node<AfrMlShifterData, typeof AfrMlShifterType>;

export const AfrMlShifterTargetLogHandleId = "logInput"
export const AfrMlShifterSourceLogHandleId = "logOutput"

export interface AfrMlShifterDataProps {
  logs?: LogRecord[] | null;
  status?: string;
  progress?: number;
  runCounter?: number;
  loading?: boolean;
  activeUpdate?: RefreshableNode<AfrMlShifterData>['activeUpdate'];
  method?: AfrShiftMethod;
}

export class AfrMlShifterData extends RefreshableNode<AfrMlShifterData> implements LogNode, SaveableNode {
  public logs: LogRecord[] | null;
  public status: string;
  public progress: number;
  public runCounter: number;
  public loading: boolean = false;
  public method: AfrShiftMethod;

  constructor({
    logs = null,
    status = 'Ready',
    progress = 0,
    runCounter = 0,
    loading = false,
    activeUpdate = null,
    method = AfrShiftMethod.CrossCorrelation,
  }: AfrMlShifterDataProps) {
    super();
    this.logs = logs;
    this.status = status;
    this.progress = progress;
    this.runCounter = runCounter;
    this.loading = loading;
    this.activeUpdate = activeUpdate;
    this.method = method;
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker();
    const promise = new Promise<AfrMlShifterData>((resolveRefresh, rejectRefresh) => {
      if (node.type !== AfrMlShifterType) {
        const err = new Error(`AfrMlShifterData.addWorkerPromise called with incorrect node type: ${node.type}`);
        rejectRefresh(err);
        return;
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [AfrMlShifterTargetLogHandleId]);
      if (!parentNodes || parentNodes.length === 0) {
        this.logs = null;
        // Not an error, just disconnected
        resolveRefresh(this.clone({ status: 'Ready', progress: 0, loading: false, logs: null }));
        return;
      }

      const [logParent] = orderAndTypeArray<[Node<RefreshableLogNode>]>(parentNodes, [isRefreshableLogNode]);

      logParent.data.activeUpdate?.promise.then(parentData => {
        if (!parentData.logs) {
          rejectRefresh(new Error("Parent logs are missing"));
          return;
        }

        // If we are not in a loading state (i.e., training wasn't manually triggered),
        // just pass the parent's logs through and resolve immediately.
        if (!this.loading) {
          this.logs = parentData.logs;
          resolveRefresh(this.clone({ status: 'Ready to train', progress: 0, loading: false }));
          return;
        }

        worker.onmessage = async ({ data }: MessageEvent<AfrMlShifterWorkerResult>) => {
          if (data.type === "error") {
            console.error("AfrMlShifterWorker error:", data.error);
            rejectRefresh(data.error);
            return Promise.reject(data.error);
          } else if (data.type === "progress") {
            // This is a soft update, so we don't resolve the promise yet
            // The UI will get this from the node data directly
            node.data.status = data.status;
            node.data.progress = data.progress;
            return Promise.resolve();
          } else if (data.type === "data") {
            this.logs = data.data.correctedLogs;
            this.status = 'Done';
            this.progress = 100;
            resolveRefresh(this);
            return Promise.resolve(this);
          }
          return Promise.resolve();
        };

        const workerMessage: AfrMlShifterWorkerMessage = {
          type: "run",
          data: {
            logs: parentData.logs,
            method: this.method,
          }
        };
        worker.postMessage(workerMessage);

      }).catch(e => {
        console.log("AfrMlShifterNode parent promise rejected", e);
        rejectRefresh(e);
      });
    });

    this.activeUpdate = { worker, promise };
  }

  public createWorker(): AfrMlShifterWorker {
    return new Worker(new URL("./AfrMlShifterWorker.ts", import.meta.url));
  }

  public getLoadable() {
    return { runCounter: this.runCounter, method: this.method };
  }

  public clone(updates: Partial<AfrMlShifterData>): AfrMlShifterData {
    return new AfrMlShifterData({
      logs: this.logs,
      status: this.status,
      progress: this.progress,
      runCounter: this.runCounter,
      loading: this.loading,
      activeUpdate: this.activeUpdate,
      method: this.method,
      ...updates
    });
  }
}
