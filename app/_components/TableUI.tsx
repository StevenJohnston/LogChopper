import { Scaling, Table } from "../_lib/rom-metadata";
import { sprintf } from 'sprintf-js'
import ColorScale from "color-scales";
import { useMemo } from "react";

interface TableUIProps {
  table: Table
}

// function getColorBetween(
//   color1: string,
//   color2: string,
//   min: number,
//   max: number,
//   value: number
// ): string {
//   // Ensure value is within the min-max range
//   if (value < min || value > max) {
//     throw new Error("Value must be between min and max");
//   }

//   // Convert colors to RGB objects
//   const rgb1 = hexToRgb(color1);
//   const rgb2 = hexToRgb(color2);

//   // Calculate the normalized value (between 0 and 1)
//   const normalizedValue = (value - min) / (max - min);

//   // Interpolate each color channel
//   const red = Math.round(rgb1.r + (rgb2.r - rgb1.r) * normalizedValue);
//   const green = Math.round(rgb1.g + (rgb2.g - rgb1.g) * normalizedValue);
//   const blue = Math.round(rgb1.b + (rgb2.b - rgb1.b) * normalizedValue);

//   // Convert back to hex string
//   const hexColor = rgbToHex({ r: red, g: green, b: blue });

//   return hexColor;
// }
const getColor = (scaling: Scaling | undefined, value: number | undefined) => {
  if (!scaling || !value) return
  const xAxisMin = parseFloat(scaling.min || '')
  const xAxisMax = parseFloat(scaling.max || '')
  var colorScale = new ColorScale(xAxisMin, xAxisMax, ['#00ffff', '#ff8b25'])
  let color = colorScale.getColor(value)
  return color.toHexString()
}

const TableUI: React.FC<TableUIProps> = ({ table }) => {

  const maxWidth = useMemo(() => {
    if (!table) return 0
    let maxWidth = 0
    // Get the max width of colomn names
    if (table.xAxis) {
      table.xAxis.values?.forEach((value) => {
        let width = sprintf(table?.xAxis?.scalingValue?.format || '', value).length
        if (width > maxWidth) maxWidth = width
      })
    }
    table.values?.forEach?.((row) => {
      if (Array.isArray(table.values)) {
        if (Array.isArray(row)) {
          row.forEach((cell) => {
            let width = sprintf(table?.scalingValue?.format || '', cell).length
            if (width > maxWidth) maxWidth = width
          })
        }
      } else {
        let width = sprintf(table?.scalingValue?.format || '', row).length
        if (width > maxWidth) maxWidth = width
      }
    })
    return maxWidth
  }, [table])

  if (!table) return <div>Loading Table</div>

  return (
    <div className="flex flex-col items-center text-[12px]">
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
                      style={{ backgroundColor: getColor(table.xAxis?.scalingValue, value), width: `${maxWidth * 10}px` }}
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
              table?.values?.map((row: (string | number | (string | number)[]), i) => {
                let yAxisValue = table?.yAxis?.values?.[i]
                return (
                  <tr>
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
                      row.map((cell) => {
                        return (
                          <td
                            className="text-center border border-gray-300"
                            style={{ backgroundColor: getColor(table.scalingValue, parseFloat(cell.toString())) }}
                          >
                            {sprintf(table?.scalingValue?.format || '', cell)}
                          </td>
                        )
                      })
                    }
                  </tr>
                )
                // }
                // return (
                //   <div>{table.scalingValue.name}</div>
                // )
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableUI;