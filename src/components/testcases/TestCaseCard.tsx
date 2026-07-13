import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing, Shadows } from '../../constants/theme';
import { TestCase } from '../../types/testCase';
import { Chip } from '../common/Chip';
import { FadeInView } from '../common/FadeInView';
import { AnimatedPressable } from '../common/AnimatedPressable';
import { resolveChipColor, withAlpha } from '../../utils/colorUtils';

/**
 * Maps a backend execution-status label to a semantic Feather icon so the
 * status badge reads at a glance (check = passed, x = failed, etc.). Falls back
 * to a neutral icon for custom/unknown statuses.
 */
const getExecutionStatusIcon = (name?: string): string => {
  const key = (name || '').toLowerCase().trim();
  if (!key) return 'help-circle';
  if (key.includes('pass')) return 'check-circle';
  if (key.includes('fail')) return 'x-circle';
  if (key.includes('block')) return 'slash';
  if (key.includes('skip')) return 'skip-forward';
  if (key.includes('retest') || key.includes('reopen')) return 'refresh-cw';
  if (key.includes('progress') || key.includes('running')) return 'loader';
  if (key.includes('not') || key.includes('pending') || key.includes('todo') || key.includes('unexecut')) {
    return 'circle';
  }
  return 'activity';
};

/**
 * Hard-coded color scheme for execution statuses. The backend status color is
 * unreliable (it frequently arrives as a generic gray), so the badge derives
 * its color from the status name instead — green = passed, red = failed, amber =
 * blocked, etc. — for a consistent, meaningful look across the app.
 */
const getExecutionStatusColor = (name?: string): string => {
  const key = (name || '').toLowerCase().trim();
  if (key.includes('pass')) return '#16A34A'; // green — passed
  if (key.includes('fail')) return '#DC2626'; // red — failed
  if (key.includes('block')) return '#D97706'; // amber — blocked
  if (key.includes('progress') || key.includes('running')) return '#0284C7'; // sky — in progress
  if (key.includes('retest') || key.includes('reopen')) return '#7C3AED'; // violet — retest
  if (key.includes('skip')) return '#0D9488'; // teal — skipped
  return '#64748B'; // slate — not executed / pending / unknown
};

/**
 * Polished execution-status badge: an icon-led pill sitting on a soft tint of
 * the status color with a hairline border. It reuses the app's chip/RiskBadge
 * language (pill shape, Feather icon) while standing out as the card's primary
 * status indicator. Both the icon and color are derived from the status name
 * (hard-coded), so it stays meaningful regardless of the backend color.
 */
const StatusBadge: React.FC<{ label: string }> = ({ label }) => {
  const color = getExecutionStatusColor(label);
  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: withAlpha(color, 0.13), borderColor: withAlpha(color, 0.3) },
      ]}
    >
      <Icon name={getExecutionStatusIcon(label)} size={13} color={color} />
      <Text style={[styles.statusText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

interface TestCaseCardProps {
  testCase: TestCase;
  isMyTestCase: boolean;
  /**
   * Whether the current user may reassign this test case. Decided by the parent
   * screen from permissions (assign / update / create) so the button visibility
   * and the reassign handler guard always agree.
   */
  canReassign?: boolean;
  onReassign: (testCase: TestCase) => void;
  severityColorMap?: Record<string, string>;
  priorityColorMap?: Record<string, string>;
  index?: number;
}

export const TestCaseCard: React.FC<TestCaseCardProps> = ({
  testCase,
  isMyTestCase,
  canReassign = false,
  onReassign,
  severityColorMap,
  priorityColorMap,
  index = 0,
}) => {
  if (!testCase) return null;

  const severityColor = resolveChipColor(
    testCase.severityColor ?? severityColorMap?.[String(testCase.severityId)],
    testCase.severityName,
  );
  const priorityColor = resolveChipColor(
    testCase.priorityColor ?? priorityColorMap?.[String(testCase.priorityId)],
    testCase.priorityName,
  );

  // Defect No and Priority are only meaningful once the test case is linked to a
  // real defect, so they are surfaced together and hidden together otherwise.
  const rawDefectNo = testCase.defectNo != null ? String(testCase.defectNo).trim() : '';
  const hasLinkedDefect =
    rawDefectNo.length > 0 && rawDefectNo !== '0' && rawDefectNo !== '-';

  // "Assigned To" is shown for test cases that aren't mine.
  const showAssignedTo = !isMyTestCase;

  return (
    <FadeInView delay={(index % 12) * 55} style={styles.wrapper}>
      <View style={[styles.card, { borderLeftColor: severityColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.testCaseNo}>{testCase.testCaseNo}</Text>
            <Text style={styles.typeText}>{testCase.testCaseTypeName}</Text>
          </View>
          <View style={styles.headerRight}>
            {testCase.executionStatusName ? (
              <StatusBadge label={testCase.executionStatusName} />
            ) : null}
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>{testCase.description}</Text>

        <View style={styles.metaRow}>
          <Icon name="layers" size={13} color={Colors.textLight} />
          <Text style={styles.metaText}>{testCase.moduleName}</Text>
          {testCase.subModuleName ? (
            <>
              <Icon name="chevron-right" size={12} color={Colors.textLight} style={styles.metaChevron} />
              <Text style={styles.metaText}>{testCase.subModuleName}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.chipsRow}>
          <View style={styles.chipGroup}>
            <Text style={styles.chipLabel}>Severity</Text>
            <Chip label={testCase.severityName || '—'} color={severityColor} dot size="md" />
          </View>
          {hasLinkedDefect ? (
            /* Priority is only surfaced alongside a linked defect. */
            <View style={styles.chipGroup}>
              <Text style={styles.chipLabel}>Priority</Text>
              <Chip label={testCase.priorityName || '—'} color={priorityColor} dot size="md" />
            </View>
          ) : showAssignedTo ? (
            /* With no Priority to show, pull "Assigned To" up into the free
               second column (flexible) so the row isn't left half-empty. */
            <View style={[styles.chipGroup, styles.chipGroupFlex]}>
              <Text style={styles.chipLabel}>Assigned To</Text>
              <Text style={styles.gridValueText} numberOfLines={1}>{testCase.assignedToName}</Text>
            </View>
          ) : null}
        </View>

        {hasLinkedDefect && (
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Defect No</Text>
              <View style={styles.defectValueRow}>
                <Icon name="link" size={12} color={Colors.error} />
                <Text style={[styles.gridValueText, { color: Colors.error }]} numberOfLines={1}>
                  {rawDefectNo}
                </Text>
              </View>
            </View>
            {showAssignedTo && (
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Assigned To</Text>
                <Text style={styles.gridValueText} numberOfLines={1}>{testCase.assignedToName}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.releaseContainer}>
            <Icon name="package" size={14} color={Colors.textSecondary} />
            <Text style={styles.releaseText} numberOfLines={1}>{testCase.releaseName}</Text>
          </View>
          {/* Reassign is shown to assign / update / create users (decided by the
              parent screen and passed down as `canReassign`). */}
          {canReassign && (
            <AnimatedPressable style={styles.reassignBtn} onPress={() => onReassign(testCase)}>
              <Icon name="user-plus" size={15} color={Colors.primary} />
              <Text style={styles.reassignText}>Reassign</Text>
            </AnimatedPressable>
          )}
        </View>
      </View>
    </FadeInView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  headerRight: {
    marginLeft: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: 150,
  },
  statusText: {
    ...Typography.chipText,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  testCaseNo: {
    ...Typography.cardTitle,
    fontSize: 18,
    color: Colors.primary,
  },
  typeText: {
    ...Typography.overline,
    fontSize: 10,
    marginTop: 3,
  },
  description: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
    gap: 3,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  metaChevron: {
    marginHorizontal: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  chipGroup: {
    gap: Spacing.xs,
  },
  chipGroupFlex: {
    flex: 1,
  },
  chipLabel: {
    ...Typography.overline,
    fontSize: 9,
    color: Colors.textLight,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
  },
  gridLabel: {
    ...Typography.overline,
    fontSize: 9,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  gridValueText: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Colors.text,
  },
  defectValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  releaseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  releaseText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  reassignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
  },
  reassignText: {
    ...Typography.label,
    fontSize: 12,
    textTransform: 'none',
    color: Colors.primary,
  },
});
