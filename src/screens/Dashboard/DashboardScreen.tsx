import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { getUserProjects, getProjectRisk } from '../../services/projectService';
import { ProjectCard } from '../../components/project/ProjectCard';
import { RiskSummary } from '../../components/dashboard/RiskSummary';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { RiskLevel } from '../../utils/riskUtils';

type RiskFilter = 'all' | 'high' | 'medium' | 'low';

const FILTER_ICONS: Record<RiskFilter, string> = {
  all: 'grid',
  high: 'alert-octagon',
  medium: 'alert-triangle',
  low: 'check-circle',
};

const countByRisk = (list: { risk: RiskLevel }[]) =>
  list.reduce(
    (acc, p) => {
      acc[p.risk] = (acc[p.risk] ?? 0) + 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 },
  );

const { width: screenWidth } = Dimensions.get('window');
const GRID_SPACING = 20;
const getCardSize = () => {
  return (screenWidth - (GRID_SPACING * 3)) / 2;
};

const DashboardScreen = () => {
  const navigation = useNavigation<any>();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskCounts, setRiskCounts] = useState({ high: 0, medium: 0, low: 0 });
  const [filterRisk, setFilterRisk] = useState<RiskFilter>('all');

  const fetchProjects = async () => {
    try {
      const response = await getUserProjects();
      const rawData = response?.data?.data || [];
      const base = rawData.map((item: any) => ({
        id: item.projectId,
        name: item.projectName,
      }));

      // Resolve each project's real risk from its underlying metrics
      // (Defect Density, Defect Severity Index, Defect-to-Remark ratio) in
      // parallel. Highest metric risk determines the project's risk level.
      const withRisk = await Promise.all(
        base.map(async (p: any) => ({
          ...p,
          risk: await getProjectRisk(p.id),
        })),
      );

      setProjects(withRisk);
      setRiskCounts(countByRisk(withRisk));
      setError(null);
    } catch (err: any) {
      if (err.message === 'Network Error') {
        setError('Network Error: Cannot connect to server.');
      } else {
        setError(err.message || 'Failed to load projects');
      }
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchProjects(); };

  const handleProjectPress = (projectId: number) => {
    navigation.navigate('ProjectDetail', { projectId });
  };

  const filteredProjects = projects.filter(
    (p) => filterRisk === 'all' || p.risk === filterRisk
  );

  const getFilterColor = (level: RiskFilter) => {
    switch (level) {
      case 'high': return Colors.error;
      case 'medium': return Colors.warning;
      case 'low': return Colors.success;
      default: return Colors.primary;
    }
  };

  const cardSize = getCardSize();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={Typography.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchProjects} style={styles.retryBtn}>
          <Text style={Typography.link}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        <View style={styles.header}>
          <Text style={Typography.title}>Dashboard</Text>
          <Text style={Typography.subtitle}>Summary of your defect tracking</Text>
        </View>

        <RiskSummary riskCounts={riskCounts} />

        <View style={styles.sectionHeader}>
          <Text style={Typography.heading}>Projects</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterBar}
            contentContainerStyle={styles.filterBarContent}
          >
            {(['all', 'high', 'medium', 'low'] as RiskFilter[]).map((level) => {
              const isActive = filterRisk === level;
              const baseColor = getFilterColor(level);
              return (
                <TouchableOpacity
                  key={level}
                  activeOpacity={0.8}
                  style={[
                    styles.filterChip,
                    { borderColor: baseColor },
                    isActive && { backgroundColor: baseColor },
                  ]}
                  onPress={() => setFilterRisk(level)}
                >
                  <Icon
                    name={FILTER_ICONS[level]}
                    size={15}
                    color={isActive ? Colors.white : baseColor}
                    style={styles.filterChipIcon}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isActive ? Colors.white : baseColor },
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.grid}>
          {filteredProjects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={Typography.caption}>No projects found matching the filter.</Text>
            </View>
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onPress={() => handleProjectPress(project.id)}
                size={cardSize}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  subheading: {
    marginTop: 4,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 16,
  },
  filterBar: {
    marginTop: 12,
  },
  filterBarContent: {
    flexDirection: 'row',
    paddingRight: 24,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    marginRight: 10,
  },
  filterChipIcon: {
    marginRight: 6,
  },
  filterChipText: {
    ...Typography.caption,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_SPACING,
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
  },
  retryBtn: {
    marginTop: 12,
    padding: 10,
  },
});

export default DashboardScreen;