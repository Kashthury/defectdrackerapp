import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';

interface PermissionContextType {
  hasPermission: (permission: string) => boolean;
  permissions: string[];
  /** True when the signed-in user has an admin role. */
  isAdmin: boolean;
  /** Projects the user is explicitly allocated to. Empty means "no restriction". */
  userProjects: any[];
  /** Whether the underlying auth/permission data is still loading. */
  isLoading: boolean;
}

const ADMIN_ROLES = ['ADMIN', 'ROLE_ADMIN', 'SUPER_ADMIN'];

export const PermissionContext = createContext<PermissionContextType>({} as PermissionContextType);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  const permissions = useMemo(() => user?.permissions || [], [user]);

  const isAdmin = useMemo(() => {
    const role = (user?.role || '').toUpperCase();
    return ADMIN_ROLES.includes(role) || permissions.some(p => ADMIN_ROLES.includes(p.toUpperCase()));
  }, [user, permissions]);

  // Memoized so the context value keeps a stable identity between renders
  // (prevents needless re-renders / effect loops in consumers).
  const value = useMemo<PermissionContextType>(
    () => ({
      hasPermission: (permission: string) => permissions.includes(permission),
      permissions,
      isAdmin,
      userProjects: [],
      isLoading: !!isLoading,
    }),
    [permissions, isAdmin, isLoading]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

/**
 * Access the permission context. Previously this hook did not exist, so
 * `ProjectScreen`'s `usePermission()` call threw on every render (caught by its
 * try/catch), which flooded the console with "undefined is not a function".
 */
export const usePermission = (): PermissionContextType => {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return ctx;
};
