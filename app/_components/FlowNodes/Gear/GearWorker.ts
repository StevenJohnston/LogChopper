import {
  GearWorkerMessage,
  GearWorkerResult,
} from "@/app/_components/FlowNodes/Gear/GearWorkerTypes";
import { smoothSpeedAndCalculateGear } from "@/app/_lib/log";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<GearWorkerMessage, GearWorkerResult> {}

ctx.onmessage = async (
  event: MessageEvent<GearWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      const logs = smoothSpeedAndCalculateGear(
        event.data.data.sourceLogs,
        event.data.data.gearRatios,
        event.data.data.lookahead,
        {
          enableFilter: event.data.data.enableFilter,
          invertFilter: event.data.data.invertFilter,
          maxAccuracy: event.data.data.maxAccuracy,
          filterWindowSeconds: event.data.data.filterWindowSeconds,
        }
      );

      ctx.postMessage({
        type: "data",
        data: { logs },
      });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError("GearWorker received kill message"),
    });
    ctx.close();
  }
};
