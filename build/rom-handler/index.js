"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalingAliases = exports.Rom = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const expr_eval_1 = require("expr-eval");
// var romRoot = String.raw`C:\Users\Steven\Google Drive\Evoman\roms\\`
// var romRoot = String.raw`C:\\Users\\Steven\\My Drive\\Evoman\\roms`
var romRoot = '';
const sprintf_js_1 = require("sprintf-js");
const node_file_dialog_1 = tslib_1.__importDefault(require("node-file-dialog"));
const scalingAliases = {
    'StockXMAP in kPa': {
        // insteadUse: 'PSIG', // tephra logger
        insteadUse: 'MAP',
        expr: 'x'
    },
    'Omni4barMAP in kPa': {
        // insteadUse: 'PSIG', // tephra logger
        insteadUse: 'MAP',
        expr: 'x'
    },
    'StockXMAP in psig': {
        insteadUse: 'PSIG',
        expr: 'x'
    },
    'Loadify': {
        'MAPCalcs': {
            insteadUse: 'MAPCalcs',
            expr: 'x'
        },
        'MAFCalcs': {
            insteadUse: 'MAFCalcs',
            expr: 'x'
        },
        'AFROffsetSeconds': {
            insteadUse: 'AFROffsetSeconds',
            expr: 'x'
        },
        insteadUse: 'Load',
        expr: 'x'
    },
    'Throttle_Main - Stored Minimum Throttle %': {
        insteadUse: 'TPS',
        expr: 'x/(84/100)'
    },
    'psia8': {
        insteadUse: 'PSIG',
        expr: 'x - 1.6'
    },
    'AFR': {
        insteadUse: 'AFR',
        expr: 'x'
    },
    'RPMGain': {
        insteadUse: 'RPMGain',
        expr: 'x'
    },
};
exports.ScalingAliases = scalingAliases;
const typeToReader = {
    undefined: {
        undefined: {
            reader: 'readInt16BE',
            byteCount: 2,
        }
    },
    int8: {
        undefined: {
            reader: 'readInt8',
            byteCount: 1,
        },
        big: {
            reader: 'readInt8',
            byteCount: 1,
        }
    },
    uint8: {
        undefined: {
            reader: 'readUInt8',
            byteCount: 1,
        },
        big: {
            reader: 'readUInt8',
            byteCount: 1,
        }
    },
    int16: {
        undefined: {
            reader: 'readInt16BE',
            byteCount: 2,
        },
        big: {
            reader: 'readInt16BE',
            byteCount: 2,
        }
    },
    uint16: {
        undefined: {
            reader: 'readUInt16BE',
            byteCount: 2,
        },
        big: {
            reader: 'readUInt16BE',
            byteCount: 2,
        }
    },
    int32: {
        undefined: {
            reader: 'readInt32BE',
            byteCount: 4,
        },
        big: {
            reader: 'readInt32BE',
            byteCount: 4,
        }
    },
    uint32: {
        undefined: {
            reader: 'readUInt32BE',
            byteCount: 4,
        },
        big: {
            reader: 'readUInt32BE',
            byteCount: 4,
        }
    }
};
async function getRomBuffer() {
    return new Promise(async (resolve, reject) => {
        const config = { type: 'open-file' };
        let dir = await (0, node_file_dialog_1.default)(config);
        fs_1.default.readFile(dir[0], (err, data) => {
            if (err)
                reject(err);
            resolve(data);
        });
    });
}
class Rom {
    tableMap;
    constructor(tables, scalingsMap, log) {
        this.tables = tables; //  table[scaling][agg]
        this.tableMap = {};
        this.scalingsMap = scalingsMap;
        this.log = log;
    }
    async LoadRom() {
        try {
            this.romBuffer = await getRomBuffer();
        }
        catch (err) {
            console.log(err);
        }
    }
    FillTables() {
        this.tables.forEach(table => {
            if (table.xAxis) {
                table.xAxis = this.fillAxis(table.xAxis);
            }
            if (table.yAxis) {
                table.yAxis = this.fillAxis(table.yAxis);
            }
            // Fill table
            this.fillTable(table);
            if (table.name) {
                this.tableMap[table.name] = table;
            }
        });
    }
    fillAxis(axis) {
        // get scaling
        let { address, elements, scaling } = axis;
        let { storageType, endian, toExpr, format } = this.scalingsMap[scaling];
        let { reader, byteCount } = typeToReader[storageType][endian];
        if (!reader || !byteCount) {
            console.log(`missing storagetype for axis scaling: ${scaling} storageType: ${storageType} endian: ${endian}`);
        }
        let values = [];
        for (let i = 0; i < elements; i++) {
            var parser = new expr_eval_1.Parser();
            let offset = parseInt(address, 16) + i * byteCount;
            let value = this.romBuffer[reader](offset);
            let displayValue = value;
            if (toExpr) {
                displayValue = parser.evaluate(toExpr, { x: value });
                if (format) {
                    displayValue = (0, sprintf_js_1.sprintf)(format, displayValue);
                }
            }
            values.push(displayValue);
        }
        axis.values = values;
        return axis;
    }
    fillTable(table) {
        let { address, scaling, swapxy, xAxis, yAxis } = table;
        let { storageType, endian, toExpr, format } = this.scalingsMap[scaling];
        let reader, byteCount = undefined;
        try {
            let obj = typeToReader[storageType][endian];
            reader = obj.reader;
            byteCount = obj.byteCount;
        }
        catch (e) {
            if (storageType == "bloblist")
                return;
        }
        if (!reader || !byteCount) {
            console.log(`missing storagetype for table scaling: ${scaling} storageType: ${storageType} endian: ${endian}`);
        }
        let elements = 1;
        if (xAxis && xAxis.elements)
            elements *= xAxis.elements;
        if (yAxis && yAxis.elements)
            elements *= yAxis.elements;
        for (let i = 0; i < elements; i++) {
            var parser = new expr_eval_1.Parser();
            let offset = parseInt(address, 16) + i * byteCount;
            let value;
            try {
                value = this.romBuffer[reader](offset);
            }
            catch (e) {
                debugger;
            }
            // let value = this.romBuffer[reader](offset)
            let displayValue = value;
            if (toExpr) {
                displayValue = parser.evaluate(toExpr, { x: value });
                if (format) {
                    // displayValue = sprintf(format, displayValue)
                }
            }
            // let x, y = 0
            switch (table.type) {
                case "3D":
                    let x, y;
                    if (swapxy) {
                        x = Math.floor(i / yAxis.elements);
                        y = i - (x * yAxis.elements);
                    }
                    else {
                        y = Math.floor(i / xAxis.elements);
                        x = i - (y * xAxis.elements);
                    }
                    if (!table.values)
                        table.values = [];
                    if (!table.values[y])
                        table.values[y] = [];
                    table.values[y][x] = displayValue;
                    break;
                case "2D":
                    if (yAxis) {
                        if (!table.values)
                            table.values = [];
                        table.values[i] = [displayValue];
                    }
                    else if (xAxis) {
                        if (!table.values)
                            table.values = [[]];
                        table.values[0][i] = table.values;
                    }
                    else {
                        console.log(`2d table missing x and y axis ${table.name}`);
                    }
                    break;
                case "1D":
                    table.values = [[displayValue]];
                    break;
                default:
                    console.log(`cannot fill table type ${table.type} tableName: ${table.name}`);
            }
        }
        return table;
    }
    PrintTable({ tableName, agg, scaling, tabs, formatter }) {
        let table = this.tableMap[tableName];
        if (!scaling)
            scaling = table.scaling;
        let tableValues;
        if (agg) {
            tableValues = table[scaling][agg];
        }
        else {
            tableValues = table.values;
        }
        let tableCellWidth = Math.max(...tableValues.flat().map(x => {
            // if (formatter) {
            //     x = formatter(x)
            // }
            return `${x}`.length;
        }));
        if (table.xAxis) {
            tableCellWidth = Math.max(tableCellWidth, ...table.xAxis.values.map(x => {
                // if (formatter) {
                //     x = formatter(x)
                // }
                return `${x}`.length;
            }));
        }
        tableCellWidth++;
        if (!table) {
            console.log(`missing table name ${tableName} in tableMap`);
            return;
        }
        let tableAsString = '';
        if (table.xAxis) {
            if (table.yAxis) {
                // Y axis padding
                tableAsString += ''.padStart(tableCellWidth);
            }
            table.xAxis.values.forEach(xAxisValue => {
                tableAsString += `${xAxisValue}`.padStart(tableCellWidth);
            });
        }
        tableValues.forEach((y, yIndex) => {
            tableAsString += '\n';
            if (table.yAxis) {
                tableAsString += `${table.yAxis.values[yIndex]}`.padStart(tableCellWidth);
            }
            y.forEach((x) => {
                if (formatter) {
                    x = formatter(x);
                }
                tableAsString += `${x}`.padStart(tableCellWidth);
            });
        });
        if (tabs) {
            console.log(`\n${tableName} ${scaling} ${agg}\n\t`, tableAsString.split(/(?:(?![\n\r])\s)+/).join('\t'));
        }
        else {
            console.log(`\n${tableName} ${scaling} ${agg}\n`, tableAsString);
        }
    }
    //
    FillTableFromLog(tableName) {
        let table = this.tableMap[tableName];
        this.duplicateTable({
            tableName,
            scaling: 'rawLogs',
            defaultValue: () => []
        });
        let { xAxis, yAxis } = table;
        this.log.forEach(l => {
            switch (table.type) {
                case "3D":
                    // Y axis
                    let yScaling = yAxis.scaling;
                    let yAxisLogValue = l[yScaling];
                    let y = nearestIndex(yAxis.values, yAxisLogValue);
                    // X axis
                    let xScaling = xAxis.scaling;
                    let xAxisLogValue = l[xScaling];
                    if (!xAxisLogValue) {
                        var parser = new expr_eval_1.Parser();
                        let { insteadUse, expr } = scalingAliases[xScaling];
                        if (!l[insteadUse])
                            return;
                        xAxisLogValue = parser.evaluate(expr, { x: l[insteadUse] });
                    }
                    let x = nearestIndex(xAxis.values, xAxisLogValue);
                    table.rawLogs[y][x].push(l);
                    break;
                case "2D":
                    break;
                case "1D":
                    break;
                default:
                    console.log(`unknown table type ${table.type} on tableName: ${tableName}`);
            }
        });
    }
    duplicateTable({ tableName, scaling, agg, defaultValue }) {
        let table = this.tableMap[tableName];
        let fillTable = [];
        table.values.forEach((row, y) => {
            fillTable[y] = [];
            row.forEach((cell, x) => {
                fillTable[y][x] = defaultValue();
            });
        });
        if (agg) {
            if (!table[scaling])
                table[scaling] = {};
            table[scaling][agg] = fillTable;
        }
        else {
            table[scaling] = fillTable;
        }
    }
    // FillLogTable fills a table from rawLogs
    // scalingAlias: {insteadUse: , expr: } which column of log to use and how to interpret it
    FillLogTable({ tableName, scaling, agg, scalingAlias // The value to fill in the table with. Aka use the "AFR" from the log 
     }) {
        let table = this.tableMap[tableName];
        let { rawLogs, scaling: tableScaling } = table;
        if (!scaling) {
            scaling = tableScaling;
        }
        this.duplicateTable({
            tableName,
            scaling,
            agg,
            defaultValue: () => 0
        });
        if (!rawLogs) {
            console.log('Must run FillTableFromLog before FillLogTable');
            return;
        }
        switch (table.type) {
            case "3D":
                rawLogs.forEach((row, y) => {
                    row.forEach((cell, x) => {
                        switch (agg) {
                            case 'avg':
                                table[scaling][agg][y][x] = (cell.reduce((c2, log) => {
                                    if (scalingAlias) {
                                        var parser = new expr_eval_1.Parser();
                                        let { insteadUse, expr } = scalingAlias;
                                        if (!log[insteadUse])
                                            return c2;
                                        return c2 + parser.evaluate(expr, { x: log[insteadUse] });
                                    }
                                    else if (log[tableScaling] == null) {
                                        var parser = new expr_eval_1.Parser();
                                        let { insteadUse, expr } = scalingAliases[tableScaling];
                                        return c2 + parser.evaluate(expr, { x: log[insteadUse] });
                                    }
                                    else {
                                        return c2 + log[tableScaling];
                                    }
                                }, 0) / cell.length || 0).toFixed(2);
                                break;
                            case 'avgDiff':
                                table[scaling][agg][y][x] = (cell.reduce((c2, log) => {
                                    if (scalingAlias) {
                                        var parser = new expr_eval_1.Parser();
                                        let { insteadUse, expr } = scalingAlias;
                                        let logValue = parser.evaluate(expr, { x: log[insteadUse] });
                                        let tableValue = table.values[y][x];
                                        let diff = tableValue - logValue;
                                        return c2 + diff;
                                    }
                                    else if (!log[tableScaling]) {
                                        var parser = new expr_eval_1.Parser();
                                        let { insteadUse, expr } = scalingAliases[tableScaling];
                                        let logValue = parser.evaluate(expr, { x: log[insteadUse] });
                                        let tableValue = table.values[y][x];
                                        let diff = tableValue - logValue;
                                        return c2 + diff;
                                    }
                                    else {
                                        let logValue = log[tableScaling];
                                        let tableValue = table.values[y][x];
                                        let diff = tableValue - logValue;
                                        return c2 + diff;
                                    }
                                }, 0) / cell.length || 0).toFixed(2);
                            case 'count':
                                table[scaling][agg][y][x] = cell.length;
                                break;
                        }
                    });
                });
                break;
            default:
                console.log(`PrintLogTable: unknown table type ${table.type} on tableName: ${tableName}`);
        }
    }
    // Takes 2 maps and aggregates them together 
    MapCombine({ tableName, // destination table
    tableOne: { aggOne, scalingOne }, tableTwo: { tableTwoName, aggTwo, scalingTwo }, aggregator, isAdvancedAggregator, newTable: { newAgg, newScaling } }) {
        if (tableTwoName == null) {
            tableTwoName = tableName;
        }
        this.duplicateTable({
            tableName,
            agg: newAgg,
            scaling: newScaling,
            defaultValue: () => 0
        });
        let tableRef = this.tableMap[tableName];
        let tableTwoRef = this.tableMap[tableTwoName];
        let aggOneTable = tableRef.values;
        if (aggOne) {
            aggOneTable = tableRef[scalingOne][aggOne];
        }
        let aggTwoTable = tableTwoRef.values;
        if (aggTwo) {
            aggTwoTable = tableTwoRef[scalingTwo][aggTwo];
        }
        if (!tableRef[newScaling]) {
            tableRef[newScaling] = {};
        }
        let newAggTable = tableRef[newScaling][newAgg];
        newAggTable.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (!isAdvancedAggregator) {
                    newAggTable[y][x] = aggregator(aggOneTable[y][x], aggTwoTable[y][x]);
                }
                else {
                    newAggTable[y][x] = aggregator(aggOneTable, aggTwoTable, y, x);
                }
            });
        });
    }
    // This will combine 2 different maps, 
    // Take the values (x, y, cell) from toTable look them up in fromTable and place in destTable
    MapCombineAdv({ toTable, // name, scaling, agg
    fromTable, destTable, axisMap, // (toTable x, y, value): {xValue: , yValue: }
     }) {
        this.duplicateTable({
            tableName: destTable.tableName,
            scaling: destTable.scaling,
            agg: destTable.agg,
            defaultValue: () => 0
        });
        let realToTable = this.tableMap[toTable.tableName];
        let realToTableValues = this.getTableByObj(toTable);
        let realFromTable = this.tableMap[fromTable.tableName];
        let realFromTableValues = this.getTableByObj(fromTable);
        let realDestTable = this.getTableByObj(destTable);
        realToTableValues.forEach((row, y) => {
            let yValue = realToTable.yAxis.values[y];
            row.forEach((cellValue, x) => {
                let xValue = realToTable.xAxis.values[x];
                // get cell value
                let newAxisValues = axisMap(xValue, yValue, cellValue);
                let axes = this.getAxes(realFromTable, newAxisValues.xValue, newAxisValues.yValue);
                realDestTable[y][x] = realFromTableValues[axes.y][axes.x];
            });
        });
    }
    Map({ sourceTable, // name, scaling, agg
    destTable, aggregator, }) {
        this.duplicateTable({
            tableName: destTable.tableName,
            scaling: destTable.scaling,
            agg: destTable.agg,
            defaultValue: () => 0
        });
        let realSourceTableValues = this.getTableByObj(sourceTable);
        let realDestTableValues = this.getTableByObj(destTable);
        realSourceTableValues.forEach((row, y) => {
            row.forEach((cellValue, x) => {
                realDestTableValues[y][x] = aggregator(realSourceTableValues, x, y);
            });
        });
    }
    getTableByObj({ tableName, scaling, agg }) {
        if (scaling) {
            if (agg) {
                return this.tableMap[tableName][scaling][agg];
            }
        }
        return this.tableMap[tableName].values;
    }
    // Get the value closest to x, y axis
    getAxes(table, xAxis, yAxis) {
        let x = nearestIndex(table.xAxis.values, xAxis);
        let y = nearestIndex(table.yAxis.values, yAxis);
        return { x, y };
    }
}
exports.Rom = Rom;
const nearestIndex = (array, value) => {
    return array.indexOf(array.reduce((c, n) => {
        if (Math.abs(c - value) >= Math.abs(n - value)) {
            return n;
        }
        return c;
    }, 99999));
};
exports.Rom = Rom;
exports.ScalingAliases = scalingAliases;
//# sourceMappingURL=index.js.map