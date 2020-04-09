var {ScalingAliases} = require(`./rom-handler.js`)

class MapFixer {
  constructor(romHandler) {
    this.romHandler = romHandler
  }

  ScaleMapToMaf() {
    this.romHandler.FillTableFromLog('MAP based Load Calc #1 - Hot/Interpolated')

    this.romHandler.FillLogTable({
      tableName: 'MAP based Load Calc #1 - Hot/Interpolated',
      scaling: 'MAFCalcs',
      agg: 'avg',
      scalingAlias: ScalingAliases['Loadify']['MAFCalcs']
    })

    this.romHandler.FillLogTable({
      tableName: 'MAP based Load Calc #1 - Hot/Interpolated',
      scaling: 'MAPCalcs',
      agg: 'avg', 
      scalingAlias: ScalingAliases['Loadify']['MAPCalcs']
    })

    // Get logged MapCalc % off from ROM
    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #1 - Hot/Interpolated',
      tableOne: {},
      tableTwo: {
        aggTwo: 'avg',
        scalingTwo: 'MAPCalcs'
      },
      newTable: {
        newScaling: 'MAPCalcLogAvg',
        newAgg: 'percentage'
      },
      aggregator: (mapVal, logMapAvg) => {
        let percentage = mapVal / logMapAvg
        if (!isFinite(percentage)) {
          return 0
        }
        return percentage
      }
    })

    // Get % MapCalc Off MafCalc
    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #1 - Hot/Interpolated',
      tableOne: {
        scalingOne: 'MAPCalcs',
        aggOne: 'avg'
      },
      tableTwo: {
        aggTwo: 'avg',
        scalingTwo: 'MAFCalcs',
      },
      newTable: {
        newScaling: 'MapMaf',
        newAgg: 'percentage'
      },
      aggregator: (mapVal, logMapAvg) => {
        let percentage = mapVal / logMapAvg
        if (!isFinite(percentage)) {
          return 0
        }
        return percentage
      }
    })

    // Get total % change
    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #1 - Hot/Interpolated',
      tableOne: {
        scalingOne: 'MAPCalcLogAvg',
        aggOne: 'percentage'
      },
      tableTwo: {
        scalingTwo: 'MapMaf',
        aggTwo: 'percentage',
      },
      newTable: {
        newScaling: 'MapMultiplier',
        newAgg: 'percentage'
      },
      aggregator: (mapVal, logMapAvg) => {
        let percentage = mapVal * logMapAvg
        if (!isFinite(percentage)) {
          return 0
        }
        return percentage
      }
    })

    // Get final map values
    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #1 - Hot/Interpolated',
      tableOne: {},
      tableTwo: {
        scalingTwo: 'MapMultiplier',
        aggTwo: 'percentage',
      },
      newTable: {
        newScaling: 'FinalMap',
        newAgg: 'avg'
      },
      aggregator: (mapVal, MapMultiplier) => {
        let finalVal = mapVal * MapMultiplier
        if (finalVal == 0) {
          return mapVal
        }
        return finalVal
      }
    })


    this.romHandler.PrintTable({
        tableName: 'MAP based Load Calc #1 - Hot/Interpolated',
        tabs: true,
    })    
    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #1 - Hot/Interpolated',
      agg: 'percentage', 
      tabs: true,
      scaling: 'MapMultiplier'
    })
    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #1 - Hot/Interpolated',
      agg: 'avg', 
      tabs: true,
      scaling: 'FinalMap'
    })
    
    this.romHandler.FillLogTable({
      tableName: 'MAP based Load Calc #1 - Hot/Interpolated',
      agg: 'count',
    })
    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #1 - Hot/Interpolated',
      agg: 'count',
      tabs: true,
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

  ScaleMapToAfr() {
    this.romHandler.FillTableFromLog('MAP based Load Calc #2 - Cold/Interpolated')

    // table in rom
    // this.romHandler.PrintTable({
    //   tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
    //   formatter: v => Number(v).toFixed(2) 
    // })

    // Fill map table with afr values
    this.romHandler.FillLogTable({
      tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
      scaling: 'AFR',
      agg: 'avg',
      scalingAlias: ScalingAliases['AFR']
    })

    // afr filled
    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
      scaling: 'AFR',
      agg: 'avg',
      tabs: true,
      formatter: v => Number(v).toFixed(2) 
    })

    this.romHandler.MapCombineAdv({
      toTable: {
        tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
      },
      fromTable: {
        tableName: 'Alternate #1 High Octane Fuel Map',
      },
      destTable: {
        tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
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
    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
      scaling: 'AFR',
      agg: 'target',
      tabs: true,
      formatter: v => Number(v).toFixed(2) 
    })

    // if actual afr > target increase load value
    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
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
      aggregator: (actualAfr, targetAfr) => {
        if (!Number(actualAfr)) return 0
        return actualAfr - targetAfr
      }
    })

    // diff afr 
    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
      scaling: 'AFR',
      agg: 'AFRDiff',
      tabs: true,
      formatter: v => Number(v).toFixed(2) 
    })

    // Set final values base on diff
    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
      tableOne: {},
      tableTwo: {
        scalingTwo: 'AFR',
        aggTwo: 'AFRDiff',
      },
      newTable: {
        newScaling: 'Loadify',
        newAgg: 'AFRCorrected'
      },
      aggregator: (load, afrDiff) => {
        if (Math.abs(afrDiff) < 0.3) return load
        if (afrDiff < -3) {
          return load - 20
        } else if (afrDiff < -2) {
          return load - 10
        } else if (afrDiff < -1) {
          return load - 5
        } else if (afrDiff < 1) {
          return load + 5
        } else if (afrDiff < 2) {
          return load + 10
        } 
        // >2
        return load + 20          
      }
    })

    // final loads 
    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
      scaling: 'Loadify',
      agg: 'AFRCorrected',
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

exports.MapFixer = MapFixer  