import { LogRecord } from "@/app/_lib/log";
import { SteadyStateFilterOptions } from "@/app/_lib/log";

export type SteadyStateFilterWorkerMessage =
  | {
      type: "run";
      data: {
        sourceLogs: LogRecord[];
        options: SteadyStateFilterOptions;
      };
    }
  | { type: "kill" };

export type SteadyStateFilterWorkerResult =
  | { type: "data"; data: { logs: LogRecord[] } }
  | { type: "error"; error: Error };

export interface SteadyStateFilterWorker extends Worker {
  postMessage(message: SteadyStateFilterWorkerMessage): void;
  onmessage: ((this: Worker, ev: MessageEvent<SteadyStateFilterWorkerResult>) => any) | null;
}
