import {
  BaseLogWorkerMessage,
  BaseLogWorkerResult,
} from "@/app/_components/FlowNodes/BaseLog/BaseLogWorkerTypes";
import { LogRecord } from "@/app/_lib/log";
import { InternalWorker, KilledError } from "@/app/_lib/worker-utilts";
import csv from "csvtojson";

let shouldTerminate = false;

const ctx = self as SelfWorker;

interface SelfWorker
  extends InternalWorker<BaseLogWorkerMessage, BaseLogWorkerResult> {}

ctx.onmessage = async (
  event: MessageEvent<BaseLogWorkerMessage>
): Promise<void> => {
  if (event.data.type == "run") {
    try {
      const logs = await loadLogsFromFiles(event.data.data.selectedLogFiles);
      ctx.postMessage({ type: "data", data: { logs } });
    } catch (error) {
      ctx.postMessage({ type: "error", error: error as Error });
    }
    ctx.close();
  } else if (event.data.type == "kill") {
    shouldTerminate = true;
    ctx.postMessage({
      type: "error",
      error: new KilledError("BaseLogWorker received kill message"),
    });
    ctx.close();
  }
};

async function loadLogsFromFiles(
  selectedLogFiles: File[]
): Promise<LogRecord[]> {
  const logPromises = selectedLogFiles.map(
    async (file: File): Promise<LogRecord[]> => {
      if (shouldTerminate) {
        throw new Error("loadLogsFromFiles map terminated");
      }
      const text = await file.text();
      return csv({ checkType: true }).fromString(text);
    }
  );
  const logsArray = (await Promise.allSettled(logPromises)).filter(
    (result) => result.status == "fulfilled" && result.value
  ) as unknown as PromiseFulfilledResult<LogRecord[]>[];
  return await logsArray.reduce(
    async (accPromise: Promise<LogRecord[]>, cur) => {
      if (shouldTerminate) {
        throw new Error("loadLogsFromFiles reduce terminated");
      }
      const acc = await accPromise;
      return [...acc, ...cur.value];
    },
    Promise.resolve([])
  );
}
