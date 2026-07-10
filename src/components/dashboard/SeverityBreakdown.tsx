import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { PieChart } from 'react-native-chart-kit';
import { Modal } from '../common/Modal';

const { width: screenWidth } = Dimensions.get('window');

interface SeverityBreakdownProps {
  data: any;
}

const SeverityBreakdown: React.FC<SeverityBreakdownProps> = ({ data }) => {
  // All hooks at the top – unconditional
  const scrollRef = useRef<ScrollView>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<any>(null);
  const [cardWidth, setCardWidth] = useState(280);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Early returns after hooks (safe)
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

  // Sort by severityId descending (higher weight first)
  const sortedSeverities = [...severities].sort((a, b) => b.severityId - a.severityId);

  // --- Scroll helpers ---
  const scrollToIndex = (index: number) => {
    const offset = index * (cardWidth + 16);
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

  // --- Chart modal ---
  const openChartModal = (severity: any) => {
    setSelectedSeverity(severity);
    setModalVisible(true);
  };

  const getChartData = (severity: any) => {
    const statusCounts = severity.statusCounts || {};
    const entries = Object.entries(statusCounts);
    const filtered = entries.filter(([_, count]) => count > 0);
    if (filtered.length === 0) {
      return [{ name: 'No Data', count: 0, color: '#e2e8f0' }];
    }
    const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#22c55e', '#8b5cf6', '#ec4899'];
    return filtered.map(([status, count], idx) => ({
      name: status,
      count: count as number,
      color: colors[idx % colors.length],
    }));
  };

  return (
    <View style={styles.container}>
      {/* Header with totals */}
      <View style={styles.header}>
        <Text style={styles.title}>Defect Severity Breakdown</Text>
        <View style={styles.totalBadges}>
          <View style={[styles.badge, styles.remarkBadge]}>
            <Text style={styles.badgeText}>Total Remark: {totalRemark || 0}</Text>
          </View>
          <View style={[styles.badge, styles.defectBadge]}>
            <Text style={styles.badgeText}>Total Defect: {totalDefects || 0}</Text>
          </View>
        </View>
      </View>

      {/* Scrollable cards */}
      <View style={styles.scrollWrapper}>
        <TouchableOpacity onPress={scrollLeft} style={styles.scrollButton}>
          <Icon name="chevron-left" size={24} color="#4a5568" />
        </TouchableOpacity>

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onMomentumScrollEnd={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / (cardWidth + 16));
            setCurrentIndex(Math.min(index, sortedSeverities.length - 1));
          }}
        >
          {sortedSeverities.map((severity) => {
            const statusCounts = severity.statusCounts || {};
            const totalForSeverity = severity.totalDefects || 0;
            const color = severity.severityColor || '#6B7280';
            const displayName = severity.severityName || 'Unknown';
            const statusEntries = Object.entries(statusCounts).sort((a, b) =>
              a[0].localeCompare(b[0])
            );

            // Split into two columns
            const half = Math.ceil(statusEntries.length / 2);
            const firstHalf = statusEntries.slice(0, half);
            const secondHalf = statusEntries.slice(half);

            return (
              <View
                key={severity.severityId || displayName}
                style={[styles.card, { borderLeftColor: color }]}
                onLayout={onCardLayout}
              >
                <Text style={[styles.severityLabel, { color }]}>
                  Defects on {displayName}
                </Text>
                <View style={styles.totalDefectBadge}>
                  <Text style={styles.totalDefectText}>
                    Total Defect: {totalForSeverity}
                  </Text>
                </View>

                {/* Two‑column grid */}
                <View style={styles.statusGrid}>
                  <View style={styles.statusColumn}>
                    {firstHalf.map(([status, count]) => (
                      <View key={status} style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: color }]} />
                        <Text style={styles.statusName}>{status}</Text>
                        <Text style={styles.statusCount}>{count}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.statusColumn}>
                    {secondHalf.map(([status, count]) => (
                      <View key={status} style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: color }]} />
                        <Text style={styles.statusName}>{status}</Text>
                        <Text style={styles.statusCount}>{count}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewChartButton}
                  onPress={() => openChartModal(severity)}
                >
                  <Text style={styles.viewChartText}>View Chart</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>

        <TouchableOpacity onPress={scrollRight} style={styles.scrollButton}>
          <Icon name="chevron-right" size={24} color="#4a5568" />
        </TouchableOpacity>
      </View>

      {/* Modal with Pie Chart */}
      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={`Status Breakdown for ${selectedSeverity?.severityName || ''}`}
      >
        {selectedSeverity && (
          <View style={styles.modalContent}>
            <Text style={styles.modalTotal}>
              Total Defect: {selectedSeverity.totalDefects || 0}
            </Text>
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
  container: { marginVertical: 16 },
  header: { marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 6 },
  totalBadges: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  remarkBadge: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  defectBadge: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  badgeText: { fontSize: 14, fontWeight: '600' },

  scrollWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollButton: {
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 4,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingVertical: 4, paddingHorizontal: 2 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    minWidth: 280,
    maxWidth: 360,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  severityLabel: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  totalDefectBadge: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  totalDefectText: { fontSize: 12, fontWeight: '600', color: '#b91c1c' },

  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  statusColumn: {
    flex: 1,
    paddingRight: 7,
    marginHorizontal: 8,
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
    marginRight: 8,
  },
  statusName: {
    fontSize: 13,
    color: '#1e293b',
    flex: 1,
  },
  statusCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    minWidth: 24,
    textAlign: 'right',
  },

  viewChartButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  viewChartText: { color: '#2563eb', fontSize: 12, fontWeight: '500' },

  noData: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingVertical: 20 },

  modalContent: { alignItems: 'center', paddingVertical: 12 },
  modalTotal: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
});

export default SeverityBreakdown;