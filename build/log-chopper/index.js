"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogChopper = void 0;
const tslib_1 = require("tslib");
const csvtojson_1 = tslib_1.__importDefault(require("csvtojson"));
const json2csv_1 = require("json2csv");
const fs_1 = tslib_1.__importDefault(require("fs"));
// var logRoot = String.raw`C:\Users\Steven\Google Drive\Evoman\scans\\`
// var logRoot = String.raw`C:\\Users\\Steven\\My Drive\\Evoman\\scans`
let logRoot = '';
class LogChopper {
    log;
    fileName;
    wots;
    constructor(fileName) {
        this.fileName = fileName;
        this.log = [];
    }
    async LoadLogs() {
        if (typeof this.fileName == "string") {
            let loadedLog = await this.loadLog(this.fileName);
            this.log = this.log.concat(removeTimeout(loadedLog));
        }
        else {
            await this.loadLog(this.fileName[0]).then((jsonObj) => {
                this.log.push(...removeTimeout(jsonObj));
            });
        }
    }
    async loadLog(fileName) {
        return (0, csvtojson_1.default)({
            checkType: true,
        })
            .fromFile(fileName);
    }
    // shifts AFR records down offset count
    ShiftAfr() {
        this.log = this.log.map((v, i, arr) => {
            let offsetSeconds = (100 / v.MAP) / v.RPM * 1000;
            for (let futureI = i; futureI < arr.length; futureI++) {
                let futureLog = arr[futureI];
                if (futureLog.LogEntrySeconds - v.LogEntrySeconds > offsetSeconds) {
                    return {
                        ...v,
                        AFR: arr[futureI].AFR,
                        AFROffsetSeconds: offsetSeconds
                    };
                }
            }
            return v;
        });
    }
    // adds rpmGain column from offsetTime
    AddRPMGain(offset = 0.1) {
        this.log = this.log.map((v, i, arr) => {
            // get log 1 second from now
            for (let futureI = i; futureI < arr.length; futureI++) {
                let futureLog = this.log[futureI];
                if (futureLog.LogEntrySeconds - v.LogEntrySeconds > offset) {
                    return {
                        ...v,
                        RPMGain: futureLog.RPM - v.RPM
                    };
                }
            }
            return v;
        });
    }
    tagAllForDelete() {
        this.log.forEach(l => {
            l.delete = true;
            l.deleteReason = "allForDelete";
        });
    }
    keepIdle() {
        this.log.forEach(l => {
            if (l.IPW != 0 &&
                l.Speed == 0 &&
                l.RPM < 1000 &&
                l.APP < 10) {
                l.delete = false;
                l.deleteReason = "keep idle";
            }
        });
    }
    keepCruise() {
        this.log.forEach(l => {
            if (l.IPW != 0 &&
                l.Speed > 0 &&
                l.TPS > 12 && l.TPS < 30 &&
                l.RPM > 1000 &&
                Math.abs(l.RPMGain) < 50) {
                l.delete = false;
                l.deleteReason = "keep cruise";
            }
        });
    }
    deleteLargeTPSChanges(period = 1, TPSChange = 5) {
        this.log.forEach((log, index, logs) => {
            //get log 1 second in the future
            for (let i = index; i < logs.length; i++) {
                let endLog = logs[i];
                if (endLog.LogEntrySeconds - log.LogEntrySeconds > period) {
                    break;
                }
                if (Math.abs(endLog.TPS - log.TPS) > TPSChange) {
                    log.delete = true;
                    log.deleteReason = "TPS change";
                    endLog.delete = true;
                    endLog.deleteReason = "TPS change";
                }
            }
        });
    }
    SplitWot(tpsThreshold, timeThreshold) {
        let wots = [];
        for (let i = 0; i < this.log.length; i++) {
            let l = this.log[i];
            if (l.TPS >= tpsThreshold) {
                let wotStart = i;
                while (wotStart > 0) {
                    let wotLog = this.log[wotStart - 1];
                    if (wotLog.LogEntrySeconds > l.LogEntrySeconds - timeThreshold) {
                        wotStart--;
                    }
                    else {
                        break;
                    }
                }
                while (i < this.log.length - 1) {
                    if (this.log[i].TPS > tpsThreshold) {
                        i++;
                    }
                    else {
                        break;
                    }
                }
                l = this.log[i];
                let wotEnd = i;
                while (wotEnd < this.log.length) {
                    let wotLog = this.log[wotEnd + 1];
                    if (wotLog && wotLog.LogEntrySeconds < l.LogEntrySeconds + timeThreshold) {
                        wotEnd++;
                    }
                    else {
                        break;
                    }
                }
                if (this.log[wotEnd].LogEntrySeconds - this.log[wotStart].LogEntrySeconds > 1) {
                    wots.push(this.log.slice(wotStart, wotEnd));
                }
                i = wotEnd;
            }
        }
        this.wots = wots;
    }
    //Only logs using MAP sensor
    // MapOnly() {
    //   for(const log of iter(this.log)) {
    //     if (log[])
    //     // log = logsIter.next()
    //   }
    // }
    Accelerating(period = 1, rpmChange = 100) {
        this.log.forEach((log, index, logs) => {
            //get log 1 second in the future
            for (let i = index; i < logs.length; i++) {
                let endLog = logs[i];
                if (endLog.LogEntrySeconds - log.LogEntrySeconds > period) {
                    if (endLog.RPM - log.RPM < rpmChange) {
                        log.delete = true;
                        log.deleteReason = "not Accelerating";
                    }
                }
            }
        });
    }
    DropDeleted() {
        this.log = this.log.filter(l => !l.delete);
    }
    // Returns logs for a period of time in seconds
    *LogsForPeriod(logs, period) {
        // let upperIter = iterTill(logs)
        // Get record where rmp is 100 more, then check if its been 1 second
        let lowerIter = iterTill(logs);
        let lower = lowerIter.next();
        let logsIter = iter(logs);
        // let log = logsIter.next()
        for (const log of logsIter) {
            // while (!log.done) {
            lower = lowerIter.next((l) => l.LogEntrySeconds > log.item.LogEntrySeconds - period && l.LogEntrySeconds <= log.item.LogEntrySeconds);
            yield ({
                logsSlice: logs.slice(lower.value.index, log.index),
                log
            });
            // log = logsIter.next()
        }
    }
    fields = [
        'LogID',
        // 'LogEntryDate',
        // 'LogEntryTime',
        'LogEntrySeconds',
        'AFR',
        // 'STFT',
        // 'CurrentLTFT',
        // 'IdleLTFT',
        // 'CruiseLTFT',
        'Load',
        // 'O2Sensor2',
        'IPW',
        // 'AFRMAP',
        'LoadTiming',
        'TimingAdv',
        'KnockSum',
        'RPM',
        // 'Baro',
        'MAP',
        'Boost',
        'WGDC_Active',
        // 'MAF',
        // 'IDC',
        // 'ExVVTtarget',
        // 'InVVTtarget',
        'InVVTactual',
        'ExVVTactual',
        'TPS',
        // 'APP',
        // 'IAT',
        'WGDCCorr',
        'Speed',
        // 'Battery',
        // 'ECT',
        // 'MAT',
        'MAPCalcs',
        'IMAPCalcs',
        'MAFCalcs',
        // 'ChosenCalc',
        'RPMGain',
        'deleteReason'
        //'AFROffsetSeconds',
    ];
    WriteChopped() {
        const json2csvParser = new json2csv_1.Parser({ fields: this.fields });
        const csv = json2csvParser.parse(this.log);
        fs_1.default.writeFileSync(`${logRoot}${this.fileName}-chopped.csv`, csv);
    }
    WriteChoppedWot() {
        const json2csvParser = new json2csv_1.Parser({ fields: this.fields });
        const csv = json2csvParser.parse(this.wots.reduce((all, wot) => {
            return [...all, ...wot];
            // return [...all, ...wot.slice(30)]
        }, []));
        fs_1.default.writeFileSync(`${logRoot}${this.fileName}-chopped-wot.csv`, csv);
    }
}
exports.LogChopper = LogChopper;
function removeTimeout(jsonObj) {
    return jsonObj.filter(l => l['Load'] !== 'timeout');
}
// Calling .next(till) will loop till(item) is true
function* iterTill(items) {
    let till;
    let itemIter = iter(items);
    let next = itemIter.next();
    while (!next.done) {
        till = yield next.value;
        while (!next.done) {
            if (till(next.value))
                break;
            next = itemIter.next();
        }
    }
}
// Eachtime .next called return the next item/value of given array
function* iter(items) {
    for (let [, item] of items.entries()) {
        yield (item);
    }
}
exports.default = {
    LogChopper
};
//# sourceMappingURL=index.js.map