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
  func: string;
}

export const LogFilterWorkerType = "LogFilterWorker";
export type LogFilterWorkerMessage = WorkerMessage<WorkerRequest>;
export type LogFilterWorkerResult = WorkerResult<WorkerResponse>;

export interface LogFilterWorker
  extends ExternalWorker<LogFilterWorkerMessage, LogFilterWorkerResult> {}
