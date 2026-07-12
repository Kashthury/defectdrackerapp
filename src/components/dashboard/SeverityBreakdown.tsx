import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { PieChart } from 'react-native-chart-kit';
import { Modal } from '../common/Modal';
import { Chip } from '../common/Chip';
import { AnimatedPressable } from '../common/AnimatedPressable';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing, Shadows } from '../../constants/theme';
import { resolveChipColor, withAlpha } from '../../utils/colorUtils';

const { width: screenWidth } = Dimensions.get('window');

interface SeverityBreakdownProps {
  data: any;
}

const SeverityBreakdown: React.FC<SeverityBreakdownProps> = ({ data }) => {
  const scrollRef = useRef<ScrollView>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<any>(null);
  const [cardWidth, setCardWidth] = useState(280);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!data || !data.data) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>No severity data available</Text>
      </View>
    );
  }

  const { totalRemark, totalDefects, severities } = data.data;

  if (!severities || severities.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>No severity data available</Text>
      </View>
    );
  }

  const sortedSeverities = [...severities].sort((a, b) => b.severityId - a.severityId);

  const scrollToIndex = (index: number) => {
    const offset = index * (cardWidth + Spacing.lg);
    scrollRef.current?.scrollTo({ x: offset, animated: true });
    setCurrentIndex(index);
  };

  const scrollLeft = () => {
    if (currentIndex > 0) scrollToIndex(currentIndex - 1);
  };

  const scrollRight = () => {
    if (currentIndex < sortedSeverities.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  const onCardLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) setCardWidth(width);
  };

  const openChartModal = (severity: any) => {
    setSelectedSeverity(severity);
    setModalVisible(true);
  };

  const getChartData = (severity: any) => {
    const statusCounts = severity.statusCounts || {};
    const entries = Object.entries(statusCounts) as [string, number][];
    const filtered = entries.filter(([, count]) => count > 0);
    if (filtered.length === 0) {
      return [{ name: 'No Data', count: 0, color: '#e2e8f0' }];
    }
    const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#22c55e', '#8b5cf6', '#ec4899'];
    return filtered.map(([status, count], idx) => ({
      name: status,
      count,
      color: colors[idx % colors.length],
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name="layers" size={16} color={Colors.textSecondary} />
          <Text style={styles.title}>Defect Severity Breakdown</Text>
        </View>
        <View style={styles.totalBadges}>
          <Chip label={`Remarks: ${totalRemark || 0}`} color={Colors.info} size="md" icon="message-square" />
          <Chip label={`Defects: ${totalDefects || 0}`} color={Colors.error} size="md" icon="alert-circle" />
        </View>
      </View>

      <View style={styles.scrollWrapper}>
        <AnimatedPressable onPress={scrollLeft} style={styles.scrollButton}>
          <Icon name="chevron-left" size={22} color={Colors.textSecondary} />
        </AnimatedPressable>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onMomentumScrollEnd={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / (cardWidth + Spacing.lg));
            setCurrentIndex(Math.min(index, sortedSeverities.length - 1));
          }}
        >
          {sortedSeverities.map((severity) => {
            const statusCounts = severity.statusCounts || {};
            const totalForSeverity = severity.totalDefects || 0;
            const color = resolveChipColor(severity.severityColor, severity.severityName);
            const displayName = severity.severityName || 'Unknown';
            const statusEntries = (Object.entries(statusCounts) as [string, number][]).sort((a, b) =>
              a[0].localeCompare(b[0]),
            );

            const half = Math.ceil(statusEntries.length / 2);
            const firstHalf = statusEntries.slice(0, half);
            const secondHalf = statusEntries.slice(half);

            return (
              <View
                key={severity.severityId || displayName}
                style={[styles.card, { borderLeftColor: color }]}
                onLayout={onCardLayout}
              >
                <Text style={[styles.severityLabel, { color }]}>Defects on {displayName}</Text>
                <View style={styles.severityTotal}>
                  <Chip label={`Total: ${totalForSeverity}`} color={color} size="sm" dot />
                </View>

                <View style={styles.statusGrid}>
                  <View style={styles.statusColumn}>
                    {firstHalf.map(([status, count]) => (
                      <View key={status} style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: color }]} />
                        <Text style={styles.statusName} numberOfLines={1}>{status}</Text>
                        <Text style={styles.statusCount}>{count}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.statusColumn}>
                    {secondHalf.map(([status, count]) => (
                      <View key={status} style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: color }]} />
                        <Text style={styles.statusName} numberOfLines={1}>{status}</Text>
                        <Text style={styles.statusCount}>{count}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <AnimatedPressable
                  style={[styles.viewChartButton, { backgroundColor: withAlpha(color, 0.12) }]}
                  onPress={() => openChartModal(severity)}
                >
                  <Icon name="pie-chart" size={13} color={color} />
                  <Text style={[styles.viewChartText, { color }]}>View Chart</Text>
                </AnimatedPressable>
              </View>
            );
          })}
        </ScrollView>

        <AnimatedPressable onPress={scrollRight} style={styles.scrollButton}>
          <Icon name="chevron-right" size={22} color={Colors.textSecondary} />
        </AnimatedPressable>
      </View>

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={`Status Breakdown for ${selectedSeverity?.severityName || ''}`}
      >
        {selectedSeverity && (
          <View style={styles.modalContent}>
            <Text style={styles.modalTotal}>Total Defect: {selectedSeverity.totalDefects || 0}</Text>
            <PieChart
              data={getChartData(selectedSeverity)}
              width={screenWidth - 80}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
            />
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: Spacing.lg },
  header: { marginBottom: Spacing.md },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  title: { ...Typography.sectionTitle },
  totalBadges: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },

  scrollWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.xs,
    ...Shadows.soft,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingVertical: Spacing.xs, paddingHorizontal: 2 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginRight: Spacing.lg,
    minWidth: 280,
    maxWidth: 360,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 6,
    ...Shadows.card,
  },
  severityLabel: { ...Typography.cardTitle, fontSize: 16, marginBottom: Spacing.sm },
  severityTotal: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },

  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.xs,
  },
  statusColumn: {
    flex: 1,
    paddingRight: 7,
    marginHorizontal: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  statusCount: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 24,
    textAlign: 'right',
  },

  viewChartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.pill,
  },
  viewChartText: { ...Typography.chipText, fontSize: 12 },

  noData: { ...Typography.subtitle, fontSize: 14, color: Colors.textLight, textAlign: 'center', paddingVertical: Spacing.xl },

  modalContent: { alignItems: 'center', paddingVertical: Spacing.md },
  modalTotal: { ...Typography.cardTitle, marginBottom: Spacing.md },
});

export default SeverityBreakdown;
