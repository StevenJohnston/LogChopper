import {
  ExternalWorker,
  WorkerMessage,
  WorkerResult,
} from "@/app/_lib/worker-utilts";

export interface WorkerResponse {}
export interface WorkerRequest {}

export const BaseRomWorkerType = "BaseRomWorker";
export type BaseRomWorkerMessage = WorkerMessage<WorkerRequest>;
export type BaseRomWorkerResult = WorkerResult<WorkerResponse>;

export interface BaseRomWorker
  extends ExternalWorker<BaseRomWorkerMessage, BaseRomWorkerResult> {}
