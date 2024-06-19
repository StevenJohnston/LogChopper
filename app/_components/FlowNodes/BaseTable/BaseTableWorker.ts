import {
  BaseTableWorkerMessage,
  BaseTableWorkerResult,
} from "@/app/_components/FlowNodes/BaseTable/BaseTableWorkerTypes";
import { getFilledTable } from "@/app/_lib/rom";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<BaseTableWorkerMessage, BaseTableWorkerResult> {}

ctx.onmessage = async (
  event: MessageEvent<BaseTableWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      const selectedTable = event.data.data.tableMap[event.data.data.tableKey];

      const table = await getFilledTable(
        event.data.data.selectedRomFile,
        event.data.data.scalingMap,
        selectedTable
      );
      if (!table) {
        console.log("Failed to getFilledTable for newBaseTableData");
        throw new Error("Failed to getFilledTable for BaseTableWorker");
      }
      ctx.postMessage({ type: "data", data: { table } });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError("BaseTableWorker received kill message"),
    });
    ctx.close();
  }
};
