import React from 'react';
import { Dimensions } from 'react-native';
import { PieChart as ChartPie } from 'react-native-chart-kit';
import { Colors } from '../../constants/colors';

interface PieChartProps {
  data: Array<{ name: string; count: number; color?: string }>;
  width?: number;
  height?: number;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  width = Dimensions.get('window').width - 32,
  height = 200,
}) => {
  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  const chartData = data.map((item) => ({
    name: item.name,
    count: item.count,
    color: item.color || Colors.primary,
    legendFontColor: '#333',
    legendFontSize: 12,
  }));

  return (
    <ChartPie
      data={chartData}
      width={width}
      height={height}
      chartConfig={chartConfig}
      accessor="count"
      backgroundColor="transparent"
      paddingLeft="15"
    />
  );
};