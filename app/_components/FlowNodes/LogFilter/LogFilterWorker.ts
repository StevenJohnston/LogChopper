import {
  LogFilterWorkerMessage,
  LogFilterWorkerResult,
} from "@/app/_components/FlowNodes/LogFilter/LogFilterWorkertypes";
import { filterLogs } from "@/app/_lib/log";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<LogFilterWorkerMessage, LogFilterWorkerResult> {}

ctx.onmessage = async (
  event: MessageEvent<LogFilterWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      const logs = filterLogs(event.data.data.sourceLogs, event.data.data.func);
      ctx.postMessage({ type: "data", data: { logs } });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError("LogFilterWorker received kill message"),
    });
    ctx.close();
  }
};
