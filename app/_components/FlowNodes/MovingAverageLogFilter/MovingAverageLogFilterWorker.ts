import {
  MovingAverageLogFilterWorkerMessage,
  MovingAverageLogFilterWorkerResult,
} from "@/app/_components/FlowNodes/MovingAverageLogFilter/MovingAverageLogFilterWorkerTypes";
import { movingAverageFilter } from "@/app/_lib/log";
import {
  InternalWorker,
  Killable,
  KilledError,
} from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;
const killable = new Killable();

interface SelfWorker
  extends InternalWorker<
    MovingAverageLogFilterWorkerMessage,
    MovingAverageLogFilterWorkerResult
  > {}

ctx.onmessage = async (
  event: MessageEvent<MovingAverageLogFilterWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      await movingAverageFilter(
        event.data.data.sourceLogs,
        event.data.data.logField,
        event.data.data.durationSeconds,
        event.data.data.maxDeviation,
        event.data.data.direction,
        killable
      );
      if (await killable.allowAndCheckKilled(true)) {
        throw new Error(
          "MovingAverageLogFilterWorker killed skipping postMessage data"
        );
      }
      ctx.postMessage({
        type: "data",
        data: { logs: event.data.data.sourceLogs },
      });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    killable.kill();
    ctx.postMessage({
      type: "error",
      error: new KilledError(
        "MovingAverageLogFilterWorker received kill message"
      ),
    });
    ctx.close();
  }
};
