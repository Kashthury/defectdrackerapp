import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RiskSummaryProps {
  riskCounts: { high: number; medium: number; low: number };
}

export const RiskSummary: React.FC<RiskSummaryProps> = ({ riskCounts }) => {
  const items = [
    {
      key: 'high',
      label: 'High Risk Projects',
      count: riskCounts.high,
      color: '#ef4444',
      lightBg: '#fee2e2', // light red
      emoji: '🔥',
      subtitle: 'Immediate attention required',
    },
    {
      key: 'medium',
      label: 'Medium Risk Projects',
      count: riskCounts.medium,
      color: '#f59e0b',
      lightBg: '#fef3c7', // light amber
      emoji: '⚠️',
      subtitle: 'Monitor progress closely',
    },
    {
      key: 'low',
      label: 'Low Risk Projects',
      count: riskCounts.low,
      color: '#22c55e',
      lightBg: '#dcfce7', // light green
      emoji: '✅',
      subtitle: 'Stable and on track',
    },
  ];

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View key={item.key} style={[styles.card, { borderLeftColor: item.color }]}>
          <View style={styles.left}>
            {/* Circle with light background + border */}
            <View
              style={[
                styles.iconCircle,
                {
                  borderColor: item.color,
                  backgroundColor: item.lightBg,
                },
              ]}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <View style={styles.textGroup}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={[styles.count, { color: item.color }]}>{item.count}</Text>
              <Text style={[styles.subtitle, { color: item.color }]}>{item.subtitle}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 14,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emoji: { fontSize: 24 },
  textGroup: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  count: { fontSize: 28, fontWeight: '700', marginVertical: 2 },
  subtitle: { fontSize: 12, fontWeight: '500' },
});

export default RiskSummary;