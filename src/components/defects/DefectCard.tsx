import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing, Shadows } from '../../constants/theme';
import { Defect, StatusTransition } from '../../types/defect';
import Dropdown from '../common/Dropdown';
import { Chip } from '../common/Chip';
import { FadeInView } from '../common/FadeInView';
import { AnimatedPressable } from '../common/AnimatedPressable';
import { resolveChipColor } from '../../utils/colorUtils';
import { getNextStatuses } from '../../services/defectService';
import { usePermission } from '../../context/PermissionContext';

interface DefectCardProps {
  defect: Defect;
  isMyDefect: boolean;
  onStatusChange: (defect: Defect, targetStatus: any) => Promise<void>;
  onReassign: (defect: Defect) => void;
  /** id -> backend color lookups so chips use the real severity/priority/status hues. */
  severityColorMap?: Record<string, string>;
  priorityColorMap?: Record<string, string>;
  statusColorMap?: Record<string, string>;
  /** List index, used to stagger the entrance animation. */
  index?: number;
}

export const DefectCard: React.FC<DefectCardProps> = ({
  defect,
  isMyDefect,
  onStatusChange,
  onReassign,
  severityColorMap,
  priorityColorMap,
  statusColorMap,
  index = 0,
}) => {
  const { can } = usePermission();
  const [nextStatuses, setNextStatuses] = useState<StatusTransition[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Only fetch/allow status transitions when the user can change status.
  const canChangeStatus = isMyDefect && can.defect.statusUpdate;

  useEffect(() => {
    if (canChangeStatus && defect?.statusId) {
      fetchNextStatuses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defect?.statusId, canChangeStatus]);

  const fetchNextStatuses = async () => {
    if (!defect?.statusId) return;
    try {
      const response = await getNextStatuses(defect.statusId);
      const data = response.data?.data || response.data || [];
      setNextStatuses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.warn(`⚠️ Failed to fetch next statuses for ${defect.defectNo}:`, error.message);
    }
  };

  if (!defect) return null;

  // Status color is backend-driven (Status Type config) and resolved the same
  // way as severity/priority, so both the My Defects and All Defects tabs show
  // an identical status badge color instead of a hardcoded fallback.
  const statusColor = resolveChipColor(
    defect.statusColor ?? statusColorMap?.[String(defect.statusId)],
    defect.statusName,
  );

  const statusItems = [
    { label: defect.statusName || 'Unknown', value: defect.statusId, color: statusColor },
    ...nextStatuses
      .filter(s => s.toStatus && s.toStatus.id !== defect.statusId)
      .map(s => ({
        label: s.toStatus.name,
        value: s.toStatus.id,
        color: resolveChipColor(
          s.toStatus.color ?? statusColorMap?.[String(s.toStatus.id)],
          s.toStatus.name,
        ),
      }))
  ];

  const handleStatusSelect = async (val: string | number) => {
    if (val === defect.statusId) return;
    const transition = nextStatuses.find(s => s.toStatus.id === val);
    if (!transition) return;
    setLoadingStatus(true);
    try {
      await onStatusChange(defect, transition.toStatus);
    } finally {
      setLoadingStatus(false);
    }
  };

  const severityColor = resolveChipColor(
    defect.severityColor ?? severityColorMap?.[String(defect.severityId)],
    defect.severityName,
  );
  const priorityColor = resolveChipColor(
    defect.priorityColor ?? priorityColorMap?.[String(defect.priorityId)],
    defect.priorityName,
  );

  return (
    <FadeInView delay={(index % 12) * 55} style={styles.wrapper}>
      <View style={[styles.card, { borderLeftColor: severityColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.defectNo}>{defect.defectNo}</Text>
            <Text style={styles.typeText}>{defect.defectTypeName}</Text>
          </View>
          <View style={styles.headerRight}>
            {canChangeStatus ? (
              // DEFECT_STATUS_CHANGE controls the status-change dropdown.
              <Dropdown
                items={statusItems}
                selectedValue={defect.statusId}
                onSelect={handleStatusSelect}
                placeholder="Status"
                style={styles.statusDropdown}
                disabled={loadingStatus}
              />
            ) : (
              <Chip
                label={defect.statusName || 'No Status'}
                color={statusColor}
                dot
                size="md"
                uppercase
              />
            )}
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>{defect.description}</Text>

        <View style={styles.metaRow}>
          <Icon name="layers" size={13} color={Colors.textLight} />
          <Text style={styles.metaText}>{defect.moduleName}</Text>
          <Icon name="chevron-right" size={12} color={Colors.textLight} style={styles.metaChevron} />
          <Text style={styles.metaText}>{defect.subModuleName || 'Default'}</Text>
        </View>

        <View style={styles.chipsRow}>
          <View style={styles.chipGroup}>
            <Text style={styles.chipLabel}>Severity</Text>
            <Chip label={defect.severityName || '—'} color={severityColor} dot size="md" />
          </View>
          <View style={styles.chipGroup}>
            <Text style={styles.chipLabel}>Priority</Text>
            <Chip label={defect.priorityName || '—'} color={priorityColor} dot size="md" />
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Entered By</Text>
            <Text style={styles.gridValueText} numberOfLines={1}>{defect.createdByName}</Text>
          </View>
          {!isMyDefect && (
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Assigned To</Text>
              <Text style={styles.gridValueText} numberOfLines={1}>{defect.assignedToName}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.releaseContainer}>
            <Icon name="package" size={14} color={Colors.textSecondary} />
            <Text style={styles.releaseText} numberOfLines={1}>{defect.releaseName}</Text>
          </View>
          {/* DEFECT_ASSIGN_DEVELOPER controls the reassign action. */}
          {can.defect.reassign && (
            <AnimatedPressable style={styles.reassignBtn} onPress={() => onReassign(defect)}>
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
  defectNo: {
    ...Typography.cardTitle,
    fontSize: 18,
    color: Colors.primary,
  },
  typeText: {
    ...Typography.overline,
    fontSize: 10,
    marginTop: 3,
  },
  statusDropdown: {
    minWidth: 128,
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
