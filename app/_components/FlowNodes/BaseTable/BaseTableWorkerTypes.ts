import { BasicTable, Scaling } from "@/app/_lib/rom-metadata";
import {
  ExternalWorker,
  WorkerMessage,
  WorkerResult,
} from "@/app/_lib/worker-utilts";

interface WorkerResponse {
  table: BasicTable;
}
interface WorkerRequest {
  scalingMap: Record<string, Scaling>;
  tableMap: Record<string, BasicTable>;
  selectedRomFile: File;
  tableKey: string;
}

export const BaseTableWorkerType = "BaseTableWorker";
export type BaseTableWorkerMessage = WorkerMessage<WorkerRequest>;
export type BaseTableWorkerResult = WorkerResult<WorkerResponse>;

export interface BaseTableWorker
  extends ExternalWorker<BaseTableWorkerMessage, BaseTableWorkerResult> {}
