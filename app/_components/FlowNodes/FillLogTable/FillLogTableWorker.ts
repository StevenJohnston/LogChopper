import {
  FillLogTableWorkerMessage,
  FillLogTableWorkerResult,
} from "@/app/_components/FlowNodes/FillLogTable/FillLogTableWorkerTypes";
import { FillTableFromLog } from "@/app/_lib/rom";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<FillLogTableWorkerMessage, FillLogTableWorkerResult> {}

ctx.onmessage = async (
  event: MessageEvent<FillLogTableWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      const table = FillTableFromLog(
        event.data.data.sourceTable,
        event.data.data.sourceLogs,
        event.data.data.weighted
      );

      if (!table) {
        console.log("Failed to FillTableFromLog for FillLogTableWorker");
        throw new Error("Failed to FillTableFromLog for FillLogTableWorker");
      }
      ctx.postMessage({ type: "data", data: { table } });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError("FillLogTableWorker received kill message"),
    });
    ctx.close();
  }
};
