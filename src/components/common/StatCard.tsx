import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing, Shadows, coloredShadow } from '../../constants/theme';
import { withAlpha } from '../../utils/colorUtils';
import { AnimatedPressable } from './AnimatedPressable';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  /** Accent color for the icon chip, value and subtle shadow. */
  color?: string;
  caption?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Emphasize the value in the accent color (default true). */
  colorValue?: boolean;
}

/**
 * A compact, premium statistic card: a rounded accent icon chip, a large value
 * and a label. Shared by the dashboard risk summary and project statistics so
 * every stat block looks the same.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color = Colors.primary,
  caption,
  onPress,
  style,
  colorValue = true,
}) => {
  const body = (
    <View style={[styles.card, { borderColor: withAlpha(color, 0.2) }, style]}>
      <View style={styles.topRow}>
        {icon ? (
          <View
            style={[
              styles.iconChip,
              { backgroundColor: color, ...coloredShadow(color, 0.32, 8, 4) },
            ]}
          >
            <Icon name={icon} size={20} color={Colors.white} />
          </View>
        ) : null}
        <View style={[styles.accentDot, { backgroundColor: withAlpha(color, 0.16) }]}>
          <View style={[styles.accentDotInner, { backgroundColor: color }]} />
        </View>
      </View>

      <Text
        style={[Typography.metricValue, colorValue && { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {caption ? (
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress} style={styles.flex}>
        {body}
      </AnimatedPressable>
    );
  }

  return body;
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    flex: 1,
    backgroundColor: Colors.card,
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
    marginBottom: Spacing.md,
  },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accentDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accentDotInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  label: {
    ...Typography.caption,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 3,
  },
  caption: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
});

export default StatCard;
