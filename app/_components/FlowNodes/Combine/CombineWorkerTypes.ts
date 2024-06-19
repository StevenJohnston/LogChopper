import { BasicTable } from "@/app/_lib/rom-metadata";
import {
  ExternalWorker,
  WorkerMessage,
  WorkerResult,
} from "@/app/_lib/worker-utilts";

interface WorkerResponse {
  table: BasicTable;
}
interface WorkerRequest {
  func: string;
  sourceTable: BasicTable;
  joinTable: BasicTable;
}

export const CombineWorkerType = "CombineWorker";
export type CombineWorkerMessage = WorkerMessage<WorkerRequest>;
export type CombineWorkerResult = WorkerResult<WorkerResponse>;

export interface CombineWorker
  extends ExternalWorker<CombineWorkerMessage, CombineWorkerResult> {}
