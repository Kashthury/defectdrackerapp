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
  getActiveRelease,
  getTestCases,
  getProjectModules,
  getSubModules,
  getProjectEmployees,
  reassignTestCase,
} from '../../services/testCaseService';
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
    if (projectId && user?.id && activeRelease?.id) {
      resetAndFetch();
    }
  }, [projectId, filters, user?.id, activeRelease?.id]);

  const fetchActiveReleaseAndOptions = async () => {
    if (!projectId) return;
    try {
      const releaseResponse = await getActiveRelease(projectId);
      let releaseData = releaseResponse.data?.data || releaseResponse.data;
      
      if (Array.isArray(releaseData)) {
        if (releaseData.length === 0) {
          toast.warning('No active release found.', 'No active release');
          setLoading(false);
          return;
        }
        releaseData = releaseData[0];
      }
      
      if (!releaseData || !releaseData.id) {
        toast.warning('No active release found.', 'No active release');
        setLoading(false);
        return;
      }

      setActiveRelease(releaseData);

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
      console.error('❌ Failed to fetch active release:', error);
      toast.error('Failed to load active release.');
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

      let rawTestCases = response.data.data;
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
              <Icon name="search" size={48} color={Colors.borderStrong} />
              <Text style={styles.emptyText}>No test cases found matching your criteria.</Text>
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
