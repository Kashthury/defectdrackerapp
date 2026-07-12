import { StyleSheet, Platform } from 'react-native';
import { Colors } from './colors';

// Centralized font family map so every weight resolves to a real, bundled
// system font instead of the old Avenir/sans-serif mix (Avenir isn't always
// present, and the old Android mix of condensed/thin/light read as flimsy).
const fontFamily = {
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', // Using medium as bold for better Android support
};

export const Typography = StyleSheet.create({
  // Large hero/screen titles
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    color: Colors.text,
    fontFamily: fontFamily.bold,
  },
  // Slightly smaller hero title for stacked/detail screens.
  screenTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: Colors.text,
    fontFamily: fontFamily.bold,
  },
  // Secondary heading, used for the main section headers on a screen.
  heading: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: Colors.text,
    fontFamily: fontFamily.bold,
  },
  // Section header sitting between `heading` and body — groups of cards.
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: Colors.text,
    fontFamily: fontFamily.bold,
  },
  // Title inside a card/panel (replaces the scattered 16/600 inline styles).
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: Colors.text,
    fontFamily: fontFamily.bold,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.textSecondary,
    fontFamily: fontFamily.medium,
    lineHeight: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: Colors.text,
    fontFamily: fontFamily.regular,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    color: Colors.text,
    fontFamily: fontFamily.bold,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.white,
    fontFamily: fontFamily.bold,
  },
  link: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: fontFamily.bold,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textLight,
    fontFamily: fontFamily.medium,
  },
  overline: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.textLight,
    fontFamily: fontFamily.bold,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
    fontFamily: fontFamily.medium,
  },
  // Large emphasized stat number (dashboard / metric cards).
  metricValue: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
    color: Colors.text,
    fontFamily: fontFamily.bold,
  },
  // Compact, bold label used inside chips & badges.
  chipText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: Colors.text,
    fontFamily: fontFamily.bold,
  },
});