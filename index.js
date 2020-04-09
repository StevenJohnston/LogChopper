var xmlWrapper = require(`./xml-wrapper.js`)
var {Rom, ScalingAliases} = require(`./rom-handler.js`)
var {LogChopper} = require('./log-chopper.js')
var {MapFixer} = require('./map-fixer.js')


const main = async () => {
  let {tables, scalingsMap} = await xmlWrapper.GetRom('59580304')
  tables = filterAddressless(tables)

  let logChopper = new LogChopper('EvoScanDataLog_2020.04.05_21.37.52' + '.csv')
  await logChopper.LoadLogs()
  logChopper.SplitWot(80, 0.00)
  // logChopper.Accelerating()
  // logChopper.DropDeleted()
  console.log(`wots: ${logChopper.wots.length}`)
  log = logChopper.wots.flat()
  // log = logChopper.log
  // log = logChopper.wots[1]

  let rom = new Rom(tables, scalingsMap, log)
  await rom.LoadRom('007.hex'+'.bin')
  rom.FillTables()

  // rom.PrintTable('MAP based Load Calc #1 - Hot/Interpolated', undefined, true)
  // rom.FillTableFromLog('MAP based Load Calc #1 - Hot/Interpolated')
  // rom.PrintLogTable({
  //   tableName: 'MAP based Load Calc #1 - Hot/Interpolated',
  //   agg: 'avg', 
  //   tabs: true,
  //   scalingAlias: ScalingAliases['Loadify']['MAFCalc']
  // })

  mapFixer = new MapFixer(rom)
  // mapFixer.ScaleMapToMaf()
  // mapFixer.LogCounts()
  // mapFixer.AfrFix()
  // mapFixer.ShowBoost()
  mapFixer.ScaleMapToAfr()


  console.log("wow")
}
main()


function filterAddressless(tables) {
  return tables.filter((table) => {
    if (!table.address) {
      return false
    }
    return true
  })
}