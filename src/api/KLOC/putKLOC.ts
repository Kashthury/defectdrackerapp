import apiClient from '../../lib/api';
import { ENDPOINTS } from '../../constants/endpoints';

// ---- Request & Response Interfaces ----
export interface CalculateKlocRequest {
  backendRepo: string;
  frontendRepo: string;
  githubUsername: string;
  githubToken: string;
}

export interface CalculateKlocResponse {
  status: string;
  statusCode: number;
  statusMessage: string;
  data: {
    backendLOC: number;
    frontendLOC: number;
    backendKLOC: number;
    frontendKLOC: number;
    totalKLOC: number;
  };
}

export interface UpdateKlocResponse {
  status: string;
  statusCode: number;
  statusMessage: string;
  data: {
    id: number;
    projectId: number;
    projectName: string;
    kloc: number;
    createdAt: string;
    updatedAt: string;
    createdBy: number;
    updatedBy: number;
  };
}

// ---- API Calls ----

/**
 * Update KLOC for a specific project
 * @param projectId - Project ID
 * @param kloc - New KLOC value
 * @returns Promise<UpdateKlocResponse>
 */
export const updateProjectKloc = async (
  projectId: number,
  kloc: number
): Promise<UpdateKlocResponse> => {
  const response = await apiClient.patch(
    ENDPOINTS.PROJECT_KILO_OF_CODE(projectId),
    { kloc }
  );
  return response.data;
};

/**
 * Calculate KLOC from GitHub repositories
 * @param payload - GitHub repo details
 * @returns Promise<CalculateKlocResponse>
 */
export const calculateKlocFromGithub = async (
  payload: CalculateKlocRequest
): Promise<CalculateKlocResponse> => {
  const response = await apiClient.post(ENDPOINTS.GIT_KLOC, payload);
  return response.data;
};