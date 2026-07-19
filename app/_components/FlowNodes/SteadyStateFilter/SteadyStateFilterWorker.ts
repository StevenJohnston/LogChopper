import {
  SteadyStateFilterWorkerMessage,
  SteadyStateFilterWorkerResult,
} from "@/app/_components/FlowNodes/SteadyStateFilter/SteadyStateFilterWorkerTypes";
import { processSteadyStateFilter } from "@/app/_lib/log";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<SteadyStateFilterWorkerMessage, SteadyStateFilterWorkerResult> {}

ctx.onmessage = async (
  event: MessageEvent<SteadyStateFilterWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      const logs = processSteadyStateFilter(
        event.data.data.sourceLogs,
        event.data.data.options
      );
      ctx.postMessage({ type: "data", data: { logs } });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError("SteadyStateFilterWorker received kill message"),
    });
    ctx.close();
  }
};
