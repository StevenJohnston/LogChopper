import { Aggregator } from "@/app/_lib/consts";
import { LogRecord } from "@/app/_lib/log";
import { BasicTable, LogTable } from "@/app/_lib/rom-metadata";
import {
  ExternalWorker,
  WorkerMessage,
  WorkerResult,
} from "@/app/_lib/worker-utilts";

interface WorkerResponse {
  table: BasicTable;
}
interface WorkerRequest {
  logField: keyof LogRecord;
  aggregator: Aggregator;
  sourceTable: LogTable;
}

export const FillTableWorkerType = "FillTableWorker";
export type FillTableWorkerMessage = WorkerMessage<WorkerRequest>;
export type FillTableWorkerResult = WorkerResult<WorkerResponse>;

export interface FillTableWorker
  extends ExternalWorker<FillTableWorkerMessage, FillTableWorkerResult> {}
