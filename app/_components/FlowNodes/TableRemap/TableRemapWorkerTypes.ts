import { Table } from "@/app/_lib/rom";
import { TableRemapAxis, TableRemapSource } from "./TableRemapTypes";

export type TableRemapConfig = {
  commonAxis: TableRemapAxis;
  lookupValueSource: TableRemapAxis;
  searchTarget: TableRemapSource;
  outputSource: TableRemapSource;
}

export type TableRemapWorker = Worker & {
  onmessage: (e: MessageEvent<TableRemapWorkerOutput>) => void;
  postMessage: (msg: { type: 'run', data: TableRemapWorkerInput } | {type: 'kill'}) => void;
}

export type TableRemapWorkerInput = {
  tableA: Table;
  tableB: Table;
  config: TableRemapConfig;
};

export type TableRemapWorkerOutput = {
  type: 'data';
  outputTable: Table;
} | {
  type: 'error';
  error: string;
};
