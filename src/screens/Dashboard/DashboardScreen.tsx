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
import { getUserProjects } from '../../services/projectService';
import { ProjectCard } from '../../components/project/ProjectCard';
import { RiskSummary } from '../../components/dashboard/RiskSummary';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

type RiskFilter = 'all' | 'high' | 'medium' | 'low';

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
      const mapped = rawData.map((item: any) => ({
        id: item.projectId,
        name: item.projectName,
        risk: 'low', // Replace with real risk later
      }));
      setProjects(mapped);
      const counts = { high: 0, medium: 0, low: mapped.length };
      setRiskCounts(counts);
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
            {(['all', 'high', 'medium', 'low'] as RiskFilter[]).map((level) => {
              const isActive = filterRisk === level;
              const baseColor = getFilterColor(level);
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.filterChip,
                    isActive && { backgroundColor: baseColor, borderColor: baseColor },
                  ]}
                  onPress={() => setFilterRisk(level)}
                >
                  <Text style={[styles.filterChipText, isActive && { color: Colors.white }]}>
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
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  filterChipText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
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