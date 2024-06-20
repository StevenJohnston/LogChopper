'use client'
import { Axis, BasicTable, Scaling, isTable2DX, isTable2DY } from "../_lib/rom-metadata";
import { sprintf } from 'sprintf-js'
import ColorScale from "color-scales";
import { useCallback, useMemo, useState, MouseEvent, CSSProperties, forwardRef } from "react";
import ScalingSelector from "@/app/_components/ScalingSelector";

interface TableUIProps {
  table: BasicTable

  scalingMap?: Record<string, Scaling> | null
  scalingValue?: Scaling | null
  setScalingValue?: (scalingValue: Scaling | undefined | null) => void
}
type CellPos = [number, number]
const getColor = (scaling: Scaling | undefined, value: number | undefined) => {
  if (!scaling || value == undefined) return
  const xAxisMin = Number(scaling.min)
  const xAxisMax = Number(scaling.max)
  if (xAxisMin >= xAxisMax) return "#CCC"
  const colorScale = new ColorScale(xAxisMin, xAxisMax, ['#00ffff', '#ff8b25'])
  try {
    const color = colorScale.getColor(value)
    return color.toHexString()
  } catch (e) {
    return "#FFF"
  }
}

const selectText = (textArea: HTMLTextAreaElement, text: string) => {
  textArea.value = text;
  textArea.focus();
  textArea.select();
}

const eventToCellpos = (event: MouseEvent<HTMLTableCellElement>): CellPos | void => {
  const { cellpos } = event.currentTarget.dataset
  if (!cellpos) return
  const [x, y] = cellpos.split(',')
  return [Number(x), Number(y)]
}

const sortCellPos = (cell1: CellPos, cell2: CellPos): [CellPos, CellPos] => {
  const startCell: CellPos = [
    cell1[0] < cell2[0] ? cell1[0] : cell2[0],
    cell1[1] < cell2[1] ? cell1[1] : cell2[1],
  ]
  const endCell: CellPos = [
    cell1[0] > cell2[0] ? cell1[0] : cell2[0],
    cell1[1] > cell2[1] ? cell1[1] : cell2[1],
  ]
  return [startCell, endCell]

}

const isCellWithinSelection = (cell: CellPos, minCell: CellPos, maxCell: CellPos): boolean => {
  if (cell[0] >= minCell[0] && cell[0] <= maxCell[0]) {
    if (cell[1] >= minCell[1] && cell[1] <= maxCell[1]) {
      return true
    }
  }
  return false
}

const TableUI = forwardRef<HTMLTextAreaElement, TableUIProps>(({ table, scalingMap, scalingValue, setScalingValue }, textAreaRef) => {

  const [selectStartCell, setSelectStartCell] = useState<CellPos>()
  const [selectEndCell, setSelectEndCell] = useState<CellPos>()

  const [mouseDown, setMouseDown] = useState<boolean>(false)

  const cellOnMouseDown = useCallback((event: MouseEvent<HTMLTableCellElement>) => {
    setMouseDown(true)
    setSelectEndCell(undefined)
    const cellpos = eventToCellpos(event)
    if (!cellpos) return console.log("Failed to get start cellpos from event")

    setSelectStartCell(cellpos)
  }, [])

  const highlightCells = useCallback(() => {
    if (!selectStartCell) return console.log("No selectStartCell")
    // const cellpos = eventToCellpos(event)
    const endCell = selectEndCell
    if (!endCell) return console.log("Failed to get end cellpos from event")
    setSelectEndCell(endCell)

    const [[minRow, minCol], [maxRow, maxCol]] = sortCellPos(selectStartCell, endCell)
    console.log(`start: [${minRow}, ${minCol}] end: [${maxRow}, ${maxCol}]`)

    let csvText = ""
    for (let y = minRow; y <= maxRow; y++) {
      for (let x = minCol; x <= maxCol; x++) {
        if (table.type != '3D') {
          console.log("Attempted to highlight cells from non 3d table")
          continue
        }
        csvText += `${table.values[y][x]}`
        if (x != maxCol) {
          csvText += `\t`
        }
      }

      if (y != maxRow) {
        csvText += '\n'
      }
    }

    if (textAreaRef == null) return console.log("TextAreadRef missing")
    if (typeof textAreaRef === 'function') {
      return console.log("passed ref to TableUI is a function expect ref with .current")
    }
    if (textAreaRef.current == null) return console.log()
    selectText(textAreaRef.current as HTMLTextAreaElement, csvText)
  }, [textAreaRef, selectEndCell, selectStartCell, table])

  const cellOnMouseEnter = useCallback((event: MouseEvent<HTMLTableCellElement>) => {
    if (mouseDown) {
      const endCell = eventToCellpos(event)
      if (!endCell) return console.log("Failed to get end cellpos from event")
      setSelectEndCell(endCell)
    }
  }, [mouseDown])

  const cellOnMouseUp = useCallback((event: MouseEvent<HTMLTableCellElement>) => {
    console.log("up")
    setMouseDown(false)
    const endCell = eventToCellpos(event)
    if (!endCell) return console.log("Failed to get end cellpos from event")
    setSelectEndCell(endCell)
    highlightCells()
  }, [highlightCells, setSelectEndCell])

  const tableScaling: Scaling | undefined = useMemo(() => {
    if (scalingValue) return scalingValue
    // if (table?.scalingValue?.min != undefined && table?.scalingValue?.max != undefined) return table.scalingValue
    if (table.type == "Other") return undefined
    if (table.type == "1D") return { min: table.values, max: table.values }
    let min = Infinity
    let max = -Infinity
    if (table.type == "2D") {
      if (isTable2DY(table)) {
        table.values.forEach(cell => {
          const cellN = Number(cell)
          min = min < cellN ? min : cellN
          max = max > cellN ? max : cellN
        })
        return { min, max }
      }
    }

    if ((table.type == "2D" && isTable2DX(table)) || table.type == "3D") {
      table.values.forEach(row => {
        row.forEach(cell => {
          const cellN = Number(cell)
          min = min < cellN ? min : cellN
          max = max > cellN ? max : cellN
        })
      })
    }
    return { min, max }
  }, [table, scalingValue])

  const formatCell = useCallback((row: number, col: number, cell: string | number): CSSProperties => {
    if (selectStartCell && selectEndCell) {
      const [minCell, maxCell] = sortCellPos(selectStartCell, selectEndCell)
      if (isCellWithinSelection([row, col], minCell, maxCell)) {
        return {
          backgroundColor: "#333399",
          color: "#fff"
        }
      }
    }

    return {
      backgroundColor: getColor(tableScaling, parseFloat(cell?.toString() || ""))
    }
  }, [tableScaling, selectStartCell, selectEndCell])

  const maxWidth = useMemo(() => {
    if (!table) return 0
    let maxWidth = 0

    let xAxis: Axis | null = null;
    // Get the max width of colomn names
    switch (table.type) {
      case "3D":
        xAxis = table.xAxis;
        break;
      case "2D":
        if (isTable2DX(table)) {
          xAxis = table.xAxis;
        }
        break;
      case "1D":
        break;
      case "Other":
        return console.log(`fillTable unhandled table type ${table.type}`);
    }

    if (xAxis) {
      xAxis.values?.forEach((value) => {
        const width = sprintf(xAxis?.scalingValue?.format || '', value).length
        if (width > maxWidth) maxWidth = width
      })
    }

    if (!Array.isArray(table.values)) {
      const width = sprintf(table?.scalingValue?.format || '', table.values).length
      if (width > maxWidth) maxWidth = width
    } else {
      table.values.forEach?.((row) => {
        if (Array.isArray(table.values)) {
          if (Array.isArray(row)) {
            row.forEach((cell) => {
              try {
                const width = sprintf(table?.scalingValue?.format || '', cell).length
                if (width > maxWidth) maxWidth = width
              } catch (e) {
                console.log("TableUI maxWidth failed to get", e)
              }
            })
          }
        } else {
          const width = sprintf(table?.scalingValue?.format || '', row).length
          if (width > maxWidth) maxWidth = width
        }
      })
    }

    return maxWidth
  }, [table])

  const getTableValue = useCallback((fmt: string, cell: string | number) => {
    try {
      return sprintf(fmt, cell)
    } catch (error) {
      return ""
    }
  }, [])

  if (!table) return <div>Loading Table</div>

  if (table.type == "Other") return <div>Other table tyoe not supported</div>
  if (table.type != "3D") return <div>2D 1D not supported</div>
  return (
    <div className="flex flex-col items-center text-[12px] pr-2">
      <textarea ref={textAreaRef} style={{ position: "fixed", left: "-9999px", top: "-9999px" }} readOnly></textarea>
      {
        scalingMap
        && <div className="w-full mt-2 flex-col justify-end items-center">
          <p className="block mb-1 text-sm font-medium text-gray-900">Colour Scale</p>

          <ScalingSelector
            scalingMap={scalingMap}
            scalingValue={scalingValue}
            setScalingValue={setScalingValue}
          />
        </div>
      }


      <div className="flex text-center flex-grow">{table?.xAxis?.name}</div>
      <div className="flex max-w-full">
        <div className="inline text-center rotate-180" style={{ writingMode: "vertical-rl" }}>
          {table?.yAxis?.name}
        </div>
        <table className="table-auto block font-mono leading-none cursor-pointer overflow-auto max-w-full">
          <thead>
            <tr className="sticky">
              <th>*</th>
              {
                table?.xAxis?.values?.map((value) => {
                  return (
                    <th
                      key={value}
                      style={{ backgroundColor: getColor(table.xAxis?.scalingValue, value), width: `${maxWidth || 1 * 10}px` }}
                      className="border border-gray-300"
                    >
                      {sprintf(table?.xAxis?.scalingValue?.format || '', value)}
                    </th>
                  )
                }) || <th>{table.scalingValue?.name}</th>
              }
            </tr>
          </thead>
          <tbody>
            {
              table?.values?.map((row, rowI) => {
                const yAxisValue = table?.yAxis?.values?.[rowI]
                return (
                  <tr key={rowI}>
                    {yAxisValue &&
                      <th
                        className="px-2 border border-gray-300 sticky"
                        style={{ backgroundColor: getColor(table.yAxis?.scalingValue, yAxisValue) }}
                      >
                        {sprintf(table?.yAxis?.scalingValue?.format || '', yAxisValue)}
                      </th> ||
                      <th>{table.scalingValue?.name}</th>
                    }
                    {

                      Array.isArray(row) &&
                      row.map((cell, colI) => {
                        return (
                          <td
                            data-cellpos={[rowI, colI]}
                            key={`${rowI}-${colI}`}
                            className="text-center border border-gray-300"
                            style={formatCell(rowI, colI, cell)}
                            onMouseDown={cellOnMouseDown}
                            onMouseUp={cellOnMouseUp}
                            onMouseEnter={cellOnMouseEnter}
                          >
                            {getTableValue(scalingValue?.format || '%.2f', cell)}
                          </td>
                        )
                      })
                    }
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
})

TableUI.displayName = "TableUI"

export default TableUI;