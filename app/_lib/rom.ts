import { LogRecord } from "@/app/_lib/log";
import { scalingAliases, typeToReader } from "./consts";
import { Axis, Scaling, Table } from "./rom-metadata";
import { Parser as exprParser } from "expr-eval";
import { sprintf } from "sprintf-js";

// Returns table filled with data from rom, inclues axis
export async function getFilledTable(
  romFileHandle: FileSystemFileHandle,
  scalingMap: Record<string, Scaling>,
  table: Table
): Promise<Table> {
  let newTable = { ...table };
  const romFile = await romFileHandle.getFile();
  const romBuffer = await romFile.arrayBuffer();
  const romDataArray = new DataView(
    romBuffer,
    romFile.name.endsWith(".srf") ? 328 : 0
  );
  if (table.xAxis) {
    newTable.xAxis = fillAxis(romDataArray, scalingMap, table.xAxis);
  }
  if (table.yAxis) {
    newTable.yAxis = fillAxis(romDataArray, scalingMap, table.yAxis);
  }
  // Fill table
  newTable = fillTable(romDataArray, scalingMap, newTable);
  return newTable;
}

function fillAxis(
  romBuffer: DataView,
  scalingMap: Record<string, Scaling>,
  axis: Axis
): Axis {
  // get scaling
  let newAxis = { ...axis };
  let { address, elements, scaling } = axis;
  if (!scaling || !elements || !address) {
    console.log("Error fillAxis scaling, elements, or address is missing");
    return {};
  }
  newAxis.scalingValue = scalingMap[scaling];
  let { storageType, endian, toExpr, format } = scalingMap[scaling];
  if (!storageType || !endian || !toExpr || !format) {
    console.log(
      "Error fillAxis storageType, endian, toExpr, or format is missing"
    );
    return {};
  }
  let { reader, byteCount } = typeToReader[storageType];
  if (!reader || !byteCount) {
    console.log(
      `missing storagetype for axis scaling: ${scaling} storageType: ${storageType} endian: ${endian}`
    );
  }
  let values = [];
  for (let i = 0; i < elements; i++) {
    var parser = new exprParser();
    let offset = parseInt(address, 16) + i * byteCount;
    // @ts-ignore:next-line
    let value = romBuffer[reader](offset);
    let displayValue = value;
    if (toExpr) {
      displayValue = parser.evaluate(toExpr, { x: value });
      if (format) {
        displayValue = sprintf(format, displayValue);
      }
    }
    values.push(displayValue);
  }
  newAxis.values = values;
  return newAxis;
}

function fillTable(
  romBuffer: DataView,
  scalingMap: Record<string, Scaling>,
  table: Table
): Table {
  let newTable = { ...table };
  let { address, scaling, swapxy, xAxis, yAxis } = table;
  if (!address || !scaling || !swapxy || !xAxis || !yAxis) {
    console.log(
      "error fillTable missing one of address, scaling, swapxy, xAxis, yAxis"
    );
    return {};
  }
  newTable.scalingValue = scalingMap[scaling];
  let { storageType, endian, toExpr, format } = scalingMap[scaling];

  if (!storageType || !endian || !toExpr || !format) {
    console.log(
      "error fillTable missing one of  storageType, endian, toExpr, format"
    );
    return {};
  }
  // let reader, byteCount = undefined
  let { reader, byteCount } = typeToReader[storageType];
  if (storageType == "bloblist") return {};

  if (!reader || !byteCount) {
    console.log(
      `missing storagetype for table scaling: ${scaling} storageType: ${storageType} endian: ${endian}`
    );
  }

  let elements = 1;
  if (xAxis && xAxis.elements) elements *= xAxis.elements;
  if (yAxis && yAxis.elements) elements *= yAxis.elements;

  for (let i = 0; i < elements; i++) {
    var parser = new exprParser();
    let offset = parseInt(address, 16) + i * byteCount;
    let value;
    try {
      // @ts-ignore:next-line
      value = romBuffer[reader](offset, endian == "little");
    } catch (e) {
      debugger;
    }
    // let value = romBuffer[reader](offset)
    let displayValue = value;
    if (toExpr) {
      displayValue = parser.evaluate(toExpr, { x: value });
      if (format) {
        // displayValue = sprintf(format, displayValue)
      }
    }
    // let x, y = 0
    switch (newTable.type) {
      case "3D":
        let x, y;
        if (swapxy) {
          x = Math.floor(i / yAxis.elements!);
          y = i - x * yAxis.elements!;
        } else {
          y = Math.floor(i / xAxis.elements!);
          x = i - y * xAxis.elements!;
        }

        if (!newTable.values) newTable.values = [];
        if (!newTable.values[y]) newTable.values[y] = [];
        // @ts-ignore:next-line
        newTable.values[y][x] = displayValue;
        break;
      case "2D":
        if (yAxis) {
          if (!newTable.values) newTable.values = [];
          newTable.values[i] = [displayValue];
        } else if (xAxis) {
          if (!newTable.values) newTable.values = [[]];
          // @ts-ignore:next-line
          newTable.values[0][i] = displayValue;
        } else {
          console.log(`2d table missing x and y axis ${newTable.name}`);
        }
        break;
      case "1D":
        newTable.values = [[displayValue]];
        break;
      default:
        console.log(
          `cannot fill table type ${newTable.type} tableName: ${newTable.name}`
        );
    }
  }
  return newTable;
}

export function FillTableFromLog(table: Table, logs: LogRecord[]): Table {
  let newTable = duplicateTable(table);

  logs.forEach((l) => {
    switch (table.type) {
      case "3D":
        let { xAxis, yAxis } = table;
        // Y axis
        let yScaling = yAxis.scaling;
        let yAxisLogValue = l[yScaling];
        if (typeof yAxisLogValue !== "number") {
          console.log(
            "Wanted log value to be of type number",
            "log",
            l,
            "yScaling",
            yScaling
          );
          return;
        }
        let y = nearestIndex(yAxis.values, yAxisLogValue);

        let xScaling = xAxis.scaling;
        let xAxisLogValue = l[xScaling];
        // TODO hit this if somehow
        if (!xAxisLogValue) {
          var parser = new exprParser();
          let { insteadUse, expr } = scalingAliases[xScaling];
          if (!l[insteadUse]) return;

          xAxisLogValue = parser.evaluate(expr, l);
        }
        let x = nearestIndex(xAxis.values, xAxisLogValue);

        newTable.rawLogs[y][x].push(l);
        break;
      case "2D":
        break;
      case "1D":
        break;
      default:
        console.log(
          `unknown table type ${table.type} on tableName: ${tableName}`
        );
    }
  });
  return newTable;
}

// function duplicateTable({ tableName, scaling, agg, defaultValue }) {
function duplicateTable(table: Table): Table {
  const fillTable: Table = { ...table };
  fillTable.values = table.values?.map((row) => {
    if (Array.isArray(row)) {
      return [...row];
    } else {
      return row;
    }
  });
  return fillTable;
}

function nearestIndex(array: number[], value: number): number {
  return array.indexOf(
    array.reduce((c, n) => {
      if (Math.abs(c - value) >= Math.abs(n - value)) {
        return n;
      }
      return c;
    }, 99999)
  );
}

// import { Parser as exprParser } from "expr-eval";
// import { sprintf } from 'sprintf-js'
// import { typeToReader, scalingAliases } from "./consts";

// async function getRomBuffer(): Promise<Buffer> {
//   return new Promise(async (resolve, reject) => {

//     const config = { type: 'open-file' }
//     let dir = await dialog(config)
//     fs.readFile(dir[0], (err, data) => {
//       if (err) reject(err);
//       resolve(data)
//     });
//   })
// }

// interface Table {
//   values: any[]
//   rawLogs: any[]
//   scaling: any
// }

// interface Axis {
//   address: string
//   elements: string
//   name: string
//   scaling: string
//   type: string
//   values: number[]
// }

// interface RomScaling {
//   name: string
//   storageType: string
//   endian?: string
//   format?: string
//   frExpr?: string
//   inc?: string
//   max?: string
//   min?: string
//   toExpr?: string
//   units?: string
// }

// interface RomTable {
//   address?: string
//   category?: string
//   name?: string
//   scaling?: string
//   type?: string
//   swapxy?: string
//   xAxis?: Axis
//   yAxis?: Axis
//   values?: number[][]
//   rawLogs?: Log[][][]

//   [tableNameOrIndex: string | number]: RomTable | string | Axis | number[][] | Log[][][]
//   // Can also be a map of maps [scaling][agg]: table

// }

// interface RomTables {
//   [tableName: string]: RomTable;
// }

// interface RomScalings {
//   [scalingName: string]: RomScaling;
// }

// interface Tables {
//   [tableName: string]: Table;
// }

// interface TableRef {
//   tableName: string;
//   scaling: string;
//   agg?: string;
// }

// interface Log {
//   LogID: number,
//   LogEntryDate: string,
//   LogEntryTime: string,
//   LogEntrySeconds: number,
//   LogNotes: string,
//   AFR: number,
//   STFT: number,
//   CurrentLTFT: number,
//   IdleLTFT: number,
//   CruiseLTFT: number,
//   Load: number,
//   O2Sensor2: number,
//   IPW: number,
//   AFRMAP: number,
//   LoadTiming: number,
//   TimingAdv: number,
//   KnockSum: number,
//   RPM: number,
//   Baro: number,
//   WGDC_Active: number,
//   MAP: number,
//   Boost: number,
//   MAF: number,
//   IDC: number,
//   ExVVTtarget: number,
//   InVVTtarget: number,
//   InVVTactual: number,
//   ExVVTactual: number,
//   TPS: number,
//   APP: number,
//   IAT: number,
//   WGDCCorr: number,
//   Speed: number,
//   Battery: number,
//   ECT: number,
//   MAT: number,
//   MAPCalcs: number,
//   IMAPCalcs: number,
//   MAFCalcs: number,
//   ChosenCalc: number,
//   boost_error: string,
//   Custom: string,
//   AFROffsetSeconds: number,
//   RPMGain: number
// }

// export class Rom {
//   tableMap: RomTables
//   tables: RomTable[]
//   scalingsMap: RomScaling
//   log: Log[]

//   romBuffer: Buffer | number

//   constructor(tables, scalingsMap, log) {
//     this.tables = tables //  table[scaling][agg]
//     this.tableMap = {}
//     this.scalingsMap = scalingsMap
//     this.log = log
//   }

//   async LoadRom() {
//     try {
//       this.romBuffer = await getRomBuffer()
//     } catch (err) {
//       console.log(err)
//     }
//   }

//   FillTables() {
//     this.tables.forEach(table => {
//       if (table.xAxis) {
//         table.xAxis = this.fillAxis(table.xAxis)
//       }
//       if (table.yAxis) {
//         table.yAxis = this.fillAxis(table.yAxis)
//       }
//       // Fill table
//       this.fillTable(table)
//       if (table.name) {
//         this.tableMap[table.name] = table
//       }
//     });
//   }

//   fillAxis(axis) {
//     // get scaling
//     let { address, elements, scaling } = axis
//     let { storageType, endian, toExpr, format } = this.scalingsMap[scaling]
//     let { reader, byteCount } = typeToReader[storageType][endian]
//     if (!reader || !byteCount) {
//       console.log(`missing storagetype for axis scaling: ${scaling} storageType: ${storageType} endian: ${endian}`)
//     }
//     let values = []
//     for (let i = 0; i < elements; i++) {
//       var parser = new exprParser()
//       let offset = parseInt(address, 16) + i * byteCount
//       let value = this.romBuffer[reader](offset)
//       let displayValue = value
//       if (toExpr) {
//         displayValue = parser.evaluate(toExpr, { x: value })
//         if (format) {
//           displayValue = sprintf(format, displayValue)
//         }
//       }
//       values.push(displayValue)
//     }
//     axis.values = values
//     return axis
//   }

//   PrintTable({
//     tableName,
//     agg,
//     scaling,
//     tabs,
//     noAxis,
//     formatter
//   }: {
//     tableName,
//     agg,
//     scaling,
//     tabs,
//     noAxis,
//     formatter?
//   }) {
//     let table = this.tableMap[tableName]

//     if (!scaling) scaling = table.scaling

//     let tableValues
//     if (agg) {
//       tableValues = table[scaling][agg]
//     } else {
//       tableValues = table.values
//     }
//     let tableCellWidth = Math.max(...tableValues.flat().map(x => {
//       // if (formatter) {
//       //     x = formatter(x)
//       // }
//       return `${x}`.length
//     }))
//     if (table.xAxis) {
//       tableCellWidth = Math.max(tableCellWidth, ...table.xAxis.values.map(x => {
//         // if (formatter) {
//         //     x = formatter(x)
//         // }
//         return `${x}`.length
//       }))
//     }
//     tableCellWidth++

//     if (!table) {
//       console.log(`missing table name ${tableName} in tableMap`)
//       return
//     }
//     let tableAsString = ''
//     let tableXAxis = ''
//     if (table.xAxis) {
//       if (table.yAxis) {
//         // Y axis padding
//         tableXAxis += ''.padStart(tableCellWidth)
//       }
//       table.xAxis.values.forEach(xAxisValue => {
//         tableXAxis += `${xAxisValue}`.padStart(tableCellWidth)
//       })
//     }
//     tableValues.forEach((y, yIndex) => {
//       if (tableAsString !== '') tableAsString += '\n'
//       if (table.yAxis && !noAxis) {
//         tableAsString += `${table.yAxis.values[yIndex]}`.padStart(tableCellWidth)
//       }
//       y.forEach((x) => {
//         if (formatter) {
//           x = formatter(x)
//         }
//         if (!noAxis) {
//           tableAsString += `${x}`.padStart(tableCellWidth)
//         } else {
//           tableAsString += `${x}\t`
//         }
//       })
//       tableAsString = tableAsString.substring(0, tableAsString.length - 1)
//     })
//     if (tabs) {
//       console.log('\n')
//       console.log(`${tableName} ${scaling} ${agg}`)
//       console.log((noAxis ? '' : '\t') + tableXAxis.split(/(?:(?![\n\r])\s)+/).join('\t'))
//       console.log(tableAsString.split(/(?:(?![\n\r])\s)+/).join('\t'))
//     } else {
//       console.log(`\n${tableName} ${scaling} ${agg}\n`, tableAsString)
//     }
//   }

//   //
//   FillTableFromLog(tableName) {
//     let table = this.tableMap[tableName]
//     this.duplicateTable({
//       tableName,
//       scaling: 'rawLogs',
//       defaultValue: () => []
//     })
//     let { xAxis, yAxis } = table
//     this.log.forEach(l => {
//       switch (table.type) {
//         case "3D":
//           // Y axis
//           let yScaling = yAxis.scaling
//           let yAxisLogValue = l[yScaling]
//           let y = nearestIndex(yAxis.values, yAxisLogValue)
//           // X axis

//           let xScaling = xAxis.scaling
//           let xAxisLogValue = l[xScaling]
//           if (!xAxisLogValue) {
//             var parser = new exprParser()
//             let { insteadUse, expr } = scalingAliases[xScaling]
//             if (!l[insteadUse]) return

//             xAxisLogValue = parser.evaluate(expr, l)
//           }
//           let x = nearestIndex(xAxis.values, xAxisLogValue)

//           table.rawLogs[y][x].push(l)
//           break
//         case "2D":
//           break
//         case "1D":
//           break
//         default:
//           console.log(`unknown table type ${table.type} on tableName: ${tableName}`)
//       }
//     })
//   }

//   duplicateTable({
//     tableName,
//     scaling,
//     agg,
//     defaultValue
//   }) {
//     let table = this.tableMap[tableName]
//     let fillTable = [] as number[][]
//     table.values.forEach((row, y) => {
//       fillTable[y] = [] as number[]
//       row.forEach((cell, x) => {
//         fillTable[y][x] = defaultValue()
//       })
//     })

//     if (agg) {
//       if (!table[scaling]) table[scaling] = {} as RomTable
//       table[scaling][agg] = fillTable
//     } else {
//       table[scaling] = fillTable
//     }
//   }

//   // FillLogTable fills a table from rawLogs
//   // scalingAlias: {insteadUse: , expr: } which column of log to use and how to interpret it
//   FillLogTable({
//     tableName,
//     scaling,
//     agg,
//     scalingAlias // The value to fill in the table with. Aka use the "AFR" from the log
//   }) {
//     let table = this.tableMap[tableName]
//     let { rawLogs, scaling: tableScaling } = table

//     if (!scaling) {
//       scaling = tableScaling
//     }
//     this.duplicateTable({
//       tableName,
//       scaling,
//       agg,
//       defaultValue: () => 0
//     })

//     if (!rawLogs) {
//       console.log('Must run FillTableFromLog before FillLogTable')
//       return
//     }

//     switch (table.type) {
//       case "3D":
//         rawLogs.forEach((row, y) => {
//           row.forEach((cell, x) => {
//             switch (agg) {
//               case 'avg':
//                 table[scaling][agg][y][x] = (cell.reduce((c2, log) => {
//                   if (scalingAlias) {
//                     var parser = new exprParser()
//                     let { insteadUse, expr } = scalingAlias
//                     if (!log[insteadUse]) return c2
//                     // return c2 + parser.evaluate(expr, { x: log[insteadUse] })
//                     return c2 + parser.evaluate(expr, log)
//                   } else if (log[tableScaling] == null) {
//                     var parser = new exprParser()
//                     let { insteadUse, expr } = scalingAliases[tableScaling]
//                     return c2 + parser.evaluate(expr, log)
//                   } else {
//                     return c2 + log[tableScaling]
//                   }
//                 }, 0) / cell.length || 0).toFixed(2)
//                 break
//               case 'avgDiff':
//                 table[scaling][agg][y][x] = (cell.reduce((c2, log) => {
//                   if (scalingAlias) {
//                     var parser = new exprParser()
//                     let { insteadUse, expr } = scalingAlias
//                     let logValue = parser.evaluate(expr, log)
//                     let tableValue = table.values[y][x]
//                     let diff = tableValue - logValue
//                     return c2 + diff
//                   } else if (!log[tableScaling]) {
//                     var parser = new exprParser()
//                     let { insteadUse, expr } = scalingAliases[tableScaling]
//                     let logValue = parser.evaluate(expr, log)
//                     let tableValue = table.values[y][x]
//                     let diff = tableValue - logValue
//                     return c2 + diff
//                   } else {
//                     let logValue = log[tableScaling]
//                     let tableValue = table.values[y][x]
//                     let diff = tableValue - logValue
//                     return c2 + diff
//                   }
//                 }, 0) / cell.length || 0).toFixed(2)
//               case 'count':
//                 table[scaling][agg][y][x] = cell.length
//                 break
//             }
//           })
//         })
//         break
//       default:
//         console.log(`PrintLogTable: unknown table type ${table.type} on tableName: ${tableName}`)
//     }
//   }

//   // Takes 2 maps and aggregates them together
//   MapCombine({
//     tableName, // destination table
//     tableOne: { aggOne, scalingOne },
//     tableTwo: { tableTwoName, aggTwo, scalingTwo },
//     aggregator,
//     isAdvancedAggregator,
//     newTable: { newAgg, newScaling }
//   }) {
//     if (tableTwoName == null) {
//       tableTwoName = tableName
//     }
//     this.duplicateTable({
//       tableName,
//       agg: newAgg,
//       scaling: newScaling,
//       defaultValue: () => 0
//     })
//     let tableRef = this.tableMap[tableName]
//     let tableTwoRef = this.tableMap[tableTwoName]

//     let aggOneTable = tableRef.values
//     if (scalingOne) {
//       aggOneTable = tableRef[scalingOne]
//       if (aggOne) {
//         aggOneTable = tableRef[scalingOne][aggOne]
//       }
//     }
//     let aggTwoTable = tableTwoRef.values
//     if (scalingTwo) {
//       aggTwoTable = tableTwoRef[scalingTwo]
//       if (aggTwo) {
//         aggTwoTable = tableTwoRef[scalingTwo][aggTwo]
//       }
//     }
//     if (!tableRef[newScaling]) {
//       tableRef[newScaling] = {}
//     }
//     let newAggTable = tableRef[newScaling][newAgg]
//     newAggTable.forEach((row, y) => {
//       row.forEach((cell, x) => {
//         if (!isAdvancedAggregator) {
//           newAggTable[y][x] = aggregator(aggOneTable[y][x], aggTwoTable[y][x])
//         } else {
//           newAggTable[y][x] = aggregator(aggOneTable, aggTwoTable, y, x)
//         }
//       })
//     })
//   }
//   // This will combine 2 different maps,
//   // Take the values (x, y, cell) from toTable look them up in fromTable and place in destTable
//   MapCombineAdv({
//     toTable, // name, scaling, agg
//     fromTable,
//     destTable,
//     axisMap, // (toTable x, y, value): {xValue: , yValue: }
//   }) {
//     this.duplicateTable({
//       tableName: destTable.tableName,
//       scaling: destTable.scaling,
//       agg: destTable.agg,
//       defaultValue: () => 0
//     })

//     let realToTable = this.tableMap[toTable.tableName]
//     let realToTableValues = this.getTableByObj(toTable)

//     let realFromTable = this.tableMap[fromTable.tableName]
//     let realFromTableValues = this.getTableByObj(fromTable)
//     let realDestTable = this.getTableByObj(destTable)

//     realToTableValues.forEach((row, y) => {
//       let yValue = realToTable.yAxis.values[y]
//       row.forEach((cellValue, x) => {
//         let xValue = realToTable.xAxis.values[x]
//         // get cell value
//         let newAxisValues = axisMap(xValue, yValue, cellValue)
//         let axes = this.getAxes(realFromTable, newAxisValues.xValue, newAxisValues.yValue)
//         realDestTable[y][x] = realFromTableValues[axes.y][axes.x]
//       })
//     })
//   }

//   Map({
//     sourceTable, // name, scaling, agg
//     destTable,
//     aggregator,
//   }) {
//     this.duplicateTable({
//       tableName: destTable.tableName,
//       scaling: destTable.scaling,
//       agg: destTable.agg,
//       defaultValue: () => 0
//     })

//     let realSourceTableValues = this.getTableByObj(sourceTable)
//     let realDestTableValues = this.getTableByObj(destTable)

//     realSourceTableValues.forEach((row, y) => {
//       row.forEach((cellValue, x) => {
//         realDestTableValues[y][x] = aggregator(realSourceTableValues, x, y)
//       })
//     })
//   }
//   getTableByObj({ tableName, scaling, agg }) {
//     if (scaling) {
//       if (agg) {
//         return this.tableMap[tableName][scaling][agg]
//       }
//     }
//     return this.tableMap[tableName].values
//   }
//   // Get the value closest to x, y axis
//   getAxes(table, xAxis, yAxis) {
//     let x = nearestIndex(table.xAxis.values, xAxis)
//     let y = nearestIndex(table.yAxis.values, yAxis)
//     return { x, y }
//   }
// }

// const nearestIndex = (array, value) => {
//   return array.indexOf(array.reduce((c, n) => {
//     if (Math.abs(c - value) >= Math.abs(n - value)) {
//       return n
//     }
//     return c
//   }, 99999))
// }

// exports.Rom = Rom
// exports.ScalingAliases = scalingAliases
// export { scalingAliases as ScalingAliases }
