import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { usePermission } from '../../context/PermissionContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Dropdown from '../../components/common/Dropdown';
import { getAllProjects } from '../../services/projectService';

// ---- Stable fallback (module-level, not recreated every render) ----
const DEFAULT_PERMISSION_DATA = {
  isAdmin: false,
  userProjects: [] as any[],
  isLoading: false,
};

// ---- Helper functions ----
const getDaysLeft = (endDate: string) => {
  if (!endDate) return 'N/A';
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Overdue';
  return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return '#22c55e';
    case 'on hold':
      return '#f59e0b';
    case 'completed':
      return '#3b82f6';
    default:
      return '#94a3b8';
  }
};

// Allowed project statuses, mirrors the backend CHECK constraint:
// status IN ('Active', 'On Hold', 'Completed'). Values are sent verbatim to
// the `status` query param, so they must match the backend exactly.
const PROJECT_STATUS_OPTIONS = [
  { label: 'Active', value: 'Active', color: '#22c55e' },
  { label: 'On Hold', value: 'On Hold', color: '#f59e0b' },
  { label: 'Completed', value: 'Completed', color: '#3b82f6' },
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

  const renderItem = ({ item }: { item: any }) => {
    const daysLeft = item.endDate
      ? Math.ceil(
          (new Date(item.endDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    return (
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => openOptionModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardMainContent}>
          <View style={styles.topRow}>
            <Text style={styles.projectName} numberOfLines={1}>
              {item.name || 'Unnamed Project'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status || 'Unknown'}</Text>
            </View>
          </View>

          <View style={styles.timelineRow}>
            <Icon name="calendar" size={14} color={Colors.textSecondary || '#64748b'} />
            <Text style={styles.timelineText}>
              {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
          </View>

          {daysLeft > 0 && (
            <View style={styles.daysRow}>
              <Icon name="clock" size={14} color={Colors.textSecondary || '#64748b'} />
              <Text style={styles.daysText}>Days Left: {daysLeft} days</Text>
            </View>
          )}

          {item.projectManagerName && (
            <View style={styles.managerRow}>
              <Icon name="user" size={14} color={Colors.textSecondary || '#64748b'} />
              <Text style={styles.managerText} numberOfLines={1}>
                Project Manager: {item.projectManagerName}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chevronContainer}>
          <Icon name="chevron-right" size={24} color={Colors.primary || '#3b82f6'} />
        </View>
      </TouchableOpacity>
    );
  };

  if ((loading && projects.length === 0) || permissionLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary || '#3b82f6'} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchProjects} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isFiltered = searchTerm !== '' || statusFilter !== '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>All Projects</Text>
            <Text style={styles.subtitle}>
              {isAdmin ? 'Manage your projects and teams' : 'View your assigned projects'}
            </Text>
          </View>
          {isFiltered && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearAllButton}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.filterContainer}>
        <View style={styles.searchWrapper}>
          <Icon name="search" size={18} color={Colors.textSecondary || '#64748b'} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            placeholderTextColor={Colors.textSecondary || '#64748b'}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Icon name="x" size={18} color={Colors.textSecondary || '#64748b'} />
            </TouchableOpacity>
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
            <Icon name="folder" size={60} color={Colors.textSecondary || '#64748b'} />
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
                  <TouchableOpacity
                    style={[styles.optionCard, { borderColor: Colors.primary || '#3b82f6' }]}
                    onPress={() => handleOptionSelect('testcases')}
                  >
                    <Icon name="file-text" size={32} color={Colors.primary || '#3b82f6'} />
                    <Text style={styles.optionLabel}>Testcases</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionCard, { borderColor: '#ef4444' }]}
                    onPress={() => handleOptionSelect('defects')}
                  >
                    <Icon name="alert-circle" size={32} color="#ef4444" />
                    <Text style={styles.optionLabel}>Defects</Text>
                  </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: Colors.background || '#f8fafc',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text || '#0f172a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary || '#64748b',
  },
  clearAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearAllText: {
    color: Colors.primary || '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background || '#f8fafc',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary || '#3b82f6',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white || '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 4,
    fontSize: 14,
    color: Colors.text || '#0f172a',
  },
  statusDropdown: {
    flex: 1,
  },
  list: {
    paddingBottom: 20,
  },
  projectCard: {
    backgroundColor: Colors.white || '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMainContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text || '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineText: {
    fontSize: 14,
    color: Colors.textSecondary || '#64748b',
    marginLeft: 6,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  daysText: {
    fontSize: 14,
    color: Colors.textSecondary || '#64748b',
    marginLeft: 6,
  },
  managerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  managerText: {
    fontSize: 14,
    color: Colors.textSecondary || '#64748b',
    marginLeft: 6,
    flexShrink: 1,
  },
  chevronContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text || '#0f172a',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: Colors.textSecondary || '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionModal: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalSmallTitle: {
    fontSize: 14,
    color: Colors.textSecondary || '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalProjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text || '#0f172a',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 15,
  },
  optionCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text || '#0f172a',
  },
});

export default ProjectScreen;
