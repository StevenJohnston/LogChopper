
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

export const TpsAfrDeleteWorkerType = "TpsAfrDeleteWorker";
export type TpsAfrDeleteWorkerMessage = WorkerMessage<WorkerRequest>;
export type TpsAfrDeleteWorkerResult = WorkerResult<WorkerResponse>;

export interface TpsAfrDeleteWorker
  extends ExternalWorker<TpsAfrDeleteWorkerMessage, TpsAfrDeleteWorkerResult> {}
