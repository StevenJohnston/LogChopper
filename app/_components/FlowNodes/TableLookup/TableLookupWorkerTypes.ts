import { LogRecord } from "@/app/_lib/log";
import { Table } from "@/app/_lib/rom-metadata";
import { LookupMode } from "./TableLookupTypes";

export type TableLookupWorkerInput = {
  table: Table<any>;
  logs: LogRecord[];
  newColumnName: string;
  lookupMode: LookupMode;
  targetValueColumnName?: string;
};

export type TableLookupWorkerOutput = {
  logs?: LogRecord[];
  error?: string;
};
