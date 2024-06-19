import {
  LogAlterWorkerMessage,
  LogAlterWorkerResult,
} from "@/app/_components/FlowNodes/LogAlter/LogAlterWorkerTypes";
import { alterLogs } from "@/app/_lib/log";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<LogAlterWorkerMessage, LogAlterWorkerResult> {}

ctx.onmessage = async (
  event: MessageEvent<LogAlterWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      const logs = alterLogs(
        event.data.data.sourceLogs,
        event.data.data.func,
        event.data.data.newLogField
      );

      if (!logs) {
        console.log("Failed to alterLogs for LogAlterWorker");
        throw new Error("Failed to alterLogs for LogAlterWorker");
      }
      ctx.postMessage({ type: "data", data: { logs } });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError("LogAlterWorker received kill message"),
    });
    ctx.close();
  }
};
