import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { PERMISSIONS } from '../../constants/permissions';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { usePermission } from '../../context/PermissionContext';
import {
  getActiveRelease,
  getTestCases,
  getProjectModules,
  getSubModules,
  getProjectEmployees,
  reassignTestCase,
} from '../../services/testCaseService';
import { getReleases } from '../../services/releaseService';
import { getSeverities, getPriorities } from '../../services/defectService';
import { buildColorMap } from '../../utils/colorUtils';
import {
  TestCase,
  ProjectEmployee,
  Release,
  TestCaseReassignPayload,
  QA_ROLE_TYPES,
} from '../../types/testCase';
import { TestCaseCard } from '../../components/testcases/TestCaseCard';
import { TestCaseFilterArea } from '../../components/testcases/TestCaseFilterArea';
import { Modal } from '../../components/common/Modal';
import Dropdown from '../../components/common/Dropdown';
import Icon from 'react-native-vector-icons/Feather';
import { normalizeSubModules, unwrapApiList, isSubModuleValid, SubModuleOption } from '../../utils/moduleUtils';
import { getApiErrorMessage } from '../../utils/apiError';

const PAGE_SIZE = 20;

const INITIAL_FILTERS = {
  searchTerm: '',
  moduleId: '',
  subModuleId: '',
};

const TestCasesScreen = () => {
  const route = useRoute();
  const params: any = route.params || {};
  const projectId = params.projectId;
  const { user } = useAuth();
  const toast = useToast();
  const { can, hasPermission } = usePermission();

  // View permission is the gate for loading data. TEST_CASE_READ alone is enough
  // to fetch and display ALL test cases for the release — it must not be
  // conflated with assignment (which only decides the "My Test Cases" subset).
  const canViewTestCases = hasPermission(PERMISSIONS.TEST_CASE_READ);

  const [activeTab, setActiveTab] = useState<'MY' | 'ALL'>('MY');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeRelease, setActiveRelease] = useState<Release | null>(null);

  // Filters
  const [filters, setFilters] = useState({ ...INITIAL_FILTERS });

  // Options for filters
  const [options, setOptions] = useState<{ modules: any[]; severities: any[]; priorities: any[] }>({
    modules: [],
    severities: [],
    priorities: [],
  });
  const [subModules, setSubModules] = useState<SubModuleOption[]>([]);
  const [subModulesLoading, setSubModulesLoading] = useState(false);

  // Reassign Modal
  const [reassignModalVisible, setReassignModalVisible] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [targetEmployeeId, setTargetEmployeeId] = useState<number | string>('');
  const [qaEmployees, setQaEmployees] = useState<ProjectEmployee[]>([]);
  const [loadingReassignOptions, setLoadingReassignOptions] = useState(false);
  const [submittingReassign, setSubmittingReassign] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchActiveReleaseAndOptions();
    }
  }, [projectId]);

  useEffect(() => {
    // Check the correct permission (TEST_CASE_READ) BEFORE loading data. Note we
    // intentionally do NOT require `user?.id` here: having view permission is
    // sufficient to fetch every test case in the release, so the "All Test
    // Cases" tab populates even for a viewer with nothing assigned to them.
    if (projectId && activeRelease?.id && canViewTestCases) {
      resetAndFetch();
    }
  }, [projectId, filters, activeRelease?.id, canViewTestCases]);

  // Resolve a release to load test cases from. We deliberately DON'T hard-depend
  // on the dedicated "active release" endpoint: a user with TEST_CASE_READ but
  // without release-level access (that endpoint can 403), or a project that has
  // no release flagged "active", must still be able to fetch and view all test
  // cases. So we try the active-release endpoint first, then transparently fall
  // back to the project's release list — preferring an active release, else the
  // most recent one. Test cases only fail to load if the project truly has none.
  const resolveRelease = async (): Promise<Release | null> => {
    const unwrapSingle = (raw: any): Release | null => {
      let data = raw?.data?.data ?? raw?.data ?? null;
      if (Array.isArray(data)) return data.length ? data[0] : null;
      if (data && !Array.isArray(data) && Array.isArray(data.content)) {
        return data.content.length ? data.content[0] : null;
      }
      return data && data.id ? data : null;
    };

    const pickFromList = (raw: any): Release | null => {
      let list = raw?.data?.data ?? raw?.data ?? [];
      if (list && !Array.isArray(list) && Array.isArray(list.content)) list = list.content;
      if (!Array.isArray(list) || list.length === 0) return null;
      const active = list.find(
        (r: any) => r?.isActive || r?.active || String(r?.status).toUpperCase() === 'ACTIVE',
      );
      return (active || list[0]) as Release;
    };

    // 1) Preferred: the dedicated active-release endpoint.
    try {
      const res = await getActiveRelease(projectId);
      const release = unwrapSingle(res);
      if (release?.id) return release;
      console.warn('⚠️ Active-release endpoint returned no usable release; falling back to release list.');
    } catch (err) {
      console.warn('⚠️ Active-release endpoint failed; falling back to release list.', err);
    }

    // 2) Fallback: the project's release list. Independent of "active" status and
    //    of the active-release endpoint, so TEST_CASE_READ users aren't blocked.
    try {
      const res = await getReleases(projectId);
      const release = pickFromList(res);
      if (release?.id) return release;
    } catch (err) {
      console.warn('⚠️ Release-list fallback failed.', err);
    }

    return null;
  };

  const fetchActiveReleaseAndOptions = async () => {
    if (!projectId) return;
    try {
      const release = await resolveRelease();

      if (!release?.id) {
        toast.warning('No release found for this project yet.', 'No release');
        setLoading(false);
        return;
      }

      setActiveRelease(release);

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

      const [modules, severities, priorities] = await Promise.all([
        safeFetch(getProjectModules(projectId), 'Modules'),
        safeFetch(getSeverities(), 'Severities'),
        safeFetch(getPriorities(), 'Priorities'),
      ]);
      setOptions({ modules, severities, priorities });
    } catch (error: any) {
      console.error('❌ Failed to load release information:', error);
      toast.error('Failed to load release information.');
      setLoading(false);
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
        const subs = normalizeSubModules(unwrapApiList(res));
        setSubModules(subs);
        if (!isSubModuleValid(subs, filters.subModuleId)) {
          setFilters(prev => ({ ...prev, subModuleId: '' }));
        }
      })
      .catch(() => setSubModules([]))
      .finally(() => setSubModulesLoading(false));
  }, [filters.moduleId]);

  const fetchTestCases = async (pageNumber: number, isRefreshing = false) => {
    if (!activeRelease?.id) return;

    try {
      if (pageNumber === 0) setLoading(true);

      const queryParams: any = {
        page: pageNumber,
        size: PAGE_SIZE,
      };

      if (filters.searchTerm) queryParams.description = filters.searchTerm;
      if (filters.moduleId) queryParams.moduleId = filters.moduleId;
      if (filters.subModuleId) queryParams.subModuleId = filters.subModuleId;

      console.log(`📡 Fetching test cases. Params:`, JSON.stringify(queryParams));
      const response = await getTestCases(activeRelease.id, queryParams);

      if (!response || !response.data) throw new Error('Invalid response');

      // Tolerate the different envelopes the backend may return so a valid list
      // is never dropped as "not an array":
      //   { data: { data: [...] } } | { data: [...] } | { data: { content: [...] } }
      let rawTestCases = response.data?.data ?? response.data ?? [];
      if (rawTestCases && !Array.isArray(rawTestCases) && Array.isArray(rawTestCases.content)) {
        rawTestCases = rawTestCases.content;
      }

      if (!Array.isArray(rawTestCases)) {
        if (pageNumber === 0) setTestCases([]);
        setHasMore(false);
        return;
      }

      const newTestCases: TestCase[] = rawTestCases.map((item: any) => {
        const executionStatus = item.executionStatus || {};
        return {
          id: item.id,
          testCaseNo: item.no || item.testCaseNumber || `TC-${item.id}`,
          description: item.description || '',
          severityId: item.severityId || item.severity?.id,
          severityName: item.severityName || item.severity?.name || 'Unknown',
          severityColor: item.severityColor || item.severity?.color,
          priorityId: item.priorityId || item.priority?.id,
          priorityName: item.priorityName || item.priority?.name || 'Unknown',
          priorityColor: item.priorityColor || item.priority?.color,
          testCaseTypeId: item.defectTypeId,
          testCaseTypeName: item.defectTypeName || 'Unknown',
          moduleId: item.moduleId || item.module?.id,
          moduleName: item.moduleName || item.module?.name || 'Unknown',
          subModuleId: item.subModuleId || item.subModule?.id,
          subModuleName: item.subModuleName || item.subModule?.name || '',
          releaseId: item.releaseId || item.release?.id || activeRelease.id,
          releaseName: item.releaseName || item.release?.name || activeRelease.name,
          assignedToId: item.assignedToId || item.assignedTo?.id,
          assignedToName: (typeof item.assignedTo === 'string' ? item.assignedTo : item.assignedTo?.name) || item.assignedToName || 'Unassigned',
          defectNo: item.defectNo || item.defect?.defectNo || item.defectNumber,
          executionStatusId: executionStatus.id || item.executionStatusId,
          executionStatusName: executionStatus.name || item.executionStatusName || 'Not Executed',
          executionStatusColor: executionStatus.color || item.executionStatusColor || '#64748b',
          _raw: item
        };
      });

      console.log(
        `✅ Test cases fetched: ${newTestCases.length} (release ${activeRelease.id}, page ${pageNumber})`,
      );

      if (isRefreshing || pageNumber === 0) {
        setTestCases(newTestCases);
      } else {
        setTestCases(prev => [...prev, ...newTestCases]);
      }
      setHasMore(newTestCases.length === PAGE_SIZE);
    } catch (error: any) {
      console.error('❌ Failed to fetch test cases:', error);
      toast.error('Failed to load test cases.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const resetAndFetch = () => {
    setPage(0);
    setHasMore(true);
    fetchTestCases(0, true);
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
      fetchTestCases(nextPage);
    }
  };

  const handleReassignInitiate = async (testCase: TestCase) => {
    // Validate permission before opening the reassign flow / API calls.
    if (!can.testCase.assign) {
      toast.error('You do not have permission to reassign test cases.', 'Permission denied');
      return;
    }
    setSelectedTestCase(testCase);
    setTargetEmployeeId('');
    setQaEmployees([]);
    setReassignModalVisible(true);
    setLoadingReassignOptions(true);

    try {
      const response = await getProjectEmployees(projectId);
      let employees = response.data?.data ?? response.data ?? [];
      if (employees && !Array.isArray(employees) && Array.isArray(employees.content)) {
        employees = employees.content;
      }
      if (!Array.isArray(employees)) employees = [];

      const qaOnly = employees.filter((emp: any) => QA_ROLE_TYPES.includes(emp.roleType));

      const mappedEmployees: ProjectEmployee[] = qaOnly.map((emp: any) => {
        const fullName = `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim();
        return {
          id: emp.id ?? emp.employeeId,
          employeeId: emp.employeeId,
          firstName: emp.firstName,
          lastName: emp.lastName,
          name: fullName || emp.name || emp.employeeName || `Employee ${emp.employeeId}`,
          email: emp.email,
          roleType: emp.roleType,
        };
      });

      setQaEmployees(mappedEmployees);
    } catch (error: any) {
      console.error('❌ Failed to fetch QA employees:', error);
      toast.error('Failed to load QA team members.');
      setReassignModalVisible(false);
    } finally {
      setLoadingReassignOptions(false);
    }
  };

  const handleReassignConfirm = async () => {
    if (!selectedTestCase || !targetEmployeeId || submittingReassign || !activeRelease?.id) return;
    // Re-validate at confirm time (defense-in-depth against stale UI state).
    if (!can.testCase.assign) {
      toast.error('You do not have permission to reassign test cases.', 'Permission denied');
      setReassignModalVisible(false);
      return;
    }

    setSubmittingReassign(true);
    try {
      const employee = qaEmployees.find(e => Number(e.employeeId) === Number(targetEmployeeId));
      const payload: TestCaseReassignPayload = { testCaseId: selectedTestCase.id, isAssigned: true };

      await reassignTestCase(activeRelease.id, targetEmployeeId, payload);
      setReassignModalVisible(false);
      toast.success(`Reassigned to ${employee?.name || 'QA'}.`);

      setTestCases(prev => prev.map(tc => tc.id === selectedTestCase.id ? {
        ...tc,
        assignedToId: Number(targetEmployeeId),
        assignedToName: employee?.name || 'Assigned',
        _raw: { ...tc._raw, assignedToId: Number(targetEmployeeId), assignedTo: { id: Number(targetEmployeeId), name: employee?.name } },
      } : tc));
    } catch (error: any) {
      console.error('❌ Reassign failed:', error.response?.data || error.message);
      toast.error(getApiErrorMessage(error, 'Reassignment failed. Please try again.'));
    } finally {
      setSubmittingReassign(false);
    }
  };

  const myTestCases = useMemo(() => testCases.filter(tc => String(tc.assignedToId) === String(user?.id)), [testCases, user?.id]);
  const allTestCases = useMemo(() => testCases, [testCases]);
  const visibleTestCases = activeTab === 'MY' ? myTestCases : allTestCases;

  // View-only users (e.g. someone with TEST_CASE_READ but no assigned test
  // cases) would otherwise land on the empty "My Test Cases" tab and think
  // nothing exists. After the first load, if there are viewable test cases but
  // none assigned to the user, switch to "All Test Cases" so the list shows.
  // Runs once per screen instance; the user can still switch tabs freely after.
  const didAutoSelectTab = useRef(false);
  useEffect(() => {
    if (loading || didAutoSelectTab.current) return;
    if (testCases.length > 0) {
      didAutoSelectTab.current = true;
      if (myTestCases.length === 0) {
        setActiveTab('ALL');
      }
    }
  }, [loading, testCases.length, myTestCases.length]);

  const severityColorMap = useMemo(() => buildColorMap(options.severities), [options.severities]);
  const priorityColorMap = useMemo(() => buildColorMap(options.priorities), [options.priorities]);

  return (
    <SafeAreaView style={styles.container}>
      <TestCaseFilterArea
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
            My Test Cases
            {myTestCases.length > 0 && <Text style={styles.countText}>  {myTestCases.length}</Text>}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'ALL' && styles.activeTab]} onPress={() => setActiveTab('ALL')}>
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.activeTabText]}>
            All Test Cases
            {allTestCases.length > 0 && <Text style={styles.countText}>  {allTestCases.length}</Text>}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visibleTestCases}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <TestCaseCard
              testCase={item}
              isMyTestCase={activeTab === 'MY'}
              onReassign={handleReassignInitiate}
              severityColorMap={severityColorMap}
              priorityColorMap={priorityColorMap}
              index={index}
            />
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.primary]} />}
          ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} /> : null}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name={!activeRelease ? 'inbox' : 'search'} size={48} color={Colors.borderStrong} />
              <Text style={styles.emptyText}>
                {!activeRelease
                  ? 'No release found for this project yet.'
                  : activeTab === 'MY' && allTestCases.length > 0
                  ? 'No test cases are assigned to you. Switch to "All Test Cases" to browse them.'
                  : 'No test cases found matching your criteria.'}
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={reassignModalVisible} title="Reassign QA" onClose={() => setReassignModalVisible(false)} onConfirm={handleReassignConfirm} confirmText="Reassign" confirmLoading={submittingReassign}>
        <View style={styles.modalContent}>
          <Text style={styles.modalLabel}>Select QA Team Member</Text>
          {loadingReassignOptions ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Dropdown
              items={qaEmployees.filter(e => Number(e.employeeId) !== Number(selectedTestCase?.assignedToId)).map(e => ({ label: e.name, value: e.employeeId }))}
              selectedValue={targetEmployeeId}
              onSelect={setTargetEmployeeId}
              placeholder="Pick QA Member"
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
  tabBar: { flexDirection: 'row', backgroundColor: Colors.white, paddingHorizontal: 16, paddingTop: 8, gap: 12, zIndex: 10 },
  tab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  activeTab: { backgroundColor: Colors.primarySoft, borderColor: Colors.primaryLight },
  tabText: { ...Typography.bodyBold, fontSize: 13, color: Colors.textSecondary },
  activeTabText: { color: Colors.primary },
  countText: { fontSize: 11, color: Colors.textLight },
  listContent: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { ...Typography.subtitle, textAlign: 'center', marginTop: 16, color: Colors.textLight },
  modalContent: { marginVertical: 8 },
  modalLabel: { ...Typography.overline, marginBottom: 8 },
  modalDropdown: { width: '100%' },
});

export default TestCasesScreen;
