"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const tslib_1 = require("tslib");
const xml_wrapper_1 = tslib_1.__importDefault(require("./xml-wrapper"));
const rom_handler_1 = require("./rom-handler");
const log_chopper_1 = require("./log-chopper");
const map_fixer_1 = require("./map-fixer");
const node_file_dialog_1 = tslib_1.__importDefault(require("node-file-dialog"));
const main = async () => {
    let { tables, scalingsMap } = await xml_wrapper_1.default.GetRom('59580304');
    tables = filterAddressless(tables);
    //ask for log file
    const config = { type: 'open-file' };
    let dir = await (0, node_file_dialog_1.default)(config);
    dir = dir[0].split('/').join('\\');
    const logChopper = new log_chopper_1.LogChopper(dir);
    await logChopper.LoadLogs();
    logChopper.ShiftAfr(45);
    logChopper.AddRPMGain(0.15);
    // logChopper.tagAllForDelete()
    // logChopper.keepIdle()
    // logChopper.keepCruise()
    // logChopper.deleteLargeTPSChanges()
    // logChopper.DropDeleted()
    let log = logChopper.log;
    console.log(logChopper.log[0]);
    logChopper.SplitWot(86, 0.00);
    // logChopper.SplitWot(0, 0.00)
    // logChopper.Accelerating
    // console.log(`wots: ${logChopper.wots.length}`)
    // let log = logChopper.wots.flat()
    log = logChopper.wots.reduce((all, wot) => {
        return [...all, ...wot];
        // return [...all, ...wot.slice(30)]
    }, []);
    // log = logChopper.wots[5]
    // log = logChopper.log
    logChopper.WriteChopped();
    // logChopper.WriteChoppedWot()
    let rom = new rom_handler_1.Rom(tables, scalingsMap, log);
    await rom.LoadRom();
    rom.FillTables();
    let mapFixer = new map_fixer_1.MapFixer(rom);
    // mapFixer.ScaleMapToMaf({debug: true, minCount: 100})
    // mapFixer.LogCounts()
    // mapFixer.AfrFix()
    // mapFixer.ShowBoost() // doesnt work
    mapFixer.ScaleMapToAfr({ debug: true });
    // mapFixer.ShowMapLoadCalcDiff({debug: true})
    // mapFixer.MivecInGain()
    // mapFixer.ShowAFROffsetSeconds()
    console.log("wow");
};
exports.main = main;
(0, exports.main)();
function filterAddressless(tables) {
    return tables.filter((table) => {
        if (!table.address) {
            return false;
        }
        return true;
    });
}
exports.default = exports.main;
//# sourceMappingURL=index.js.map