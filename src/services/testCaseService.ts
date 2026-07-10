import api from '../lib/api';
import { ENDPOINTS } from '../constants/endpoints';
import { TestCaseReassignPayload } from '../types/testCase';

/**
 * Get the active release for a project
 */
export const getActiveRelease = (projectId: number | string) =>
  api.get(ENDPOINTS.ACTIVE_RELEASE(projectId));

/**
 * Get test cases for a specific release with optional filters and pagination
 */
export const getTestCases = (releaseId: number | string, params: any) =>
  api.get(ENDPOINTS.TEST_CASES(releaseId), { params });

/**
 * Get project employees (QA members)
 */
export const getProjectEmployees = (projectId: number | string) =>
  api.get(ENDPOINTS.PROJECT_EMPLOYEES(projectId));

/**
 * Reassign a test case to a QA employee.
 * PATCH /release/{releaseId}/test-case/employee/{employeeId}
 * Body: { assignments: [{ testCaseId, isAssigned }] }
 *
 * The backend only supports PATCH here (PUT returns 500 "method not supported")
 * and expects the assignment(s) wrapped in an `assignments` array, so we accept
 * a single assignment at the call site and wrap it for the request.
 */
export const reassignTestCase = (
  releaseId: number | string,
  employeeId: number | string,
  payload: TestCaseReassignPayload
) =>
  api.patch(ENDPOINTS.ASSIGN_TEST_CASE(releaseId, employeeId), {
    assignments: [payload],
  });

/**
 * Re-export common lookups from defectService for convenience
 */
export {
  getProjectModules,
  getSubModules,
  getSeverities,
  getPriorities,
} from './defectService';
