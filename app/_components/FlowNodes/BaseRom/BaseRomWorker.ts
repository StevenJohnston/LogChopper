import {
  BaseRomWorkerMessage,
  BaseRomWorkerResult,
} from "@/app/_components/FlowNodes/BaseRom/BaseRomWorkerTypes";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<BaseRomWorkerMessage, BaseRomWorkerResult> {}

ctx.onmessage = async (
  event: MessageEvent<BaseRomWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      ctx.postMessage({ type: "data", data: {} });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError("BaseRomWorker received kill message"),
    });
    ctx.close();
  }
};
