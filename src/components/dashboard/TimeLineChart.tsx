import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface TimeLineChartProps {
  data: { day: string; value: number }[];
  color: string;
  label: string;
}

export const TimeLineChart: React.FC<TimeLineChartProps> = ({ data, color, label }) => {
  const screenWidth = Dimensions.get('window').width - 64;

  // Only show "No data" if data is missing or empty
  if (!data || data.length === 0) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>No data available</Text>
      </View>
    );
  }

  const labels = data.map((d) => d.day);
  const values = data.map((d) => d.value);

  // Always render chart, even if all values are zero
  const chartData = {
    labels: labels,
    datasets: [{ data: values }],
  };

  // Calculate Y axis max: if all zero, set to 2 so zero line is visible
  const maxVal = Math.max(...values, 0);
  const yMax = maxVal > 0 ? maxVal + 1 : 2;

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={180}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => color,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: { borderRadius: 16 },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: color,
          },
        }}
        bezier
        style={styles.chart}
        formatYLabel={(value) => Math.round(Number(value)).toString()}
        fromZero={true}
        yAxisInterval={1}
        yAxisLabel=""
        yAxisSuffix=""
        yMin={0}
        yMax={yMax}
      />
      <Text style={styles.yAxisLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  chart: { borderRadius: 16 },
  yAxisLabel: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4 },
  placeholderContainer: { paddingVertical: 20, alignItems: 'center' },
  placeholderText: { fontSize: 14, color: '#94a3b8' },
});