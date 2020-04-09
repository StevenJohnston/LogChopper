const csv = require('csvtojson')
const commandLineArgs = require('command-line-args')
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path')

const rpms = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000]
const rpmsLong = [500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3250, 3500, 3750, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000]
const loads = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320]
const loadsLong = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320]
const gearRatios = [
  4324.21875 / 32,
  3359.375 / 42,
  3609.375 / 62,
  3503.90625 / 82,
  5550.78125 / 168,
]

const columns = [
  'LogID',
  'Load',
  '2ByteRPM',
  'AFR',
  'KnockSum',
  'TimingAdv',
  'knock_adc_processed',
  'knock_base',
  'Speed',
  'PSIG',
  'TPS'
]

const tunaToEvoScan = {
  'RPM': '2ByteRPM',
  'Timing': 'TimingAdv',
  'Knock_Filter_ADC': 'knock_adc_processed',
  'Knock_Base': 'knock_base',
  'ET': 'LogEntrySeconds',
  'MAFVolts': 'MAF',
  'LTFT_InUse': 'CurrentLTFT'
}

const knockFilter = (logs) => {
  return logs.map((l, i)=> {
    if (l.delete) return l
    let lower = 0
    let upper = logs.length - 1
    if (i - 10 > 0) {
      lower = i - 10
    } 
    if (i + 10 < logs.length - 1) {
      upper = i + 10
    }
    const gear = toGear(l)
    const sameGearLogs = logs.slice(lower, upper).reduce((p, c) => {
      cGear = toGear(c)
      if (cGear == gear) {
        p++
      }
      return p
    }, 0)
    
    if (sameGearLogs < 10 || gear < 3) {
      l.delete = true
    }

    return l

  }).map(l => {
    if (l['knock_adc_processed'] - l['knock_base'] < -99999 || l['Speed'] <= 10) l.delete = true
    return l
  }) 
}

const toGear = (log) => {
  const gearIndex = nearestIndex(gearRatios ,log['2ByteRPM'] / log['Speed'])
  const gearError = gearRatios[gearIndex] / (log['2ByteRPM'] / log['Speed'])
  if (Math.abs(1 - gearError) > 0.1 && gearIndex > 1 && log['KnockSum'] > 0) {
    let a = 1
  }
  return nearestIndex(gearRatios ,log['2ByteRPM'] / log['Speed']) + 1
}

const repeatKnock = (logs) => {
  return logs.filter((l) => {
    return l['knock_adc_processed'] - l['knock_base'] > 0
  })
  // return logs.filter((l, i) => {
  //   if (i == 0) return l['KnockSum']
  //   return l['KnockSum'] != logs[i-1]['KnockSum']
  // })
}

const tables = {
  'AFR': {
    xAxis: loads,
    yAxis: rpms,
    xAxisKey: 'Load',
    yAxisKey: '2ByteRPM',
  },
  'KnockSum': {
    xAxis: loadsLong,
    yAxis: rpmsLong,
    xAxisKey: 'Load',
    yAxisKey: '2ByteRPM',
    filters: [
      repeatKnock,
    ]
  },
  'TimingAdv': {
    xAxis: loadsLong,
    yAxis: rpmsLong,
    xAxisKey: 'Load',
    yAxisKey: '2ByteRPM',
  }
}


const closedLoopRpm = [500 ,1000 ,1500 ,2000 ,2500 ,3000 ,3500 ,4000 ,4250 ,4500 ,4750 ,5000 ,5250 ,5500 ,5750 ,6000 ,6500 ,7000 ,7500 ,8000]
const closedLoopLoad = [70, 73.75, 90, 140, 140, 125, 120, 100, 64.375, 54.375, 43.75, 40, 34.375, 0, 0, 0, 0, 0, 0, 0]

const closedLoop = {
  '500':70,
  '1000':69.375,
  '1500':68.75,
  '2000':68.125,
  '2500':67.5,
  '3000':66.25,
  '3500':65.625,
  '4000':65,
  '4250':64.375,
  '4500':54.375,
  '4750':43.75,
  '5000':40,
  '5250':34.375,
  '5500':0,
  '5750':0,
  '6000':0,
  '6500':0,
  '7000':0,
  '7500':0,
  '8000':0,
}

const removeClosedLoop = (logs) => {
  return logs.filter((l) => {
    // let keep = false
    for (c of Object.keys(closedLoop).reverse()) {
      if(Number(c) <= Number(l['2ByteRPM'])) { 
        return Number(closedLoop[c]) < Number(l['Load'])
      }
    }
  })
}

const emptyTable = (yAxis, xAxis) => {
  return [...Array(yAxis.length)].map(e => [...Array(xAxis.length)].map(r=>[]));
}

const nearestIndex = (array, value) => {
  return array.indexOf(array.reduce((c, n) => {
    if (Math.abs(c - value) >= Math.abs(n - value)) {
      return n
    }
    return c
  },99999))
}

// const afrMap = emptyTable()
// console.log(afrMap)
const sumMap = {}

const optionDefinitions = [
  { name: 'log', type: String },
  { name: 'rom', type: String },
  { name: 'throttleThreshold', alias: 't', type: Number },
  { name: 'count', alias: 'c', type: Number },
  { name: 'rpmThreshold', alias: 'r', type: Number },
  { name: 'accelerating', alias: 'a', type: Boolean },
  { name: 'airFuel', alias: 'f', type: Boolean },
  // { name: 'knock', alias: 'f', type: Boolean },
  { name: 'load', alias: 'l', type: Number }
]

const options = commandLineArgs(optionDefinitions)

// Removes all logs where throttle is cut
function accelerating(logs) {
  return logs.map((log, i) => {

    const next = logs[i + 1]
    if (!next) {
      log.delete = true
      return log
    }

    if (next.LogID - log.LogID != 1) {
      // Need more to check if the last wasnt removed
      log.delete = true
      return false
    }

    return log
  })
}

function throttleThreshold(logs, threshold) {
  return logs.map(l => {
    if (l.TPS < threshold) l.delete = true
    return l
  })
}

function rpmThreshold(logs, threshold) {
  return logs.map(l => {
    if (l['2ByteRPM'] < threshold) l.delete = true
    return l
  })
}

function load(logs, threshold) {
  return logs.map(l => {
    if (l.Load < threshold) l.delete = true
    return l
  })
}

function airFuel(logs) {
  return logs.map(l => {
    if (!l.AFR) l.delete = true
    return l
  })
}

function psig(logs) {
  return logs.map(l => {
    if (l.PSIG < 10) l.delete = true
    return l
  })
}

function logsRpmLoad(logs, column) {
  yAxis = tables[column].yAxis
  xAxis = tables[column].xAxis
  yKey = tables[column].yAxisKey
  xKey = tables[column].xAxisKey
  if (tables[column].filters) {
    tables[column].filters.forEach(f => {
      logs = f(logs)
    })
  }
  let rpmLoadMap = emptyTable(yAxis, xAxis)
  logs.forEach((l, i, l2) => {
    const nRpm = nearestIndex(yAxis, l[yKey])
    const nLoad = nearestIndex(xAxis, l[xKey])
    // rpmLoadMap[column][nLoad][nRpm].push(l)
    if (nRpm < 0 || nLoad < 0) {
      return
    }
    rpmLoadMap[nRpm][nLoad].push(l)
  });
  return rpmLoadMap
  // return printMap(sumMap[column])
}


function printMap(logs, column, type = 'avg') {
  logs = logs.map(log => Object.keys(log)
  .filter(key => columns.includes(key))
  .reduce((obj, key) => {
    obj[key] = log[key];
    return obj;
  }, {}));

  tables[column].filters && tables[column].filters.forEach(f => {
    logs = f(logs)
  })
  // logs = logs.sort((a,b) => b.KnockSum - a.KnockSum)
  // const logMap = logsRpmLoad(logs, rpms, loads, '2ByteRPM', 'Load')
  let logMap = logsRpmLoad(
    logs,
    column
  )

  return logMap.reduce((c,nLoads) => {
    return c + '\n' + nLoads.map(nRpms => {
      if (options.count && (nRpms.length <= options.count)) {
        return 0
      }
      switch(type) {
        case 'avg':
          return (nRpms.reduce((c2, log) => c2+log[column],0) / nRpms.length || 0).toFixed(2)
        case 'max':
          return (nRpms.reduce((c2, log) => c2 > log[column] ? c2 : log[column],0) || 0).toFixed(2)
        case 'count':
          return nRpms.length
      }
    }).join('\t')
  }, '')
}

csv({
  checkType:true,
})
.fromFile(options.log)
.then((jsonObj)=>{
  // Standarize to evo scan
  jsonObj = jsonObj.map(l => {
    for (const [tunaKey, evoScanKey] of Object.entries(tunaToEvoScan)) {
      if (tunaKey in l) {
        l[evoScanKey] = l[tunaKey]
        delete l[tunaKey]
      }
    }
    return l
  })
  
  if (options.accelerating) {
    jsonObj = accelerating(jsonObj)
  }
  if (options.throttleThreshold) {
    jsonObj = throttleThreshold(jsonObj, options.throttleThreshold)
  }
  if (options.rpmThreshold) {
    jsonObj = rpmThreshold(jsonObj, options.rpmThreshold)
  }
  if (options.load) {
    jsonObj = load(jsonObj, options.load)
  }
  if (options.airFuel) {
    jsonObj = airFuel(jsonObj)
  }
  
  if (options.trueknock) {
    jsonObj = trueknock(jsonObj)
  }
  // if (options.airFuel) {
  // jsonObj = psig(jsonObj)
  // }
  // jsonObj = knockFilter(jsonObj)

  jsonObj = jsonObj.filter(l => !l.delete)
  const jsonClosedLoop = removeClosedLoop(jsonObj)
  console.log('AFR')
  console.log(printMap(jsonClosedLoop, 'AFR', 'avg'))
  console.log('KnockSum')
  console.log(printMap(jsonObj, 'KnockSum', 'max'))
  // console.log('counts KnockSum')
  // console.log(printMap(jsonObj, 'KnockSum', 'count'))
  // console.log('TimingAdv')
  // console.log(printMap(jsonObj, 'TimingAdv', 'avg'))
  // console.log(rpmLoadAvg(jsonObj, 'AFR'))
  // console.log(sumMap['AFR'])

  const json2csvParser = new Parser();
  let outCsv = json2csvParser.parse(jsonObj);

  const outCsvLines = outCsv.split('\n')
  outCsvLines[0] = outCsvLines[0].split('"').join('')
  outCsv = outCsvLines.join('\n')

  const pathInfo = path.parse(options.log)

  const newFile = pathInfo.dir + '\\' + pathInfo.name + '-cleaned' + pathInfo.ext;

  fs.writeFile(newFile, outCsv, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");

    
  }); 
})


