import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../hooks/useAuth';
import {
  AccessibleProject,
  fetchAccessibleProjects,
  fetchCurrentUserPermissions,
  fetchProjectPermissions,
} from '../services/permissionService';
import { STORAGE_KEYS } from '../constants/storageKeys';
import {
  ADMIN_PERMISSIONS,
  ADMIN_ROLES,
  CanMatrix,
  ModuleDefinition,
  PERMISSIONS,
  PROJECT_MODULES,
} from '../constants/permissions';

/**
 * Centralized, permission-based authorization for the mobile app.
 *
 * There is NO hardcoded access control anywhere else: screens, modules, cards,
 * buttons and API calls all funnel through this context. Permissions are:
 *   - loaded from the login response (`globalPermissions`) after sign-in,
 *   - refined per-project via `GET /user/me/projects/{id}/permissions`,
 *   - cached securely in AsyncStorage for fast, offline-friendly startup.
 *
 * "Effective" permissions are project-scoped when a project is selected, and
 * fall back to the user's global permissions otherwise.
 */

const STORAGE_KEY = STORAGE_KEYS.PERMISSION_STATE;

interface PersistedState {
  globalPermissions: string[];
  accessibleProjects: AccessibleProject[];
  projectPermissions: Record<string, string[]>;
  currentProjectId: number | null;
}

export interface PermissionContextType {
  // ---- data ----
  /** Effective permissions for the current scope (project-scoped or global). */
  permissions: string[];
  /** The user's account-wide permissions, independent of any project. */
  globalPermissions: string[];
  /** Projects the user is allowed to access. */
  accessibleProjects: AccessibleProject[];
  /** Back-compat alias used by older screens. */
  userProjects: AccessibleProject[];
  /** Project the permissions are currently scoped to (null = global scope). */
  currentProjectId: number | null;

  // ---- status ----
  isAdmin: boolean;
  isLoading: boolean;
  /** True once the initial permission bootstrap/login load has finished. */
  permissionsReady: boolean;

  // ---- checks (scoped to the current project when one is selected) ----
  hasPermission: (permission?: string | null) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;

  // ---- checks against global permissions (ignore project scope) ----
  hasGlobalPermission: (permission?: string | null) => boolean;
  hasAnyGlobalPermission: (permissions: string[]) => boolean;

  // ---- structured helpers (web-parity `can` object) ----
  /** Scoped to the current project. */
  can: CanMatrix;
  /** Account-wide, ignores project scope (use for nav/dashboard module gating). */
  globalCan: CanMatrix;

  // ---- project helpers ----
  canAccessProject: (projectId: number | string) => boolean;
  getAccessibleModules: (scope?: 'global' | 'current') => ModuleDefinition[];

  // ---- actions ----
  setCurrentProject: (
    projectId: number | string | null,
    options?: { force?: boolean },
  ) => Promise<void>;
  /**
   * Re-fetch the latest permissions from the backend (global + accessible
   * projects + the currently-scoped project) and update state. Safe to call on
   * app resume, dashboard focus, etc. Runs silently (does not gate screens).
   */
  refreshPermissions: () => Promise<void>;
  loadAccessibleProjects: () => Promise<AccessibleProject[]>;
  clearPermissions: () => Promise<void>;
}

/** Builds the structured `can` matrix from a single permission-check function. */
const buildCan = (check: (permission: string) => boolean): CanMatrix => ({
  dashboard: {
    view: check(PERMISSIONS.DASHBOARD_VIEW) || check(PERMISSIONS.DASHBOARD_READ),
  },
  project: {
    view: check(PERMISSIONS.PROJECT_READ),
    create: check(PERMISSIONS.PROJECT_CREATE),
    update: check(PERMISSIONS.PROJECT_UPDATE),
    delete: check(PERMISSIONS.PROJECT_DELETE),
  },
  defect: {
    view: check(PERMISSIONS.DEFECT_READ),
    create: check(PERMISSIONS.DEFECT_CREATE),
    update: check(PERMISSIONS.DEFECT_UPDATE),
    delete: check(PERMISSIONS.DEFECT_DELETE),
    statusUpdate: check(PERMISSIONS.DEFECT_STATUS_CHANGE),
    reassign: check(PERMISSIONS.DEFECT_ASSIGN_DEVELOPER),
    commentCreate: check(PERMISSIONS.DEFECT_COMMENT_CREATE),
    commentView: check(PERMISSIONS.DEFECT_COMMENT_READ),
  },
  testCase: {
    view: check(PERMISSIONS.TEST_CASE_READ),
    create: check(PERMISSIONS.TEST_CASE_CREATE),
    update: check(PERMISSIONS.TEST_CASE_UPDATE),
    delete: check(PERMISSIONS.TEST_CASE_DELETE),
    assign: check(PERMISSIONS.TEST_CASE_ASSIGN),
    execute: check(PERMISSIONS.TEST_CASE_EXECUTE),
  },
  release: {
    view: check(PERMISSIONS.RELEASE_READ),
    create: check(PERMISSIONS.RELEASE_CREATE),
    update: check(PERMISSIONS.RELEASE_UPDATE),
    delete: check(PERMISSIONS.RELEASE_DELETE),
  },
  kloc: {
    update: check(PERMISSIONS.KLOC_UPDATE),
  },
});

export const PermissionContext = createContext<PermissionContextType>(
  {} as PermissionContextType,
);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading: authLoading } = useAuth();

  const [globalPermissions, setGlobalPermissions] = useState<string[]>([]);
  const [accessibleProjects, setAccessibleProjects] = useState<AccessibleProject[]>([]);
  const [projectPermissions, setProjectPermissions] = useState<Record<string, string[]>>({});
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [permissionsReady, setPermissionsReady] = useState(false);

  // Latest project-permission cache, read inside async actions without needing
  // them in dependency arrays (prevents stale closures + effect churn).
  const projectPermsRef = useRef(projectPermissions);
  projectPermsRef.current = projectPermissions;
  const inflightProjects = useRef<Set<string>>(new Set());
  // Prevents overlapping background refreshes (app-resume + screen focus can
  // fire together).
  const refreshingRef = useRef(false);

  // ---- Hydrate cached state on first mount ----
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: PersistedState = JSON.parse(raw);
          setGlobalPermissions(parsed.globalPermissions || []);
          setAccessibleProjects(parsed.accessibleProjects || []);
          setProjectPermissions(parsed.projectPermissions || {});
          setCurrentProjectId(parsed.currentProjectId ?? null);
        }
      } catch (e) {
        console.warn('⚠️ Failed to hydrate permissions from storage:', e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // ---- Persist state whenever it changes (after hydration) ----
  useEffect(() => {
    if (!hydrated) return;
    const snapshot: PersistedState = {
      globalPermissions,
      accessibleProjects,
      projectPermissions,
      currentProjectId,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)).catch(() => {});
    // Mirror the selected project to its own key so it can be inspected/cleared
    // independently of the full permission snapshot.
    if (currentProjectId != null) {
      AsyncStorage.setItem(
        STORAGE_KEYS.SELECTED_PROJECT,
        String(currentProjectId),
      ).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_PROJECT).catch(() => {});
    }
  }, [hydrated, globalPermissions, accessibleProjects, projectPermissions, currentProjectId]);

  const clearPermissions = useCallback(async () => {
    setGlobalPermissions([]);
    setAccessibleProjects([]);
    setProjectPermissions({});
    setCurrentProjectId(null);
    try {
      await AsyncStorage.removeMany([STORAGE_KEY, STORAGE_KEYS.SELECTED_PROJECT]);
    } catch {
      /* noop */
    }
  }, []);

  const loadAccessibleProjects = useCallback(async (): Promise<AccessibleProject[]> => {
    try {
      const projects = await fetchAccessibleProjects();
      setAccessibleProjects(projects);
      return projects;
    } catch (e) {
      console.warn('⚠️ Failed to load accessible projects:', e);
      return [];
    }
  }, []);

  // ---- React to login / logout ----
  useEffect(() => {
    if (!hydrated || authLoading) return;
    let cancelled = false;

    (async () => {
      if (!user) {
        // Signed out — wipe everything.
        await clearPermissions();
        if (!cancelled) {
          setPermissionsReady(true);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      // The login response is authoritative for global permissions. Set it
      // unconditionally (even if empty) so a previous user's cached permissions
      // can never leak into a different account.
      const fromUser = Array.isArray(user.permissions) ? user.permissions : [];
      setGlobalPermissions(fromUser);

      // On startup/login, ALWAYS refresh permissions from the backend rather
      // than trusting only the (possibly stale) cached/login-payload values.
      // This is what makes changes made on another platform (e.g. the web app)
      // show up without a logout/login. A failure keeps the login-payload perms.
      try {
        const globals = await fetchCurrentUserPermissions();
        if (!cancelled && globals.length) {
          setGlobalPermissions(globals);
        }
      } catch (e) {
        console.warn('⚠️ Could not refresh global permissions on login:', e);
      }

      // Fetch the projects this user may access (used for dashboard filtering).
      try {
        const projects = await fetchAccessibleProjects();
        if (!cancelled && projects.length) {
          setAccessibleProjects(projects);
        }
      } catch (e) {
        console.warn('⚠️ Could not fetch accessible projects on login:', e);
      }

      if (!cancelled) {
        setPermissionsReady(true);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, authLoading, user?.id]);

  // ---- Select a project and load its scoped permissions ----
  // `force` re-fetches even when a project's permissions are already cached.
  // This is how "project switching" picks up permission changes made elsewhere
  // (e.g. the web app) without a logout/login. When permissions are already
  // cached, the forced re-fetch runs silently so it doesn't gate the screen
  // (no loading flash) — the fresh values are applied when they arrive.
  const setCurrentProject = useCallback(
    async (
      projectId: number | string | null,
      options: { force?: boolean } = {},
    ) => {
      const { force = false } = options;

      if (projectId === null || projectId === undefined || projectId === '') {
        setCurrentProjectId(null);
        return;
      }
      const id = Number(projectId);
      if (Number.isNaN(id)) return;

      // Scope immediately so protected screens can align to this project.
      setCurrentProjectId(id);

      const key = String(id);
      const cached = !!projectPermsRef.current[key];
      if (cached && !force) return; // already cached, no refresh requested
      if (inflightProjects.current.has(key)) return; // already fetching

      inflightProjects.current.add(key);
      // Only gate the screen (global loading) on the very first load for this
      // project. A forced refresh over cached data stays silent.
      const gate = !cached;
      if (gate) setIsLoading(true);
      try {
        const perms = await fetchProjectPermissions(id);
        setProjectPermissions((prev) => ({ ...prev, [key]: perms }));
      } catch (e) {
        // Leave cached value intact so effective permissions fall back to the
        // last known (or global) set instead of denying everything on a
        // transient network error.
        console.warn(`⚠️ Failed to load permissions for project ${id}:`, e);
      } finally {
        inflightProjects.current.delete(key);
        if (gate) setIsLoading(false);
      }
    },
    [],
  );

  const refreshPermissions = useCallback(async () => {
    // Nothing to refresh when signed out; and never run two refreshes at once.
    if (!user || refreshingRef.current) return;
    refreshingRef.current = true;
    // NOTE: deliberately does NOT toggle `isLoading` — this is a background
    // refresh and must not gate/flash the screen the user is currently on.
    try {
      // 1) Account-wide (global) permissions straight from the backend. This is
      //    the source of truth for cross-platform changes. Fall back to the
      //    login-payload perms if the endpoint is unavailable.
      try {
        const globals = await fetchCurrentUserPermissions();
        if (globals.length) {
          setGlobalPermissions(globals);
        } else {
          const fromUser = Array.isArray(user?.permissions) ? user!.permissions! : [];
          if (fromUser.length) setGlobalPermissions(fromUser);
        }
      } catch {
        const fromUser = Array.isArray(user?.permissions) ? user!.permissions! : [];
        if (fromUser.length) setGlobalPermissions(fromUser);
      }

      // 2) Accessible projects (dashboard/project filtering).
      try {
        const projects = await fetchAccessibleProjects();
        if (projects.length) setAccessibleProjects(projects);
      } catch {
        /* keep cached */
      }

      // 3) The currently-scoped project's permissions (force fresh).
      if (currentProjectId != null) {
        try {
          const perms = await fetchProjectPermissions(currentProjectId);
          setProjectPermissions((prev) => ({
            ...prev,
            [String(currentProjectId)]: perms,
          }));
        } catch {
          /* keep cached */
        }
      }
    } finally {
      refreshingRef.current = false;
      setPermissionsReady(true);
    }
  }, [user, currentProjectId]);

  // ---- Refresh permissions when the app returns to the foreground ----
  // The latest refresh fn + auth flag live in refs so the AppState listener is
  // subscribed exactly once yet always runs the current logic (no stale
  // closures, no re-subscribe churn on every project change).
  const refreshRef = useRef(refreshPermissions);
  refreshRef.current = refreshPermissions;
  const hasUserRef = useRef(!!user);
  hasUserRef.current = !!user;
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (next: AppStateStatus) => {
        const prev = appStateRef.current;
        appStateRef.current = next;
        // Only refresh on a real transition INTO the foreground while signed in.
        if (next === 'active' && prev !== 'active' && hasUserRef.current) {
          refreshRef.current();
        }
      },
    );
    return () => subscription.remove();
  }, []);

  // ---- Derived permission sets ----
  const effectivePermissions = useMemo(() => {
    if (currentProjectId != null) {
      const scoped = projectPermissions[String(currentProjectId)];
      if (scoped && scoped.length) {
        // Permissions are ADDITIVE. The effective set for a project is the
        // union of the user's account-wide (user-specific) grants and the
        // project/role-specific grants. This ensures a user-level permission
        // (e.g. TEST_CASE_READ assigned directly to the user) is never lost
        // just because the project's role-based set (e.g. a developer role
        // that only grants DEFECT_READ) doesn't include it.
        return Array.from(new Set([...globalPermissions, ...scoped]));
      }
    }
    return globalPermissions;
  }, [currentProjectId, projectPermissions, globalPermissions]);

  const isAdmin = useMemo(() => {
    const role = (user?.role || '').toUpperCase();
    if (ADMIN_ROLES.includes(role)) return true;
    const scoped =
      currentProjectId != null ? projectPermissions[String(currentProjectId)] || [] : [];
    return [...globalPermissions, ...scoped].some((p) =>
      ADMIN_PERMISSIONS.includes(String(p).toUpperCase()),
    );
  }, [user?.role, globalPermissions, projectPermissions, currentProjectId]);

  // ---- Check functions ----
  const hasPermission = useCallback(
    (permission?: string | null) => {
      if (!permission) return true;
      if (isAdmin) return true;
      return effectivePermissions.includes(permission);
    },
    [isAdmin, effectivePermissions],
  );

  const hasAnyPermission = useCallback(
    (perms: string[]) => {
      if (!perms || perms.length === 0) return true;
      if (isAdmin) return true;
      return perms.some((p) => effectivePermissions.includes(p));
    },
    [isAdmin, effectivePermissions],
  );

  const hasAllPermissions = useCallback(
    (perms: string[]) => {
      if (!perms || perms.length === 0) return true;
      if (isAdmin) return true;
      return perms.every((p) => effectivePermissions.includes(p));
    },
    [isAdmin, effectivePermissions],
  );

  const hasGlobalPermission = useCallback(
    (permission?: string | null) => {
      if (!permission) return true;
      if (isAdmin) return true;
      return globalPermissions.includes(permission);
    },
    [isAdmin, globalPermissions],
  );

  const hasAnyGlobalPermission = useCallback(
    (perms: string[]) => {
      if (!perms || perms.length === 0) return true;
      if (isAdmin) return true;
      return perms.some((p) => globalPermissions.includes(p));
    },
    [isAdmin, globalPermissions],
  );

  const canAccessProject = useCallback(
    (projectId: number | string) => {
      if (isAdmin) return true;
      // No restriction info available -> allow (fail-open for listing only).
      if (!accessibleProjects.length) return true;
      return accessibleProjects.some((p) => Number(p.id) === Number(projectId));
    },
    [isAdmin, accessibleProjects],
  );

  const can = useMemo(
    () => buildCan((p) => isAdmin || effectivePermissions.includes(p)),
    [isAdmin, effectivePermissions],
  );

  const globalCan = useMemo(
    () => buildCan((p) => isAdmin || globalPermissions.includes(p)),
    [isAdmin, globalPermissions],
  );

  const getAccessibleModules = useCallback(
    (scope: 'global' | 'current' = 'current') => {
      const source = scope === 'global' ? globalPermissions : effectivePermissions;
      const check = (p: string) => isAdmin || source.includes(p);
      return PROJECT_MODULES.filter(
        (m) => check(m.permission) || (m.anyOf ? m.anyOf.some(check) : false),
      );
    },
    [isAdmin, globalPermissions, effectivePermissions],
  );

  const value = useMemo<PermissionContextType>(
    () => ({
      permissions: effectivePermissions,
      globalPermissions,
      accessibleProjects,
      userProjects: accessibleProjects,
      currentProjectId,
      isAdmin,
      isLoading,
      permissionsReady,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasGlobalPermission,
      hasAnyGlobalPermission,
      can,
      globalCan,
      canAccessProject,
      getAccessibleModules,
      setCurrentProject,
      refreshPermissions,
      loadAccessibleProjects,
      clearPermissions,
    }),
    [
      effectivePermissions,
      globalPermissions,
      accessibleProjects,
      currentProjectId,
      isAdmin,
      isLoading,
      permissionsReady,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasGlobalPermission,
      hasAnyGlobalPermission,
      can,
      globalCan,
      canAccessProject,
      getAccessibleModules,
      setCurrentProject,
      refreshPermissions,
      loadAccessibleProjects,
      clearPermissions,
    ],
  );

  return (
    <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
  );
};

/**
 * Access the permission context. Must be used within a PermissionProvider.
 */
export const usePermission = (): PermissionContextType => {
  const ctx = useContext(PermissionContext);
  if (!ctx || typeof ctx.hasPermission !== 'function') {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return ctx;
};
