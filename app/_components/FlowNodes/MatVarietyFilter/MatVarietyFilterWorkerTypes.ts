import { LogRecord, MatVarietyFilterOptions, MatVarietyFilterResult } from "@/app/_lib/log";

export type MatVarietyFilterWorkerMessage =
  | {
      type: "run";
      data: {
        sourceLogs: LogRecord[];
        options: MatVarietyFilterOptions;
      };
    }
  | { type: "kill" };

export type MatVarietyFilterWorkerResult =
  | { type: "data"; data: { logs: LogRecord[]; result: MatVarietyFilterResult } }
  | { type: "error"; error: Error };

export interface MatVarietyFilterWorker extends Worker {
  postMessage(message: MatVarietyFilterWorkerMessage): void;
  onmessage: ((this: Worker, ev: MessageEvent<MatVarietyFilterWorkerResult>) => any) | null;
}
