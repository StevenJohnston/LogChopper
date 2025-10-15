import { BasicTable } from "@/app/_lib/rom-metadata";
import {
  ExternalWorker,
  WorkerMessage,
  WorkerResult,
} from "@/app/_lib/worker-utilts";
import { TableRemapAxis, TableRemapSource } from "./TableRemapTypes";

export type TableRemapConfig = {
  commonAxis: TableRemapAxis;
  lookupValueSource: TableRemapAxis;
  searchTarget: TableRemapSource;
  outputSource: TableRemapSource;
};

interface WorkerResponse {
  outputTable: BasicTable;
}
interface WorkerRequest {
  tableA: BasicTable;
  tableB: BasicTable;
  config: TableRemapConfig;
}

export const TableRemapWorkerType = "TableRemapWorker";
export type TableRemapWorkerMessage = WorkerMessage<WorkerRequest>;
export type TableRemapWorkerResult = WorkerResult<WorkerResponse>;

export interface TableRemapWorker
  extends ExternalWorker<
    TableRemapWorkerMessage,
    TableRemapWorkerResult
  > {}
