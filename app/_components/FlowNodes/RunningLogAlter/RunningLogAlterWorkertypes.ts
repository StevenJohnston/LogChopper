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
  newFieldName: string;
  alterFunc: string;
  untilFunc: string;
}

export const RunningLogAlterWorkerType = "RunningLogAlterWorker";
export type RunningLogAlterWorkerMessage = WorkerMessage<WorkerRequest>;
export type RunningLogAlterWorkerResult = WorkerResult<WorkerResponse>;

export interface RunningLogAlterWorker
  extends ExternalWorker<
    RunningLogAlterWorkerMessage,
    RunningLogAlterWorkerResult
  > {}
