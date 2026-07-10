import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Colors } from '../../constants/colors';

interface DefectTypeItem {
  defectTypeName: string;
  defectCount: number;
  percentage: number;
}

interface DefectTypeData {
  defectTypes: DefectTypeItem[];
  totalDefectCount: number;
  mostCommonDefectType: string;
  mostCommonDefectCount: number;
}

interface DefectTypePieChartProps {
  data: DefectTypeData | null;
  loading?: boolean;
  error?: string | null;
}

export const DefectTypePieChart: React.FC<DefectTypePieChartProps> = ({
  data,
  loading = false,
  error = null,
}) => {
  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Defect Distribution by Type</Text>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Defect Distribution by Type</Text>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!data || !data.defectTypes || data.defectTypes.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Defect Distribution by Type</Text>
        <Text style={styles.noData}>No defect type data available</Text>
      </View>
    );
  }

  const colors = [
    '#4285F4', '#00B894', '#FBBC05', '#EA4335', '#A259F7',
    '#FF6F00', '#8E24AA', '#43A047', '#F4511E', '#1E88E5',
  ];

  const chartData = data.defectTypes.map((item, index) => ({
    name: item.defectTypeName,
    count: item.defectCount,
    color: colors[index % colors.length],
    legendFontColor: '#1e293b',
    legendFontSize: 12,
  }));

  const screenWidth = 300;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Defect Distribution by Type</Text>

      {/* Pie Chart */}
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
          paddingLeft="75"
          hasLegend={false}
          absolute
        />
      </View>

      {/* Legend below the chart */}
      <View style={styles.legendContainer}>
        {data.defectTypes.map((item, index) => (
          <View key={item.defectTypeName} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: colors[index % colors.length] }]} />
            <Text style={styles.legendText}>
              {item.defectTypeName}: {item.defectCount} ({item.percentage.toFixed(1)}%)
            </Text>
          </View>
        ))}
      </View>

      {/* Stats: Total and Most Common */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data.totalDefectCount}</Text>
          <Text style={styles.statLabel}>Total Defects</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#4285F4' }]}>{data.mostCommonDefectCount}</Text>
          <Text style={styles.statLabel}>Most Common</Text>
          <Text style={styles.statSubLabel}>{data.mostCommonDefectType}</Text>
        </View>
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
    marginTop: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#1e293b',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statSubLabel: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
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