import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  useWindowDimensions,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Radius, Spacing, Shadows } from '../../constants/theme';
import { withAlpha } from '../../utils/colorUtils';
import { RiskLevel } from '../../utils/riskUtils';
import { usePermission } from '../../context/PermissionContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { Chip } from '../../components/common/Chip';
import { FadeInView } from '../../components/common/FadeInView';
import { AnimatedPressable } from '../../components/common/AnimatedPressable';
import { ProjectListCard, getStatusMeta } from '../../components/project/ProjectListCard';
import { getAllProjects, getProjectRisk } from '../../services/projectService';
import { ModuleDefinition } from '../../constants/permissions';

// Maps a module's colorKey to a concrete theme color for its option card.
const MODULE_COLORS: Record<string, string> = {
  primary: Colors.primary,
  error: Colors.error,
  success: Colors.success,
  warning: Colors.warning,
  info: Colors.info,
};

const getModuleColor = (mod: ModuleDefinition) =>
  MODULE_COLORS[mod.colorKey ?? 'primary'] ?? Colors.primary;

// Allowed project statuses, mirrors the backend CHECK constraint:
// status IN ('Active', 'On Hold', 'Completed'). Values are sent verbatim to
// the `status` query param, so they must match the backend exactly.
const PROJECT_STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'On Hold', value: 'On Hold' },
  { label: 'Completed', value: 'Completed' },
];

// Status filter chips shown below the search bar. "All" clears the filter; the
// rest reuse the shared status color/icon mapping so the chips, the card status
// badge and the accent color always agree.
const STATUS_FILTERS = [
  { label: 'All', value: '', color: Colors.primary, icon: 'grid' },
  ...PROJECT_STATUS_OPTIONS.map((o) => {
    const meta = getStatusMeta(o.value);
    return { label: o.label, value: o.value, color: meta.color, icon: meta.icon };
  }),
];

// Number of project risks fetched in parallel. Each risk resolves from three
// metric endpoints, so this keeps the list responsive without flooding the API.
const RISK_CONCURRENCY = 4;

/**
 * A single shimmering placeholder block used to compose skeleton cards while
 * the first page of projects loads. Native-driver opacity loop keeps it cheap.
 */
const Skeleton: React.FC<{
  height: number;
  width?: ViewStyle['width'];
  radius?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ height, width = '100%', radius = Radius.sm, style }) => {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ height, width, borderRadius: radius, backgroundColor: Colors.backgroundAlt, opacity }, style]}
    />
  );
};

/** Skeleton mirroring the ProjectListCard layout for a smooth loading state. */
const SkeletonCard: React.FC = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonHeader}>
      <Skeleton height={46} width={46} radius={Radius.md} />
      <View style={styles.skeletonHeaderText}>
        <Skeleton height={15} width={'70%'} />
        <Skeleton height={11} width={'45%'} style={styles.skeletonGap} />
      </View>
      <Skeleton height={22} width={70} radius={Radius.pill} />
    </View>
    <Skeleton height={8} width={'100%'} radius={Radius.pill} style={styles.skeletonBar} />
    <View style={styles.skeletonDivider} />
    <View style={styles.skeletonFooter}>
      <Skeleton height={22} width={96} radius={Radius.pill} />
      <Skeleton height={32} width={32} radius={Radius.pill} />
    </View>
  </View>
);

const ProjectScreen = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Resolved risk per project id. Populated progressively so the list can
  // render immediately while each project's risk is still being computed.
  const [riskMap, setRiskMap] = useState<Record<string, RiskLevel>>({});
  const riskCacheRef = useRef<Record<string, RiskLevel>>({});

  // Modal state
  const [optionModalVisible, setOptionModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const compact = width < 360;

  // Centralized permissions. The PermissionProvider always wraps the app, so
  // this is safe to call directly (no fragile try/catch fallback needed).
  const {
    isAdmin,
    userProjects,
    isLoading: permissionLoading,
    setCurrentProject,
    getAccessibleModules,
  } = usePermission();

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

  // Progressively resolve each project's risk from its underlying metrics.
  // Runs with bounded concurrency and caches results so filtering/searching
  // never re-fetches a risk we already know.
  useEffect(() => {
    let cancelled = false;

    const pending = projects
      .map((p) => p?.id)
      .filter((id) => id != null && riskCacheRef.current[String(id)] === undefined);

    if (pending.length === 0) return;

    let cursor = 0;
    const worker = async () => {
      while (!cancelled && cursor < pending.length) {
        const id = pending[cursor++];
        try {
          const level = await getProjectRisk(id);
          if (cancelled) return;
          riskCacheRef.current[String(id)] = level;
          setRiskMap((prev) => ({ ...prev, [String(id)]: level }));
        } catch {
          // Leave unresolved; the card keeps its neutral "assessing" state.
        }
      }
    };

    Promise.all(
      Array.from({ length: Math.min(RISK_CONCURRENCY, pending.length) }, worker),
    ).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [projects]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
  };

  const openOptionModal = useCallback(
    (project: any) => {
      setSelectedProject(project);
      // Scope permissions to this project so the module options reflect the
      // user's project-specific access. Force a fresh fetch so the options honor
      // the latest permissions (e.g. changed on the web app), not stale cache.
      setCurrentProject(project.id, { force: true });
      setOptionModalVisible(true);
    },
    [setCurrentProject],
  );

  const handleOptionSelect = (module: ModuleDefinition) => {
    setOptionModalVisible(false);
    navigation.navigate(module.route as never, { projectId: selectedProject?.id } as never);
  };

  const keyExtractor = useCallback(
    (item: any, index: number) => String(item?.id ?? item?.projectId ?? index),
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const risk = riskMap[String(item.id)];
      return (
        <FadeInView delay={index < 8 ? index * 45 : 0}>
          <ProjectListCard
            project={item}
            risk={risk}
            riskLoading={risk === undefined}
            compact={compact}
            onPress={() => openOptionModal(item)}
          />
        </FadeInView>
      );
    },
    [riskMap, compact, openOptionModal],
  );

  // Full-screen gate only while permissions load — nothing meaningful can
  // render before we know which projects the user may see.
  if (permissionLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIconWrap}>
          <Icon name="wifi-off" size={30} color={Colors.error} />
        </View>
        <Text style={styles.errorText}>{error}</Text>
        <AnimatedPressable onPress={fetchProjects} style={styles.retryButton}>
          <Icon name="refresh-cw" size={16} color={Colors.white} />
          <Text style={styles.retryText}>Retry</Text>
        </AnimatedPressable>
      </View>
    );
  }

  const isFiltered = searchTerm !== '' || statusFilter !== '';
  const initialLoading = loading && projects.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>Workspace</Text>
            <View style={styles.titleLine}>
              <Text style={Typography.title}>Projects</Text>
              {!initialLoading && (
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{projects.length}</Text>
                </View>
              )}
              {loading && projects.length > 0 && (
                <ActivityIndicator size="small" color={Colors.primary} />
              )}
            </View>
            <Text style={[Typography.subtitle, styles.subtitle]}>
              {isAdmin ? 'Manage your projects and teams' : 'View your assigned projects'}
            </Text>
          </View>
          {isFiltered && (
            <AnimatedPressable onPress={clearFilters} style={styles.clearAllButton}>
              <Icon name="x" size={14} color={Colors.primary} />
              <Text style={styles.clearAllText}>Clear</Text>
            </AnimatedPressable>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Icon name="search" size={18} color={Colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
          placeholderTextColor={Colors.textLight}
          value={searchTerm}
          onChangeText={setSearchTerm}
          returnKeyType="search"
        />
        {searchTerm.length > 0 && (
          <AnimatedPressable onPress={() => setSearchTerm('')}>
            <Icon name="x-circle" size={18} color={Colors.textLight} />
          </AnimatedPressable>
        )}
      </View>

      {/* Status filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipBar}
        contentContainerStyle={styles.chipBarContent}
      >
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.value || 'all'}
            label={f.label}
            color={f.color}
            icon={f.icon}
            size="md"
            active={statusFilter === f.value}
            onPress={() => setStatusFilter(f.value)}
            style={styles.chipSpacing}
          />
        ))}
      </ScrollView>

      {initialLoading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={9}
          updateCellsBatchingPeriod={50}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Icon name={isFiltered ? 'search' : 'folder'} size={38} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {isFiltered
                  ? 'No matching projects'
                  : isAdmin
                  ? 'No projects yet'
                  : 'No projects assigned'}
              </Text>
              <Text style={styles.emptySub}>
                {isFiltered
                  ? 'Try a different search or status filter'
                  : isAdmin
                  ? 'Create your first project to get started'
                  : 'You are not allocated to any projects yet'}
              </Text>
              {isFiltered && (
                <AnimatedPressable onPress={clearFilters} style={styles.emptyClearButton}>
                  <Text style={styles.emptyClearText}>Clear filters</Text>
                </AnimatedPressable>
              )}
            </View>
          }
        />
      )}

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
                {permissionLoading ? (
                  <>
                    <Text style={styles.modalSmallTitle}>Loading modules…</Text>
                    <Text style={styles.modalProjectName}>{selectedProject?.name}</Text>
                    <ActivityIndicator size="small" color={Colors.primary} style={styles.modalLoader} />
                  </>
                ) : (
                  (() => {
                    // Modules are resolved from the selected project's effective
                    // permissions (user-level + project/role grants) — a module
                    // (e.g. Defects) only appears if the user holds its read
                    // permission (e.g. DEFECT_READ / TEST_CASE_READ).
                    const modules = getAccessibleModules('current');

                    if (modules.length === 0) {
                      return (
                        <>
                          <Text style={styles.modalSmallTitle}>No access</Text>
                          <Text style={styles.modalProjectName}>{selectedProject?.name}</Text>
                          <View style={styles.noAccessBox}>
                            <View style={styles.noAccessIcon}>
                              <Icon name="lock" size={26} color={Colors.textLight} />
                            </View>
                            <Text style={styles.noAccessText}>
                              You don't have access to any modules for this project.
                            </Text>
                          </View>
                        </>
                      );
                    }

                    const isSingle = modules.length === 1;

                    return (
                      <>
                        <Text style={styles.modalSmallTitle}>
                          {isSingle ? 'Open Module' : 'Select Category'}
                        </Text>
                        <Text style={styles.modalProjectName}>{selectedProject?.name}</Text>

                        {isSingle ? (
                          // Modern, full-width call-to-action card shown when the
                          // user can access exactly one module for this project.
                          (() => {
                            const mod = modules[0];
                            const color = getModuleColor(mod);
                            return (
                              <AnimatedPressable
                                style={[styles.singleOptionCard, { borderColor: withAlpha(color, 0.35) }]}
                                onPress={() => handleOptionSelect(mod)}
                              >
                                <View style={[styles.singleOptionIcon, { backgroundColor: withAlpha(color, 0.12) }]}>
                                  <Icon name={mod.icon} size={30} color={color} />
                                </View>
                                <View style={styles.singleOptionText}>
                                  <Text style={styles.singleOptionTitle}>{mod.label}</Text>
                                  {mod.description ? (
                                    <Text style={styles.singleOptionDesc}>{mod.description}</Text>
                                  ) : null}
                                </View>
                                <View style={[styles.singleOptionArrow, { backgroundColor: color }]}>
                                  <Icon name="arrow-right" size={18} color={Colors.white} />
                                </View>
                              </AnimatedPressable>
                            );
                          })()
                        ) : (
                          <View style={styles.optionsRow}>
                            {modules.map((mod) => {
                              const color = getModuleColor(mod);
                              return (
                                <AnimatedPressable
                                  key={mod.key}
                                  style={[styles.optionCard, { borderColor: withAlpha(color, 0.4) }]}
                                  onPress={() => handleOptionSelect(mod)}
                                >
                                  <View style={[styles.optionIcon, { backgroundColor: withAlpha(color, 0.12) }]}>
                                    <Icon name={mod.icon} size={28} color={color} />
                                  </View>
                                  <Text style={styles.optionLabel}>{mod.label}</Text>
                                  {mod.description ? (
                                    <Text style={styles.optionSubLabel} numberOfLines={2}>
                                      {mod.description}
                                    </Text>
                                  ) : null}
                                </AnimatedPressable>
                              );
                            })}
                          </View>
                        )}
                      </>
                    );
                  })()
                )}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  eyebrow: {
    ...Typography.overline,
    color: Colors.primary,
    marginBottom: 2,
  },
  countPill: {
    minWidth: 28,
    height: 24,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: withAlpha(Colors.primary, 0.12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    ...Typography.chipText,
    color: Colors.primary,
    fontSize: 13,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: withAlpha(Colors.primary, 0.1),
  },
  clearAllText: {
    ...Typography.link,
    fontSize: 13,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.pill,
    backgroundColor: Colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.subtitle,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  retryText: {
    ...Typography.buttonText,
    fontSize: 15,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.soft,
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
  chipBar: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    flexGrow: 0,
  },
  chipBarContent: {
    paddingRight: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  chipSpacing: {
    marginRight: Spacing.sm,
  },
  list: {
    // Give the first project card the same breathing room under the status
    // filter chips that the empty state already has (its big paddingVertical
    // supplies the gap). Without this the populated list sits too close to the
    // chips and the filter's bottom margin looks collapsed.
    paddingTop: Spacing.md,
    paddingBottom: Spacing.huge,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge + Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    backgroundColor: withAlpha(Colors.primary, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.sectionTitle,
    marginTop: Spacing.xs,
  },
  emptySub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  emptyClearButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: withAlpha(Colors.primary, 0.1),
  },
  emptyClearText: {
    ...Typography.link,
    fontSize: 14,
  },
  // ---- Skeleton loading ----
  skeletonCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  skeletonHeaderText: {
    flex: 1,
  },
  skeletonGap: {
    marginTop: Spacing.sm,
  },
  skeletonBar: {
    marginTop: Spacing.lg,
  },
  skeletonDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  skeletonFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // ---- Modal ----
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
    minHeight: 150,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.soft,
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
  optionSubLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
  },
  // ---- Single-module (modern CTA) card ----
  singleOptionCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.soft,
  },
  singleOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleOptionText: {
    flex: 1,
  },
  singleOptionTitle: {
    ...Typography.cardTitle,
    fontSize: 17,
  },
  singleOptionDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  singleOptionArrow: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLoader: {
    paddingVertical: Spacing.xl,
  },
  noAccessBox: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  noAccessIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccessText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
});

export default ProjectScreen;
