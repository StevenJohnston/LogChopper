import csv from 'csvtojson'
import { Parser } from 'json2csv'
import fs from 'fs'

// var logRoot = String.raw`C:\Users\Steven\Google Drive\Evoman\scans\\`
// var logRoot = String.raw`C:\\Users\\Steven\\My Drive\\Evoman\\scans`
let logRoot = ''

interface LogRecord {
  LogID?: number;
  // LogEntryDate?: string;
  // LogEntryTime?: string;
  LogEntrySeconds?: number;
  AFR?: number;
  STFT?: number;
  CurrentLTFT?: number;
  // IdleLTFT?: string;
  // CruiseLTFT?: string;
  Load?: number;
  // O2Sensor2?: string;
  IPW?: number;
  // AFRMAP?: string;
  LoadTiming?: number;
  TimingAdv?: number;
  KnockSum?: number;
  RPM?: number;
  // Baro?: string;
  MAP?: number;
  Boost?: number;
  WGDC_Active?: number;
  // MAF?: string;
  // IDC?: string;
  // ExVVTtarget?: string;
  // InVVTtarget?: string;
  InVVTactual?: number;
  ExVVTactual?: number;
  TPS?: number;
  APP?: number;
  // IAT?: string;
  WGDCCorr?: number;
  Speed?: number;
  // Battery?: string;
  // ECT?: string;
  // MAT?: string;
  MAPCalcs?: number;
  IMAPCalcs?: number;
  MAFCalcs?: number;
  // ChosenCalc?: string;
  // AFROffsetSeconds?: string;



  RPMGain?: number;
  delete?: boolean;
  deleteReason?: string;
}

export class LogChopper {
  log: LogRecord[]
  fileName: string
  wots: LogRecord[][]

  constructor(fileName) {
    this.fileName = fileName
    this.log = []
  }

  async LoadLogs() {
    if (typeof this.fileName == "string") {
      let loadedLog = await this.loadLog(this.fileName)
      this.log = this.log.concat(removeTimeout(loadedLog))
    } else {
      await this.loadLog(this.fileName[0]).then((jsonObj) => {
        this.log.push(...removeTimeout(jsonObj))
      })
    }
  }

  async loadLog(fileName): Promise<LogRecord[]> {
    return csv({
      checkType: true,
    })
      .fromFile(fileName)
  }

  // shifts AFR records down offset count
  ShiftAfr() {
    this.log = this.log.map((v, i, arr) => {
      let offsetSeconds = (100 / v.MAP) / v.RPM * 1000
      for (let futureI = i; futureI < arr.length; futureI++) {
        let futureLog = arr[futureI]
        if (futureLog.LogEntrySeconds - v.LogEntrySeconds > offsetSeconds) {
          return {
            ...v,
            AFR: arr[futureI].AFR,
            AFROffsetSeconds: offsetSeconds
          }
        }
      }
      return v
    })
  }

  // adds rpmGain column from offsetTime
  AddRPMGain(offset = 0.1) {
    this.log = this.log.map((v, i, arr) => {
      // get log 1 second from now
      for (let futureI = i; futureI < arr.length; futureI++) {
        let futureLog = this.log[futureI]
        if (futureLog.LogEntrySeconds - v.LogEntrySeconds > offset) {
          return {
            ...v,
            RPMGain: futureLog.RPM - v.RPM
          }
        }
      }
      return v
    })
  }

  tagAllForDelete() {
    this.log.forEach(l => {
      l.delete = true
      l.deleteReason = "allForDelete"
    })
  }

  keepIdle() {
    this.log.forEach(l => {
      if (
        l.IPW != 0 &&
        l.Speed == 0 &&
        l.RPM < 1000 &&
        l.APP < 10
      ) {
        l.delete = false
        l.deleteReason = "keep idle"
      }
    })
  }

  keepCruise() {
    this.log.forEach(l => {
      if (
        l.IPW != 0 &&
        l.Speed > 0 &&
        l.TPS > 12 && l.TPS < 30 &&
        l.RPM > 1000 &&
        Math.abs(l.RPMGain) < 50
      ) {
        l.delete = false
        l.deleteReason = "keep cruise"
      }
    })
  }

  deleteLargeTPSChanges(period: number = 1, TPSChange: number = 5) {
    this.log.forEach((log, index, logs) => {
      for (let i = index; i > 0; i--) {
        let pastLog = logs[i]
        if (log.LogEntrySeconds - pastLog.LogEntrySeconds > period) {
          break;
        }
        if (Math.abs(pastLog.TPS - log.TPS) > TPSChange) {
          log.delete = true
          log.deleteReason = "TPS change"
          pastLog.delete = true
          pastLog.deleteReason = "TPS change"
        }
      }
    })
  }

  SplitWot(tpsThreshold, timeThreshold) {
    let wots = []
    for (let i = 0; i < this.log.length; i++) {
      let l = this.log[i]
      if (l.TPS >= tpsThreshold) {
        let wotStart = i
        while (wotStart > 0) {
          let wotLog = this.log[wotStart - 1]
          if (wotLog.LogEntrySeconds > l.LogEntrySeconds - timeThreshold) {
            wotStart--
          } else {
            break
          }
        }

        while (i < this.log.length - 1) {
          if (this.log[i].TPS > tpsThreshold) {
            i++
          } else {
            break
          }
        }

        l = this.log[i]
        let wotEnd = i
        while (wotEnd < this.log.length) {
          let wotLog = this.log[wotEnd + 1]
          if (wotLog && wotLog.LogEntrySeconds < l.LogEntrySeconds + timeThreshold) {
            wotEnd++
          } else {
            break
          }
        }
        if (this.log[wotEnd].LogEntrySeconds - this.log[wotStart].LogEntrySeconds > 1) {
          wots.push(this.log.slice(wotStart, wotEnd))
        }
        i = wotEnd
      }
    }
    this.wots = wots
  }

  //Only logs using MAP sensor
  // MapOnly() {
  //   for(const log of iter(this.log)) {
  //     if (log[])
  //     // log = logsIter.next()
  //   }
  // }

  Accelerating(period: number = 1, rpmChange: number = 100) {
    this.log.forEach((log, index, logs) => {
      //get log 1 second in the future
      for (let i = index; i < logs.length; i++) {
        let endLog = logs[i]
        if (endLog.LogEntrySeconds - log.LogEntrySeconds > period) {
          if (endLog.RPM - log.RPM < rpmChange) {
            log.delete = true
            log.deleteReason = "not Accelerating"
          }
        }
      }
    })
  }

  delete0ipw() {
    this.log.forEach((log) => {
      if (log.IPW == 0) {
        log.delete = true
        log.deleteReason = "0 ipw"
      }
    })
  }

  deleteSTFT0() {
    this.log.forEach((log) => {
      if (log.STFT == 0) {
        log.delete = true
        log.deleteReason = "0 ipw"
      }
    })
  }

  DropDeleted() {
    this.log = this.log.filter(l => !l.delete)
  }

  // Returns logs for a period of time in seconds
  *LogsForPeriod(logs: LogRecord[], period: number) {
    // let upperIter = iterTill(logs)

    // Get record where rmp is 100 more, then check if its been 1 second

    let lowerIter = iterTill(logs)
    let lower = lowerIter.next()

    let logsIter = iter(logs)
    // let log = logsIter.next()
    for (const log of logsIter) {
      // while (!log.done) {
      lower = lowerIter.next((l: LogRecord): boolean => l.LogEntrySeconds > log.item.LogEntrySeconds - period && l.LogEntrySeconds <= log.item.LogEntrySeconds)
      yield ({
        logsSlice: logs.slice(lower.value.index, log.index),
        log
      })
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
  ]

  WriteChopped() {
    const json2csvParser = new Parser({ fields: this.fields })
    const csv = json2csvParser.parse(this.log)
    fs.writeFileSync(`${logRoot}${this.fileName}-chopped.csv`, csv)
  }

  WriteChoppedWot() {
    const json2csvParser = new Parser({ fields: this.fields })
    const csv = json2csvParser.parse(this.wots.reduce((all, wot) => {
      return [...all, ...wot]
      // return [...all, ...wot.slice(30)]
    }, []))
    fs.writeFileSync(`${logRoot}${this.fileName}-chopped-wot.csv`, csv)
  }
}

function removeTimeout(jsonObj) {
  return jsonObj.filter(l => l['Load'] !== 'timeout')
}

interface TillCallback<T> {
  (T): boolean
}

// Calling .next(till) will loop till(item) is true
function* iterTill<T>(items: T[]): Iterator<T, any, TillCallback<T>> {
  let till: (T) => boolean
  let itemIter = iter(items)
  let next = itemIter.next()
  while (!next.done) {
    till = yield next.value
    while (!next.done) {
      if (till(next.value)) break
      next = itemIter.next()
    }
  }
}

// Eachtime .next called return the next item/value of given array
function* iter<T>(items: T[]): Iterator<T> {
  for (let [, item] of items.entries()) {
    yield (item)
  }
}

export default {
  LogChopper
}