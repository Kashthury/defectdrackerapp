import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing, Shadows } from '../../constants/theme';
import { Chip } from '../common/Chip';
import { withAlpha } from '../../utils/colorUtils';

interface DefectSeverityIndexProps {
  dsi: number;
  status: string;
  loading?: boolean;
  error?: string | null;
}

// Maps the backend status label to a color from the shared palette.
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Critical':
      return '#B91C1C';
    case 'High Risk':
      return Colors.error;
    case 'Needs Attention':
      return Colors.warning;
    default: // Healthy
      return Colors.success;
  }
};

const CardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.card}>
    <View style={styles.titleRow}>
      <Icon name="bar-chart-2" size={16} color={Colors.textSecondary} />
      <Text style={styles.title}>Defect Severity Index</Text>
    </View>
    {children}
  </View>
);

export const DefectSeverityIndex: React.FC<DefectSeverityIndexProps> = ({
  dsi,
  status = 'Healthy',
  loading = false,
  error = null,
}) => {
  const color = getStatusColor(status);
  const maxWeight = 4;
  const maxBarHeight = 120;
  const cappedDsi = Math.max(1, Math.min(dsi, maxWeight));
  const barHeight = ((cappedDsi - 1) / (maxWeight - 1)) * maxBarHeight;

  if (loading) {
    return (
      <CardShell>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      </CardShell>
    );
  }

  if (error) {
    return (
      <CardShell>
        <Text style={styles.error}>{error}</Text>
      </CardShell>
    );
  }

  return (
    <CardShell>
      <View style={styles.content}>
        <View style={styles.barContainer}>
          <View style={styles.barWrapper}>
            <View style={[styles.barBackground, { height: maxBarHeight }]}>
              <View style={[styles.barFill, { height: barHeight, backgroundColor: color }]} />
            </View>
            <View style={[styles.labels, { height: maxBarHeight }]}>
              <Text style={styles.label}>4</Text>
              <Text style={styles.label}>3</Text>
              <Text style={styles.label}>2</Text>
              <Text style={styles.label}>1</Text>
            </View>
          </View>

          <View style={styles.valueContainer}>
            <Text style={[styles.dsiValue, { color }]}>{dsi.toFixed(2)}</Text>
            <Chip label={status} color={color} size="md" dot />
            <Text style={styles.description}>
              Weighted severity score (higher = more severe defects)
            </Text>
          </View>
        </View>
      </View>
    </CardShell>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.cardTitle,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
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
    marginRight: Spacing.xl,
  },
  barBackground: {
    width: 28,
    backgroundColor: withAlpha(Colors.textLight, 0.18),
    borderRadius: Radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  barFill: {
    width: '100%',
    borderRadius: Radius.lg,
    position: 'absolute',
    bottom: 0,
  },
  labels: {
    marginLeft: Spacing.sm,
    justifyContent: 'space-between',
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  valueContainer: {
    alignItems: 'center',
    marginLeft: Spacing.sm,
    flex: 1,
    gap: Spacing.sm,
  },
  dsiValue: {
    ...Typography.metricValue,
    fontSize: 34,
  },
  description: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: 2,
  },
  error: {
    ...Typography.errorText,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  loader: {
    marginVertical: Spacing.xl,
  },
});
