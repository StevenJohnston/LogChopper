import {
  AfrShiftWorkerMessage,
  AfrShiftWorkerResult,
} from "@/app/_components/FlowNodes/AfrShift/AfrShiftWorkertypes";
import { fixAfrLag } from "@/app/_lib/log";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<AfrShiftWorkerMessage, AfrShiftWorkerResult> {}

ctx.onmessage = async (
  event: MessageEvent<AfrShiftWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      fixAfrLag(event.data.data.sourceLogs, {});
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
      error: new KilledError("AfrShiftWorker received kill message"),
    });
    ctx.close();
  }
};
