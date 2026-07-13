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
import { resolveChipColor } from '../../utils/colorUtils';

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
              <Chip
                label={testCase.executionStatusName}
                color={testCase.executionStatusColor || Colors.primary}
                dot
                size="md"
                uppercase
              />
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
          <View style={styles.chipGroup}>
            <Text style={styles.chipLabel}>Priority</Text>
            <Chip label={testCase.priorityName || '—'} color={priorityColor} dot size="md" />
          </View>
        </View>

        <View style={styles.grid}>
          {testCase.defectNo ? (
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Linked Defect</Text>
              <Text style={[styles.gridValueText, { color: Colors.error }]} numberOfLines={1}>
                {testCase.defectNo}
              </Text>
            </View>
          ) : null}
          {!isMyTestCase && (
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Assigned To</Text>
              <Text style={styles.gridValueText} numberOfLines={1}>{testCase.assignedToName}</Text>
            </View>
          )}
        </View>

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
