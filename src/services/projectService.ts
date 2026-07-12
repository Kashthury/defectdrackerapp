import api from '../lib/api';
import { ENDPOINTS } from '../constants/endpoints';
import { getProjectRiskFromMetrics, RiskLevel } from '../utils/riskUtils';

export const getUserProjects = () => api.get(ENDPOINTS.USER_PROJECTS);

/**
 * Resolves a single project's overall risk from its underlying metrics
 * (Defect Density, Defect Severity Index and Defect-to-Remark ratio).
 *
 * The three metric endpoints are fetched in parallel and each is guarded, so a
 * missing/failed metric simply contributes "low" instead of breaking the whole
 * dashboard. The highest risk across the metrics wins (see getCombinedRisk).
 */
export const getProjectRisk = async (
  projectId: number | string,
): Promise<RiskLevel> => {
  const safeGet = async (url: string): Promise<any> => {
    try {
      const res = await api.get(url);
      return res.data?.data ?? res.data ?? {};
    } catch {
      return {};
    }
  };

  const [density, dsi, remark] = await Promise.all([
    safeGet(ENDPOINTS.DEFECT_DENSITY(projectId)),
    safeGet(ENDPOINTS.DEFECT_SEVERITY_INDEX(projectId)),
    safeGet(ENDPOINTS.REMARK_RATIO(projectId)),
  ]);

  return getProjectRiskFromMetrics({
    defectDensity: density?.defectDensity ?? 0,
    dsiStatus: dsi?.dsiStatus ?? '',
    remarkStatus: remark?.ratioStatus ?? '',
  });
};

export const getProjectPermissions = (projectId: number | string) =>
  api.get(ENDPOINTS.PROJECT_PERMISSIONS(projectId));

export interface ProjectFilterParams {
  /** Free-text search on the project name. */
  projectName?: string;
  /** One of 'Active' | 'On Hold' | 'Completed'. Empty/undefined means no status filter. */
  status?: string;
}

/**
 * Fetches all projects, optionally filtered by name and/or status.
 * Wraps the backend `getAllProjects` endpoint: GET /project?projectName=&status=
 * Only non-empty params are sent, so an unset filter returns the full list.
 */
export const getAllProjects = (params: ProjectFilterParams = {}) => {
  const query: Record<string, string> = {};
  if (params.projectName && params.projectName.trim()) {
    query.projectName = params.projectName.trim();
  }
  if (params.status) {
    query.status = params.status;
  }
  return api.get(ENDPOINTS.PROJECT, { params: query });
};
