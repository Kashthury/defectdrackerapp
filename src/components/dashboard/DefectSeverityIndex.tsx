import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';

interface DefectSeverityIndexProps {
  dsi: number;
  status: string;
  loading?: boolean;
  error?: string | null;
}

export const DefectSeverityIndex: React.FC<DefectSeverityIndexProps> = ({
  dsi,
  status = 'Healthy',
  loading = false,
  error = null,
}) => {
  // Determine colors based on status
  const getColors = (status: string) => {
    switch (status) {
      case 'Critical':
        return { barColor: '#b91c1c', textColor: '#b91c1c', badgeBg: '#b91c1c20', badgeBorder: '#b91c1c40' };
      case 'High Risk':
        return { barColor: '#ef4444', textColor: '#dc2626', badgeBg: '#ef444420', badgeBorder: '#ef444440' };
      case 'Needs Attention':
        return { barColor: '#f59e0b', textColor: '#d97706', badgeBg: '#f59e0b20', badgeBorder: '#f59e0b40' };
      default: // Healthy
        return { barColor: '#22c55e', textColor: '#16a34a', badgeBg: '#22c55e20', badgeBorder: '#22c55e40' };
    }
  };

  const colors = getColors(status);
  const maxWeight = 4;
  const maxBarHeight = 120;
  // Clamp dsi between 1 and 4 (since severity index is 1-4)
  const cappedDsi = Math.max(1, Math.min(dsi, maxWeight));
  const barHeight = ((cappedDsi - 1) / (maxWeight - 1)) * maxBarHeight;

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Defect Severity Index</Text>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Defect Severity Index</Text>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Defect Severity Index</Text>
      <View style={styles.content}>
        {/* Bar + Labels */}
        <View style={styles.barContainer}>
         <View style={styles.barWrapper}>
           {/* Background bar */}
           <View style={[styles.barBackground, { height: maxBarHeight }]}>
             <View
               style={[
                 styles.barFill,
                 { height: barHeight, backgroundColor: colors.barColor },
               ]}
             />
           </View>
           {/* Labels 1-4 */}
           <View style={[styles.labels, { height: maxBarHeight }]}>
             <Text style={styles.label}>4</Text>
             <Text style={styles.label}>3</Text>
             <Text style={styles.label}>2</Text>
             <Text style={styles.label}>1</Text>
           </View>
         </View>

          {/* Value and badge */}
          <View style={styles.valueContainer}>
            <Text style={[styles.dsiValue, { color: colors.textColor }]}>
              {dsi.toFixed(2)}
            </Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.badgeBg,
                  borderColor: colors.badgeBorder,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.textColor }]}>
                {status}
              </Text>
            </View>
            <Text style={styles.description}>
              Weighted severity score (higher = more severe defects)
            </Text>
          </View>
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 20,
  },
  barBackground: {
    width: 28,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  barFill: {
    width: '100%',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    position: 'absolute',
    bottom: 0,
  },
  labels: {
    marginLeft: 8,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  valueContainer: {
    alignItems: 'center',
    marginLeft: 8,
    flex: 1,
  },
  dsiValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
    paddingVertical: 10,
  },
});