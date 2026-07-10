import api from '../lib/api';
import { ENDPOINTS } from '../constants/endpoints';

export const getDashboardData = (projectId: number | string) =>
  api.get(ENDPOINTS.DASHBOARD(projectId));

export const getDefectSeveritySummary = (projectId: number | string) =>
  api.get(ENDPOINTS.DEFECT_SEVERITY_BREAKDOWN(projectId));

export const getDefectDensity = (projectId: number | string) =>
  api.get(ENDPOINTS.DEFECT_DENSITY(projectId));

export const getDefectSeverityIndex = (projectId: number | string) =>
  api.get(ENDPOINTS.DEFECT_SEVERITY_INDEX(projectId));

export const getDefectRemarkRatio = (projectId: number | string) =>
  api.get(ENDPOINTS.REMARK_RATIO(projectId));

export const getReopenSummary = (projectId: number | string, releaseId?: number | string) =>
  api.get(ENDPOINTS.REOPEN_SUMMARY(projectId, releaseId));

export const getDefectTypeDistribution = (projectId: number | string) =>
  api.get(ENDPOINTS.DEFECT_TYPE(projectId));

export const getTimeToFind = (projectId: number | string, releaseId: number | string) =>
  api.get(ENDPOINTS.TIME_TO_FIND(projectId, releaseId));

export const getTimeToFix = (projectId: number | string, releaseId: number | string) =>
  api.get(ENDPOINTS.TIME_TO_FIX(projectId, releaseId));

export const getDefectsByModule = (projectId: number | string) =>
  api.get(ENDPOINTS.DEFECT_BY_MODULE(projectId));