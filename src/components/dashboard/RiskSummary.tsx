import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing, Shadows, coloredShadow } from '../../constants/theme';
import { RiskLevel } from '../../utils/riskUtils';
import { getRiskMeta, withAlpha } from '../../utils/colorUtils';
import { AnimatedPressable } from '../common/AnimatedPressable';

interface RiskSummaryProps {
  riskCounts: { high: number; medium: number; low: number };
  /** Currently selected risk filter (highlights the matching card). */
  activeRisk?: RiskLevel | 'all';
  /** When provided, cards become tappable and drive the risk filter. */
  onSelectRisk?: (risk: RiskLevel) => void;
}

const ORDER: RiskLevel[] = ['high', 'medium', 'low'];

export const RiskSummary: React.FC<RiskSummaryProps> = ({
  riskCounts,
  activeRisk,
  onSelectRisk,
}) => {
  return (
    <View style={styles.container}>
      {ORDER.map((key) => {
        const meta = getRiskMeta(key);
        const count = riskCounts[key] ?? 0;
        const isActive = activeRisk === key;

        const card = (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isActive ? withAlpha(meta.color, 0.12) : Colors.card,
                borderColor: isActive ? withAlpha(meta.color, 0.55) : withAlpha(meta.color, 0.18),
              },
              isActive && coloredShadow(meta.color, 0.22, 14, 6),
            ]}
          >
            <View style={styles.topRow}>
              <View
                style={[
                  styles.iconChip,
                  { backgroundColor: meta.color, ...coloredShadow(meta.color, 0.35, 8, 4) },
                ]}
              >
                <Icon name={meta.icon} size={20} color={Colors.white} />
              </View>
              {isActive ? (
                <View style={[styles.checkDot, { backgroundColor: meta.color }]}>
                  <Icon name="check" size={12} color={Colors.white} />
                </View>
              ) : null}
            </View>

            <Text style={[styles.count, { color: meta.color }]} numberOfLines={1} adjustsFontSizeToFit>
              {count}
            </Text>
            <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
              {meta.label}
            </Text>
          </View>
        );

        if (onSelectRisk) {
          return (
            <AnimatedPressable
              key={key}
              style={styles.cardTouchable}
              onPress={() => onSelectRisk(key)}
              accessibilityLabel={`Filter by ${meta.label}, ${count} projects`}
            >
              {card}
            </AnimatedPressable>
          );
        }

        return (
          <View key={key} style={styles.cardTouchable}>
            {card}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  cardTouchable: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    ...Shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 42,
  },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  count: {
    ...Typography.metricValue,
    fontSize: 30,
    marginTop: Spacing.md,
  },
  label: {
    ...Typography.caption,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default RiskSummary;
