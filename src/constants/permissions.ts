/**
 * Centralized permission catalogue for the mobile app.
 *
 * These string keys MUST match the permission codes returned by the backend
 * (login `globalPermissions` and `GET /user/me/projects/{projectId}/permissions`).
 * Nothing in the app should hardcode access rules; every screen, module, card,
 * button and API call is gated through these constants via the PermissionContext.
 */

export const PERMISSIONS = {
  // ---- Dashboard ----
  DASHBOARD_VIEW: 'DASHBOARD_VIEW',
  DASHBOARD_READ: 'DASHBOARD_READ',

  // ---- Project ----
  PROJECT_READ: 'PROJECT_READ',
  PROJECT_CREATE: 'PROJECT_CREATE',
  PROJECT_UPDATE: 'PROJECT_UPDATE',
  PROJECT_DELETE: 'PROJECT_DELETE',

  // ---- Defect ----
  DEFECT_READ: 'DEFECT_READ',
  DEFECT_CREATE: 'DEFECT_CREATE',
  DEFECT_UPDATE: 'DEFECT_UPDATE',
  DEFECT_DELETE: 'DEFECT_DELETE',
  DEFECT_STATUS_CHANGE: 'DEFECT_STATUS_CHANGE',
  DEFECT_ASSIGN_DEVELOPER: 'DEFECT_ASSIGN_DEVELOPER',
  DEFECT_COMMENT_CREATE: 'DEFECT_COMMENT_CREATE',
  DEFECT_COMMENT_READ: 'DEFECT_COMMENT_READ',

  // ---- Test Case ----
  TEST_CASE_READ: 'TEST_CASE_READ',
  TEST_CASE_CREATE: 'TEST_CASE_CREATE',
  TEST_CASE_UPDATE: 'TEST_CASE_UPDATE',
  TEST_CASE_DELETE: 'TEST_CASE_DELETE',
  TEST_CASE_ASSIGN: 'TEST_CASE_ASSIGN',
  TEST_CASE_EXECUTE: 'TEST_CASE_EXECUTE',

  // ---- Release ----
  RELEASE_READ: 'RELEASE_READ',
  RELEASE_CREATE: 'RELEASE_CREATE',
  RELEASE_UPDATE: 'RELEASE_UPDATE',
  RELEASE_DELETE: 'RELEASE_DELETE',

  // ---- KLOC / metrics ----
  KLOC_UPDATE: 'KLOC_UPDATE',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Roles that are treated as administrators. Admins bypass individual permission
 * checks (they implicitly hold every permission). Kept configurable so the list
 * can grow without touching the context logic.
 */
export const ADMIN_ROLES = ['ADMIN', 'ROLE_ADMIN', 'SUPER_ADMIN', 'SUPERADMIN'];

/**
 * Permission codes that, if present, also mark the user as an admin even when
 * the role string is something generic.
 */
export const ADMIN_PERMISSIONS = ['ADMIN', 'ALL', 'SUPER_ADMIN', '*'];

/**
 * A navigable module/feature. The dashboard and project screens render these
 * dynamically: a module is only shown when the user holds `permission` (or any
 * of `anyOf`). This is what makes cards/menus appear or disappear per-user.
 */
export interface ModuleDefinition {
  key: string;
  label: string;
  /** Short helper text shown in the module picker UI. */
  description?: string;
  /** Feather icon name. */
  icon: string;
  /** Navigation route this module opens. */
  route: string;
  /** Primary permission required to see the module. */
  permission: PermissionKey;
  /** Optional additional permissions; holding any one is sufficient. */
  anyOf?: PermissionKey[];
  /** Accent color key used by the UI (resolved against Colors at render time). */
  colorKey?: 'primary' | 'error' | 'success' | 'warning' | 'info';
}

/**
 * The feature modules a user can drill into from a project. Order here is the
 * order they render in. Add new modules here rather than hardcoding cards.
 */
export const PROJECT_MODULES: ModuleDefinition[] = [
  {
    key: 'defects',
    label: 'Defects',
    description: 'View and manage reported defects',
    icon: 'alert-circle',
    route: 'Defects',
    permission: PERMISSIONS.DEFECT_READ,
    colorKey: 'error',
  },
  {
    key: 'testcases',
    label: 'Testcases',
    description: 'Browse and track test cases',
    icon: 'file-text',
    route: 'TestCases',
    permission: PERMISSIONS.TEST_CASE_READ,
    colorKey: 'primary',
  },
];

/**
 * Shape of the structured `can` helper exposed by the PermissionContext. Mirrors
 * the web app so screens can write expressive checks like `can.defect.create`.
 */
export interface CanMatrix {
  dashboard: {
    view: boolean;
  };
  project: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  defect: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    statusUpdate: boolean;
    reassign: boolean;
    commentCreate: boolean;
    commentView: boolean;
  };
  testCase: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    assign: boolean;
    execute: boolean;
  };
  release: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  kloc: {
    update: boolean;
  };
}
