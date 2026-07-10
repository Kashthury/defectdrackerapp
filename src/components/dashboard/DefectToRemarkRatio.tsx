import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface DefectToRemarkRatioProps {
  ratio: string;       // e.g., "71.43%"
  category: string;    // "High", "Medium", "Low"
  color: string;       // hex color or named color
  loading?: boolean;
  error?: string | null;
}

export const DefectToRemarkRatio: React.FC<DefectToRemarkRatioProps> = ({
  ratio,
  category,
  color,
  loading = false,
  error = null,
}) => {
  // Parse percentage from "71.43%" -> 71.43
  const percentage = parseFloat(ratio.replace('%', '')) || 0;
  const barWidth = Math.min(percentage, 100);

  // Map category to background color for badge
  const getBadgeBg = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'high': return '#fef2f2';
      case 'medium': return '#fffbeb';
      case 'low': return '#f0fdf4';
      default: return '#f1f5f9';
    }
  };

  const badgeBg = getBadgeBg(category);

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Defect to Remark Ratio</Text>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Defect to Remark Ratio</Text>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Defect to Remark Ratio</Text>
      <View style={styles.content}>
        {/* Large percentage */}
        <Text style={[styles.percentage, { color }]}>
          {ratio}
        </Text>

        {/* Bar */}
        <View style={styles.barContainer}>
          <View style={styles.barBackground}>
            <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: color }]} />
          </View>
        </View>

        {/* Tick marks */}
        <View style={styles.ticks}>
          <Text style={styles.tickLabel}>0%</Text>
          <Text style={styles.tickLabel}>50%</Text>
          <Text style={styles.tickLabel}>100%</Text>
        </View>

        {/* Category badge */}
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color }]}>{category}</Text>
        </View>
      </View>
    </View>
  );
};

// (Add ActivityIndicator import at top if not already)
import { ActivityIndicator } from 'react-native';

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
  content: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  percentage: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  barContainer: {
    width: '100%',
    paddingHorizontal: 4,
  },
  barBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  tickLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  badge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
    paddingVertical: 10,
  },
});