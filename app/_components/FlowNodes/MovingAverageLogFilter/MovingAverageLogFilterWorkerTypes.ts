import { Direction, LogRecord } from "@/app/_lib/log";
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
  logField: keyof LogRecord;
  durationSeconds: number;
  maxDeviation: number;
  direction: Direction;
}

export const MovingAverageLogFilterWorkerType = "MovingAverageLogFilterWorker";
export type MovingAverageLogFilterWorkerMessage = WorkerMessage<WorkerRequest>;
export type MovingAverageLogFilterWorkerResult = WorkerResult<WorkerResponse>;

export interface MovingAverageLogFilterWorker
  extends ExternalWorker<
    MovingAverageLogFilterWorkerMessage,
    MovingAverageLogFilterWorkerResult
  > {}
