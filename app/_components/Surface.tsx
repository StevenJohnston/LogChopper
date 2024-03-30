'use client'
import ReactECharts, { EChartsOption } from 'echarts-for-react';
import 'echarts-gl'
import { Table3D } from '../_lib/rom-metadata';
import { getScalingAlias } from '../_lib/consts';
import { useMemo } from 'react';

interface SurfaceProps {
  table: Table3D<number | string>
}

type MinMax = [number, number]
type point3d = [number, number, number]
// https://echarts.apache.org/en/option-gl.html#grid3D
const Surface: React.FC<SurfaceProps> = ({ table }) => {

  const data: point3d[] = useMemo(() => {
    return table.values?.map((row, rowI) => {
      if (Array.isArray(row)) {
        const point3d: [number, number, number][] = row?.map((cell, cI) => {
          return [parseFloat(table.xAxis?.values?.[cI]), parseFloat(table.yAxis?.values?.[rowI]), parseFloat(cell.toString())]
        }) || []
        return point3d
      }
      return []
    }).flat() || []//.filter(([x, y, z]) => !isNaN(x))
  }, [table])


  const [min, max]: MinMax = useMemo(() => {
    return data?.reduce(([min, max]: MinMax, cur: point3d): MinMax => {
      return [
        min < (cur[2] || Infinity) ? min : cur[2],
        max < (cur[2] || -Infinity) ? max : cur[2],
      ]
    }, [Infinity, -Infinity]) || [0, 0]
  }, [data])

  const option: EChartsOption = {
    tooltip: {},
    backgroundColor: '#fff',
    visualMap: {
      show: true,
      dimension: 2,
      inRange: {
        color: ['#00ffff', '#ff8b25']
      }
    },
    xAxis3D: {
      type: 'value',
      name: table?.xAxis?.name
    },
    yAxis3D: {
      type: 'value',
      name: table?.yAxis?.name
    },
    zAxis3D: {
      type: 'value',
      name: getScalingAlias(table?.scalingValue),
      min,
      max
    },
    grid3D: {
      viewControl: {
        // projection: 'orthographic'
        rotateSensitivity: 10
      }
    },
    series: [
      {
        type: 'surface',
        wireframe: {
          show: true
        },
        data: data
        // data: [
        //   [1, 1, 1],
        //   [0, 1, 1],
        //   [0, 0, 0],
        //   // [-1, 0, 1],
        // ]
      }
    ]
  };

  if (table?.type !== '3D') return <></>

  return <ReactECharts option={option} />;
}

export default Surface