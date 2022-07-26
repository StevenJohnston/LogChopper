import xmlWrapper from './xml-wrapper'
import {Rom} from './rom-handler'
import {LogChopper} from './log-chopper'
import {MapFixer} from './map-fixer'
import dialog from 'node-file-dialog'

export const main = async () => {
  let {tables, scalingsMap} = await xmlWrapper.GetRom('59580304')
  tables = filterAddressless(tables)

  //ask for log file
  const config={type:'open-file'}
  let dir = await dialog(config)
  dir = dir[0].split('/').join('\\')
  const logChopper = new LogChopper(dir)
  await logChopper.LoadLogs()
  logChopper.ShiftAfr(45)
  logChopper.AddRPMGain(0.15)


  // logChopper.tagAllForDelete()
  // logChopper.keepIdle()
  // logChopper.keepCruise()
  // logChopper.deleteLargeTPSChanges()
  // logChopper.DropDeleted()
  let log = logChopper.log


  console.log(logChopper.log[0])
  logChopper.SplitWot(86, 0.00)
  // logChopper.SplitWot(0, 0.00)
  // logChopper.Accelerating

  // console.log(`wots: ${logChopper.wots.length}`)
  // let log = logChopper.wots.flat()
  log = logChopper.wots.reduce((all, wot) => {
    return [...all, ...wot]
    // return [...all, ...wot.slice(30)]
  }, [])
  // log = logChopper.wots[5]
  // log = logChopper.log

  logChopper.WriteChopped()
  // logChopper.WriteChoppedWot()
  let rom = new Rom(tables, scalingsMap, log)
  await rom.LoadRom()
  rom.FillTables()

  let mapFixer = new MapFixer(rom)
  // mapFixer.ScaleMapToMaf({debug: true, minCount: 100})
  // mapFixer.LogCounts()
  // mapFixer.AfrFix()
  // mapFixer.ShowBoost() // doesnt work
  mapFixer.ScaleMapToAfr({debug: true})
  // mapFixer.ShowMapLoadCalcDiff({debug: true})
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

export default main
