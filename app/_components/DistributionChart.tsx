'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';

// A function to create histogram data using the Freedman-Diaconis rule
const getHistogramData = (values: number[]) => {
  const n = values.length;
  if (n === 0) {
    return {
      bins: [],
      counts: [],
    };
  }

  const sortedValues = [...values].sort((a, b) => a - b);
  const min = sortedValues[0];
  const max = sortedValues[n - 1];

  if (min === max) {
    return {
      bins: [String(min)],
      counts: [n],
    };
  }

  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sortedValues[q1Index];
  const q3 = sortedValues[q3Index];
  const iqr = q3 - q1;

  let binCount: number;

  if (iqr > 0) {
    const binWidth = (2 * iqr) / Math.pow(n, 1 / 3);
    binCount = Math.ceil((max - min) / binWidth);
  } else {
    binCount = Math.ceil(Math.sqrt(n));
  }

  if (n > 10) {
    binCount = Math.max(5, binCount);
    binCount = Math.min(100, binCount);
  } else {
    binCount = Math.max(2, n);
  }

  const binSize = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => min + i * binSize);
  const counts = Array(binCount).fill(0);

  for (const value of values) {
    let binIndex = Math.floor((value - min) / binSize);
    if (value === max) {
      binIndex = binCount - 1;
    }
    if (binIndex >= 0 && binIndex < binCount) {
      counts[binIndex]++;
    }
  }

  return {
    bins: bins.map((bin) => bin.toFixed(2)),
    counts,
  };
};

interface DistributionChartProps {
    values: number[];
}

const DistributionChart: React.FC<DistributionChartProps> = ({ values }) => {
  const { bins, counts } = getHistogramData(values);

  const option = {
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        }
    },
    grid: {
      top: 30,
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: bins,
        name: 'Value Bins',
        nameLocation: 'middle',
        nameGap: 25
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: 'Count',
        nameLocation: 'middle',
        nameGap: 40
      },
    ],
    series: [
      {
        name: 'Count',
        type: 'bar',
        barWidth: '90%',
        data: counts,
      },
    ],
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
        <div style={{fontWeight: 'bold'}}>Cell Data Distribution</div>
        <ReactECharts option={option} style={{ height: 'calc(100% - 20px)', width: '100%' }} />
    </div>
  );
};

export default DistributionChart;
