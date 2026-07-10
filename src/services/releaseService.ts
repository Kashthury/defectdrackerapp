import api from '../lib/api';

export const getReleases = (projectId: number | string) =>
  api.get(`/project/${projectId}/release`);