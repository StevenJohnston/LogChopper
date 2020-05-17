var xmlWrapper = require(`./xml-wrapper.js`)
var {Rom, ScalingAliases} = require(`./rom-handler.js`)
var {LogChopper} = require('./log-chopper.js')
var {MapFixer} = require('./map-fixer.js')


const main = async () => {
  let {tables, scalingsMap} = await xmlWrapper.GetRom('59580304')
  tables = filterAddressless(tables)

  let logChopper = new LogChopper('EvoScanDataLog_2020.05.17_13.19.29' + '.csv')
  await logChopper.LoadLogs()
  logChopper.ShiftAfr(45)
  logChopper.AddRPMGain(0.15)
  logChopper.SplitWot(85, 0.00)
  // logChopper.Accelerating()
  
  // logChopper.DropDeleted()
  console.log(`wots: ${logChopper.wots.length}`)
  log = logChopper.wots.flat()
  // log = logChopper.wots.reduce((all, wot) => {
  //   return [...all, ...wot]
  //   // return [...all, ...wot.slice(30)]
  // }, [])
  // log = logChopper.wots[5]
  // log = logChopper.log

  // logChopper.WriteChopped()
  // logChopper.WriteChoppedWot()
  let rom = new Rom(tables, scalingsMap, log)
  await rom.LoadRom('026'+'.bin')
  rom.FillTables()

  mapFixer = new MapFixer(rom)
  // mapFixer.ScaleMapToMaf({debug: true})
  // mapFixer.LogCounts()
  // mapFixer.AfrFix()
  // mapFixer.ShowBoost() // doesnt work
  mapFixer.ScaleMapToAfr({debug: true})
  // mapFixer.MivecInGain()
  // mapFixer.ShowAFROffsetSeconds()


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
