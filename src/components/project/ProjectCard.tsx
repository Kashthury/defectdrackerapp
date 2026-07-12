import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing, Shadows } from '../../constants/theme';
import { RiskLevel } from '../../utils/riskUtils';
import { getRiskMeta, withAlpha } from '../../utils/colorUtils';
import { Chip } from '../common/Chip';
import { AnimatedPressable } from '../common/AnimatedPressable';

interface ProjectCardProps {
  project: { id: number; name: string; risk?: RiskLevel };
  onPress: () => void;
  size?: number;
}

const getInitials = (str: string) =>
  str
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .substring(0, 2);

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress, size = 160 }) => {
  const { name, risk = 'low' } = project;
  const meta = getRiskMeta(risk);

  return (
    <AnimatedPressable
      style={[styles.touchable, { width: size }]}
      onPress={onPress}
      accessibilityLabel={`${name}, ${meta.label}`}
    >
      <View style={[styles.card, { borderColor: withAlpha(meta.color, 0.18) }]}>
        {/* risk accent stripe */}
        <View style={[styles.accent, { backgroundColor: meta.color }]} />

        <View style={styles.headerRow}>
          <View style={[styles.avatar, { backgroundColor: withAlpha(meta.color, 0.14) }]}>
            <Text style={[styles.initials, { color: meta.color }]}>{getInitials(name)}</Text>
          </View>
          <View style={[styles.riskDot, { backgroundColor: meta.color }]}>
            <Icon name={meta.icon} size={12} color={Colors.white} />
          </View>
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>

        <View style={styles.footer}>
          <Chip label={meta.label} color={meta.color} size="sm" dot />
        </View>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  touchable: {
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    minHeight: 150,
    overflow: 'hidden',
    ...Shadows.card,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  riskDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    ...Typography.bodyBold,
    fontSize: 15,
    color: Colors.text,
    flex: 1,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ProjectCard;
