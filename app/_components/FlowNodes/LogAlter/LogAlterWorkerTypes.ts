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
  func: string;
  newLogField: string;
  sourceLogs: LogRecord[];
}

export const LogAlterWorkerType = "LogAlterWorker";
export type LogAlterWorkerMessage = WorkerMessage<WorkerRequest>;
export type LogAlterWorkerResult = WorkerResult<WorkerResponse>;

export interface LogAlterWorker
  extends ExternalWorker<LogAlterWorkerMessage, LogAlterWorkerResult> {}
