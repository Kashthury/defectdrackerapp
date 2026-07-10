import api from '../lib/api';
import { ENDPOINTS } from '../constants/endpoints';

export const getUserProjects = () => api.get(ENDPOINTS.USER_PROJECTS);

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
