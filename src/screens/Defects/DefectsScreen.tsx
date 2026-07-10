import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import {
  getDefects,
  getProjectModules,
  getDefectTypes,
  getSeverities,
  getPriorities,
  getStatuses,
  getProjectDevelopers,
  getProjectReleases,
  updateDefect,
  buildDefectUpdatePayload,
  getSubModuleEmployees,
  getProjectAllocationEmployees,
  getSubModules,
} from '../../services/defectService';
import { Defect, Developer, StatusTransition } from '../../types/defect';
import { DefectCard } from '../../components/defects/DefectCard';
import { DefectFilterArea } from '../../components/defects/DefectFilterArea';
import { Modal } from '../../components/common/Modal';
import Dropdown from '../../components/common/Dropdown';
import Icon from 'react-native-vector-icons/Feather';
import { getApiErrorMessage } from '../../utils/apiError';

const PAGE_SIZE = 20;

const INITIAL_FILTERS = {
  searchTerm: '',
  moduleId: '',
  subModuleId: '',
  defectTypeId: '',
  severityId: '',
  priorityId: '',
  releaseId: '',
  statusId: '',
  assignedToId: '',
  enteredById: '',
};

const DefectsScreen = () => {
  const route = useRoute();
  const params: any = route.params || {};
  const projectId = params.projectId;
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'MY' | 'ALL'>('MY');
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [filters, setFilters] = useState({ ...INITIAL_FILTERS });

  // Options for filters
  const [options, setOptions] = useState<{
    modules: any[];
    defectTypes: any[];
    severities: any[];
    priorities: any[];
    releases: any[];
    statuses: any[];
    developers: any[];
  }>({
    modules: [],
    defectTypes: [],
    severities: [],
    priorities: [],
    releases: [],
    statuses: [],
    developers: [],
  });
  const [subModules, setSubModules] = useState<any[]>([]);
  const [subModulesLoading, setSubModulesLoading] = useState(false);

  // Reassign Modal
  const [reassignModalVisible, setReassignModalVisible] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [targetDeveloperId, setTargetDeveloperId] = useState<number | string>('');
  const [subModuleDevelopers, setSubModuleDevelopers] = useState<any[]>([]);
  const [loadingReassignOptions, setLoadingReassignOptions] = useState(false);
  const [projectEmployees, setProjectEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (projectId) {
      fetchOptions();
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId && user?.id) {
      resetAndFetch();
    }
  }, [projectId, filters, user?.id]);

  const fetchOptions = async () => {
    if (!projectId) return;
    try {
      const safeFetch = async (apiCall: Promise<any>, listName: string) => {
        try {
          const res = await apiCall;
          let result = res.data?.data ?? res.data ?? [];
          if (result && !Array.isArray(result) && Array.isArray(result.content)) {
            result = result.content;
          }
          return Array.isArray(result) ? result : [];
        } catch (err) {
          console.warn(`⚠️ Failed to fetch ${listName}`);
          return [];
        }
      };

      const [modules, types, severities, priorities, statuses, developers, releases, employees] = await Promise.all([
        safeFetch(getProjectModules(projectId), 'Modules'),
        safeFetch(getDefectTypes(), 'Defect Types'),
        safeFetch(getSeverities(), 'Severities'),
        safeFetch(getPriorities(), 'Priorities'),
        safeFetch(getStatuses(), 'Statuses'),
        safeFetch(getProjectDevelopers(projectId), 'Developers'),
        safeFetch(getProjectReleases(projectId), 'Releases'),
        safeFetch(getProjectAllocationEmployees(projectId), 'Project Employees'),
      ]);

      const mappedStatuses = statuses.map((s: any) => ({
        id: s.id,
        name: s.name,
        color: s.color,
      }));

      const employeeDevelopers = Array.from(
        new Map(
          (Array.isArray(employees) ? employees : [])
            .filter((e: any) => e?.employeeId != null)
            .map((e: any) => {
              const fullName = `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim();
              return [
                Number(e.employeeId),
                {
                  id: Number(e.employeeId),
                  name: fullName || e.name || e.email || `Employee ${e.employeeId}`,
                },
              ];
            }),
        ).values(),
      );

      setOptions({
        modules,
        defectTypes: types,
        severities,
        priorities,
        statuses: mappedStatuses,
        developers: employeeDevelopers.length ? employeeDevelopers : developers,
        releases,
      });
      setProjectEmployees(employees);
    } catch (error) {
      console.error('❌ Global failure in fetchOptions:', error);
    }
  };

  useEffect(() => {
    if (!filters.moduleId) {
      setSubModules([]);
      return;
    }
    setSubModulesLoading(true);
    getSubModules(filters.moduleId)
      .then(res => {
        const data = res.data?.data || res.data || [];
        setSubModules(Array.isArray(data) ? data : []);
      })
      .catch(() => setSubModules([]))
      .finally(() => setSubModulesLoading(false));
  }, [filters.moduleId]);

  const fetchDefects = async (pageNumber: number, isRefreshing = false) => {
    try {
      if (pageNumber === 0) setLoading(true);

      const params: any = {
        page: pageNumber,
        size: PAGE_SIZE,
      };

      if (filters.searchTerm) params.search = filters.searchTerm;
      if (filters.moduleId) params.moduleIds = [Number(filters.moduleId)];
      if (filters.subModuleId) params.subModuleIds = [Number(filters.subModuleId)];
      if (filters.defectTypeId) params.typeIds = [Number(filters.defectTypeId)];
      if (filters.severityId) params.severityIds = [Number(filters.severityId)];
      if (filters.priorityId) params.priorityIds = [Number(filters.priorityId)];
      if (filters.releaseId) params.releaseIds = [Number(filters.releaseId)];
      if (filters.statusId) params.statusIds = [Number(filters.statusId)];
      if (filters.assignedToId) params.assignedToIds = [Number(filters.assignedToId)];
      if (filters.enteredById) params.enteredByIds = [Number(filters.enteredById)];

      console.log(`📡 Fetching defects. Params:`, JSON.stringify(params));
      const response = await getDefects(projectId, params);

      let rawDefects = response.data?.data ?? response.data ?? [];
      if (rawDefects && !Array.isArray(rawDefects) && Array.isArray(rawDefects.content)) {
        rawDefects = rawDefects.content;
      }

      if (!Array.isArray(rawDefects)) {
        if (pageNumber === 0) setDefects([]);
        setHasMore(false);
        return;
      }

      const newDefects: Defect[] = rawDefects.map((item: any) => {
        const statusObj = item.status || {};
        return {
          id: item.id,
          defectNo: item.defectNo,
          description: item.description,
          severityId: item.severityId || item.severity?.id,
          severityName: item.severityName || item.severity?.name,
          priorityId: item.priorityId || item.priority?.id,
          priorityName: item.priorityName || item.priority?.name,
          statusId: statusObj.id || item.statusId,
          statusName: statusObj.name || item.statusName || (typeof item.status === 'string' ? item.status : 'Unknown'),
          statusColor: statusObj.color || item.statusColor || '#64748b',
          defectTypeId: item.defectTypeId || item.defectType?.id,
          defectTypeName: item.defectTypeName || item.defectType?.name,
          moduleId: item.moduleId || item.module?.id,
          moduleName: item.moduleName || item.module?.name,
          subModuleId: item.subModuleId || item.subModule?.id,
          subModuleName: item.subModuleName || item.subModule?.name,
          releaseId: item.releaseId || item.release?.id,
          releaseName: item.releaseName || item.release?.name,
          assignedToId: item.assignedToId || item.assignedTo?.id,
          assignedToName: item.assignedToName || item.assignedTo?.name,
          createdByName: item.createdByName || item.createdBy?.name || item.createdBy?.firstName || 'System',
          _raw: item
        };
      });

      if (isRefreshing || pageNumber === 0) {
        setDefects(newDefects);
      } else {
        setDefects(prev => [...prev, ...newDefects]);
      }
      setHasMore(rawDefects.length === PAGE_SIZE);
    } catch (error: any) {
      console.error('❌ Failed to fetch defects:', error);
      toast.error('Failed to load defects.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const resetAndFetch = () => {
    setPage(0);
    setHasMore(true);
    fetchDefects(0, true);
  };

  const clearFilters = useCallback(() => {
    setFilters({ ...INITIAL_FILTERS });
    setSubModules([]);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    resetAndFetch();
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchDefects(nextPage);
    }
  };

  const handleStatusChange = async (defect: Defect, targetStatus: any) => {
    try {
      const payload = buildDefectUpdatePayload(defect, { statusId: targetStatus.id });
      console.log('📡 Updating status. Payload:', JSON.stringify(payload));
      await updateDefect(defect.id, payload);

      setDefects(prev => prev.map(d => d.id === defect.id ? {
        ...d,
        statusId: targetStatus.id,
        statusName: targetStatus.name,
        statusColor: targetStatus.color,
        status: targetStatus,
        _raw: { ...d._raw, statusId: targetStatus.id, status: targetStatus }
      } : d));

      toast.success(`Status updated to ${targetStatus.name}.`);
    } catch (error: any) {
      console.error('❌ Status update failed:', error.response?.data || error.message);
      toast.error(getApiErrorMessage(error, 'Could not update status. Please try again.'));
    }
  };

  const handleReassignInitiate = async (defect: Defect) => {
    setSelectedDefect(defect);
    setTargetDeveloperId('');
    setReassignModalVisible(true);
    setLoadingReassignOptions(true);
    setSubModuleDevelopers([]);

    try {
      const smId = defect.subModuleId || defect._raw?.subModule?.id;
      console.log(`📡 Fetching employees for sub-module: ${smId}`);
      const response = await getSubModuleEmployees(smId);
      const subDevs = response.data?.data || response.data || [];

      const mappedDevs = subDevs
        .filter((sd: any) => sd.employeeId)
        .map((sd: any) => {
          const fullDev = projectEmployees.find(
            (d: any) => Number(d.employeeId) === Number(sd.employeeId)
          );
          return {
            id: Number(sd.employeeId),
            name: fullDev ? `${fullDev.firstName} ${fullDev.lastName}` : `Employee ${sd.employeeId}`
          };
        });

      setSubModuleDevelopers(mappedDevs);
    } catch (error) {
      console.warn('⚠️ Sub-module employees fetch failed, using project developers');
      setSubModuleDevelopers(options.developers);
    } finally {
      setLoadingReassignOptions(false);
    }
  };

  const handleReassignConfirm = async () => {
    if (!selectedDefect || !targetDeveloperId) return;
    try {
      const dev: any = subModuleDevelopers.find((d: any) => d.id === targetDeveloperId);
      const payload = buildDefectUpdatePayload(selectedDefect, { assignedTo: targetDeveloperId });

      console.log('📡 Reassigning. Payload:', JSON.stringify(payload));
      await updateDefect(selectedDefect.id, payload);
      setReassignModalVisible(false);

      setDefects(prev => prev.map(d => d.id === selectedDefect.id ? {
        ...d,
        assignedToId: targetDeveloperId as number,
        assignedToName: dev?.name || 'Assigned',
        _raw: { ...d._raw, assignedTo: { id: targetDeveloperId }, assignedToId: targetDeveloperId }
      } : d));

      toast.success(`Defect reassigned.`);
    } catch (error: any) {
      console.error('❌ Reassign failed:', error.response?.data || error.message);
      toast.error(getApiErrorMessage(error, 'Could not reassign defect. Please try again.'));
    }
  };

  const myDefects = useMemo(() => {
    if (!user?.id) return [];
    return defects.filter(d => Number(d.assignedToId) === Number(user.id));
  }, [defects, user?.id]);

  const allDefects = useMemo(() => defects, [defects]);
  const visibleDefects = activeTab === 'MY' ? myDefects : allDefects;

  return (
    <SafeAreaView style={styles.container}>
      <DefectFilterArea
        filters={filters}
        setFilters={setFilters}
        options={options}
        subModules={subModules}
        subModulesLoading={subModulesLoading}
        onClear={clearFilters}
      />

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'MY' && styles.activeTab]} onPress={() => setActiveTab('MY')}>
          <Text style={[styles.tabText, activeTab === 'MY' && styles.activeTabText]}>
            My Defects
            {myDefects.length > 0 && <Text style={styles.countText}>  {myDefects.length}</Text>}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'ALL' && styles.activeTab]} onPress={() => setActiveTab('ALL')}>
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.activeTabText]}>
            All Defects
            {allDefects.length > 0 && <Text style={styles.countText}>  {allDefects.length}</Text>}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visibleDefects}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <DefectCard
              defect={item}
              isMyDefect={activeTab === 'MY'}
              onStatusChange={handleStatusChange}
              onReassign={handleReassignInitiate}
            />
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} /> : null}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="search" size={48} color={Colors.borderStrong} />
              <Text style={styles.emptyText}>No defects found matching your criteria.</Text>
            </View>
          }
        />
      )}

      <Modal visible={reassignModalVisible} title="Reassign Defect" onClose={() => setReassignModalVisible(false)} onConfirm={handleReassignConfirm} confirmText="Reassign">
        <View style={styles.modalContent}>
          <Text style={styles.modalLabel}>Select Team Member</Text>
          {loadingReassignOptions ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Dropdown
              items={subModuleDevelopers.filter(d => d.id !== selectedDefect?.assignedToId).map((d: any) => ({ label: d.name, value: d.id }))}
              selectedValue={targetDeveloperId}
              onSelect={setTargetDeveloperId}
              placeholder="Pick Developer"
              style={styles.modalDropdown}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
    zIndex: 10
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTab: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primaryLight,
  },
  tabText: {
    ...Typography.bodyBold,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  countText: {
    fontSize: 11,
    color: Colors.textLight,
  },
  listContent: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { ...Typography.subtitle, textAlign: 'center', marginTop: 16, color: Colors.textLight },
  modalContent: { marginVertical: 8 },
  modalLabel: { ...Typography.overline, marginBottom: 8 },
  modalDropdown: { width: '100%' },
});

export default DefectsScreen;
