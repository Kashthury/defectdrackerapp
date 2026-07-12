/**
 * Centralized AsyncStorage keys.
 *
 * Keeping every persisted key in one place prevents drift between the modules
 * that read/write them (AuthContext, PermissionContext, the axios interceptor)
 * and lets logout wipe ALL cached data in a single, reliable place.
 */
export const STORAGE_KEYS = {
  /** JWT access token used by the axios request interceptor. */
  TOKEN: 'token',
  /** Cached, authenticated user profile (id/email/role/permissions). */
  USER: 'user',
  /** Refresh token used to mint a new access token. */
  REFRESH_TOKEN: 'refreshToken',
  /** Persisted permission snapshot (global + project-scoped + selected project). */
  PERMISSION_STATE: '@dt_permission_state_v1',
  /** Last selected project id (kept separately for quick, explicit restore). */
  SELECTED_PROJECT: '@dt_selected_project_v1',
} as const;

/**
 * Every key that represents cached, per-session data. Logging out must clear
 * all of these so a new sign-in reloads everything from the server and no
 * previous user's data (or stale permissions) can leak into the next session.
 */
export const SESSION_STORAGE_KEYS: string[] = [
  STORAGE_KEYS.TOKEN,
  STORAGE_KEYS.USER,
  STORAGE_KEYS.REFRESH_TOKEN,
  STORAGE_KEYS.PERMISSION_STATE,
  STORAGE_KEYS.SELECTED_PROJECT,
];
