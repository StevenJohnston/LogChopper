import { get } from 'object-path'
import { ScalingAliases, Rom } from '../rom-handler'

export class MapFixer {
  romHandler: Rom
  constructor(romHandler) {
    this.romHandler = romHandler
  }

  ShowAFROffsetSeconds({ debug = false } = {}) {
    this.romHandler.FillTableFromLog('MAP based Load Calc #3')
    this.romHandler.FillLogTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'AFROffsetSeconds',
      agg: 'avg',
      scalingAlias: ScalingAliases['Loadify']['AFROffsetSeconds']
    })

    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      agg: 'avg',
      scaling: 'AFROffsetSeconds',
      tabs: true,
    })
  }

  ScaleMapToMaf({ debug = false, minCount = 10 } = {}) {
    this.romHandler.FillTableFromLog('MAP based Load Calc #3')
    this.romHandler.FillLogTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'MAFCalcs',
      agg: 'avg',
      scalingAlias: ScalingAliases['Loadify']['MAFCalcs']
    })

    debug && this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      agg: 'avg',
      scaling: 'MAFCalcs',
      tabs: true,
    })

    this.romHandler.FillLogTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'MAFCalcs',
      agg: 'count',
    })

    debug && this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      agg: 'count',
      scaling: 'MAFCalcs',
      tabs: true,
    })

    // Keep large count
    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #3',
      tableOne: {
        scalingOne: 'MAFCalcs',
        aggOne: 'avg',
      },
      tableTwo: {
        scalingTwo: 'MAFCalcs',
        aggTwo: 'count',
      },
      newTable: {
        newScaling: 'MAFCalcs',
        newAgg: 'FrequentOnly'
      },
      aggregator: (mapVal, count) => {
        if (count < minCount) {
          return 0
        }
        return Number(mapVal)
      }
    })

    debug && this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      agg: 'FrequentOnly',
      scaling: 'MAFCalcs',
      tabs: true,
      formatter: v => v.toFixed(2)
    })

    // Replace with large count only 
    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #3',
      tableOne: {},
      tableTwo: {
        scalingTwo: 'MAFCalcs',
        aggTwo: 'FrequentOnly',
      },
      newTable: {
        newScaling: 'MAFCalcs',
        newAgg: 'FrequentFinal'
      },
      aggregator: (mapVal, fixedVal) => {
        return fixedVal || mapVal
      }
    })

    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      agg: 'FrequentFinal',
      scaling: 'MAFCalcs',
      tabs: true,
      formatter: v => v.toFixed(3)
    })

  }

  AfrFix() {
    this.romHandler.FillTableFromLog('Alternate #1 High Octane Fuel Map')
    this.romHandler.FillLogTable({
      tableName: 'Alternate #1 High Octane Fuel Map',
      agg: 'avg',
    })
    this.romHandler.PrintTable({
      tableName: 'Alternate #1 High Octane Fuel Map',
      agg: 'avg',
      tabs: true,
    })

    // Get percentage change vs alt 7
    this.romHandler.MapCombine({
      tableName: 'Alternate #1 High Octane Fuel Map',
      tableOne: {
        scalingOne: 'AFR',
        aggOne: 'avg'
      },
      tableTwo: {
        scalingTwo: 'AFR',
        tableTwoName: 'Alternate #7 High Octane Fuel Map'
      },
      newTable: {
        newScaling: 'AFR',
        newAgg: 'Alt7Diff'
      },
      aggregator: (mapVal, logMapAvg) => {
        let percentage = mapVal / logMapAvg
        if (!isFinite(percentage)) {
          return 0
        }
        return percentage
      }
    })

    this.romHandler.PrintTable({
      tableName: 'Alternate #7 High Octane Fuel Map',
      // agg: 'Alt7Diff', 
      tabs: true,
      formatter: v => v.toFixed(2)
    })

    this.romHandler.PrintTable({
      tableName: 'Alternate #1 High Octane Fuel Map',
      agg: 'Alt7Diff',
      tabs: true,
      formatter: v => v.toFixed(2)
    })

    // get final values
    this.romHandler.MapCombine({
      tableName: 'Alternate #1 High Octane Fuel Map',
      tableOne: {},
      tableTwo: {
        scalingTwo: 'AFR',
        aggTwo: 'Alt7Diff'
      },
      newTable: {
        newScaling: 'AFR',
        newAgg: 'Alt7Fix'
      },
      aggregator: (mapVal, logMapAvg) => {
        let percentage = mapVal / logMapAvg
        if (!isFinite(percentage)) {
          return 0
        }
        return percentage
      }
    })

    // fill 0s with original
    this.romHandler.MapCombine({
      tableName: 'Alternate #1 High Octane Fuel Map',
      tableOne: {},
      tableTwo: {
        scalingTwo: 'AFR',
        aggTwo: 'Alt7Fix'
      },
      newTable: {
        newScaling: 'AFR',
        newAgg: 'Alt7FixFilled'
      },
      aggregator: (mapVal, logMapAvg) => {
        if (logMapAvg == 0) {
          return mapVal
        }
        return logMapAvg
      }
    })

    this.romHandler.PrintTable({
      tableName: 'Alternate #1 High Octane Fuel Map',
      agg: 'Alt7FixFilled',
      tabs: true,
      formatter: v => v.toFixed(2)
    })
  }
  ScaleMapToAfr({ debug = false } = {}) {
    this.romHandler.FillTableFromLog('MAP based Load Calc #3')

    // Fill map table with afr values
    this.romHandler.FillLogTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'AFR',
      agg: 'avg',
      scalingAlias: ScalingAliases['AFR']
    })


    this.romHandler.FillLogTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'AFR',
      agg: 'count',
    })

    debug && this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      agg: 'count',
      scaling: 'AFR',
      tabs: true,
    })


    // afr filled
    debug && this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'AFR',
      agg: 'avg',
      tabs: true,
      formatter: v => Number(v).toFixed(2)
    })

    this.romHandler.MapCombineAdv({
      toTable: {
        tableName: 'MAP based Load Calc #3',
      },
      fromTable: {
        tableName: 'Alternate #1 High Octane Fuel Map',
      },
      destTable: {
        tableName: 'MAP based Load Calc #3',
        scaling: 'AFR',
        agg: 'target'
      },
      // xValue = MAP, yValue = RPM, cellValue = Load
      axisMap: (xValue, yValue, cellValue) => {
        return {
          xValue: cellValue,
          yValue: yValue,
        }
      }
    })

    // target afr 
    debug && this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'AFR',
      agg: 'target',
      tabs: true,
      formatter: v => Number(v).toFixed(2)
    })

    // get actual - target afrs
    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #3',
      tableOne: {
        scalingOne: 'AFR',
        aggOne: 'avg',
      },
      tableTwo: {
        scalingTwo: 'AFR',
        aggTwo: 'target',
      },
      newTable: {
        newScaling: 'AFR',
        newAgg: 'AFRDiff'
      },
      // aggregator: (actualAfr, targetAfr) => {
      //   if (!Number(actualAfr)) return 0
      //   return actualAfr - targetAfr
      // }
      aggregator: (actualAfr, targetAfr) => {
        if (!Number(actualAfr)) return 0
        return actualAfr / targetAfr
      }
    })

    // diff afr 
    debug && this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'AFR',
      agg: 'AFRDiff',
      tabs: true,
      formatter: v => Number(v).toFixed(2)
    })

    // // Smooth diff
    // this.romHandler.Map({
    //   sourceTable: {
    //     tableName: 'MAP based Load Calc #3',
    //     scaling: 'AFR',
    //     agg: 'AFRDiff',
    //   },
    //   destTable: {
    //     tableName: 'MAP based Load Calc #3',
    //     scaling: 'AFR',
    //     agg: 'AFRDiffSmooth1',
    //   },
    //   aggregator: (map, x, y) => {
    //     let value = map[y][x]
    //     if (Number(value)) return value

    //     let sum = 0, cellCount = 0
    //     const top = get(map, `${y-1}.${x}`, 0)
    //     const right = get(map, `${y}.${x+1}`, 0)
    //     const bottom = get(map, `${y+1}.${x}`, 0)
    //     const left = get(map, `${y}.${x-1}`, 0)
    //     return [top, right, bottom, left].reduce((t,n) => t + n, 0) / 4
    //   }
    // })

    // // print smooth afr diffs 
    // debug && this.romHandler.PrintTable({
    //   tableName: 'MAP based Load Calc #3',
    //   scaling: 'AFR',
    //   agg: 'AFRDiffSmooth1',
    //   tabs: true,
    //   formatter: v => Number(v).toFixed(2) 
    // })

    // // Smooth diff 2nd
    // this.romHandler.Map({
    //   sourceTable: {
    //     tableName: 'MAP based Load Calc #3',
    //     scaling: 'AFR',
    //     agg: 'AFRDiffSmooth1',
    //   },
    //   destTable: {
    //     tableName: 'MAP based Load Calc #3',
    //     scaling: 'AFR',
    //     agg: 'AFRDiffSmooth2',
    //   },
    //   aggregator: (map, x, y) => {
    //     let value = map[y][x]
    //     if (Number(value)) return value

    //     let sum = 0, cellCount = 0

    //     const top = get(map, `${y-1}.${x}`, 0)
    //     const right = get(map, `${y}.${x+1}`, 0)
    //     const bottom = get(map, `${y+1}.${x}`, 0)
    //     const left = get(map, `${y}.${x-1}`, 0)
    //     return [top, right, bottom, left].reduce((t,n) => t + n, 0) / 4
    //   }
    // })

    // // print smooth afr diffs 
    // debug && this.romHandler.PrintTable({
    //   tableName: 'MAP based Load Calc #3',
    //   scaling: 'AFR',
    //   agg: 'AFRDiffSmooth2',
    //   tabs: true,
    //   formatter: v => Number(v).toFixed(2) 
    // })

    // // Set final values base on diff
    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #3',
      tableOne: {},
      tableTwo: {
        scalingTwo: 'AFR',
        aggTwo: 'AFRDiff',
      },
      newTable: {
        newScaling: 'Loadify',
        newAgg: 'AFRCorrected'
      },
      // aggregator: (load, afrDiff) => {
      //   if (Math.abs(afrDiff) < 0.2) return load
      //   if (afrDiff >= 0) {
      //     if (afrDiff > 2) {
      //       return Math.max(load + 20)
      //     } else if (afrDiff > 1) {
      //       return load + 10
      //     }
      //     return load + 5
      //   } else {
      //     if (afrDiff < -2) {
      //       return load - 20
      //     } else if (afrDiff < -1) {
      //       return load - 10
      //     }
      //     return load - 5
      //   }
      // }

      // This just adds the diff
      aggregator: (load, afrDiff) => {
        return load * afrDiff
      }
    })

    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #3',
      tableOne: {
        scalingOne: 'Loadify',
        aggOne: 'AFRCorrected',
      },
      tableTwo: {
        scalingTwo: 'AFR',
        aggTwo: 'count',
      },
      newTable: {
        newScaling: 'Loadify',
        newAgg: 'AFRCorrectedWithCount'
      },
      aggregator: (load, afrCount) => {
        if (afrCount > 100) {
          return load
        }
        return 0
      }
    })

    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'Loadify',
      agg: 'AFRCorrectedWithCount',
      tabs: true,
      formatter: v => Number(v).toFixed(3)
    })

    // Set value if not touched
    // this.romHandler.MapCombine({
    //   tableName: 'MAP based Load Calc #3',
    //   tableOne: {},
    //   tableTwo: {
    //     scalingTwo: 'Loadify',
    //     aggTwo: 'AFRCorrectedWithCount',
    //   },
    //   newTable: {
    //     newScaling: 'Loadify',
    //     newAgg: 'LoadifyUpAndToTheRight'
    //   },
    //   isAdvancedAggregator: true,
    //   aggregator: (loadTable, correctedLoadTable, y, x) => {
    //     let load = loadTable[y][x]
    //     let correctedLoad = correctedLoadTable[y][x]
    //     let newLoad: number = load

    //     if (correctedLoad !== 0) {
    //       return correctedLoad
    //     }

    //     for (let y2 = y; y2 > 0; y2--) {

    //       for (let x2 = x; x2 < loadTable[y2].length; x2++) {
    //         let cLoad = correctedLoadTable[y2][x2]
    //         if (cLoad == 0) continue
    //         if (cLoad < newLoad) {
    //           newLoad = cLoad
    //         }
    //       }
    //     }

    //     for (let y2 = y; y2 < loadTable.length; y2++) {
    //       for (let x2 = x; x2 > 0; x2--) {
    //         let cLoad = correctedLoadTable[y2][x2]
    //         if (cLoad == 0) continue
    //         if (cLoad > newLoad) {
    //           newLoad = cLoad
    //         }
    //       }

    //     }
    //     return newLoad
    //   }
    // })
    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #3',
      tableOne: {},
      tableTwo: {
        scalingTwo: 'Loadify',
        aggTwo: 'AFRCorrectedWithCount',
      },
      newTable: {
        newScaling: 'Loadify',
        newAgg: 'LoadifyFilled'
      },
      isAdvancedAggregator: true,
      aggregator: (loadTable, correctedLoadTable, y, x) => {
        let load = loadTable[y][x]
        let correctedLoad = correctedLoadTable[y][x]
        let newLoad: number = load

        if (correctedLoad !== 0) {
          return correctedLoad
        }
        return newLoad
      }
    })


    // // print smooth afr diffs 
    // debug && this.romHandler.PrintTable({
    //   tableName: 'MAP based Load Calc #3',
    //   scaling: 'AFR',
    //   agg: 'AFRDiffSmooth1',
    //   tabs: true,
    //   formatter: v => Number(v).toFixed(2) 
    // })

    // final loads 
    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'Loadify',
      agg: 'AFRCorrectedWithCount',
      tabs: true,
      formatter: v => Number(v).toFixed(3)
    })
    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'Loadify',
      agg: 'LoadifyFilled',
      tabs: true,
      
      noAxis: true,
      formatter: v => Number(v).toFixed(3)
    })

  }

  ScaleMapToLTFT({ debug = false } = {}) {
    this.romHandler.FillTableFromLog('MAP based Load Calc #3')
    // Fill map table with afr values
    this.romHandler.FillLogTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'LFSTFTAFR',
      agg: 'avg',
      scalingAlias: ScalingAliases['LFSTFTAFR']
    })

    this.romHandler.FillLogTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'LFSTFTAFR',
      agg: 'count',
    })


    // afr filled
    debug && this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'LFSTFTAFR',
      agg: 'avg',
      tabs: true,
      formatter: v => Number(v).toFixed(2)
    })

    
    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #3',
      tableOne: {},
      tableTwo: {
        scalingTwo: 'LFSTFTAFR',
        aggTwo: 'avg',
      },
      newTable: {
        newScaling: 'LFSTFTAFR',
        newAgg: 'MAPCorrected'
      },
      aggregator: (load, LFSTFTAFR) => {
        return load * (LFSTFTAFR / 14.7)
      }
    })

    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #3',
      tableOne: {
        scalingOne: 'LFSTFTAFR',
        aggOne: 'MAPCorrected',
      },
      tableTwo: {
        scalingTwo: 'LFSTFTAFR',
        aggTwo: 'count',
      },
      newTable: {
        newScaling: 'LFSTFTAFR',
        newAgg: 'LFSTFTAFRWithCount'
      },
      aggregator: (load, CurrentLTFTCount) => {
        if (CurrentLTFTCount > 0) {
          return load
        }
        return 0
      }
    })

    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'LFSTFTAFR',
      agg: 'LFSTFTAFRWithCount',
      tabs: true,
      formatter: v => Number(v).toFixed(3)
    })

    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #3',
      tableOne: {},
      tableTwo: {
        scalingTwo: 'LFSTFTAFR',
        aggTwo: 'LFSTFTAFRWithCount',
      },
      newTable: {
        newScaling: 'LFSTFTAFR',
        newAgg: 'CombinedLFSTFTAFRWithCount'
      },
      isAdvancedAggregator: true,
      aggregator: (loadTable, correctedLoadTable, y, x) => {
        let load = loadTable[y][x]
        let correctedLoad = correctedLoadTable[y][x]
        let newLoad: number = load

        if (correctedLoad !== 0) {
          return correctedLoad
        }
        return newLoad
      }
    })

    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'LFSTFTAFR',
      agg: 'CombinedLFSTFTAFRWithCount',
      tabs: true,
      noAxis: true,
      formatter: v => Number(v).toFixed(3)
    })
  }

  ShowMapLoadCalcDiff({ debug = false } = {}) {
    this.romHandler.FillTableFromLog('MAP based Load Calc #3')

    this.romHandler.FillLogTable({
      tableName: 'MAP based Load Calc #3',
      scaling: 'loggedMAPCalc',
      agg: 'avg',
      scalingAlias: ScalingAliases.Loadify.MAPCalcs
    })

    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #3',
      agg: 'avg',
      scaling: 'loggedMAPCalc',
      tabs: true,
      // formatter: v => v.toFixed(2)
    })
  }
  MivecExGain() {

  }

  MivecInGain() {
    this.romHandler.FillTableFromLog('MIVEC Intake Normal Coolant Temp')
    this.romHandler.FillLogTable({
      tableName: 'MIVEC Intake Normal Coolant Temp',
      scaling: 'RPMGain',
      agg: 'avg',
      scalingAlias: ScalingAliases['RPMGain']
    })

    // afr filled
    this.romHandler.PrintTable({
      tableName: 'MIVEC Intake Normal Coolant Temp',
      scaling: 'RPMGain',
      agg: 'avg',
      tabs: true,
      formatter: v => Number(v).toFixed(2)
    })
  }

  ShowBoost() {
    this.romHandler.FillTableFromLog('Alternate #1 Boost Target #1 (High Gear Range)')
    this.romHandler.FillLogTable({
      tableName: 'Alternate #1 Boost Target #1 (High Gear Range)',
      agg: 'avg',
    })

    this.romHandler.PrintTable({
      tableName: 'Alternate #1 Boost Target #1 (High Gear Range)',
      tabs: true,
    })

    this.romHandler.FillLogTable({
      tableName: 'Alternate #1 Boost Target #1 (High Gear Range)',
      agg: 'avgDiff',
    })

    this.romHandler.PrintTable({
      tableName: 'Alternate #1 Boost Target #1 (High Gear Range)',
      agg: 'avg',
      tabs: true,
    })

    this.romHandler.PrintTable({
      tableName: 'Alternate #1 Boost Target #1 (High Gear Range)',
      agg: 'avgDiff',
      tabs: true,
    })

    // Get final map values
    this.romHandler.MapCombine({
      tableName: 'Alternate #1 Boost Target #1 (High Gear Range)',
      tableOne: {},
      tableTwo: {
        scalingTwo: 'psia8',
        aggTwo: 'avgDiff',
      },
      newTable: {
        newScaling: 'FinalMap',
        newAgg: 'avg'
      },
      aggregator: (mapVal, Diff) => {
        let finalVal = mapVal - Diff
        if (finalVal == 0) {
          return mapVal
        }
        return finalVal
      }
    })
    this.romHandler.PrintTable({
      tableName: 'Alternate #1 Boost Target #1 (High Gear Range)',
      agg: 'avg',
      scaling: 'FinalMap',
      tabs: true,
    })
  }

  LogCounts() {
    this.romHandler.FillLogTable({
      tableName: 'Alternate #1 Boost Target #1 (High Gear Range)',
      agg: 'count',
    })
    this.romHandler.PrintTable({
      tableName: 'Alternate #1 Boost Target #1 (High Gear Range)',
      agg: 'count',
      tabs: true,
    })
  }
}
