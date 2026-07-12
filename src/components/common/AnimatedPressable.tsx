import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
} from 'react-native';
import { HIT_SLOP } from '../../constants/theme';

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale applied while pressed (default 0.96). */
  scaleTo?: number;
  /** Opacity applied while pressed (default 0.9). */
  activeOpacity?: number;
}

// Animate the Pressable itself so layout props (flex, width, margin) on `style`
// behave exactly as they would on a plain View, while the whole surface scales.
const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

/**
 * A touchable wrapper that adds a subtle, spring-based scale + fade on press.
 * Built on the core Animated API (no extra dependencies) so it works reliably
 * on both platforms and gives every interactive surface the same tactile feel.
 */
export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  children,
  style,
  scaleTo = 0.96,
  activeOpacity = 0.9,
  onPressIn,
  onPressOut,
  disabled,
  hitSlop,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateTo = (toScale: number, toOpacity: number) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: toScale,
        useNativeDriver: true,
        speed: 40,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: toOpacity,
        duration: 90,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressIn = (e: GestureResponderEvent) => {
    if (!disabled) animateTo(scaleTo, activeOpacity);
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    if (!disabled) animateTo(1, 1);
    onPressOut?.(e);
  };

  return (
    <AnimatedPressableBase
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop ?? HIT_SLOP}
      style={[style, { transform: [{ scale }], opacity }]}
      {...rest}
    >
      {children}
    </AnimatedPressableBase>
  );
};

export default AnimatedPressable;
