import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { getUserProjects, getProjectRisk } from '../../services/projectService';
import { ProjectCard } from '../../components/project/ProjectCard';
import { RiskSummary } from '../../components/dashboard/RiskSummary';
import { Chip } from '../../components/common/Chip';
import { FadeInView } from '../../components/common/FadeInView';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, Radius } from '../../constants/theme';
import { RiskLevel } from '../../utils/riskUtils';
import { getRiskColor } from '../../utils/colorUtils';
import { usePermission } from '../../context/PermissionContext';

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
  const { canAccessProject, refreshPermissions } = usePermission();

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
      const base = rawData
        .map((item: any) => ({
          id: item.projectId,
          name: item.projectName,
        }))
        // Only surface projects the signed-in user is permitted to access.
        // The endpoint already scopes to the user, and this is a second guard
        // driven purely by the permission context (no hardcoded rules).
        .filter((p: any) => canAccessProject(p.id));

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

  // Whenever the dashboard gains focus (initial load, returning from a project,
  // switching back to this tab), pull the latest permissions from the backend
  // so the dashboard reflects access changes made elsewhere (e.g. the web app)
  // without needing a logout/login. Runs silently in the background.
  useFocusEffect(
    useCallback(() => {
      refreshPermissions();
    }, [refreshPermissions]),
  );

  const onRefresh = () => { setRefreshing(true); fetchProjects(); };

  const handleProjectPress = (projectId: number) => {
    navigation.navigate('ProjectDetail', { projectId });
  };

  const filteredProjects = projects.filter(
    (p) => filterRisk === 'all' || p.risk === filterRisk
  );

  const getFilterColor = (level: RiskFilter) =>
    level === 'all' ? Colors.primary : getRiskColor(level);

  // Tapping a risk summary card toggles that risk filter on/off.
  const handleRiskSelect = (level: RiskLevel) =>
    setFilterRisk((prev) => (prev === level ? 'all' : level));

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
        <FadeInView style={styles.header}>
          <Text style={styles.eyebrow}>Overview</Text>
          <Text style={Typography.title}>Dashboard</Text>
          <Text style={[Typography.subtitle, styles.subheading]}>
            Track defect risk across your projects
          </Text>
        </FadeInView>

        <RiskSummary
          riskCounts={riskCounts}
          activeRisk={filterRisk}
          onSelectRisk={handleRiskSelect}
        />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={Typography.heading}>Projects</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{filteredProjects.length}</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterBar}
            contentContainerStyle={styles.filterBarContent}
          >
            {(['all', 'high', 'medium', 'low'] as RiskFilter[]).map((level) => (
              <Chip
                key={level}
                label={level === 'all' ? 'All' : capitalize(level)}
                color={getFilterColor(level)}
                icon={FILTER_ICONS[level]}
                size="lg"
                active={filterRisk === level}
                onPress={() => setFilterRisk(level)}
                style={styles.filterChipSpacing}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.grid}>
          {filteredProjects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="folder" size={44} color={Colors.borderStrong} />
              <Text style={styles.emptyText}>No projects match this filter.</Text>
            </View>
          ) : (
            filteredProjects.map((project, i) => (
              <FadeInView key={project.id} delay={i * 45} style={{ width: cardSize }}>
                <ProjectCard
                  project={project}
                  onPress={() => handleProjectPress(project.id)}
                  size={cardSize}
                />
              </FadeInView>
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
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  eyebrow: {
    ...Typography.overline,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  subheading: {
    marginTop: Spacing.xs,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  countPill: {
    minWidth: 26,
    height: 22,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    ...Typography.chipText,
    fontSize: 12,
    color: Colors.primary,
  },
  filterBar: {
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.xxl,
  },
  filterBarContent: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xxl,
  },
  filterChipSpacing: {
    marginRight: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_SPACING,
    justifyContent: 'space-between',
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  emptyText: {
    ...Typography.subtitle,
    fontSize: 15,
    color: Colors.textLight,
    marginTop: Spacing.md,
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