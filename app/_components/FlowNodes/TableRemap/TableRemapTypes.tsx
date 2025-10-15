'use client'
import { NodeWithType, RefreshableNode, RefreshableTableNode, isRefreshableTableNode, SaveableNode, isTableBasic } from "@/app/_components/FlowNodes/FlowNodesTypes";
import { MyNode } from "@/app/store/useFlow";
import { Edge, Node } from "reactflow";
import { getParentsByHandleIds, orderAndTypeArray } from "@/app/_lib/react-flow-utils";
import { TableRemapWorker, TableRemapWorkerResult } from "./TableRemapWorkerTypes";
import { BasicTable } from "@/app/_lib/rom-metadata";

export type TableRemapAxis = "x" | "y";
export type TableRemapSource = "x" | "y" | "v";

export const TableRemapType = "TableRemapNode";

export interface TableRemapDataProps extends Partial<RefreshableNode<TableRemapData>> {
  commonAxis: TableRemapAxis;
  lookupValueSource: TableRemapAxis;
  searchTarget: TableRemapSource;
  outputSource: TableRemapSource;
  output?: BasicTable | null;
}

export type TableRemapNodeType = NodeWithType<TableRemapData, typeof TableRemapType>;

export class TableRemapData extends RefreshableNode<TableRemapData> implements TableRemapDataProps, SaveableNode<Partial<TableRemapDataProps>> {
  commonAxis: TableRemapAxis;
  lookupValueSource: TableRemapAxis;
  searchTarget: TableRemapSource;
  outputSource: TableRemapSource;
  output?: BasicTable | null;

  constructor({
    commonAxis = 'y',
    lookupValueSource = 'x',
    searchTarget = 'v',
    outputSource = 'x',
    output,
    loading = false,
    activeUpdate = null,
  }: Partial<TableRemapDataProps> = {}) {
    super();
    this.commonAxis = commonAxis;
    this.lookupValueSource = lookupValueSource;
    this.searchTarget = searchTarget;
    this.outputSource = outputSource;
    this.output = output;
    this.loading = loading;
    this.activeUpdate = activeUpdate;
  }

  public getLoadable() {
    return {
      commonAxis: this.commonAxis,
      lookupValueSource: this.lookupValueSource,
      searchTarget: this.searchTarget,
      outputSource: this.outputSource,
    }
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker();
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<Partial<TableRemapData>>(async (resolve, reject) => {
      if (node.type !== TableRemapType) return reject(new Error("Invalid node type"));

      const parentNodes = getParentsByHandleIds(node, nodes, edges, ["a", "b"]);
      if (!parentNodes) {
        this.output = null
        console.log("TableRemapData One or more parents are missing")
        reject(new Error(`TableRemapData One or more parents are missing`))
        return
      }
      if (parentNodes.length !== 2) return reject(new Error("Missing parent nodes"));

      const [tableANode, tableBNode] = orderAndTypeArray<[Node<RefreshableTableNode>, Node<RefreshableTableNode>]>(parentNodes, [isRefreshableTableNode, isRefreshableTableNode]);

      try {
        const [dataA, dataB] = await Promise.all([tableANode.data.activeUpdate?.promise, tableBNode.data.activeUpdate?.promise]);

        if (!dataA?.table || !dataB?.table) return reject(new Error("Parent data not ready"));

        if (!isTableBasic(dataA.table)) {
          reject(new Error("Table A is not a BasicTable"));
          return;
        }

        if (!isTableBasic(dataB.table)) {
          reject(new Error("Table B is not a BasicTable"));
          return;
        }

        worker.onmessage = async (e: MessageEvent<TableRemapWorkerResult>) => {
          const { data } = e;
          if (data.type === "error") {
            reject(data.error);
            return;
          }
          if (data.type === "data") {
            resolve({ output: data.data.outputTable });
            return;
          }
        };

        worker.onerror = (e) => reject(e);

        const workerInput = {
          type: 'run' as const,
          data: {
            tableA: dataA.table,
            tableB: dataB.table,
            config: {
              commonAxis: this.commonAxis,
              lookupValueSource: this.lookupValueSource,
              searchTarget: this.searchTarget,
              outputSource: this.outputSource,
            },
          }
        };
        worker.postMessage(workerInput);

      } catch (e) {
        reject(e);
      }
    });

    this.activeUpdate = { worker, promise };
  }

  public createWorker(): TableRemapWorker {
    return new Worker(new URL("app/_components/FlowNodes/TableRemap/TableRemapWorker.ts", import.meta.url));
  }

  public clone(updates: Partial<TableRemapData>): TableRemapData {
    return new TableRemapData({ ...this, ...updates });
  }

  isPartial(obj: any): obj is Partial<TableRemapData> {
    return typeof obj === 'object' && obj !== null;
  }
}
