import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing, Shadows } from '../../constants/theme';
import { withAlpha } from '../../utils/colorUtils';
import { usePermission } from '../../context/PermissionContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Dropdown from '../../components/common/Dropdown';
import { Chip } from '../../components/common/Chip';
import { FadeInView } from '../../components/common/FadeInView';
import { AnimatedPressable } from '../../components/common/AnimatedPressable';
import { getAllProjects } from '../../services/projectService';

// ---- Stable fallback (module-level, not recreated every render) ----
const DEFAULT_PERMISSION_DATA = {
  isAdmin: false,
  userProjects: [] as any[],
  isLoading: false,
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return Colors.success;
    case 'on hold':
      return Colors.warning;
    case 'completed':
      return Colors.info;
    default:
      return Colors.textLight;
  }
};

// Allowed project statuses, mirrors the backend CHECK constraint:
// status IN ('Active', 'On Hold', 'Completed'). Values are sent verbatim to
// the `status` query param, so they must match the backend exactly.
const PROJECT_STATUS_OPTIONS = [
  { label: 'Active', value: 'Active', color: Colors.success },
  { label: 'On Hold', value: 'On Hold', color: Colors.warning },
  { label: 'Completed', value: 'Completed', color: Colors.info },
];

const ProjectScreen = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal state
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const navigation = useNavigation<any>();

  // Safe hook usage with stable fallback (prevents infinite re-render loop)
  let permissionData = DEFAULT_PERMISSION_DATA;
  try {
    permissionData = usePermission();
  } catch (err) {
    console.warn('⚠️ usePermission hook failed, using defaults:', err);
  }
  const { isAdmin, userProjects, isLoading: permissionLoading } = permissionData;

  // Stable key derived from userProjects so the effect below only fires
  // when the actual project list changes, not on every render.
  const userProjectIdsKey = (userProjects || [])
    .map((p: any) => p.projectId ?? p.id)
    .join(',');

  useEffect(() => {
    if (permissionLoading) return;
    // Debounce so typing in the search box (and quick status changes) doesn't
    // fire a request on every keystroke. Status is sent to the backend so
    // filtering stays consistent with server-side paging/permissions.
    const handler = setTimeout(() => {
      fetchProjects();
    }, 350);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionLoading, isAdmin, userProjectIdsKey, searchTerm, statusFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllProjects({
        projectName: searchTerm,
        status: statusFilter,
      });

      let allProjects = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        allProjects = response.data.data;
      } else if (Array.isArray(response.data)) {
        allProjects = response.data;
      } else {
        allProjects = [];
      }

      let accessibleProjects = allProjects;
      if (!isAdmin && userProjects && userProjects.length > 0) {
        const userProjectIds = userProjects.map((p: any) => Number(p.projectId || p.id));
        accessibleProjects = allProjects.filter((project: any) =>
          userProjectIds.includes(Number(project.id))
        );
      }

      setProjects(accessibleProjects);
    } catch (err: any) {
      console.error('❌ Error fetching projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
  };

  const openOptionModal = (project: any) => {
    setSelectedProject(project);
    setOptionModalVisible(true);
  };

  const handleOptionSelect = (type: 'testcases' | 'defects') => {
    setOptionModalVisible(false);
    if (type === 'defects') {
      navigation.navigate('Defects', { projectId: selectedProject.id });
    } else {
      navigation.navigate('TestCases', { projectId: selectedProject.id });
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const daysLeft = item.endDate
      ? Math.ceil(
          (new Date(item.endDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;
    const statusColor = getStatusColor(item.status);

    return (
      <FadeInView delay={(index % 12) * 45}>
        <AnimatedPressable
          style={[styles.projectCard, { borderLeftColor: statusColor }]}
          onPress={() => openOptionModal(item)}
        >
          <View style={styles.cardMainContent}>
            <View style={styles.topRow}>
              <Text style={styles.projectName} numberOfLines={1}>
                {item.name || 'Unnamed Project'}
              </Text>
              <Chip label={item.status || 'Unknown'} color={statusColor} variant="solid" size="sm" />
            </View>

            <View style={styles.metaRow}>
              <Icon name="calendar" size={14} color={Colors.textLight} />
              <Text style={styles.metaText}>
                {formatDate(item.startDate)} - {formatDate(item.endDate)}
              </Text>
            </View>

            {daysLeft > 0 && (
              <View style={styles.metaRow}>
                <Icon name="clock" size={14} color={Colors.textLight} />
                <Text style={styles.metaText}>Days Left: {daysLeft} days</Text>
              </View>
            )}

            {item.projectManagerName && (
              <View style={styles.metaRow}>
                <Icon name="user" size={14} color={Colors.textLight} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.projectManagerName}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.chevronContainer}>
            <Icon name="chevron-right" size={22} color={Colors.primary} />
          </View>
        </AnimatedPressable>
      </FadeInView>
    );
  };

  if ((loading && projects.length === 0) || permissionLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <AnimatedPressable onPress={fetchProjects} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </AnimatedPressable>
      </View>
    );
  }

  const isFiltered = searchTerm !== '' || statusFilter !== '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>Workspace</Text>
            <Text style={Typography.title}>All Projects</Text>
            <Text style={[Typography.subtitle, styles.subtitle]}>
              {isAdmin ? 'Manage your projects and teams' : 'View your assigned projects'}
            </Text>
          </View>
          {isFiltered && (
            <AnimatedPressable onPress={clearFilters} style={styles.clearAllButton}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </AnimatedPressable>
          )}
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.filterContainer}>
        <View style={styles.searchWrapper}>
          <Icon name="search" size={18} color={Colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            placeholderTextColor={Colors.textLight}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <AnimatedPressable onPress={() => setSearchTerm('')}>
              <Icon name="x" size={18} color={Colors.textLight} />
            </AnimatedPressable>
          )}
        </View>

        <Dropdown
          items={[{ label: 'All Status', value: '' }, ...PROJECT_STATUS_OPTIONS]}
          selectedValue={statusFilter}
          onSelect={(val) => setStatusFilter(String(val))}
          placeholder="All Status"
          style={styles.statusDropdown}
        />
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="folder" size={56} color={Colors.borderStrong} />
            <Text style={styles.emptyTitle}>
              {isAdmin ? 'No projects yet' : 'No projects assigned'}
            </Text>
            <Text style={styles.emptySub}>
              {isAdmin
                ? 'Create your first project to get started'
                : 'You are not allocated to any projects yet'}
            </Text>
          </View>
        }
      />

      {/* Project Options Modal */}
      <Modal
        visible={optionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOptionModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.optionModal}>
                <Text style={styles.modalSmallTitle}>Select Category</Text>
                <Text style={styles.modalProjectName}>{selectedProject?.name}</Text>

                <View style={styles.optionsRow}>
                  <AnimatedPressable
                    style={[styles.optionCard, { borderColor: withAlpha(Colors.primary, 0.4) }]}
                    onPress={() => handleOptionSelect('testcases')}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: withAlpha(Colors.primary, 0.12) }]}>
                      <Icon name="file-text" size={28} color={Colors.primary} />
                    </View>
                    <Text style={styles.optionLabel}>Testcases</Text>
                  </AnimatedPressable>

                  <AnimatedPressable
                    style={[styles.optionCard, { borderColor: withAlpha(Colors.error, 0.4) }]}
                    onPress={() => handleOptionSelect('defects')}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: withAlpha(Colors.error, 0.12) }]}>
                      <Icon name="alert-circle" size={28} color={Colors.error} />
                    </View>
                    <Text style={styles.optionLabel}>Defects</Text>
                  </AnimatedPressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    ...Typography.overline,
    color: Colors.primary,
    marginBottom: 2,
  },
  subtitle: {
    marginTop: 2,
  },
  clearAllButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  clearAllText: {
    ...Typography.link,
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    ...Typography.subtitle,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  retryText: {
    ...Typography.buttonText,
    fontSize: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.xs,
    fontSize: 15,
    color: Colors.text,
    fontFamily: Typography.body.fontFamily,
  },
  statusDropdown: {
    flex: 1,
  },
  list: {
    paddingBottom: Spacing.xl,
  },
  projectCard: {
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    ...Shadows.card,
  },
  cardMainContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  projectName: {
    ...Typography.cardTitle,
    fontSize: 17,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  chevronContainer: {
    marginLeft: Spacing.sm,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge + Spacing.xl,
  },
  emptyTitle: {
    ...Typography.sectionTitle,
    marginTop: Spacing.md,
  },
  emptySub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  optionModal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.card,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.elevated,
  },
  modalSmallTitle: {
    ...Typography.overline,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  modalProjectName: {
    ...Typography.heading,
    fontSize: 20,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: Spacing.lg,
  },
  optionCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLabel: {
    ...Typography.bodyBold,
    fontSize: 14,
  },
});

export default ProjectScreen;
