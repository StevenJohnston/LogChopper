import { LogRecord } from "@/app/_lib/log";
import {
  ExternalWorker,
  WorkerMessage,
  WorkerResult,
} from "@/app/_lib/worker-utilts";

interface WorkerResponse {
  logs: LogRecord[];
}
interface WorkerRequest {
  sourceLogs: LogRecord[];
}

export const AfrShiftWorkerType = "AfrShiftWorker";
export type AfrShiftWorkerMessage = WorkerMessage<WorkerRequest>;
export type AfrShiftWorkerResult = WorkerResult<WorkerResponse>;

export interface AfrShiftWorker
  extends ExternalWorker<AfrShiftWorkerMessage, AfrShiftWorkerResult> {}
