import { Colors } from './colors';

/**
 * Central design tokens for the app.
 *
 * Before this file, spacing / border-radius / shadows were hardcoded per
 * component and had drifted (radius values of 12/16/18/20/24 all coexisted).
 * These tokens give every screen a single, consistent scale so the UI reads as
 * one cohesive, premium product.
 */

// 4pt spacing scale — use these instead of arbitrary paddings/margins.
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

// Border-radius scale. `pill` is for chips/badges, `full` for circular avatars.
export const Radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
  full: 9999,
} as const;

/**
 * Reusable elevation presets. Kept subtle and layered (low opacity, larger
 * blur) for a soft, modern "floating card" feel rather than harsh drop
 * shadows. Colored variants let cards echo an accent color in their shadow.
 */
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  // Subtle lift for list rows / small cards.
  soft: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // Default card elevation.
  card: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  // Prominent, hero / floating elements.
  elevated: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
} as const;

/**
 * Builds a soft, tinted shadow that echoes an accent color — used by stat
 * cards and icon chips so a "High Risk" card glows subtly red, etc.
 */
export const coloredShadow = (
  color: string,
  opacity = 0.35,
  radius = 12,
  height = 6,
) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: 6,
});

// Consistent hit target for touchable controls (accessibility / touch-friendly).
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
export const MIN_TOUCH_SIZE = 44;

export const Theme = { Spacing, Radius, Shadows, coloredShadow, HIT_SLOP, MIN_TOUCH_SIZE };

export default Theme;
