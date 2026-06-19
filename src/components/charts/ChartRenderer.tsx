import React from 'react';
import { GroupedBarChart } from './GroupedBarChart';
import { SpendingLineChart } from './SpendingLineChart';
import { CategoryDonut } from './CategoryDonut';
import { NetWorthChart } from '../wealth/NetWorthChart';
import type { ChartKey } from '../../store/chartModal.store';
import type { ChartData } from '../../hooks/ui/useChartData';

interface Props {
  type:   ChartKey;
  data:   ChartData;
  width:  number;
  height: number;
}

export const ChartRenderer = React.memo(function ChartRenderer({ type, data, width, height }: Props) {
  switch (type) {
    case 'bar':
      return <GroupedBarChart data={data.bar} chartW={width} chartH={height} />;
    case 'line':
      return <SpendingLineChart data={data.line} chartW={width} chartH={height} />;
    case 'donut':
      return <CategoryDonut data={data.donut} />;
    case 'networth':
      return <NetWorthChart data={data.networth} width={width} height={height} />;
  }
});
