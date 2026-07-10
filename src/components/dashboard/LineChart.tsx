import React from 'react';
import { Dimensions } from 'react-native';
import { LineChart as ChartLine } from 'react-native-chart-kit';
import { Colors } from '../../constants/colors';

interface LineChartProps {
  labels: string[];
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  labels,
  data,
  width = Dimensions.get('window').width - 32,
  height = 200,
  color = Colors.primary,
}) => {
  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  };

  return (
    <ChartLine
      data={{ labels, datasets: [{ data }] }}
      width={width}
      height={height}
      chartConfig={chartConfig}
      bezier
      style={{ marginVertical: 8, borderRadius: 16 }}
    />
  );
};