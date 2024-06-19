import {
  CombineAdvancedTableWorkerMessage,
  CombineAdvancedTableWorkerResult,
} from "@/app/_components/FlowNodes/CombineAdvancedTable/CombineAdvancedTableWorkerTypes";
import { MapCombineAdv } from "@/app/_lib/rom";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<
    CombineAdvancedTableWorkerMessage,
    CombineAdvancedTableWorkerResult
  > {}

ctx.onmessage = async (
  event: MessageEvent<CombineAdvancedTableWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      const table = MapCombineAdv(
        event.data.data.sourceTable,
        event.data.data.destTable,
        event.data.data.matchCriteria
      );

      if (!table) {
        console.log("Failed to MapCombineAdv for CombineAdvancedTableWorker");
        throw new Error(
          "Failed to MapCombineAdv for CombineAdvancedTableWorker"
        );
      }
      ctx.postMessage({ type: "data", data: { table } });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError(
        "CombineAdvancedTableWorker received kill message"
      ),
    });
    ctx.close();
  }
};
