import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Colors } from '../../constants/colors';

interface DefectModuleItem {
  name: string;
  value: number;
  percentage: number;
}

interface DefectsByModuleChartProps {
  data: DefectModuleItem[] | null;
  loading?: boolean;
  error?: string | null;
}

export const DefectsByModuleChart: React.FC<DefectsByModuleChartProps> = ({
  data,
  loading = false,
  error = null,
}) => {
  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Defects by Module</Text>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Defects by Module</Text>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Defects by Module</Text>
        <Text style={styles.noData}>No data available</Text>
      </View>
    );
  }

  const colors = [
    '#4285F4', '#00B894', '#FBBC05', '#EA4335', '#A259F7',
    '#00B8D9', '#FF6F00', '#8E24AA', '#43A047', '#F4511E',
  ];

  const chartData = data.map((item, index) => ({
    name: item.name,
    count: item.value,
    color: colors[index % colors.length],
    legendFontColor: '#1e293b',
    legendFontSize: 12,
  }));

  const screenWidth = 300;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Defects by Module</Text>
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

      {/* Legend */}
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={item.name} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors[index % colors.length] }]} />
            <Text style={styles.legendName}>{item.name}</Text>
            <Text style={styles.legendValue}>
              {item.value} ({item.percentage.toFixed(1)}%)
            </Text>
          </View>
        ))}
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
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendName: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  legendValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    textAlign: 'right',
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