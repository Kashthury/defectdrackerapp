import api from '../lib/api';
import { ENDPOINTS } from '../constants/endpoints';

/**
 * A project the signed-in user is allowed to access. The backend returns
 * `projectId` / `projectName`, but we normalize to also expose `id` / `name`
 * so consumers can use either shape safely.
 */
export interface AccessibleProject {
  id: number;
  projectId: number;
  name: string;
  projectName: string;
  /** Original payload, in case a screen needs extra fields. */
  raw?: any;
}

/**
 * Pulls a permission string[] out of the many shapes a backend might return:
 *   ["DEFECT_READ", ...]
 *   { data: ["DEFECT_READ", ...] }
 *   { permissions: ["DEFECT_READ", ...] }
 *   { data: { permissions: [...] } }
 *   [{ name: "DEFECT_READ" }, { code: "DEFECT_CREATE" }, ...]
 * Always returns a de-duplicated array of non-empty strings.
 */
export const normalizePermissions = (payload: any): string[] => {
  let list: any = payload;

  // Unwrap common envelopes.
  if (list && !Array.isArray(list)) {
    list = list.data ?? list.permissions ?? list.globalPermissions ?? list.authorities ?? list;
  }
  if (list && !Array.isArray(list) && Array.isArray(list.permissions)) {
    list = list.permissions;
  }
  if (!Array.isArray(list)) return [];

  const result = list
    .map((entry: any) => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object') {
        return entry.name ?? entry.code ?? entry.permission ?? entry.authority ?? '';
      }
      return '';
    })
    .map((s: string) => String(s).trim())
    .filter(Boolean);

  return Array.from(new Set(result));
};

/**
 * Normalizes the accessible-projects response into AccessibleProject[].
 */
export const normalizeAccessibleProjects = (payload: any): AccessibleProject[] => {
  let list: any = payload;
  if (list && !Array.isArray(list)) {
    list = list.data ?? list.content ?? list.projects ?? [];
  }
  if (list && !Array.isArray(list) && Array.isArray(list.content)) {
    list = list.content;
  }
  if (!Array.isArray(list)) return [];

  return list
    .map((item: any) => {
      const id = Number(item.projectId ?? item.id);
      const name = item.projectName ?? item.name ?? `Project ${id}`;
      if (!id && id !== 0) return null;
      return { id, projectId: id, name, projectName: name, raw: item } as AccessibleProject;
    })
    .filter(Boolean) as AccessibleProject[];
};

/**
 * Fetches the list of projects the current user is allocated to / may access.
 * GET /user/me/projects
 */
export const fetchAccessibleProjects = async (): Promise<AccessibleProject[]> => {
  const res = await api.get(ENDPOINTS.USER_PROJECTS);
  return normalizeAccessibleProjects(res?.data);
};

/**
 * Fetches the signed-in user's account-wide (global) permissions from the
 * backend. This is what lets the app pick up permission changes made on another
 * platform (e.g. the web app) without requiring a logout/login.
 * GET /user/me/permissions
 *
 * Returns a de-duplicated string[]; callers should treat a thrown error or an
 * empty result as "keep the currently cached permissions" so a transient
 * network/endpoint issue never wipes a user's access.
 */
export const fetchCurrentUserPermissions = async (): Promise<string[]> => {
  const res = await api.get(ENDPOINTS.CURRENT_USER_PERMISSIONS);
  return normalizePermissions(res?.data);
};

/**
 * Fetches the effective permissions for the user within a specific project.
 * GET /user/me/projects/{projectId}/permissions
 */
export const fetchProjectPermissions = async (
  projectId: number | string,
): Promise<string[]> => {
  const res = await api.get(ENDPOINTS.PROJECT_PERMISSIONS(projectId));
  return normalizePermissions(res?.data);
};
