const csv = require('csvtojson')
const { Parser } = require('json2csv');
const fs = require('fs');

// var logRoot = String.raw`C:\Users\Steven\Google Drive\Evoman\scans\\`
// var logRoot = String.raw`C:\\Users\\Steven\\My Drive\\Evoman\\scans`
var logRoot = ''
class LogChopper {
  constructor(fileName) {
    this.fileName = fileName
    this.log = []
  }

  async LoadLogs() {
    if (typeof this.fileName == "string") {
      await new Promise(async(resolve, _) => {
        let loadedLog  = await this.loadLog(this.fileName)
        this.log = this.log.concat(removeTimeout(loadedLog ))
        resolve()
      })
    } else {
      await this.loadLog(this.fileName[0]).then((jsonObj) => {
        this.log.push(...removeTimeout(jsonObj))
      })
    }
  }

  async loadLog(fileName) {
    return csv({
      checkType:true,
    })
    .fromFile(fileName)
  }

  // shifts AFR records down offset count
  ShiftAfr() {
    this.log = this.log.map((v, i, arr) => {
      let offsetSeconds = (100/v.MAP) / v.RPM * 1000 
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

  SplitWot(tpsThreshold, timeThreshold) {
    let wots = []
    for (let i = 0; i < this.log.length; i++) {
      let l = this.log[i]
      if (l.TPS >= tpsThreshold ) {
        let wotStart = i
        while(wotStart > 0) {
          let wotLog = this.log[wotStart-1]
          if (wotLog.LogEntrySeconds > l.LogEntrySeconds - timeThreshold) {
            wotStart--
          } else {
            break
          }
        }

        while(i < this.log.length - 1) {
          if (this.log[i].TPS > tpsThreshold) {
            i++
          } else {
            break
          }
        }

        l = this.log[i]
        let wotEnd = i
        while(wotEnd < this.log.length) {
          let wotLog = this.log[wotEnd+1]
          if (wotLog && wotLog.LogEntrySeconds < l.LogEntrySeconds + timeThreshold) {
            wotEnd++
          } else {
            break
          }
        }
        if (this.log[wotEnd].LogEntrySeconds - this.log[wotStart].LogEntrySeconds > 2) {
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

  Accelerating() {
    // if within the next 1 second rpm increases more than 100 rpm
    let logsForPeriodIter = this.LogsForPeriod(this.log, 0.1)

    for (const {logsSlice, log: {item: log}} of logsForPeriodIter) {
      let rpms = logsSlice.map(l => l.RPM)
      let rpmsMax = Math.max(...rpms)
      let speeds = logsSlice.map(l => l.Speed)
      let speedMax = Math.max(...speeds)
      let tpsSum = logsSlice.reduce(function(a, b) { return a + b.TPS; }, 0);
      let tpsAvg = tpsSum / logsSlice.length;
      if (log.TPS < tpsAvg-1) {
        log.delete = true
      }
    }
  }

  DropDeleted() {
    this.log = this.log.filter(l => !l.delete)
  }

  // Returns logs for a period of time in seconds
  *LogsForPeriod(logs, period) {
    // let upperIter = iterTill(logs)
    let lowerIter = iterTill(logs)
    let lower = lowerIter.next()

    let logsIter = iter(logs)
    // let log = logsIter.next()
    for(const log of logsIter) {
    // while (!log.done) {
      lower = lowerIter.next(l => l.ET > log.item.ET - period && l.ET <= log.item.ET)
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

function* iterTill(items) {
  let till
  let itemIter = iter(items)
  let next = itemIter.next()
  while (!next.done) {
    till = yield next.value
    while(!next.done) {
      if (till(next.value.item)) break
      next = itemIter.next()
    }
  }
}

function* iter(items) {
  for (let [index, item] of items.entries()) {
    yield ({
      item,
      index
    })
  }
}

exports.LogChopper = LogChopper;
