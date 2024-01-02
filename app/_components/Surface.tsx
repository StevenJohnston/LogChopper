'use client'
import ReactECharts, { EChartsOption } from 'echarts-for-react';
import 'echarts-gl'
import { Table } from '../_lib/rom-metadata';
import { getScalingAlias } from '../_lib/consts';
import { useMemo } from 'react';

interface SurfaceProps {
  table: Table
}
// https://echarts.apache.org/en/option-gl.html#grid3D
const Surface: React.FC<SurfaceProps> = ({ table }) => {
  if (table?.type !== '3D') return <></>

  const data = useMemo(() => {
    return table?.values?.map((row, rowI) => {
      return row.map((cell, cI) => {

        return [parseFloat(table.xAxis.values[cI]), parseFloat(table.yAxis.values[rowI]), cell]
      })
    }).flat()//.filter(([x, y, z]) => !isNaN(x))
  }, [table])


  const [min, max]: [number, number] = useMemo(() => {
    return data?.reduce(([min, max], cur) => {
      return [
        min < cur ? min : cur,
        max < cur ? max : cur,
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


  return <ReactECharts option={option} />;
}

export default Surface