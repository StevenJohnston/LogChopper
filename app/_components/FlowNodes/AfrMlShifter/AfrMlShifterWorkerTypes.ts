import { LogRecord } from "@/app/_lib/log";
import {
  ExternalWorker,
  WorkerMessage,
  WorkerResult,
} from "@/app/_lib/worker-utilts";
import { AfrShiftMethod } from "./AfrMlShifterTypes";

// Data sent from main thread to worker
interface WorkerRequest {
  logs: LogRecord[];
  method: AfrShiftMethod;
}

// Data sent from worker to main thread
interface WorkerResponse {
  correctedLogs: LogRecord[];
}

// Progress updates from worker
export interface WorkerProgress {
  type: 'progress';
  status: string;
  progress: number; // 0-100
}

export const AfrMlShifterWorkerType = "AfrMlShifterWorker";

// The message types the worker can receive
export type AfrMlShifterWorkerMessage = WorkerMessage<WorkerRequest>;

// The result types the worker can post back
export type AfrMlShifterWorkerResult =
  | WorkerResult<WorkerResponse>
  | WorkerProgress;

// The worker interface
export interface AfrMlShifterWorker
  extends ExternalWorker<
    AfrMlShifterWorkerMessage,
    AfrMlShifterWorkerResult
  > {}
