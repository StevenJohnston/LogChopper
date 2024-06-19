import {
  FillTableWorkerMessage,
  FillTableWorkerResult,
} from "@/app/_components/FlowNodes/FillTable/FillTableWorkerTypes";
import { FillLogTable } from "@/app/_lib/rom";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<FillTableWorkerMessage, FillTableWorkerResult> {}

ctx.onmessage = async (
  event: MessageEvent<FillTableWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      const table = FillLogTable(
        event.data.data.sourceTable,
        event.data.data.logField,
        event.data.data.aggregator
      );

      if (!table) {
        console.log("Failed to FillTableFromLog for FillTableWorker");
        throw new Error("Failed to FillTableFromLog for FillTableWorker");
      }
      ctx.postMessage({ type: "data", data: { table } });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError("FillTableWorker received kill message"),
    });
    ctx.close();
  }
};
