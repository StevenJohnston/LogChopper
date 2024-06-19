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
  selectedLogFiles: File[];
}

export const BaseLogWorkerType = "BaseLogWorker";
export type BaseLogWorkerMessage = WorkerMessage<WorkerRequest>;
export type BaseLogWorkerResult = WorkerResult<WorkerResponse>;

export interface BaseLogWorker
  extends ExternalWorker<BaseLogWorkerMessage, BaseLogWorkerResult> {}
