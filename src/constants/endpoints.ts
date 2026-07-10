export const ENDPOINTS = {
  LOGIN: '/auth/login',
  FORGOT_PASSWORD: '/auth/forget-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/change-password',
  DASHBOARD: (projectId: number | string) => `/project/${projectId}/dashboard`,
  USER_PROJECTS: '/user/me/projects',
  PROJECT_PERMISSIONS: (projectId: number | string) => `/user/me/projects/${projectId}/permissions`,
  DEFECT_SEVERITY_BREAKDOWN: (projectId: number | string) => `/project/${projectId}/defect/severity-breakdown`,
  DEFECT_DENSITY: (projectId: number | string) => `/project/${projectId}/defect-density`,
  DEFECT_SEVERITY_INDEX: (projectId: number | string) => `/project/${projectId}/dashboard`,
  REMARK_RATIO: (projectId: number | string) => `/project/${projectId}/dashboard/remark-ratio`,
  REOPEN_SUMMARY: (projectId: number | string, releaseId?: number | string) =>
    releaseId ? `/project/${projectId}/release/${releaseId}/dashboard/reopened` : `/project/${projectId}/dashboard/reopened`,
  DEFECT_TYPE: (projectId: number | string) => `/project/${projectId}/defect-type`,
  TIME_TO_FIND: (projectId: number | string, releaseId: number | string) =>
    `/project/${projectId}/release/${releaseId}/dashboard/time-to-find`,
  TIME_TO_FIX: (projectId: number | string, releaseId: number | string) =>
    `/project/${projectId}/release/${releaseId}/dashboard/time-to-fixed`,
  DEFECT_BY_MODULE: (projectId: number | string) => `/project/${projectId}/defect-module`,
  REFRESH_TOKEN: '/auth/refresh-token',
  LOGOUT: '/auth/log-out',
  releaseById: (id: number) => `/release/${id}`,
  GIT_KLOC: '/kloc',
  PROJECT_KILO_OF_CODE: (projectId: number | string) => `/project/${projectId}/project-kilo-of-code`,
  PROJECT: '/project',
  DEFECTS: (projectId: number | string) => `/project/${projectId}/defect`,
  DEFECT_BY_ID: (id: number | string) => `/defect/${id}`,
  NEXT_STATUSES: (statusId: number | string) => `/status/${statusId}/next`,
  PROJECT_DEVELOPERS: (projectId: number | string) => `/project/${projectId}/defect/developers`,
  PROJECT_MODULES: (projectId: number | string) => `/project/${projectId}/module`,
  // Submodules that belong to a given module. NOTE: adjust this path if your
  // backend exposes it differently (e.g. `/project/{projectId}/module/{moduleId}/sub-module`).
  MODULE_SUB_MODULES: (moduleId: number | string) => `/module/${moduleId}/sub-module`,
  PROJECT_RELEASES: (projectId: number | string) => `/project/${projectId}/release`,
  SEVERITIES: '/severity',
  PRIORITIES: '/priority',
  DEFECT_TYPES: '/defect-type',
  STATUSES: '/status-type',
  SUB_MODULE_DEV: (subModuleId: number | string) => `/sub-module/${subModuleId}/employee`,
  
  // Test Cases
  ACTIVE_RELEASE: (projectId: number | string) => `/project/${projectId}/release/active`,
  TEST_CASES: (releaseId: number | string) => `/release/${releaseId}/test-case`,
  PROJECT_EMPLOYEES: (projectId: number | string) => `/project-allocation/${projectId}/employee`,
  ASSIGN_TEST_CASE: (releaseId: number | string, employeeId: number | string) => 
    `/release/${releaseId}/test-case/employee/${employeeId}`,
};