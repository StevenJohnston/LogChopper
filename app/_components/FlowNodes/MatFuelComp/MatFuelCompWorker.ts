import {
  MatFuelCompWorkerMessage,
  MatFuelCompWorkerResult,
} from "@/app/_components/FlowNodes/MatFuelComp/MatFuelCompWorkerTypes";
import { calculateMatTempInvariance } from "@/app/_lib/rom";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<
    MatFuelCompWorkerMessage,
    MatFuelCompWorkerResult
  > {}

ctx.onmessage = async (
  event: MessageEvent<MatFuelCompWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      const result = calculateMatTempInvariance(
        event.data.data.baseTable,
        event.data.data.logs,
        event.data.data.options
      );
      ctx.postMessage({ type: "data", data: { result } });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    ctx.postMessage({
      type: "error",
      error: new KilledError("MatFuelCompWorker received kill message"),
    });
    ctx.close();
  }
};
