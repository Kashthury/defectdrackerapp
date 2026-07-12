import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';

interface FadeInViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Stagger delay in ms — use `index * step` for list entrances. */
  delay?: number;
  duration?: number;
  /** Vertical offset to slide up from (default 12). Set 0 for pure fade. */
  offset?: number;
}

/**
 * Mounts its children with a gentle fade + slide-up. Used for cards and list
 * rows so content settles in smoothly instead of popping, giving the app a
 * polished, cohesive feel. Uses the native driver for 60fps transforms.
 */
export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  style,
  delay = 0,
  duration = 380,
  offset = 12,
}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, delay, duration]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [offset, 0],
  });

  return (
    <Animated.View style={[{ opacity: progress, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
};

export default FadeInView;
