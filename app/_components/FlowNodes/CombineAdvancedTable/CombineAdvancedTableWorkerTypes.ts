import { MatchCriteria } from "@/app/_lib/rom";
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
  matchCriteria: MatchCriteria[];
  sourceTable: BasicTable;
  destTable: BasicTable;
}

export const CombineAdvancedTableWorkerType = "CombineAdvancedTableWorker";
export type CombineAdvancedTableWorkerMessage = WorkerMessage<WorkerRequest>;
export type CombineAdvancedTableWorkerResult = WorkerResult<WorkerResponse>;

export interface CombineAdvancedTableWorker
  extends ExternalWorker<
    CombineAdvancedTableWorkerMessage,
    CombineAdvancedTableWorkerResult
  > {}
