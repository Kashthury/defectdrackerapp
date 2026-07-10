import apiClient from '../../lib/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const projectReleaseCardView = async (projectId: string | number) => {
  const response = await apiClient.get(ENDPOINTS.releaseById(Number(projectId)));

  const mapped = {
    ...response.data,
    data: response.data.data.map((r: any) => ({
      ...r,
      releaseName: r.name,
    })),
  };

  return mapped;
};