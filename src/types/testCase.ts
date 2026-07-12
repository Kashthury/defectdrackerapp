export interface TestCase {
  id: number;
  testCaseNo: string;
  description: string;
  severityId: number;
  severityName: string;
  severityColor?: string;
  priorityId: number;
  priorityName: string;
  priorityColor?: string;
  testCaseTypeId: number;
  testCaseTypeName: string;
  moduleId: number;
  moduleName: string;
  subModuleId: number;
  subModuleName: string;
  releaseId: number;
  releaseName: string;
  assignedToId: number;
  assignedToName: string;
  defectNo?: string;
  executionStatusId?: number;
  executionStatusName?: string;
  executionStatusColor?: string;
  _raw?: any; // To allow sending back the full object with modifications
}

export interface TestCaseExecution {
  id: number;
  testCaseId: number;
  executionStatusId: number;
  executionStatusName: string;
  executionStatusColor?: string;
}

export type EmployeeRoleType =
  | 'QA_LEAD'
  | 'QA_ENGINEER'
  | 'DEVELOPER'
  | 'TECH_LEAD'
  | 'PROJECT_MANAGER';

/**
 * Roles eligible to be assigned a test case. Only QA members may own a test
 * case, so developers, project managers and other roles are excluded from the
 * reassign dropdown.
 */
export const QA_ROLE_TYPES: EmployeeRoleType[] = ['QA_LEAD', 'QA_ENGINEER'];

export interface ProjectEmployee {
  id: number;
  employeeId: number;
  /** Raw name parts from the project-allocation employee response. */
  firstName?: string;
  lastName?: string;
  /** Display name, derived from `firstName lastName` when available. */
  name: string;
  email?: string;
  roleType: EmployeeRoleType;
}

/**
 * A single test-case assignment entry.
 * Sent to PATCH /release/{releaseId}/test-case/employee/{employeeId}
 * inside an `assignments` array: { assignments: [{ testCaseId, isAssigned }] }
 */
export interface TestCaseReassignPayload {
  testCaseId: number;
  isAssigned: boolean;
}

export interface Release {
  id: number;
  name: string;
  version?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface TestCaseFilters {
  searchTerm?: string;
  moduleId?: number | string;
  subModuleId?: number | string;
  severityId?: number | string;
  priorityId?: number | string;
  testCaseTypeId?: number | string;
  executionStatusId?: number | string;
  assignedToId?: number | string;
}
