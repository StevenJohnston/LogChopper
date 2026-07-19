import { Edge, Node } from "reactflow";
import { RefreshableNode } from "@/app/_components/FlowNodes/RefreshableNode";
import {
  LogNode,
  NodeWithType,
  SaveableNode,
} from "../FlowNodesTypes";
import { MyNode } from "@/app/store/useFlow";
import { getParentsByHandleIds } from "@/app/_lib/react-flow-utils";
import { isTableNode, isLogNode } from "../FlowNodesConsts";
import {
  TableLookupWorkerInput,
  TableLookupWorkerOutput,
} from "./TableLookupWorkerTypes";
import { TableLookupWorker } from "./TableLookupWorker";
import { LogRecord } from "@/app/_lib/log";

export const TableLookupType = "TableLookupNode";

export type LookupMode = "value" | "xAxis";

export interface TableLookupDataProps
  extends Partial<RefreshableNode<TableLookupData>>,
    Partial<LogNode> {
  newColumnName: string;
  lookupMode: LookupMode;
  targetValueColumnName?: string;
}

export type TableLookupNodeType = NodeWithType<
  TableLookupData,
  typeof TableLookupType
>;

export function isTableLookupNode(node: Node): node is TableLookupNodeType {
  return node.type === TableLookupType;
}

export class TableLookupData
  extends RefreshableNode<TableLookupData>
  implements LogNode, SaveableNode<Partial<TableLookupDataProps>>
{
  newColumnName: string;
  lookupMode: LookupMode;
  targetValueColumnName?: string;
  logs: LogRecord[] | null;

  constructor({
    newColumnName = "lookup",
    lookupMode = "value",
    targetValueColumnName = "",
    logs = null,
    loading = false,
    activeUpdate = null,
  }: Partial<TableLookupDataProps> = {}) {
    super();
    this.newColumnName = newColumnName;
    this.lookupMode = lookupMode;
    this.targetValueColumnName = targetValueColumnName;
    this.logs = logs;
    this.loading = loading;
    this.activeUpdate = activeUpdate;
  }

  public getLoadable() {
    return {
      newColumnName: this.newColumnName,
      lookupMode: this.lookupMode,
      targetValueColumnName: this.targetValueColumnName,
    };
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker();
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<Partial<LogNode>>(async (resolve, reject) => {
      if (node.type !== TableLookupType)
        return reject(new Error("Invalid node type"));

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [
        "table",
        "log",
      ]);
      if (!parentNodes) {
        this.logs = null;
        console.log("TableLookupData One or more parents are missing");
        reject(new Error(`TableLookupData One or more parents are missing`));
        return;
      }
      if (parentNodes.length !== 2)
        return reject(new Error("Missing parent nodes"));

      const tableNode = parentNodes.find(isTableNode);
      const logNode = parentNodes.find(isLogNode);

      if (!tableNode || !logNode) {
        reject(new Error("Missing table or log node"));
        return;
      }

      try {
        const [tableData, logData]: any = await Promise.all([
          (tableNode.data as any).activeUpdate?.promise,
          (logNode.data as any).activeUpdate?.promise,
        ]);

        if (!tableData?.table || !logData?.logs)
          return reject(new Error("Parent data not ready"));

        worker.onmessage = async (
          e: MessageEvent<TableLookupWorkerOutput>
        ) => {
          const { data } = e;
          if (data.error) {
            reject(data.error);
            return;
          }
          if (data.logs) {
            resolve({
              logs: data.logs,
            });
            return;
          }
        };

        worker.onerror = (e: any) => reject(e);

        const workerInput: TableLookupWorkerInput = {
          table: tableData.table,
          logs: logData.logs,
          newColumnName: this.newColumnName,
          lookupMode: this.lookupMode,
          targetValueColumnName: this.targetValueColumnName,
        };
        worker.postMessage({ type: "run", data: workerInput });
      } catch (e) {
        reject(e);
      }
    });

    this.activeUpdate = { worker, promise };
  }

  public createWorker(): TableLookupWorker {
    return new Worker(
      new URL(
        "app/_components/FlowNodes/TableLookup/TableLookupWorker.ts",
        import.meta.url
      )
    );
  }

  public clone(updates: Partial<TableLookupData>): TableLookupData {
    return new TableLookupData({ ...this, ...updates });
  }

  isPartial(obj: any): obj is Partial<TableLookupData> {
    return typeof obj === "object" && obj !== null;
  }
}
