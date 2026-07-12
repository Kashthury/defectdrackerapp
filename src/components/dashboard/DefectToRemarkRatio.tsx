import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing, Shadows } from '../../constants/theme';
import { Chip } from '../common/Chip';
import { resolveChipColor, withAlpha } from '../../utils/colorUtils';

interface DefectToRemarkRatioProps {
  ratio: string; // e.g., "71.43%"
  category: string; // "High", "Medium", "Low"
  color: string; // hex color or named color
  loading?: boolean;
  error?: string | null;
}

const CardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.card}>
    <View style={styles.titleRow}>
      <Icon name="percent" size={16} color={Colors.textSecondary} />
      <Text style={styles.title}>Defect to Remark Ratio</Text>
    </View>
    {children}
  </View>
);

export const DefectToRemarkRatio: React.FC<DefectToRemarkRatioProps> = ({
  ratio,
  category,
  color,
  loading = false,
  error = null,
}) => {
  const percentage = parseFloat(ratio.replace('%', '')) || 0;
  const barWidth = Math.min(percentage, 100);
  // Prefer the backend color; fall back to a category-based hue.
  const accent = resolveChipColor(color, category);

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
        <Text style={[styles.percentage, { color: accent }]}>{ratio}</Text>

        <View style={styles.barContainer}>
          <View style={styles.barBackground}>
            <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: accent }]} />
          </View>
        </View>

        <View style={styles.ticks}>
          <Text style={styles.tickLabel}>0%</Text>
          <Text style={styles.tickLabel}>50%</Text>
          <Text style={styles.tickLabel}>100%</Text>
        </View>

        <View style={styles.badgeWrap}>
          <Chip label={category} color={accent} size="md" dot />
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
    paddingVertical: Spacing.xs,
  },
  percentage: {
    ...Typography.metricValue,
    fontSize: 38,
    marginBottom: Spacing.sm,
  },
  barContainer: {
    width: '100%',
    paddingHorizontal: Spacing.xs,
  },
  barBackground: {
    width: '100%',
    height: 10,
    backgroundColor: withAlpha(Colors.textLight, 0.2),
    borderRadius: Radius.xs,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.xs,
  },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tickLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  badgeWrap: {
    marginTop: Spacing.md,
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
