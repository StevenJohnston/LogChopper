import { BaseLogWorker } from "@/app/_components/FlowNodes/BaseLog/BaseLogWorkerTypes";
import { BaseRomWorker } from "@/app/_components/FlowNodes/BaseRom/BaseRomWorkerTypes";
import { BaseTableWorker } from "@/app/_components/FlowNodes/BaseTable/BaseTableWorkerTypes";
import { CombineWorker } from "@/app/_components/FlowNodes/Combine/CombineWorkerTypes";
import { CombineAdvancedTableWorker } from "@/app/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableWorkerTypes";
import { FillLogTableWorker } from "@/app/_components/FlowNodes/FillLogTable/FillLogTableWorkerTypes";
import { FillTableWorker } from "@/app/_components/FlowNodes/FillTable/FillTableWorkerTypes";
import { LogAlterWorker } from "@/app/_components/FlowNodes/LogAlter/LogAlterWorkerTypes";
import { LogFilterWorker } from "@/app/_components/FlowNodes/LogFilter/LogFilterWorkertypes";
import { RunningLogAlterWorker } from "@/app/_components/FlowNodes/RunningLogAlter/RunningLogAlterWorkertypes";

export interface RunMessage<T> {
  type: "run";
  data: T;
}
export interface KillMessage {
  type: "kill";
}

export type WorkerMessage<T> = RunMessage<T> | KillMessage;

interface DataResult<T> {
  type: "data";
  data: T;
}
interface ErrorResult {
  type: "error";
  error: Error;
}

export type WorkerResult<T> = DataResult<T> | ErrorResult;

export type MyWorker =
  | BaseLogWorker
  | BaseRomWorker
  | BaseTableWorker
  | CombineWorker
  | CombineAdvancedTableWorker
  | FillLogTableWorker
  | FillTableWorker
  | LogAlterWorker
  | LogFilterWorker
  | RunningLogAlterWorker;

type TransferOrOptions = Transferable[] | StructuredSerializeOptions;
export interface ExternalWorker<MessageIn, MessageOut>
  extends Omit<Worker, "onmessage" | "postMessage"> {
  onmessage:
    | ((
        this: ExternalWorker<MessageIn, MessageOut>,
        ev: MessageEvent<MessageOut>
      ) => Promise<any>)
    | null;
  postMessage(message: MessageIn, optionsOrTransfer?: TransferOrOptions): void;
  // postMessage(message: MessageIn): void;
  // postMessage(message: MessageIn, transfer: Transferable[]): void;
  // postMessage(message: MessageIn, options?: StructuredSerializeOptions): void;
  // postMessage(message: KillMessage, options?: StructuredSerializeOptions): void;
  // postMessage(message: KillMessage): void;
}

export interface InternalWorker<MessageIn, MessageOut>
  extends Omit<Window, "onmessage" | "postMessage"> {
  onmessage:
    | ((
        this: InternalWorker<MessageIn, MessageOut>,
        ev: MessageEvent<MessageIn>
      ) => Promise<any>)
    | null;
  postMessage(message: MessageOut, transfer: Transferable[]): void;
  postMessage(message: MessageOut, options?: StructuredSerializeOptions): void;
}

export class KilledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KilledError";
  }
}
