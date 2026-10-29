import {
  MatVarietyFilterWorkerMessage,
  MatVarietyFilterWorkerResult,
} from "@/app/_components/FlowNodes/MatVarietyFilter/MatVarietyFilterWorkerTypes";
import { filterMatVarietyLogs } from "@/app/_lib/log";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<
    MatVarietyFilterWorkerMessage,
    MatVarietyFilterWorkerResult
  > {}

ctx.onmessage = async (
  event: MessageEvent<MatVarietyFilterWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      const { logs, result } = filterMatVarietyLogs(
        event.data.data.sourceLogs,
        event.data.data.options
      );
      ctx.postMessage({ type: "data", data: { logs, result } });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError("MatVarietyFilterWorker received kill message"),
    });
    ctx.close();
  }
};
