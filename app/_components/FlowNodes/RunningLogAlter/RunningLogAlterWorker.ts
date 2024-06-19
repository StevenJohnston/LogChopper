import {
  RunningLogAlterWorkerMessage,
  RunningLogAlterWorkerResult,
} from "@/app/_components/FlowNodes/RunningLogAlter/RunningLogAlterWorkertypes";
import { runningAlter } from "@/app/_lib/log";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<
    RunningLogAlterWorkerMessage,
    RunningLogAlterWorkerResult
  > {}

ctx.onmessage = async (
  event: MessageEvent<RunningLogAlterWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      const logs = runningAlter(
        event.data.data.sourceLogs,
        event.data.data.newFieldName,
        event.data.data.untilFunc,
        event.data.data.alterFunc
      );
      ctx.postMessage({ type: "data", data: { logs } });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError("RunningLogAlterWorker received kill message"),
    });
    ctx.close();
  }
};
