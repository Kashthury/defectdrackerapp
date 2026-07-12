import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing } from '../../constants/theme';
import { withAlpha, getContrastText } from '../../utils/colorUtils';
import { AnimatedPressable } from './AnimatedPressable';

type ChipSize = 'sm' | 'md' | 'lg';
type ChipVariant = 'soft' | 'solid' | 'outline';

interface ChipProps {
  label: string | number;
  /** Accent color (typically a backend-provided color code). */
  color?: string;
  /** Feather icon name shown before the label. */
  icon?: string;
  /** Leading colored dot (ignored when an icon is provided). */
  dot?: boolean;
  size?: ChipSize;
  variant?: ChipVariant;
  uppercase?: boolean;
  /** When set the chip becomes touchable with a subtle press animation. */
  onPress?: () => void;
  /** Selected state for filter chips (renders as solid). */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

const SIZES: Record<
  ChipSize,
  { pv: number; ph: number; font: number; icon: number; dot: number; minHeight: number; gap: number }
> = {
  sm: { pv: 3, ph: 8, font: 11, icon: 11, dot: 6, minHeight: 22, gap: 4 },
  md: { pv: 5, ph: 11, font: 12, icon: 13, dot: 7, minHeight: 28, gap: 5 },
  lg: { pv: 9, ph: 15, font: 13, icon: 15, dot: 8, minHeight: 40, gap: 7 },
};

/**
 * A single, reusable chip/badge used everywhere for severity, priority, status,
 * risk and filters. Colors are driven by props (usually a backend color code)
 * with automatic tinting and readable contrast.
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  color = Colors.primary,
  icon,
  dot = false,
  size = 'md',
  variant = 'soft',
  uppercase = false,
  onPress,
  active = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const s = SIZES[size];
  const effectiveVariant: ChipVariant = active ? 'solid' : variant;

  let backgroundColor: string;
  let textColor: string;
  let borderColor: string;

  switch (effectiveVariant) {
    case 'solid':
      backgroundColor = color;
      textColor = getContrastText(color);
      borderColor = color;
      break;
    case 'outline':
      backgroundColor = 'transparent';
      textColor = color;
      borderColor = withAlpha(color, 0.5);
      break;
    default: // soft
      backgroundColor = withAlpha(color, 0.12);
      textColor = color;
      borderColor = withAlpha(color, 0.22);
      break;
  }

  const content = (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor,
          paddingVertical: s.pv,
          paddingHorizontal: s.ph,
          minHeight: s.minHeight,
          gap: s.gap,
        },
        style,
      ]}
    >
      {icon ? (
        <Icon name={icon} size={s.icon} color={textColor} />
      ) : dot ? (
        <View
          style={{
            width: s.dot,
            height: s.dot,
            borderRadius: s.dot / 2,
            backgroundColor: effectiveVariant === 'solid' ? textColor : color,
          }}
        />
      ) : null}
      <Text
        numberOfLines={1}
        style={[
          Typography.chipText,
          { color: textColor, fontSize: s.font },
          uppercase && styles.uppercase,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? String(label)}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  uppercase: {
    textTransform: 'uppercase',
  },
});

export default Chip;
