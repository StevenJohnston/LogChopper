import {
  TpsAfrDeleteWorkerMessage,
  TpsAfrDeleteWorkerResult,
} from "@/app/_components/FlowNodes/TpsAfrDelete/TpsAfrDeleteWorkerTypes";
import { markTpsAfrAffectedRecordsForDeletion } from "@/app/_lib/log";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<TpsAfrDeleteWorkerMessage, TpsAfrDeleteWorkerResult> {}

ctx.onmessage = async (
  event: MessageEvent<TpsAfrDeleteWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      markTpsAfrAffectedRecordsForDeletion(event.data.data.sourceLogs);
      ctx.postMessage({
        type: "data",
        data: { logs: event.data.data.sourceLogs },
      });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError("TpsAfrDeleteWorker received kill message"),
    });
    ctx.close();
  }
};
