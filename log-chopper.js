const csv = require('csvtojson')
const { Parser } = require('json2csv');
const fs = require('fs');

var logRoot = String.raw`C:\Users\Steven\Google Drive\Evoman\scans\\`

class LogChopper {
  constructor(fileName) {
    this.fileName = fileName
    this.log = []
  }

  async LoadLogs() {
    if (typeof this.fileName == "string") {
      await new Promise((resolve, _) => {
        fs.readdir(logRoot, async (err, files) => {
          var fetchLogs = []
          files.forEach(async (file) => {
            if (file.match(this.fileName)) {
              fetchLogs.push(this.loadLog(file))
            }
          });
          (await Promise.all(fetchLogs)).forEach((jsonObj) => {
            // if (jsonObj.length > 150000) return
            // this.log.push(...jsonObj)
            this.log = this.log.concat(removeTimeout(jsonObj))
          })
          resolve()
        });
      })
    } else {
      await this.loadLog(this.fileName[0]).then((jsonObj) => {
        this.log.push(...removeTimeout(jsonObj))
        // this.log.push(...jsonObj)
      })
    }
  }

  async loadLog(fileName) {
    return csv({
      checkType:true,
    })
    .fromFile(logRoot + fileName)
  }

  // shifts AFR records down offset count
  ShiftAfr(offset = 30) {
    this.log = this.log.map((v, i, arr) => {
      if(i + offset > arr.length - 1) {
        return v
      }
      return {
        ...v,
        AFR: arr[i+offset].AFR
      }
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
          if (wotLog.ET > l.ET - timeThreshold) {
            wotStart--
          } else {
            break
          }
        }

        while(i < this.log.length) {
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
          if (wotLog && wotLog.ET < l.ET + timeThreshold) {
            wotEnd++
          } else {
            break
          }
        }

        wots.push(this.log.slice(wotStart, wotEnd))
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
