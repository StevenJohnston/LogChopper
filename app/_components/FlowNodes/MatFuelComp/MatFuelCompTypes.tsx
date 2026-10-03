'use client'

import { RefreshableNode } from "@/app/_components/FlowNodes/RefreshableNode";
import {
  LogNode,
  NodeWithType,
  RefreshableLogNode,
  RefreshableTableNode,
  SaveableNode,
  TableNode,
  isRefreshableLogNode,
  isRefreshableTableNode,
  isTableBasic,
} from "@/app/_components/FlowNodes/FlowNodesTypes";
import { BasicTable, Scaling, Table3D } from "@/app/_lib/rom-metadata";
import { LogRecord, MatVarietyFilterResult } from "@/app/_lib/log";
import { HandleTypes } from "@/app/_components/FlowNodes/CustomHandle/CustomType";
import { MyNode } from "@/app/store/useFlow";
import { Edge, Node } from "reactflow";
import { getParentsByHandleIds, orderAndTypeArray } from "@/app/_lib/react-flow-utils";
import { MatFuelCompWorker } from "@/app/_components/FlowNodes/MatFuelComp/MatFuelCompWorkerTypes";

export const MatFuelCompType = "MatFuelCompNode";
export type MatFuelCompNodeType = NodeWithType<MatFuelCompData, typeof MatFuelCompType>;

export const sourceTableHandleId = "TableIn";
export const sourceLogHandleId = "LogIn";
export const targetTableHandleId = "TableOut";
export const MatFuelCompSources = [sourceTableHandleId, sourceLogHandleId];

export type MatCompActiveView = "corrected" | "drift" | "counts";

export interface MatFuelCompDataProps
  extends Partial<RefreshableNode<MatFuelCompData>>,
    Partial<TableNode> {
  table?: BasicTable | null;
  tableType?: HandleTypes;
  sourceTable?: BasicTable | null;
  logs?: LogRecord[] | null;

  correctedTable?: Table3D<number> | null;
  deltaPercentTable?: Table3D<number> | null;
  countTable?: Table3D<number> | null;

  activeView?: MatCompActiveView;
  refTemp?: number;
  refTempUsed?: number;
  minTempSpread?: number;
  minDistinctBins?: number;
  minCellSamples?: number;
  maxCorrectionRatio?: number;
  enableDamping?: boolean;
  confidenceHk?: number;

  sufficient?: boolean;
  spread?: number;
  reason?: string;
  varietyResult?: MatVarietyFilterResult | null;
}

export class MatFuelCompData
  extends RefreshableNode<MatFuelCompData>
  implements TableNode, SaveableNode, MatFuelCompDataProps
{
  public tableType: HandleTypes | undefined;
  public table: BasicTable | null;
  public tableMap: Record<string, BasicTable> | null;
  public scalingMap: Record<string, Scaling> | null;
  public selectedRomFile: File | null;
  public scalingValue: Scaling | undefined | null;
  public loading: boolean = false;

  public sourceTable: BasicTable | null;
  public logs: LogRecord[] | null;

  public correctedTable: Table3D<number> | null;
  public deltaPercentTable: Table3D<number> | null;
  public countTable: Table3D<number> | null;

  public activeView: MatCompActiveView;
  public refTemp?: number;
  public refTempUsed: number;
  public minTempSpread: number;
  public minDistinctBins: number;
  public minCellSamples: number;
  public maxCorrectionRatio: number;
  public enableDamping: boolean;
  public confidenceHk: number;

  public sufficient: boolean;
  public spread: number;
  public reason?: string;
  public varietyResult: MatVarietyFilterResult | null;

  constructor({
    table = null,
    tableType = "3D",
    tableMap = null,
    scalingMap = null,
    selectedRomFile = null,
    scalingValue = null,
    loading = false,
    activeUpdate = null,
    sourceTable = null,
    logs = null,
    correctedTable = null,
    deltaPercentTable = null,
    countTable = null,
    activeView = "corrected",
    refTemp = undefined,
    refTempUsed = 68,
    minTempSpread = 10.0,
    minDistinctBins = 2,
    minCellSamples = 5,
    maxCorrectionRatio = 0.15,
    enableDamping = true,
    confidenceHk = 100,
    sufficient = false,
    spread = 0,
    reason = undefined,
    varietyResult = null,
  }: MatFuelCompDataProps = {}) {
    super();
    this.table = table;
    this.tableType = tableType;
    this.tableMap = tableMap;
    this.scalingMap = scalingMap;
    this.selectedRomFile = selectedRomFile;
    this.scalingValue = scalingValue;
    this.loading = loading;
    this.activeUpdate = activeUpdate;

    this.sourceTable = sourceTable;
    this.logs = logs;
    this.correctedTable = correctedTable;
    this.deltaPercentTable = deltaPercentTable;
    this.countTable = countTable;

    this.activeView = activeView;
    this.refTemp = refTemp;
    this.refTempUsed = refTempUsed;
    this.minTempSpread = minTempSpread;
    this.minDistinctBins = minDistinctBins;
    this.minCellSamples = minCellSamples;
    this.maxCorrectionRatio = maxCorrectionRatio;
    this.enableDamping = enableDamping;
    this.confidenceHk = confidenceHk;

    this.sufficient = sufficient;
    this.spread = spread;
    this.reason = reason;
    this.varietyResult = varietyResult;
  }

  public addWorkerPromise(node: MyNode, nodes: MyNode[], edges: Edge[]): void {
    const worker = this.createWorker();
    // eslint-disable-next-line no-async-promise-executor
    const promise = new Promise<MatFuelCompData>(async (resolveRefresh, rejectRefresh) => {
      if (node.type !== MatFuelCompType) {
        console.log(`MatFuelCompData expected type ${MatFuelCompType} but found ${node.type}`);
        rejectRefresh(new Error(`MatFuelCompData expected type ${MatFuelCompType} but found ${node.type}`));
        return;
      }

      const parentNodes = getParentsByHandleIds(node, nodes, edges, [sourceTableHandleId, sourceLogHandleId]);
      if (!parentNodes) {
        this.table = null;
        this.correctedTable = null;
        this.deltaPercentTable = null;
        this.countTable = null;
        console.log("MatFuelCompData: One or more parents are missing");
        rejectRefresh(new Error("MatFuelCompData: One or more parents are missing"));
        return;
      }

      const [sourceTableNode, sourceLogNode] = orderAndTypeArray<[Node<RefreshableTableNode>, Node<RefreshableLogNode>]>(
        parentNodes,
        [isRefreshableTableNode, isRefreshableLogNode]
      );

      let updatedSourceTable: Partial<TableNode> | undefined;
      let updatedSourceLogs: Partial<LogNode> | undefined;

      try {
        [updatedSourceTable, updatedSourceLogs] = await Promise.all([
          sourceTableNode.data.activeUpdate?.promise,
          sourceLogNode.data.activeUpdate?.promise,
        ]);
      } catch (e) {
        console.log("MatFuelCompData a parent promise has rejected", e);
        rejectRefresh(e);
        return;
      }

      if (!updatedSourceTable || !updatedSourceLogs) {
        console.log("MatFuelCompData parent promise missing data");
        rejectRefresh(new Error("MatFuelCompData parent promise missing data"));
        return;
      }

      if (!updatedSourceTable.table || !isTableBasic(updatedSourceTable.table) || updatedSourceTable.table.type !== "3D") {
        worker.postMessage({ type: "kill" });
        console.log("MatFuelCompData requires a 3D table");
        rejectRefresh(new Error("MatFuelCompData requires a 3D table"));
        return;
      }

      if (!updatedSourceLogs.logs) {
        worker.postMessage({ type: "kill" });
        console.log("MatFuelCompData missing input logs");
        rejectRefresh(new Error("MatFuelCompData missing input logs"));
        return;
      }

      const resolvedSourceTable = updatedSourceTable.table as BasicTable;
      const resolvedSourceLogs = updatedSourceLogs.logs;
      const resolvedScalingMap = updatedSourceTable.scalingMap || null;
      const resolvedTableMap = updatedSourceTable.tableMap || null;
      const resolvedSelectedRomFile = updatedSourceTable.selectedRomFile || null;

      worker.onmessage = async ({ data }) => {
        if (data.type === "error") {
          console.log("MatFuelCompData worker error:", data.error);
          rejectRefresh(data.error);
          return;
        }

        if (data.type === "data") {
          const res = data.data.result;
          node.data.sourceTable = resolvedSourceTable;
          node.data.logs = resolvedSourceLogs || null;

          node.data.scalingMap = resolvedScalingMap;
          node.data.tableMap = resolvedTableMap;
          node.data.selectedRomFile = resolvedSelectedRomFile;
          node.data.tableType = "3D";

          if (res) {
            node.data.sufficient = res.sufficient;
            node.data.spread = res.spread;
            node.data.reason = res.reason;
            node.data.refTempUsed = res.refTempUsed;
            node.data.correctedTable = res.correctedTable;
            node.data.deltaPercentTable = res.deltaPercentTable;
            node.data.countTable = res.countTable;
            node.data.varietyResult = res.varietyResult || null;
            // Downstream handle TableOut always outputs the calibrated/corrected table
            node.data.table = res.correctedTable || resolvedSourceTable;
          } else {
            node.data.table = resolvedSourceTable;
          }

          resolveRefresh(node.data);
        }
      };

      worker.postMessage({
        type: "run",
        data: {
          baseTable: resolvedSourceTable,
          logs: resolvedSourceLogs,
          options: {
            refTemp: this.refTemp,
            minTempSpread: this.minTempSpread,
            minDistinctBins: this.minDistinctBins,
            minCellSamples: this.minCellSamples,
            maxCorrectionRatio: this.maxCorrectionRatio,
            enableDamping: this.enableDamping,
            confidenceHk: this.confidenceHk,
          },
        },
      });
    });

    this.activeUpdate = {
      worker,
      promise,
    };
  }

  public createWorker(): MatFuelCompWorker {
    return new Worker(
      new URL(
        "app/_components/FlowNodes/MatFuelComp/MatFuelCompWorker.ts",
        import.meta.url
      )
    );
  }

  public getLoadable() {
    return {
      activeView: this.activeView,
      refTemp: this.refTemp,
      minTempSpread: this.minTempSpread,
      minDistinctBins: this.minDistinctBins,
      minCellSamples: this.minCellSamples,
      maxCorrectionRatio: this.maxCorrectionRatio,
      enableDamping: this.enableDamping,
      confidenceHk: this.confidenceHk,
    };
  }

  public clone(updates: Partial<MatFuelCompData>): MatFuelCompData {
    return new MatFuelCompData({
      table: this.table,
      tableType: this.tableType,
      tableMap: this.tableMap,
      scalingMap: this.scalingMap,
      selectedRomFile: this.selectedRomFile,
      scalingValue: this.scalingValue,
      loading: this.loading,
      activeUpdate: this.activeUpdate,

      sourceTable: this.sourceTable,
      logs: this.logs,
      correctedTable: this.correctedTable,
      deltaPercentTable: this.deltaPercentTable,
      countTable: this.countTable,

      activeView: this.activeView,
      refTemp: this.refTemp,
      refTempUsed: this.refTempUsed,
      minTempSpread: this.minTempSpread,
      minDistinctBins: this.minDistinctBins,
      minCellSamples: this.minCellSamples,
      maxCorrectionRatio: this.maxCorrectionRatio,
      enableDamping: this.enableDamping,
      confidenceHk: this.confidenceHk,

      sufficient: this.sufficient,
      spread: this.spread,
      reason: this.reason,
      varietyResult: this.varietyResult,
      ...updates,
    });
  }
}
