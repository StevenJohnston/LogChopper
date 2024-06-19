import {
  CombineWorkerMessage,
  CombineWorkerResult,
} from "@/app/_components/FlowNodes/Combine/CombineWorkerTypes";
import { MapCombine } from "@/app/_lib/rom";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<CombineWorkerMessage, CombineWorkerResult> {}

ctx.onmessage = async (
  event: MessageEvent<CombineWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      const table = MapCombine(
        event.data.data.sourceTable,
        event.data.data.joinTable,
        event.data.data.func
      );

      if (!table) {
        console.log("Failed to MapCombine for CombineWorker");
        throw new Error("Failed to MapCombine for CombineWorker");
      }
      ctx.postMessage({ type: "data", data: { table } });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError("CombineWorker received kill message"),
    });
    ctx.close();
  }
};
