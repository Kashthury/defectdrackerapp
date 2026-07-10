import api from '../lib/api';
import { ENDPOINTS } from '../constants/endpoints';
import { Defect, StatusTransition, Developer } from '../types/defect';

export const getDefects = (projectId: number | string, params: any) =>
  api.get(ENDPOINTS.DEFECTS(projectId), { params });

export const getNextStatuses = (statusId: number | string) =>
  api.get(ENDPOINTS.NEXT_STATUSES(statusId));

export const getProjectDevelopers = (projectId: number | string) =>
  api.get(ENDPOINTS.PROJECT_DEVELOPERS(projectId));

/**
 * Updates a defect using multipart/form-data.
 * The backend expects a 'data' part containing the JSON representation of the defect.
 */
export const updateDefect = (id: number | string, defectData: any) => {
  const formData = new FormData();

  // We send the JSON as a string. To help Spring's @RequestPart identify it as JSON,
  // we use the 'type' property in the object passed to append.
  formData.append('data', {
    string: JSON.stringify(defectData),
    type: 'application/json',
    name: 'blob' // Some backends look for a filename even for JSON parts
  } as any);

  // If there was an image, it would be:
  // formData.append('file', { uri: ..., name: 'image.jpg', type: 'image/jpeg' });

  return api.put(ENDPOINTS.DEFECT_BY_ID(id), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    // Prevent axios from trying to stringify the FormData object
    transformRequest: (data) => data,
  });
};

/**
 * Strictly maps the defect to the flat DTO expected by the backend.
 * Matches the user-provided sample:
 * {description, stepsToRecreation, expectedResult, actualResult, isAddTestCase,
 *  subModuleId, severityId, priorityId, statusId, defectTypeId, releaseId,
 *  assignedTo, testCaseId, removeAttachment}
 */
export const buildDefectUpdatePayload = (defect: any, overrides: any = {}) => {
  const raw = defect._raw || {};

  // Extract IDs safely from nested objects if flat IDs are missing
  const subModuleId = defect.subModuleId ?? raw.subModuleId ?? raw.subModule?.id;
  const severityId = defect.severityId ?? raw.severityId ?? raw.severity?.id;
  const priorityId = defect.priorityId ?? raw.priorityId ?? raw.priority?.id;
  const statusId = overrides.statusId ?? defect.statusId ?? raw.statusId ?? raw.status?.id;
  const defectTypeId = defect.defectTypeId ?? raw.defectTypeId ?? raw.defectType?.id;
  const releaseId = defect.releaseId ?? raw.releaseId ?? raw.release?.id;
  const assignedTo = overrides.assignedTo ?? defect.assignedToId ?? raw.assignedToId ?? raw.assignedTo?.id;

  return {
    description: defect.description ?? raw.description ?? '',
    stepsToRecreation: raw.stepsToRecreation ?? '',
    expectedResult: raw.expectedResult ?? '',
    actualResult: raw.actualResult ?? '',
    isAddTestCase: raw.isAddTestCase ?? false,
    subModuleId: subModuleId ? Number(subModuleId) : null,
    severityId: severityId ? Number(severityId) : null,
    priorityId: priorityId ? Number(priorityId) : null,
    statusId: statusId ? Number(statusId) : null,
    defectTypeId: defectTypeId ? Number(defectTypeId) : null,
    releaseId: releaseId ? Number(releaseId) : null,
    assignedTo: assignedTo ? Number(assignedTo) : null,
    testCaseId: raw.testCaseId ?? null,
    removeAttachment: raw.removeAttachment ?? false,
    ...overrides,
  };
};

export const getProjectModules = (projectId: number | string) =>
  api.get(ENDPOINTS.PROJECT_MODULES(projectId));

export const getSubModules = (moduleId: number | string) =>
  api.get(ENDPOINTS.MODULE_SUB_MODULES(moduleId));

export const getSeverities = () =>
  api.get(ENDPOINTS.SEVERITIES, { params: { page: 0, size: 100 } });

export const getPriorities = () =>
  api.get(ENDPOINTS.PRIORITIES, { params: { page: 0, size: 100 } });

export const getDefectTypes = () =>
  api.get(ENDPOINTS.DEFECT_TYPES, { params: { page: 0, size: 100 } });

export const getStatuses = () =>
  api.get(ENDPOINTS.STATUSES, { params: { page: 0, size: 100 } });

export const getProjectReleases = (projectId: number | string) =>
  api.get(ENDPOINTS.releaseById(Number(projectId)));

export const getSubModuleEmployees = (subModuleId: number | string) =>
  api.get(ENDPOINTS.SUB_MODULE_DEV(subModuleId));

export const getProjectAllocationEmployees = (projectId: number | string) =>
  api.get(ENDPOINTS.PROJECT_EMPLOYEES(projectId), { params: { page: 0, size: 200 } });
