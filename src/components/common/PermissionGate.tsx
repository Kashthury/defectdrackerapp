import React from 'react';
import { usePermission } from '../../context/PermissionContext';

interface PermissionGateProps {
  /** Single permission required to render children. */
  permission?: string;
  /** Render children if the user holds ANY of these permissions. */
  anyOf?: string[];
  /** Render children only if the user holds ALL of these permissions. */
  allOf?: string[];
  /**
   * When true, checks against the user's global permissions instead of the
   * currently selected project's scope. Use for nav/dashboard module gating.
   */
  global?: boolean;
  /** Optional element rendered when access is denied (defaults to nothing). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Declaratively renders its children only when the current user satisfies the
 * given permission requirement. This is the primary building block for hiding
 * buttons, actions and sections the user can't use — instead of showing
 * disabled/unusable controls.
 *
 * Example:
 *   <PermissionGate permission={PERMISSIONS.DEFECT_CREATE}>
 *     <CreateButton />
 *   </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  anyOf,
  allOf,
  global = false,
  fallback = null,
  children,
}) => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasGlobalPermission,
    hasAnyGlobalPermission,
  } = usePermission();

  let allowed = true;

  if (allOf && allOf.length) {
    // No global variant of "all" is needed in practice; scope handles it.
    allowed = allowed && hasAllPermissions(allOf);
  }
  if (anyOf && anyOf.length) {
    allowed = allowed && (global ? hasAnyGlobalPermission(anyOf) : hasAnyPermission(anyOf));
  }
  if (permission) {
    allowed = allowed && (global ? hasGlobalPermission(permission) : hasPermission(permission));
  }

  if (!allowed) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};

export default PermissionGate;
