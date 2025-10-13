'use client'
import { NodeWithType, RefreshableNode, RefreshableTableNode, isRefreshableTableNode } from "@/app/_components/FlowNodes/FlowNodesTypes";
import { MyNode } from "@/app/store/useFlow";
import { Edge, Node } from "reactflow";
import { getParentsByHandleIds, orderAndTypeArray } from "@/app/_lib/react-flow-utils";
import { TableRemapWorkerInput, TableRemapWorkerOutput } from "./TableRemapWorkerTypes";
import { Table } from "@/app/_lib/rom";
import { TableRemapWorker } from "./TableRemapWorkertypes";

export type TableRemapAxis = "x" | "y";
export type TableRemapSource = "x" | "y" | "v";

export const TableRemapType = "TableRemapNode";

export interface TableRemapDataProps extends Partial<RefreshableNode<TableRemapData>> {
  commonAxis: TableRemapAxis;
  lookupValueSource: TableRemapAxis;
  searchTarget: TableRemapSource;
  outputSource: TableRemapSource;
  output?: Table;
}

export type TableRemapNodeType = NodeWithType<TableRemapData, typeof TableRemapType>;

export class TableRemapData extends RefreshableNode<TableRemapData> implements TableRemapDataProps {
  commonAxis: TableRemapAxis;
  lookupValueSource: TableRemapAxis;
  searchTarget: TableRemapSource;
  outputSource: TableRemapSource;
  output?: Table;

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

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker();
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<Partial<TableRemapData>>(async (resolve, reject) => {
      if (node.type !== TableRemapType) return reject(new Error("Invalid node type"));

      const parentNodes = getParentsByHandleIds(node, nodes, edges, ["a", "b"]);
      if (parentNodes.length !== 2) return reject(new Error("Missing parent nodes"));

      const [tableANode, tableBNode] = orderAndTypeArray<[Node<RefreshableTableNode>, Node<RefreshableTableNode>]>(parentNodes, [isRefreshableTableNode, isRefreshableTableNode]);

      try {
        const [dataA, dataB] = await Promise.all([tableANode.data.activeUpdate?.promise, tableBNode.data.activeUpdate?.promise]);
        
        if (!dataA?.table || !dataB?.table) return reject(new Error("Parent data not ready"));

        worker.onmessage = ({ data }: MessageEvent<TableRemapWorkerOutput>) => {
          if (data.type === 'error') {
            return reject(data.error);
          }
          if (data.type === 'data') {
            resolve({ output: data.outputTable });
          }
        };
        
        worker.onerror = (e) => reject(e);

        const workerInput = {
          type: 'run' as const,
          data: {
            tableA: dataA.table as Table,
            tableB: dataB.table as Table,
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
    return new Worker(new URL("./TableRemapWorker.ts", import.meta.url));
  }

  public clone(updates: Partial<TableRemapData>): TableRemapData {
    return new TableRemapData({ ...this, ...updates });
  }

  isPartial(obj: any): obj is Partial<TableRemapData> {
    return typeof obj === 'object' && obj !== null;
  }
}