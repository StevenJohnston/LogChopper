import { LogRecord } from "@/app/_lib/log";
import { BasicTable, LogTable } from "@/app/_lib/rom-metadata";
import {
  ExternalWorker,
  WorkerMessage,
  WorkerResult,
} from "@/app/_lib/worker-utilts";

interface WorkerResponse {
  table: LogTable;
}
interface WorkerRequest {
  weighted: boolean;
  sourceTable: BasicTable;
  sourceLogs: LogRecord[];
}

export const FillLogTableWorkerType = "FillLogTableWorker";
export type FillLogTableWorkerMessage = WorkerMessage<WorkerRequest>;
export type FillLogTableWorkerResult = WorkerResult<WorkerResponse>;

export interface FillLogTableWorker
  extends ExternalWorker<FillLogTableWorkerMessage, FillLogTableWorkerResult> {}
