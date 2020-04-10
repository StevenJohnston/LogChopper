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

    // get actual - target afrs
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

    // Smooth diff
    this.romHandler.Map({
      sourceTable: {
        tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
        scaling: 'AFR',
        agg: 'AFRDiff',
      },
      destTable: {
        tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
        scaling: 'AFR',
        agg: 'AFRDiffSmooth1',
      },
      aggregator: (map, x, y) => {
        let value = map[y][x]
        if (Number(value)) return value
        
        let sum = 0, cellCount = 0
        const top = map[y-1]?.[x] || 0
        const right = map[y]?.[x+1] || 0
        const bottom = map[y+1]?.[x] || 0
        const left = map[y]?.[x-1] || 0; // semicolon needed
        return [top, right, bottom, left].reduce((t,n) => t + n, 0) / 4
      }
    })

    // print smooth afr diffs 
    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
      scaling: 'AFR',
      agg: 'AFRDiffSmooth1',
      tabs: true,
      formatter: v => Number(v).toFixed(2) 
    })

    // Smooth diff 2nd
    this.romHandler.Map({
      sourceTable: {
        tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
        scaling: 'AFR',
        agg: 'AFRDiffSmooth1',
      },
      destTable: {
        tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
        scaling: 'AFR',
        agg: 'AFRDiffSmooth2',
      },
      aggregator: (map, x, y) => {
        let value = map[y][x]
        if (Number(value)) return value
        
        let sum = 0, cellCount = 0
        const top = map[y-1]?.[x] || 0
        const right = map[y]?.[x+1] || 0
        const bottom = map[y+1]?.[x] || 0
        const left = map[y]?.[x-1] || 0; // semicolon needed
        return [top, right, bottom, left].reduce((t,n) => t + n, 0) / 4
      }
    })

    // print smooth afr diffs 
    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
      scaling: 'AFR',
      agg: 'AFRDiffSmooth2',
      tabs: true,
      formatter: v => Number(v).toFixed(2) 
    })

    // Set final values base on diff
    this.romHandler.MapCombine({
      tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
      tableOne: {},
      tableTwo: {
        scalingTwo: 'AFR',
        aggTwo: 'AFRDiffSmooth2',
      },
      newTable: {
        newScaling: 'Loadify',
        newAgg: 'AFRCorrected'
      },
      aggregator: (load, afrDiff) => {
        if (Math.abs(afrDiff) < 0.2) return load
        if ( afrDiff >= 0 ) {
          if (afrDiff > 2) {
            return load - 20
          } else if (afrDiff > 1) {
            return load - 10
          }
          return load - 5
        } else {
          if (afrDiff < -2) {
            return load + 20
          } else if (afrDiff < -1) {
            return load + 10
          }
          return load + 5          
        }
      }
    })

    // final loads 
    this.romHandler.PrintTable({
      tableName: 'MAP based Load Calc #2 - Cold/Interpolated',
      scaling: 'Loadify',
      agg: 'AFRCorrected',
      tabs: true,
      // formatter: v => Number(v).toFixed(2) 
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