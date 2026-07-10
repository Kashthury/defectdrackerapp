import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { TestCase } from '../../types/testCase';

interface TestCaseCardProps {
  testCase: TestCase;
  isMyTestCase: boolean;
  onReassign: (testCase: TestCase) => void;
}

export const TestCaseCard: React.FC<TestCaseCardProps> = ({
  testCase,
  isMyTestCase,
  onReassign,
}) => {
  if (!testCase) return null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.testCaseNo}>{testCase.testCaseNo}</Text>
          <Text style={styles.typeText}>{testCase.testCaseTypeName}</Text>
        </View>
        <View style={styles.headerRight}>
          {testCase.executionStatusName && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: (testCase.executionStatusColor || Colors.primary) + '15' },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: testCase.executionStatusColor || Colors.primary }]} />
              <Text
                style={[
                  styles.statusText,
                  { color: testCase.executionStatusColor || Colors.primary },
                ]}
              >
                {testCase.executionStatusName}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.description} numberOfLines={3}>{testCase.description}</Text>

      <View style={styles.metaRow}>
         <Icon name="layers" size={14} color={Colors.textLight} />
         <Text style={styles.metaText}>{testCase.moduleName}</Text>
         {testCase.subModuleName ? (
           <>
             <Icon name="chevron-right" size={12} color={Colors.textLight} style={{ marginHorizontal: 2 }} />
             <Text style={styles.metaText}>{testCase.subModuleName}</Text>
           </>
         ) : null}
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Severity</Text>
          <View style={[styles.miniBadge, { backgroundColor: Colors.error + '10' }]}>
            <Text style={[styles.gridValue, { color: Colors.error }]}>{testCase.severityName}</Text>
          </View>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.gridLabel}>Priority</Text>
          <View style={[styles.miniBadge, { backgroundColor: Colors.warning + '10' }]}>
            <Text style={[styles.gridValue, { color: Colors.warning }]}>{testCase.priorityName}</Text>
          </View>
        </View>
        {testCase.defectNo ? (
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Linked Defect</Text>
            <Text style={[styles.gridValueText, { color: Colors.error }]}>{testCase.defectNo}</Text>
          </View>
        ) : null}
        {!isMyTestCase && (
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Assigned To</Text>
            <Text style={styles.gridValueText}>{testCase.assignedToName}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.releaseContainer}>
          <Icon name="package" size={14} color={Colors.textSecondary} />
          <Text style={styles.releaseText}>{testCase.releaseName}</Text>
        </View>
        <TouchableOpacity style={styles.reassignBtn} onPress={() => onReassign(testCase)}>
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
  testCaseNo: {
    ...Typography.heading,
    fontSize: 18,
    color: Colors.primary,
  },
  typeText: {
    ...Typography.overline,
    fontSize: 10,
    marginTop: 2,
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
