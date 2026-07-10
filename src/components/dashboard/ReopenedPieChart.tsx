import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Colors } from '../../constants/colors';

interface ReopenedPieChartProps {
  reopenedCount: number;
  notReopenedCount: number;
  loading?: boolean;
  error?: string | null;
}

export const ReopenedPieChart: React.FC<ReopenedPieChartProps> = ({
  reopenedCount,
  notReopenedCount,
  loading = false,
  error = null,
}) => {
  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Defects Reopened Multiple Times</Text>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Defects Reopened Multiple Times</Text>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  const total = reopenedCount + notReopenedCount;
  if (total === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Defects Reopened Multiple Times</Text>
        <Text style={styles.noData}>No data available</Text>
      </View>
    );
  }

  const chartData = [
    {
      name: 'Reopened',
      count: reopenedCount,
      color: '#ef4444',
      legendFontColor: '#1e293b',
      legendFontSize: 12,
    },
    {
      name: 'Not Reopened',
      count: notReopenedCount,
      color: '#22c55e',
      legendFontColor: '#1e293b',
      legendFontSize: 12,
    },
  ];

  // Adjust width as needed – use a responsive value or a fixed one
  const screenWidth = 300;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Defects Reopened Multiple Times</Text>
      <View style={styles.chartContainer}>
        <PieChart
          data={chartData}
          width={screenWidth}
          height={180}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
      {/* Custom legend with percentages */}
      <View style={styles.legendContainer}>
        {chartData.map((item) => {
          const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
          return (
            <View key={item.name} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>
                {item.name}: {item.count} ({percentage}%)
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#1e293b',
  },
  noData: {
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
    paddingVertical: 10,
  },
});