"use client";
import { LogRecord } from "@/app/_lib/log";
import xml2js from "xml2js";
import { scalingAliases, typeToReader } from "@/app/_lib/consts";

export interface RomMetadata<T> {
  romid: Romid[];
  include: string[];
  scaling: Scaling[];
  table: Table<T>[];
}

export interface Romid {
  xmlid: string[];
  internalidaddress: string[];
  internalidhex: string[];
  make: string[];
  market: string[];
  model: string[];
  submodel: string[];
  transmission: string[];
  year: string[];
  flashmethod: string[];
  memmodel: string[];
  checksummodule: string[];
}

export interface Scaling {
  $?: GeneratedType;
  data?: Daum[];

  name?:
    | "StockXMAP in kPa"
    | "Omni4barMAP in kPa"
    | "StockXMAP in psig"
    | "Loadify"
    | "Throttle_Main - Stored Minimum Throttle %"
    | "psia8"
    | "AFR"
    | "RPMGain"
    | "CurrentLTFT"
    | "CruiseLTFT"
    | "STFT"
    | "LFSTFTAFR";

  storageType?: keyof typeof typeToReader;
  units?: string;
  frExpr?: string;
  toExpr?: string;
  min?: string;
  max?: string;
  inc?: number;
  format?: string;
  endian?: string;

  [key: string]: any;
}

export interface GeneratedType {
  name?: string;
  storagetype?: string;
  units?: string;
  toexpr?: string;
  frexpr?: string;
  format?: string;
  min?: string;
  max?: string;
  inc?: string;
  endian?: string;
}

export interface Daum {
  $: GeneratedType2;
}

export interface GeneratedType2 {
  name: string;
  value: string;
}

export interface Table3D<T> extends BaseTable {
  type: "3D";
  xAxis: Axis;
  yAxis: Axis;
  values: T[][];
}
interface Table2DX<T> extends BaseTable {
  type: "2D";
  xAxis: Axis;
  values: T[][];
}
interface Table2DY<T> extends BaseTable {
  type: "2D";
  yAxis: Axis;
  values: T[];
}

type Table2D<T> = Table2DY<T> | Table2DX<T>;
function hasProperty<O extends object, K extends PropertyKey>(
  obj: O,
  prop: K
): obj is O & Record<K, unknown> {
  return prop in obj;
}
export function isTable2DX(
  table: Table2D<unknown>
): table is Table2DX<unknown> {
  return hasProperty(table, "xAxis");
}
export function isTable2DY(
  table: Table2D<unknown>
): table is Table2DY<unknown> {
  return hasProperty(table, "yAxis");
}
interface Table1D<T> extends BaseTable {
  type: "1D";
  values: T;
}

interface OtherTable<T> extends BaseTable {
  type: "Other";
  values: T;
}

export interface BaseTable {
  $?: GeneratedType3;
  table?: Table2[];

  name?: string;
  category?: string;
  address?: string;
  // type: "1D" | "2D" | "3D";
  type: string;
  swapxy?: boolean;
  scaling?: string;
  // values?: (string | number)[] | (string | number)[][];
  // values?: string[] | number[] | string[][] | number[][];
  // values?: (string | number | (string | number)[])[];
  // xAxis?: Axis;
  // yAxis?: Axis;
  valid?: boolean;

  scalingValue?: Scaling;
  // [key: string]: any;
}

export type Table<T> = Table3D<T> | Table2D<T> | Table1D<T> | OtherTable<T>;
export type UnknownTable = Table<unknown>;
export type BasicTable = Table<string | number>;
export type LogTable = Table<LogRecord[]>;

export interface GeneratedType3 {
  name: string;
  address?: string;
  category: string;
  type: string;
  scaling?: string;
  description?: string;
  swapxy?: string;
  // swapxy?: {
  //   func: (s: string) => boolean,
  //   key: 'swapxy',
  // }
}

export interface Table2 {
  $: GeneratedType4;
  data?: string[];
}

export interface GeneratedType4 {
  name?: string;
  address?: string;
  type: string;
  elements: string;
  scaling?: string;
}

const parser = new xml2js.Parser();

export const scalingMap = {
  name: "name",
  units: "units",
  toexpr: "toExpr",
  frexpr: "frExpr",
  format: "format",
  min: "min",
  max: "max",
  inc: "inc",
  storagetype: "storageType",
  endian: "endian",
};

const tableAttrMap = {
  name: "name",
  category: "category",
  address: "address",
  type: "type",
  swapxy: {
    func: (s: string) => s == "true",
    key: "swapxy",
  },
  scaling: "scaling",
  description: "description",
};

export interface Axis {
  // name?: string;
  name: string;
  // address?: string;
  address: string;
  // scaling?: string;
  scaling: keyof LogRecord & keyof typeof scalingAliases;
  // elements?: number;
  elements: number;
  // values?: any[];
  values: any[];

  scalingValue?: Scaling;

  [key: string]: any;
}

const axisMap = {
  name: "name",
  type: "type",
  address: "address",
  elements: "elements",
  scaling: "scaling",
};

async function getAllRomMetadata(
  selectedDirectoryHandle: FileSystemDirectoryHandle
): Promise<Promise<RomMetadata>[]> {
  // add all xml files
  try {
    const allRomMetaData: Promise<RomMetadata>[] = [];

    for await (const entry of selectedDirectoryHandle.values()) {
      if (entry.kind === "file") {
        if (entry.name.endsWith(".xml")) {
          allRomMetaData.push(fetchRomMetadata(entry));
        }
      } else if (entry.kind === "directory") {
        const subDirFiles = await getAllRomMetadata(entry);
        allRomMetaData.push(...subDirFiles);
      }
    }

    return allRomMetaData;
  } catch (error) {
    console.error("Error retrieving files:", error);
    return [];
  }
}

export async function getAllRomMetadataMap(
  selectedDirectoryHandle: FileSystemDirectoryHandle
): Promise<Record<string, RomMetadata>> {
  const romMetadataArrayPromises = await getAllRomMetadata(
    selectedDirectoryHandle
  );
  const romMetadataArray = (
    await Promise.allSettled(romMetadataArrayPromises)
  ).filter(
    (result) => result.status == "fulfilled" && result.value
  ) as unknown as PromiseFulfilledResult<RomMetadata>[];

  return romMetadataArray.reduce((acc: Record<string, RomMetadata>, cur) => {
    const xmlId = cur.value.romid[0].xmlid[0];
    if (!acc[xmlId]) {
      acc[xmlId] = { ...cur.value };
    } else {
      acc[xmlId] = { ...cur.value, ...acc[xmlId] };
    }
    return acc;
  }, {});

  // const romMetadataMap: Record<string, RomMetadata> = romMetadataArray
  //   .filter()
  //   .reduce((acc: Record<string, RomMetadata>, cur: PromiseFulfilledResult<RomMetadata>): Record<string, RomMetadata> => {
  //     let xmlId = cur.value.romid[0].xmlid[0]
  //     if (!acc[xmlId]) {
  //       acc[xmlId] = { ...cur.value }
  //     } else {
  //       acc[xmlId] = { ...cur.value, ...acc[xmlId] }
  //     }
  //     return acc
  //   }, {})

  // return romMetadataMap
}

async function fetchRomMetadata(
  fileHandle: FileSystemFileHandle
): Promise<RomMetadata<unknown> | null> {
  const file = await fileHandle.getFile();
  const text = await file.text();
  try {
    const xml = await parser.parseStringPromise(text);
    return xml.rom;
  } catch (e) {
    console.log(`Error loading xml ${fileHandle.name}`);
    return null;
  }
}

async function buildRomTables(
  romMetadataMap: Record<string, RomMetadata<unknown>>,
  romId: string
): Promise<[Scaling[], Record<string, Table<unknown>>]> {
  let scalings: Scaling[] = [];
  let tableMap: Record<string, Table<unknown>> = {};

  const rom = romMetadataMap[romId];
  const parentRomId = rom?.include?.[0];
  if (parentRomId) {
    [scalings, tableMap] = await buildRomTables(romMetadataMap, parentRomId);
  }
  try {
    rom.scaling &&
      rom.scaling.forEach((scaling) => {
        scalings.push(mapScaling(scaling));
      });
    rom.table &&
      rom.table.forEach((table) => {
        const mappedTable = mapTable(tableMap, table);
        if (mappedTable?.name) {
          tableMap[mappedTable.name] = mappedTable;
        } else {
          console.log(`Cant handle table ${table?.$?.name}`);
        }
      });
  } catch (e) {
    console.log(e);
  }

  return [scalings, tableMap];
}

function mapTable(tableMap: Record<string, Table>, table: Table) {
  let dropTable = false;
  const attrs = table["$"];

  let mappedTable: Table = {};
  if (table?.$?.name && tableMap[table.$.name]) {
    mappedTable = { ...tableMap[table.$.name] };
  }

  Object.keys(attrs || {}).map((key) => {
    let finalAttrValue: string | boolean =
      attrs?.[key as keyof GeneratedType3] || "";
    let finalAttrKey = tableAttrMap[key as keyof GeneratedType3];

    if (typeof finalAttrKey == "object") {
      finalAttrValue = finalAttrKey["func"](finalAttrValue);
      finalAttrKey = finalAttrKey["key"];
    }
    if (finalAttrKey !== undefined) {
      mappedTable[finalAttrKey as keyof Table] = finalAttrValue;
    }
  });

  if (table.table == undefined) {
    mappedTable.type = "1D";
  } else if (table.table.length == 1) {
    mappedTable.type = "2D";
  } else if (table.table.length == 2) {
    mappedTable.type = "3D";
  } else {
    console.log("how we have more than a 3d table");
    return null;
  }

  table.table &&
    table.table.forEach((axis) => {
      const axisAttrs = axis["$"];
      const axisType = axisAttrs.type;
      switch (axisType) {
        case undefined:
          // No axis type indicates I need to guess the axis?

          // check if tableMap alread had axis with this name
          // check x
          if (mappedTable.xAxis) {
            if (mappedTable.xAxis.name == axisAttrs.name) {
              mappedTable.xAxis = { ...mappedTable.xAxis, ...mapAxis(axis) };
              break;
            }
          }
          if (mappedTable.yAxis) {
            if (mappedTable.yAxis.name == axisAttrs.name) {
              mappedTable.yAxis = { ...mappedTable.yAxis, ...mapAxis(axis) };
              break;
            }
          }
          dropTable = true;
          console.log(`Dropping table due ??? tableName: ${table?.$?.name}`);
          break;
        case "X Axis":
          mappedTable.xAxis = mapAxis(axis);
          break;
        case "Y Axis":
          mappedTable.yAxis = mapAxis(axis);
          break;
        case "Static X Axis":
          dropTable = true;
          console.log(
            `Dropping table due to Static X Axis tableName: ${table?.$?.name}`
          );
          break;
        case "Static Y Axis":
          console.log(
            `Dropping table due to Static Y Axis tableName: ${table?.$?.name}`
          );
          dropTable = true;
          break;
        default:
          console.log(
            `unhandled axis type ${axisType} axisName: ${axisAttrs.name}`
          );
          dropTable = true;
      }
    });

  if (dropTable) {
    return null;
  }

  if (mappedTable.type == "3D") {
    if (!mappedTable.xAxis) {
      console.log("?");
    }
  }
  return mappedTable;
}

function mapAxis(axis: Table2): Axis {
  const attrs = axis["$"];
  const mappedAxis: Axis = {};
  Object.keys(attrs).map((key) => {
    const finalAttrValue: string = attrs?.[key as keyof GeneratedType4] || "";
    const finalAttrKey = axisMap[key as keyof typeof axisMap];

    // if (typeof finalAttrKey == 'object') {
    //   finalAttrKey = finalAttrKey['key']
    //   finalAttrValue = finalAttrKey['func'](finalAttrValue) ? 'true' : 'false'
    // }
    mappedAxis[finalAttrKey] = finalAttrValue;
  });
  // if (axis.name && !axis.scaling) {
  //   axis.scaling = axis.name
  // }

  return mappedAxis;
}

function mapScaling(scaling: Scaling): Scaling {
  const attrs = scaling["$"];
  if (!attrs) return {};
  const mappedScaling: Scaling = {};
  Object.keys(attrs || {}).map((key) => {
    if (!scalingMap[key as keyof typeof scalingMap]) {
      console.log(`unknown scalling attribute ${key}`);
    }
    mappedScaling[scalingMap[key as keyof typeof scalingMap]] =
      attrs[key as keyof typeof attrs];
  });
  return mappedScaling;
}

export const LoadRomMetadata = async (
  selectedDirectoryHandle: FileSystemDirectoryHandle,
  selectedRomMetadataHandle: FileSystemFileHandle
) => {
  const allRomMetadataMap = await getAllRomMetadataMap(selectedDirectoryHandle);

  // Get romid from selectedRomMetadataHandle
  const selectedRom = await fetchRomMetadata(selectedRomMetadataHandle);

  if (selectedRom == null) {
    console.log("Failed to LopadRomMetadata");
    return;
  }

  const [scalings, tableMap] = await buildRomTables(
    allRomMetadataMap,
    selectedRom.romid[0].xmlid[0]
  );

  const scalingMap = scalings.reduce(
    (acc: Record<string, Scaling>, cur: Scaling) => {
      if (!cur.name) return acc;
      if (!acc[cur.name]) acc[cur.name] = {};
      acc[cur.name] = { ...cur, ...acc[cur.name] };
      return acc;
    },
    {}
  );

  // Remove tables that dont have an address
  const newTableMap = Object.keys(tableMap)
    .filter((tableMapKey) => tableMap[tableMapKey].address)
    .reduce((acc, cur) => {
      return {
        ...acc,
        [cur]: tableMap[cur],
      };
    }, {});

  return { scalingMap, tableMap: newTableMap };
};
