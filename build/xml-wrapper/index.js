"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalingsMap = exports.Tables = exports.GetRom = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const xml2js_1 = tslib_1.__importDefault(require("xml2js"));
// var exprEval = require('expr-eval')
var parser = new xml2js_1.default.Parser();
var romRoot = String.raw `C:\Program Files (x86)\OpenECU\EcuFlash\rommetadata\mitsubishi\evo\\`;
let scalingsMap = {};
const scalingMap = {
    'name': 'name',
    'units': 'units',
    'toexpr': 'toExpr',
    'frexpr': 'frExpr',
    'format': 'format',
    'min': 'min',
    'max': 'max',
    'inc': 'inc',
    'storagetype': 'storageType',
    'endian': 'endian',
};
var scalings = [{
        name: '',
        storageType: 'uint16',
        units: '%',
        frExpr: 'x+1',
        toExpr: 'x+1',
        min: 0,
        max: 350,
        inc: 0.05,
        format: '%.2f',
        endian: 'big',
    }];
scalings = [];
const tableAttrMap = {
    'name': 'name',
    'category': 'category',
    'address': 'address',
    'type': 'type',
    'swapxy': {
        'func': s => s == 'true',
        'key': 'swapxy',
    },
    'scaling': 'scaling',
};
var table = [{
        name: "",
        category: "",
        address: 0x00,
        type: '',
        swapxy: true,
        scaling: '',
        values: [],
        xAxis: {
            name: "",
            address: "",
            scaling: "",
            elements: 0,
            values: [],
        },
        yAxis: {
            name: "",
            address: "",
            scaling: "",
            elements: 0,
            values: [],
        },
        valid: false,
    }];
const axisMap = {
    'name': 'name',
    'type': 'type',
    'address': 'address',
    'elements': 'elements',
    'scaling': 'scaling',
};
// id: romJson
var romsById = {};
var tables = [];
var tableMap = {};
async function getAllRoms() {
    return new Promise((resolve, reject) => {
        fs_1.default.readdir(romRoot, async (err, files) => {
            var fetchRoms = [];
            files.forEach(async (file) => {
                fetchRoms.push(fetchRom(file));
            });
            (await Promise.all(fetchRoms)).forEach((rom) => {
                if (rom == undefined) {
                    return;
                }
                romsById[rom.romid[0].xmlid[0]] = rom;
            });
            resolve();
        });
    });
}
async function fetchRom(fileName) {
    return new Promise((resolve, reject) => {
        fs_1.default.readFile(romRoot + fileName, function (err, data) {
            if (err) {
                resolve();
                return;
            }
            parser.parseString(data, function (err, result) {
                if (err) {
                    // reject(err)
                    resolve();
                    return;
                }
                if (result.rom == undefined) {
                    reject("rom element missing from xml");
                    return;
                }
                resolve(result.rom);
            });
        });
    });
}
async function buildRom(romId) {
    let rom = romsById[romId];
    const parentRomId = rom.include;
    if (parentRomId) {
        buildRom(parentRomId);
    }
    rom.scaling && rom.scaling.forEach((scaling) => {
        scalings.push(mapScaling(scaling));
    });
    rom.table && rom.table.forEach((table) => {
        let mappedTable = mapTable(table);
        if (mappedTable) {
            tables.push(mappedTable);
        }
    });
}
function mapTable(table) {
    let dropTable = false;
    const attrs = table['$'];
    if (!tableMap[attrs.name]) {
        tableMap[attrs.name] = {};
    }
    let mappedTable = tableMap[attrs.name];
    Object.keys(attrs).map((key) => {
        let finalAttrValue = attrs[key];
        let finalAttrKey = tableAttrMap[key];
        if (typeof finalAttrKey == 'object') {
            finalAttrValue = finalAttrKey['func'](finalAttrValue);
            finalAttrKey = finalAttrKey['key'];
        }
        mappedTable[finalAttrKey] = finalAttrValue;
    });
    if (table.table == undefined) {
        mappedTable.type = '1D';
    }
    else if (table.table.length == 1) {
        mappedTable.type = '2D';
    }
    else if (table.table.length == 2) {
        mappedTable.type = '3D';
    }
    else {
        console.log('how we have more than a 2d table');
        return;
    }
    let axisCount = table.table && table.table.length;
    table.table && table.table.forEach((axis, axisIndex, table) => {
        const axisAttrs = axis['$'];
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
                break;
            case "X Axis":
                let xAxis = mapAxis(axis);
                mappedTable.xAxis = xAxis;
                break;
            case "Y Axis":
                let yAxis = mapAxis(axis);
                mappedTable.yAxis = yAxis;
                break;
            case "Static X Axis":
                dropTable = true;
                break;
            case "Static Y Axis":
                dropTable = true;
                break;
            default:
                console.log(`unhandled axis type ${axisType} axisName: ${axisAttrs.name}`);
                dropTable = true;
        }
    });
    if (dropTable) {
        return;
    }
    if (mappedTable.type == '3D') {
        if (!mappedTable.xAxis) {
            console.log('?');
        }
    }
    return mappedTable;
}
function mapAxis(axis) {
    const attrs = axis['$'];
    let mappedAxis = {};
    Object.keys(attrs).map((key) => {
        let finalAttrValue = attrs[key];
        let finalAttrKey = axisMap[key];
        if (typeof finalAttrKey == 'object') {
            finalAttrKey = finalAttrKey['key'];
            finalAttrValue = finalAttrKey['func'](finalAttrValue);
        }
        mappedAxis[finalAttrKey] = finalAttrValue;
    });
    if (axis.name && !axis.scaling) {
        axis.scaling = axis.name;
    }
    return mappedAxis;
}
function mapScaling(scaling) {
    const attrs = scaling['$'];
    let mappedScaling = {};
    Object.keys(attrs).map((key) => {
        let scalingMapKey = scalingMap[key];
        if (!scalingMap) {
            console.log(`unknown scalling attribute ${key}`);
        }
        mappedScaling[scalingMap[key]] = attrs[key];
    });
    return mappedScaling;
}
const GetRom = async (romId) => {
    await getAllRoms();
    await buildRom(romId);
    scalings.forEach((scaling) => {
        scalingsMap[scaling.name] = scaling;
    });
    return { tables, scalingsMap };
};
exports.GetRom = GetRom;
exports.Tables = tables;
exports.ScalingsMap = scalingMap;
exports.default = {
    GetRom: exports.GetRom,
    Tables: exports.Tables,
    ScalingsMap: exports.ScalingsMap
};
// main()
//# sourceMappingURL=index.js.map