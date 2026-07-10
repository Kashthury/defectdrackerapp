import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import Dropdown from '../../components/common/Dropdown';
import RiskBadge from '../../components/common/RiskBadge';
import ProjectSelector from '../../components/project/ProjectSelector';
import SeverityBreakdown from '../../components/dashboard/SeverityBreakdown';
import { DefectDensityMeter } from '../../components/dashboard/DefectDensityMeter';
import { DefectSeverityIndex } from '../../components/dashboard/DefectSeverityIndex';
import { DefectToRemarkRatio } from '../../components/dashboard/DefectToRemarkRatio';
import { ReopenedPieChart } from '../../components/dashboard/ReopenedPieChart';
import { DefectTypePieChart } from '../../components/dashboard/DefectTypePieChart';
import { DefectsByModuleChart } from '../../components/dashboard/DefectsByModuleChart';
import { TimeLineChart } from '../../components/dashboard/TimeLineChart';
import { projectReleaseCardView } from '../../api/releaseView/ProjectReleaseCardView';
import { getUserProjects } from '../../services/projectService';
import { getCombinedRisk } from '../../utils/riskUtils';
import { Colors } from '../../constants/colors';
import { ENDPOINTS } from '../../constants/endpoints';
import apiClient from '../../lib/api';
import {
  updateProjectKloc,
  calculateKlocFromGithub,
  CalculateKlocRequest,
} from '../../api/KLOC/putKLOC';

const ProjectDetailScreen = () => {
  const route = useRoute();
  const initialProjectId = (route.params as any)?.projectId as number;

  // ---- ALL HOOKS ----
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<number>(initialProjectId);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState('Project');
  const [releases, setReleases] = useState<{ label: string; value: number }[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<number | null>(null);
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [releasesError, setReleasesError] = useState<string | null>(null);

  // Severity
  const [severitySummary, setSeveritySummary] = useState<any>(null);
  const [loadingSeverity, setLoadingSeverity] = useState(false);
  const [severityError, setSeverityError] = useState<string | null>(null);

  // Risk metrics
  const [defectDensity, setDefectDensity] = useState<number>(0);
  const [dsi, setDsi] = useState<number>(0);
  const [dsiStatus, setDsiStatus] = useState<string>('Healthy');
  const [remarkCategory, setRemarkCategory] = useState<string>('Low');
  const [risk, setRisk] = useState<'high' | 'medium' | 'low'>('low');

  // Defect Density + KLOC
  const [defectDensityData, setDefectDensityData] = useState<any>(null);
  const [klocInput, setKlocInput] = useState<number>(0.1);
  const [klocChanged, setKlocChanged] = useState(false);
  const [updatingKloc, setUpdatingKloc] = useState(false);
  const [densityError, setDensityError] = useState<string | null>(null);

  // DSI
  const [loadingDsi, setLoadingDsi] = useState(false);
  const [dsiError, setDsiError] = useState<string | null>(null);

  // Remark Ratio
  const [remarkRatioPercentage, setRemarkRatioPercentage] = useState<number>(0);
  const [remarkRatioCategory, setRemarkRatioCategory] = useState<string>('Low');
  const [remarkRatioColor, setRemarkRatioColor] = useState<string>('#22c55e');
  const [loadingRemarkRatio, setLoadingRemarkRatio] = useState(false);
  const [remarkError, setRemarkError] = useState<string | null>(null);

  // Reopen
  const [reopenedCount, setReopenedCount] = useState<number>(0);
  const [notReopenedCount, setNotReopenedCount] = useState<number>(0);
  const [loadingReopen, setLoadingReopen] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  // Defect Type
  const [defectTypeData, setDefectTypeData] = useState<any>(null);
  const [loadingDefectType, setLoadingDefectType] = useState(false);
  const [defectTypeError, setDefectTypeError] = useState<string | null>(null);

  // Defects by Module
  const [defectsByModuleData, setDefectsByModuleData] = useState<any>(null);
  const [loadingDefectsByModule, setLoadingDefectsByModule] = useState(false);
  const [defectsByModuleError, setDefectsByModuleError] = useState<string | null>(null);

  // Charts
  const [releaseDailyDefects, setReleaseDailyDefects] = useState<any[]>([]);
  const [loadingReleaseDailyDefects, setLoadingReleaseDailyDefects] = useState(false);
  const [releaseDailyFixedDefects, setReleaseDailyFixedDefects] = useState<any[]>([]);
  const [loadingReleaseDailyFixedDefects, setLoadingReleaseDailyFixedDefects] = useState(false);

  // KLOC Modal
  const [showKlocModal, setShowKlocModal] = useState(false);
  const [klocModalForm, setKlocModalForm] = useState<CalculateKlocRequest>({
    backendRepo: '',
    frontendRepo: '',
    githubUsername: '',
    githubToken: '',
  });
  const [calculatingKloc, setCalculatingKloc] = useState(false);
  const [klocModalError, setKlocModalError] = useState<string | null>(null);

  const isUpdatingRef = useRef(false);
  const isCalculatingRef = useRef(false);

  // ---- Effects ----
  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      fetchSeverity();
      fetchRiskAndDensity();
      fetchDefectTypes();
      fetchDefectsByModule();
      fetchReleases();
      updateProjectName();
    }
  }, [projectId]);

  useEffect(() => {
    if (projects.length > 0 && projectId) {
      updateProjectName(projects);
    }
  }, [projects]);

  // ---- Fetch releases ----
  const fetchReleases = async () => {
    if (!projectId) return;
    setLoadingReleases(true);
    setReleasesError(null);
    try {
      const res = await projectReleaseCardView(projectId);
      const data = res?.data || [];
      const items = data.map((r: any) => ({
        label: r.releaseName || r.name,
        value: Number(r.id),
      }));
      setReleases(items);
      if (items.length > 0) {
        setSelectedRelease(items[0].value);
      } else {
        setSelectedRelease(null);
      }
    } catch (error) {
      setReleasesError('Failed to load releases');
      setReleases([]);
      setSelectedRelease(null);
    } finally {
      setLoadingReleases(false);
    }
  };

  // ---- Fetch time‑to‑find data ----
  useEffect(() => {
    if (projectId && selectedRelease) {
      setLoadingReleaseDailyDefects(true);
      apiClient
        .get(ENDPOINTS.TIME_TO_FIND(projectId, selectedRelease))
        .then((response) => {
          const data = response.data?.data || [];
          setReleaseDailyDefects(data);
          setLoadingReleaseDailyDefects(false);
        })
        .catch(() => {
          setReleaseDailyDefects([]);
          setLoadingReleaseDailyDefects(false);
        });
    } else {
      setReleaseDailyDefects([]);
    }
  }, [projectId, selectedRelease]);

  // ---- Fetch time‑to‑fix data ----
  useEffect(() => {
    if (projectId && selectedRelease) {
      setLoadingReleaseDailyFixedDefects(true);
      apiClient
        .get(ENDPOINTS.TIME_TO_FIX(projectId, selectedRelease))
        .then((response) => {
          const data = response.data?.data || [];
          setReleaseDailyFixedDefects(data);
          setLoadingReleaseDailyFixedDefects(false);
        })
        .catch(() => {
          setReleaseDailyFixedDefects([]);
          setLoadingReleaseDailyFixedDefects(false);
        });
    } else {
      setReleaseDailyFixedDefects([]);
    }
  }, [projectId, selectedRelease]);

  // ---- Other fetch functions ----
  const fetchProjects = async () => {
    try {
      const res = await getUserProjects();
      const data = res?.data?.data || res?.data || [];
      setProjects(data);
      updateProjectName(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const updateProjectName = (projectsList = projects) => {
    if (projectsList.length > 0 && projectId) {
      const found = projectsList.find(
        (p) => Number(p.id || p.projectId) === Number(projectId)
      );
      if (found) {
        setProjectName(found.projectName || found.name || 'Project');
      }
    }
  };

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const res = await projectReleaseCardView(projectId);
      const data = res?.data || [];
      if (data.length > 0) {
        const items = data.map((r: any) => ({
          label: r.releaseName || r.name,
          value: Number(r.id),
        }));
        setReleases(items);
        setSelectedRelease(items[0]?.value || null);
      } else {
        setReleases([]);
        setSelectedRelease(null);
      }
    } catch (error) {
      console.error('Failed to fetch releases:', error);
      setReleases([]);
      setSelectedRelease(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeverity = async () => {
    setLoadingSeverity(true);
    setSeverityError(null);
    try {
      const response = await apiClient.get(ENDPOINTS.DEFECT_SEVERITY_BREAKDOWN(projectId));
      setSeveritySummary(response.data);
    } catch (error) {
      setSeverityError('Failed to load severity breakdown');
      setSeveritySummary(null);
    } finally {
      setLoadingSeverity(false);
    }
  };

  const fetchDefectTypes = async () => {
    if (!projectId) return;
    setLoadingDefectType(true);
    setDefectTypeError(null);
    try {
      const response = await apiClient.get(ENDPOINTS.DEFECT_TYPE(projectId));
      const items = response.data?.data || [];
      if (items.length === 0) {
        setDefectTypeData(null);
        setDefectTypeError('No defect type data available');
        setLoadingDefectType(false);
        return;
      }
      const total = items.reduce((sum: number, item: any) => sum + (item.defectCount || 0), 0);
      const defectTypes = items.map((item: any) => ({
        defectTypeName: item.defectTypeName || 'Unknown',
        defectCount: item.defectCount || 0,
        percentage: total > 0 ? (item.defectCount / total) * 100 : 0,
      }));
      let mostCommon = defectTypes[0];
      for (const item of defectTypes) {
        if (item.defectCount > mostCommon.defectCount) {
          mostCommon = item;
        }
      }
      setDefectTypeData({
        defectTypes,
        totalDefectCount: total,
        mostCommonDefectType: mostCommon.defectTypeName,
        mostCommonDefectCount: mostCommon.defectCount,
      });
    } catch (error) {
      setDefectTypeError('Failed to load defect type distribution');
      setDefectTypeData(null);
    } finally {
      setLoadingDefectType(false);
    }
  };

  const fetchDefectsByModule = async () => {
    if (!projectId) return;
    setLoadingDefectsByModule(true);
    setDefectsByModuleError(null);
    try {
      const response = await apiClient.get(ENDPOINTS.DEFECT_BY_MODULE(projectId));
      const rawData = response.data?.data || [];
      if (rawData.length === 0) {
        setDefectsByModuleData(null);
        setDefectsByModuleError('No data available');
        setLoadingDefectsByModule(false);
        return;
      }
      const mapped = rawData.map((item: any) => ({
        name: item.moduleName || item.module || item.name || 'Unknown',
        value: item.defectCount || item.count || item.value || 0,
        percentage: item.percentage || 0,
      }));
      const total = mapped.reduce((sum: number, m: any) => sum + m.value, 0);
      const withPercentage = mapped.map((m: any) => ({
        ...m,
        percentage: m.percentage || (total > 0 ? (m.value / total) * 100 : 0),
      }));
      setDefectsByModuleData(withPercentage);
    } catch (error) {
      setDefectsByModuleError('Failed to load defects by module');
      setDefectsByModuleData(null);
    } finally {
      setLoadingDefectsByModule(false);
    }
  };

  const fetchRiskAndDensity = async () => {
    setDensityError(null);
    setDsiError(null);
    setRemarkError(null);
    setReopenError(null);

    setLoadingRemarkRatio(true);
    try {
      const response = await apiClient.get(ENDPOINTS.REMARK_RATIO(projectId));
      const data = response.data?.data || {};
      const percentage = data.ratioPercentage ?? 0;
      const status = data.ratioStatus ?? 'Low';
      setRemarkRatioPercentage(percentage);
      setRemarkRatioCategory(status);
      let color = Colors.success;
      if (status === 'High') color = Colors.error;
      else if (status === 'Medium') color = Colors.warning;
      setRemarkRatioColor(color);
      setRemarkCategory(status.toLowerCase());
    } catch (error) {
      setRemarkError('Failed to load remark ratio');
      setRemarkCategory('low');
      setRemarkRatioCategory('Low');
      setRemarkRatioColor(Colors.success);
    } finally {
      setLoadingRemarkRatio(false);
    }

    try {
      const response = await apiClient.get(ENDPOINTS.DEFECT_DENSITY(projectId));
      const data = response.data?.data || {};
      const density = data.defectDensity ?? 0;
      const kloc = data.kloc ?? 0.1;
      const totalDefects = data.totalDefects ?? 0;
      setDefectDensityData({ kloc, totalDefects, defectDensity: density });
      setDefectDensity(density);
      if (!klocChanged) {
        setKlocInput(kloc);
      }
    } catch (error) {
      setDensityError('Failed to load defect density');
      setDefectDensityData(null);
    }

    setLoadingDsi(true);
    try {
      const response = await apiClient.get(ENDPOINTS.DEFECT_SEVERITY_INDEX(projectId));
      const data = response.data?.data || {};
      const dsiVal = data.dsiPercentage ?? 0;
      const status = data.dsiStatus ?? 'Healthy';
      setDsi(dsiVal);
      setDsiStatus(status);
    } catch (error) {
      setDsiError('Failed to load DSI');
      setDsi(0);
      setDsiStatus('Unknown');
    } finally {
      setLoadingDsi(false);
    }

    setLoadingReopen(true);
    try {
      const response = await apiClient.get(ENDPOINTS.REOPEN_SUMMARY(projectId));
      const data = response.data || {};
      setReopenedCount(data.reopenedCount ?? 0);
      setNotReopenedCount(data.notReopenedCount ?? 0);
    } catch (error) {
      setReopenError('Failed to load reopen summary');
      setReopenedCount(0);
      setNotReopenedCount(0);
    } finally {
      setLoadingReopen(false);
    }

    const remarkRisk = (remarkCategory as 'high' | 'medium' | 'low') || 'low';
    const densityValue = defectDensityData?.defectDensity ?? 0;
    let densityRisk: 'high' | 'medium' | 'low' = 'low';
    if (densityValue >= 10) densityRisk = 'high';
    else if (densityValue >= 7) densityRisk = 'medium';

    let dsiRisk: 'high' | 'medium' | 'low' = 'low';
    if (dsiStatus === 'Critical' || dsiStatus === 'High Risk') dsiRisk = 'high';
    else if (dsiStatus === 'Needs Attention') dsiRisk = 'medium';

    const combined = getCombinedRisk(remarkRisk, densityRisk, dsiRisk);
    setRisk(combined);
  };

  // ---- KLOC handlers ----
  const handleKlocInputChange = (text: string) => {
    const val = parseFloat(text) || 0.1;
    setKlocInput(val);
    setKlocChanged(true);
  };

  const handleKlocUpdate = async () => {
    if (isUpdatingRef.current || !klocChanged || !projectId) return;
    isUpdatingRef.current = true;
    setUpdatingKloc(true);
    try {
      const response = await updateProjectKloc(projectId, klocInput);
      const newKloc = response?.data?.kloc ?? klocInput;
      setKlocInput(newKloc);
      setKlocChanged(false);
      await fetchRiskAndDensity();
    } catch (error) {
      console.error('Failed to update KLOC:', error);
    } finally {
      isUpdatingRef.current = false;
      setUpdatingKloc(false);
    }
  };

  const handleCalculateKloc = async () => {
    if (isCalculatingRef.current) return;
    if (
      !klocModalForm.backendRepo ||
      !klocModalForm.frontendRepo ||
      !klocModalForm.githubUsername ||
      !klocModalForm.githubToken
    ) {
      setKlocModalError('Please fill all fields');
      return;
    }
    isCalculatingRef.current = true;
    setCalculatingKloc(true);
    try {
      const res = await calculateKlocFromGithub(klocModalForm);
      if (res?.data?.totalKLOC) {
        const calculated = res.data.totalKLOC;
        setKlocInput(calculated);
        setKlocChanged(true);
        setShowKlocModal(false);
        setKlocModalForm({
          backendRepo: '',
          frontendRepo: '',
          githubUsername: '',
          githubToken: '',
        });
        setKlocModalError(null);
      }
    } catch (error) {
      setKlocModalError('Failed to calculate KLOC. Check credentials and repo URLs.');
    } finally {
      isCalculatingRef.current = false;
      setCalculatingKloc(false);
    }
  };

  const handleProjectSelect = (id: string | number) => {
    const numId = Number(id);
    if (!isNaN(numId)) {
      setProjectId(numId);
      setKlocChanged(false);
    }
  };

  // ---- Chart data mappers ----
  const getTimeToFindData = () => {
    const defaultData = Array.from({ length: 7 }, (_, i) => ({
      day: `Day ${i + 1}`,
      value: 0,
    }));
    if (!releaseDailyDefects || releaseDailyDefects.length === 0) {
      return defaultData;
    }
    const dataMap: Record<string, number> = {};
    releaseDailyDefects.forEach((item: any) => {
      const day = item.day || `Day ${item.dayNumber}`;
      const count = item.defectCount ?? item.totalDefects ?? 0;
      dataMap[day] = count;
    });
    return defaultData.map((d) => ({
      day: d.day,
      value: dataMap[d.day] ?? 0,
    }));
  };

  const getTimeToFixData = () => {
    const defaultData = Array.from({ length: 7 }, (_, i) => ({
      day: `Day ${i + 1}`,
      value: 0,
    }));
    if (!releaseDailyFixedDefects || releaseDailyFixedDefects.length === 0) {
      return defaultData;
    }
    const dataMap: Record<string, number> = {};
    releaseDailyFixedDefects.forEach((item: any) => {
      const day = item.day || `Day ${item.dayNumber}`;
      const count = item.defectCount ?? item.defectFixedCount ?? 0;
      dataMap[day] = count;
    });
    return defaultData.map((d) => ({
      day: d.day,
      value: dataMap[d.day] ?? 0,
    }));
  };

  // ---- RENDER ----
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading project details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ProjectSelector
        projects={projects}
        selectedProjectId={projectId}
        onSelect={handleProjectSelect}
        placeholder="Search projects..."
      />

      <View style={styles.statusBar}>
        <Text style={styles.projectName}>{projectName}</Text>
        <RiskBadge risk={risk} />
      </View>

      {loadingSeverity ? (
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 16 }} />
      ) : severityError ? (
        <Text style={styles.errorText}>{severityError}</Text>
      ) : severitySummary ? (
        <SeverityBreakdown data={severitySummary} />
      ) : (
        <Text style={styles.noData}>No severity data available</Text>
      )}

      <View style={styles.defectDensityCard}>
        <Text style={styles.cardTitle}>Defect Density</Text>
        {densityError ? (
          <Text style={styles.errorText}>{densityError}</Text>
        ) : defectDensityData ? (
          <DefectDensityMeter
            defectDensity={defectDensityData.defectDensity}
            klocInput={klocInput}
            onKlocInputChange={handleKlocInputChange}
            onKlocUpdate={handleKlocUpdate}
            onCalculateClick={() => setShowKlocModal(true)}
            klocChanged={klocChanged}
            updating={updatingKloc}
          />
        ) : (
          <Text style={styles.noData}>No defect density data</Text>
        )}
      </View>

      <DefectSeverityIndex
        dsi={dsi}
        status={dsiStatus}
        loading={loadingDsi}
        error={dsiError}
      />

      <DefectToRemarkRatio
        ratio={`${remarkRatioPercentage.toFixed(2)}%`}
        category={remarkRatioCategory}
        color={remarkRatioColor}
        loading={loadingRemarkRatio}
        error={remarkError}
      />

      <ReopenedPieChart
        reopenedCount={reopenedCount}
        notReopenedCount={notReopenedCount}
        loading={loadingReopen}
        error={reopenError}
      />

      <DefectTypePieChart
        data={defectTypeData}
        loading={loadingDefectType}
        error={defectTypeError}
      />

      <DefectsByModuleChart
        data={defectsByModuleData}
        loading={loadingDefectsByModule}
        error={defectsByModuleError}
      />

      {/* ====== TIME TO FIND & TIME TO FIX CHARTS ====== */}
      <View style={styles.chartsSection}>
        <View style={styles.releaseRow}>
          <Text style={styles.releaseLabel}>Release:</Text>
          <Dropdown
            items={releases}
            selectedValue={selectedRelease ?? undefined}
            onSelect={(val) => setSelectedRelease(val as number)}
            placeholder="Select Release"
            disabled={loadingReleases || releases.length === 0}
          />
          {loadingReleases && (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />
          )}
          {releasesError && (
            <Text style={styles.errorText}>{releasesError}</Text>
          )}
        </View>

        <View style={styles.chartsRow}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Time to Find Defects</Text>
            {loadingReleaseDailyDefects ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <TimeLineChart
                data={getTimeToFindData()}
                color="#2563eb"
                label="Defects Count"
              />
            )}
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Time to Fix Defects</Text>
            {loadingReleaseDailyFixedDefects ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <TimeLineChart
                data={getTimeToFixData()}
                color="#10b981"
                label="Defects Fixed"
              />
            )}
          </View>
        </View>
      </View>

      {/* KLOC Modal */}
      <Modal
        visible={showKlocModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowKlocModal(false);
          setKlocModalError(null);
          setCalculatingKloc(false);
          isCalculatingRef.current = false;
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Calculate KLOC from GitHub</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Backend Repo URL"
              value={klocModalForm.backendRepo}
              onChangeText={(text) =>
                setKlocModalForm((p) => ({ ...p, backendRepo: text }))
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Frontend Repo URL"
              value={klocModalForm.frontendRepo}
              onChangeText={(text) =>
                setKlocModalForm((p) => ({ ...p, frontendRepo: text }))
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="GitHub Username"
              value={klocModalForm.githubUsername}
              onChangeText={(text) =>
                setKlocModalForm((p) => ({ ...p, githubUsername: text }))
              }
            />
            <TextInput
              style={styles.modalInput}
              placeholder="GitHub Token"
              secureTextEntry
              value={klocModalForm.githubToken}
              onChangeText={(text) =>
                setKlocModalForm((p) => ({ ...p, githubToken: text }))
              }
            />
            {klocModalError && (
              <Text style={styles.modalError}>{klocModalError}</Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowKlocModal(false);
                  setKlocModalError(null);
                  setCalculatingKloc(false);
                  isCalculatingRef.current = false;
                }}
                disabled={calculatingKloc}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.calculateButton]}
                onPress={handleCalculateKloc}
                disabled={calculatingKloc}
              >
                <Text style={styles.buttonText}>
                  {calculatingKloc ? 'Calculating...' : 'Calculate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: 12, fontSize: 16, color: Colors.textSecondary },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    borderRadius: 12,
    elevation: 2,
  },
  projectName: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  defectDensityCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  noData: { color: Colors.textLight, textAlign: 'center', paddingVertical: 20 },
  errorText: { color: Colors.error, textAlign: 'center', marginTop: 8, fontSize: 14 },
  chartsSection: { marginTop: 24 },
  releaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  releaseLabel: { fontSize: 16, fontWeight: '600', color: Colors.text, marginRight: 8 },
  chartsRow: {
    flexDirection: 'column',
    gap: 16,
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 200,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 74, 110, 0.4)', // Deep Sky Blue overlay
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 20, textAlign: 'center' },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: Colors.background,
    color: Colors.text,
  },
  modalError: { color: Colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, marginLeft: 12 },
  cancelButton: { backgroundColor: '#F3F4F6' },
  calculateButton: { backgroundColor: Colors.primary },
  buttonText: { fontWeight: '700', fontSize: 15, color: Colors.white },
});

export default ProjectDetailScreen;