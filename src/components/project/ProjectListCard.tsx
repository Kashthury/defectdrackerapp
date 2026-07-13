import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing, Shadows } from '../../constants/theme';
import { withAlpha } from '../../utils/colorUtils';
import { RiskLevel } from '../../utils/riskUtils';
import { Chip } from '../common/Chip';
import RiskBadge from '../common/RiskBadge';
import { AnimatedPressable } from '../common/AnimatedPressable';

export interface ProjectStatusMeta {
  color: string;
  icon: string;
  label: string;
}

/**
 * Single source of truth for how a project status is presented (color + Feather
 * icon + normalized label). Mirrors the backend status set
 * ('Active' | 'On Hold' | 'Completed') and is shared by the card and the
 * screen's status filter chips so they never drift.
 */
export const getStatusMeta = (status?: string): ProjectStatusMeta => {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return { color: Colors.success, icon: 'activity', label: 'Active' };
    case 'on hold':
      return { color: Colors.warning, icon: 'pause-circle', label: 'On Hold' };
    case 'completed':
      return { color: Colors.info, icon: 'check-circle', label: 'Completed' };
    default:
      return { color: Colors.textLight, icon: 'help-circle', label: status || 'Unknown' };
  }
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Compact, locale-independent date like "Jan 5, 2025". */
const formatShort = (value?: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

/**
 * Timeline completion (0–100) derived from how much of the project's scheduled
 * duration has elapsed. Completed projects are always 100%. Returns null when
 * there aren't enough valid dates to compute a meaningful value.
 */
const computeTimeline = (
  start?: string,
  end?: string,
  status?: string,
): number | null => {
  if ((status || '').toLowerCase() === 'completed') return 100;
  if (!start || !end) return null;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e) || e <= s) return null;
  const pct = ((Date.now() - s) / (e - s)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
};

const getInitials = (str: string): string =>
  (str || '')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .substring(0, 2) || '?';

/**
 * Schedule urgency shown in the footer. Reads the remaining days relative to
 * the end date and picks a matching color + icon + label so an overdue or
 * soon-due project is instantly recognizable.
 */
const getScheduleMeta = (
  end?: string,
  status?: string,
): { icon: string; label: string; color: string } | null => {
  if ((status || '').toLowerCase() === 'completed') {
    return { icon: 'check-circle', label: 'Completed', color: Colors.info };
  }
  if (!end) return null;
  const endTime = new Date(end).getTime();
  if (isNaN(endTime)) return null;

  const days = Math.ceil((endTime - Date.now()) / (1000 * 60 * 60 * 24));

  if (days < 0) {
    const overdue = Math.abs(days);
    return {
      icon: 'alert-triangle',
      label: `Overdue ${overdue}d`,
      color: Colors.error,
    };
  }
  if (days === 0) return { icon: 'clock', label: 'Due today', color: Colors.warning };
  if (days <= 7) return { icon: 'clock', label: `${days}d left`, color: Colors.warning };
  return { icon: 'clock', label: `${days} days left`, color: Colors.textSecondary };
};

interface ProjectLike {
  id: number | string;
  name?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  projectManagerName?: string;
}

interface ProjectListCardProps {
  project: ProjectLike;
  /** Resolved risk; undefined while still being assessed. */
  risk?: RiskLevel;
  /** True while the project's risk is still being fetched. */
  riskLoading?: boolean;
  /** Tighter paddings/sizes for very small screens. */
  compact?: boolean;
  onPress: () => void;
}

const ProjectListCardComponent: React.FC<ProjectListCardProps> = ({
  project,
  risk,
  riskLoading = false,
  compact = false,
  onPress,
}) => {
  const name = project.name || 'Unnamed Project';
  const status = getStatusMeta(project.status);
  const timeline = computeTimeline(project.startDate, project.endDate, project.status);
  const schedule = getScheduleMeta(project.endDate, project.status);
  const startLabel = formatShort(project.startDate);
  const endLabel = formatShort(project.endDate);
  const dateRange =
    startLabel && endLabel
      ? `${startLabel}  –  ${endLabel}`
      : startLabel || endLabel || 'No dates set';

  const avatarSize = compact ? 40 : 46;

  return (
    <AnimatedPressable
      style={styles.touchable}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, status ${status.label}`}
    >
      <View style={styles.card}>
        {/* Status accent strip along the top edge */}
        <View style={[styles.accent, { backgroundColor: status.color }]} />

        {/* Header: avatar + name/manager + status chip */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                backgroundColor: withAlpha(Colors.primary, 0.1),
                borderColor: withAlpha(Colors.primary, 0.18),
              },
            ]}
          >
            <Text style={styles.initials}>{getInitials(name)}</Text>
          </View>

          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.managerRow}>
              <Icon
                name={project.projectManagerName ? 'user' : 'hash'}
                size={12}
                color={Colors.textLight}
              />
              <Text style={styles.managerText} numberOfLines={1}>
                {project.projectManagerName || `Project #${project.id}`}
              </Text>
            </View>
          </View>

          <Chip
            label={status.label}
            color={status.color}
            icon={status.icon}
            variant="soft"
            size="sm"
          />
        </View>

        {/* Timeline progress */}
        {timeline !== null && (
          <View style={styles.progressBlock}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Timeline</Text>
              <Text style={[styles.progressValue, { color: status.color }]}>
                {timeline}%
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.max(timeline, 2)}%`,
                    backgroundColor: status.color,
                  },
                ]}
              />
            </View>
          </View>
        )}

        <View style={styles.divider} />

        {/* Footer: dates + schedule + risk */}
        <View style={styles.metaRow}>
          <Icon name="calendar" size={13} color={Colors.textLight} />
          <Text style={styles.metaText} numberOfLines={1}>
            {dateRange}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            <RiskBadge
              risk={risk ?? 'low'}
              loading={riskLoading || risk === undefined}
              variant="soft"
              size="sm"
            />
            {schedule && (
              <View style={styles.scheduleItem}>
                <Icon name={schedule.icon} size={13} color={schedule.color} />
                <Text style={[styles.scheduleText, { color: schedule.color }]} numberOfLines={1}>
                  {schedule.label}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.openButton}>
            <Icon name="chevron-right" size={20} color={Colors.primary} />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
};

/**
 * Elegant, self-contained project card for the Projects list. Only re-renders
 * when its meaningful data (project identity, resolved risk, loading/compact
 * flags) changes so scrolling a long list stays smooth. `onPress` is
 * intentionally excluded — the list recreates that closure every render, but
 * the captured project reference is stable, so ignoring it avoids re-rendering
 * every visible row whenever any single project's risk resolves.
 */
export const ProjectListCard = React.memo(
  ProjectListCardComponent,
  (prev, next) =>
    prev.project === next.project &&
    prev.risk === next.risk &&
    prev.riskLoading === next.riskLoading &&
    prev.compact === next.compact,
);

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    paddingTop: Spacing.lg + 2,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  initials: {
    ...Typography.bodyBold,
    fontSize: 16,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  headerText: {
    flex: 1,
  },
  name: {
    ...Typography.cardTitle,
    fontSize: 16.5,
  },
  managerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 3,
  },
  managerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  progressBlock: {
    marginTop: Spacing.lg,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    ...Typography.overline,
    color: Colors.textSecondary,
  },
  progressValue: {
    ...Typography.chipText,
    fontSize: 13,
  },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.backgroundAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  footerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scheduleText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  openButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: withAlpha(Colors.primary, 0.1),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProjectListCard;
