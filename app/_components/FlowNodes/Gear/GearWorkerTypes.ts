import { LogRecord, GearRatios } from "@/app/_lib/log";
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
  gearRatios: GearRatios;
  lookahead: number;
  enableFilter?: boolean;
  invertFilter?: boolean;
  maxAccuracy?: number;
  filterWindowSeconds?: number;
}

export const GearWorkerType = "GearWorker";
export type GearWorkerMessage = WorkerMessage<WorkerRequest>;
export type GearWorkerResult = WorkerResult<WorkerResponse>;

export interface GearWorker
  extends ExternalWorker<GearWorkerMessage, GearWorkerResult> {}
