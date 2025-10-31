'use client'
import { NodeWithType, RefreshableNode, SaveableNode, isTableBasic, TableNode } from "@/app/_components/FlowNodes/FlowNodesTypes";
import { MyNode } from "@/app/store/useFlow";
import { Edge, Node } from "reactflow";
import { getParentsByHandleIds } from "@/app/_lib/react-flow-utils";
import { TableRemapWorker, TableRemapWorkerResult } from "./TableRemapWorkerTypes";
import { BasicTable, Scaling } from "@/app/_lib/rom-metadata";
import { HandleTypes } from "../CustomHandle/CustomType";

export type TableRemapAxis = "x" | "y";
export type TableRemapSource = "x" | "y" | "v";

export const TableRemapType = "TableRemapNode";

export interface TableRemapDataProps extends Partial<RefreshableNode<TableRemapData>>, Partial<TableNode> {
  commonAxis: TableRemapAxis;
  lookupValueSource: TableRemapSource;
  searchTarget: TableRemapSource;
  outputSource: TableRemapSource;
}

export type TableRemapNodeType = NodeWithType<TableRemapData, typeof TableRemapType>;

export function isTableRemapNode(node: Node): node is TableRemapNodeType {
  return node.type === TableRemapType;
}

export class TableRemapData extends RefreshableNode<TableRemapData> implements TableNode, SaveableNode<Partial<TableRemapDataProps>> {
  commonAxis: TableRemapAxis;
  lookupValueSource: TableRemapSource;
  searchTarget: TableRemapSource;
  outputSource: TableRemapSource;
  table?: BasicTable | null;
  tableMap: Record<string, BasicTable> | null;
  scalingMap: Record<string, Scaling> | null;
  selectedRomFile: File | null;
  tableType: HandleTypes | undefined;
  scalingValue: Scaling | undefined | null;


  constructor({
    commonAxis = 'y',
    lookupValueSource = 'x',
    searchTarget = 'v',
    outputSource = 'x',
    table = null,
    tableMap = null,
    scalingMap = null,
    selectedRomFile = null,
    tableType = undefined,
    scalingValue = undefined,
    loading = false,
    activeUpdate = null,
  }: Partial<TableRemapDataProps> = {}) {
    super();
    this.commonAxis = commonAxis;
    this.lookupValueSource = lookupValueSource;
    this.searchTarget = searchTarget;
    this.outputSource = outputSource;
    this.table = table;
    this.tableMap = tableMap;
    this.scalingMap = scalingMap;
    this.selectedRomFile = selectedRomFile;
    this.tableType = tableType;
    this.scalingValue = scalingValue;
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
    const promise = new Promise<Partial<TableNode>>(async (resolve, reject) => {
      if (node.type !== TableRemapType) return reject(new Error("Invalid node type"));

      const parentNodes = getParentsByHandleIds(node, nodes, edges, ["a", "b"]);
      if (!parentNodes) {
        this.table = null
        console.log("TableRemapData One or more parents are missing")
        reject(new Error(`TableRemapData One or more parents are missing`))
        return
      }
      if (parentNodes.length !== 2) return reject(new Error("Missing parent nodes"));

      const [tableANode, tableBNode] = parentNodes;

      try {
        const [dataA, dataB]: any = await Promise.all([tableANode.data.activeUpdate?.promise, tableBNode.data.activeUpdate?.promise]);

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
            resolve({
              table: data.data.outputTable,
              tableMap: dataA.tableMap,
              scalingMap: dataA.scalingMap,
              selectedRomFile: dataA.selectedRomFile,
            });
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
