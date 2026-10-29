import { BasicTable } from "@/app/_lib/rom-metadata";
import { LogRecord } from "@/app/_lib/log";
import { MatTempInvarianceOptions, MatTempInvarianceResult } from "@/app/_lib/rom";

export interface MatFuelCompWorkerInput {
  baseTable: BasicTable;
  logs: LogRecord[];
  options: MatTempInvarianceOptions;
}

export type MatFuelCompWorkerMessage =
  | {
      type: "run";
      data: MatFuelCompWorkerInput;
    }
  | { type: "kill" };

export type MatFuelCompWorkerResult =
  | {
      type: "data";
      data: {
        result: MatTempInvarianceResult | null;
      };
    }
  | { type: "error"; error: Error };

export interface MatFuelCompWorker extends Worker {
  postMessage(message: MatFuelCompWorkerMessage): void;
  onmessage: ((this: Worker, ev: MessageEvent<MatFuelCompWorkerResult>) => any) | null;
}
