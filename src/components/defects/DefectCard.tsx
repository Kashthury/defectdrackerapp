import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Defect, StatusTransition } from '../../types/defect';
import Dropdown from '../common/Dropdown';
import { getNextStatuses } from '../../services/defectService';

interface DefectCardProps {
  defect: Defect;
  isMyDefect: boolean;
  onStatusChange: (defect: Defect, targetStatus: any) => Promise<void>;
  onReassign: (defect: Defect) => void;
}

export const DefectCard: React.FC<DefectCardProps> = ({
  defect,
  isMyDefect,
  onStatusChange,
  onReassign,
}) => {
  const [nextStatuses, setNextStatuses] = useState<StatusTransition[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(false);

  useEffect(() => {
    if (isMyDefect && defect?.statusId) {
      fetchNextStatuses();
    }
  }, [defect?.statusId, isMyDefect]);

  const fetchNextStatuses = async () => {
    if (!defect?.statusId) return;
    try {
      console.log(`📡 Fetching next statuses for ${defect.defectNo}, statusId: ${defect.statusId}`);
      const response = await getNextStatuses(defect.statusId);
      const data = response.data?.data || response.data || [];
      console.log(`✅ Next statuses for ${defect.defectNo}:`, JSON.stringify(data));
      setNextStatuses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.warn(`⚠️ Failed to fetch next statuses for ${defect.defectNo}:`, error.message);
    }
  };

  if (!defect) return null;

  const statusItems = [
    { label: defect.statusName || 'Unknown', value: defect.statusId, color: defect.statusColor || '#64748b' },
    ...nextStatuses
      .filter(s => s.toStatus && s.toStatus.id !== defect.statusId)
      .map(s => ({
        label: s.toStatus.name,
        value: s.toStatus.id,
        color: s.toStatus.color || Colors.primary
      }))
  ];

 const handleStatusSelect = async (val: string | number) => {
   if (val === defect.statusId) return;

   const transition = nextStatuses.find(
     s => s.toStatus.id === val
   );

   if (!transition) return;

   setLoadingStatus(true);

   try {
     await onStatusChange(defect, transition.toStatus);
   } finally {
     setLoadingStatus(false);
   }
 };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.defectNo}>{defect.defectNo}</Text>
          <Text style={styles.typeText}>{defect.defectTypeName}</Text>
        </View>
        <View style={styles.headerRight}>
          {isMyDefect ? (
            <Dropdown
              items={statusItems}
              selectedValue={defect.statusId}
              onSelect={handleStatusSelect}
              placeholder="Status"
              style={styles.statusDropdown}
              disabled={loadingStatus}
            />
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: (defect.statusColor || Colors.primary) + '15' }]}>
              <View style={[styles.dot, { backgroundColor: defect.statusColor || Colors.primary }]} />
              <Text style={[styles.statusText, { color: defect.statusColor || Colors.primary }]}>
                {defect.statusName || 'No Status'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.description} numberOfLines={3}>{defect.description}</Text>

      <View style={styles.metaRow}>
         <Icon name="layers" size={14} color={Colors.textLight} />
         <Text style={styles.metaText}>{defect.moduleName}</Text>
         <Icon name="chevron-right" size={12} color={Colors.textLight} style={{ marginHorizontal: 2 }} />
         <Text style={styles.metaText}>{defect.subModuleName || 'Default'}</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Severity</Text>
          <View style={[styles.miniBadge, { backgroundColor: Colors.error + '10' }]}>
            <Text style={[styles.gridValue, { color: Colors.error }]}>{defect.severityName}</Text>
          </View>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Priority</Text>
          <View style={[styles.miniBadge, { backgroundColor: Colors.warning + '10' }]}>
            <Text style={[styles.gridValue, { color: Colors.warning }]}>{defect.priorityName}</Text>
          </View>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Entered By</Text>
          <Text style={styles.gridValueText}>{defect.createdByName}</Text>
        </View>
        {!isMyDefect && (
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Assigned To</Text>
            <Text style={styles.gridValueText}>{defect.assignedToName}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.releaseContainer}>
          <Icon name="package" size={14} color={Colors.textSecondary} />
          <Text style={styles.releaseText}>{defect.releaseName}</Text>
        </View>
        <TouchableOpacity style={styles.reassignBtn} onPress={() => onReassign(defect)}>
          <Icon name="user-plus" size={16} color={Colors.primary} />
          <Text style={styles.reassignText}>Reassign</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  defectNo: {
    ...Typography.heading,
    fontSize: 18,
    color: Colors.primary,
  },
  typeText: {
    ...Typography.overline,
    fontSize: 10,
    marginTop: 2,
  },
  statusDropdown: {
    minWidth: 120,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    ...Typography.label,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  description: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  metaText: {
    ...Typography.caption,
    marginLeft: 4,
    color: Colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
  },
  gridLabel: {
    ...Typography.overline,
    fontSize: 9,
    color: Colors.textLight,
    marginBottom: 4,
  },
  gridValue: {
    ...Typography.label,
    fontSize: 12,
  },
  gridValueText: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Colors.text,
  },
  miniBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  releaseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  releaseText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  reassignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.primarySoft,
  },
  reassignText: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.primary,
  },
});
