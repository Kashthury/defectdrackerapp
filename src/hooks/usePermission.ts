import { usePermission } from '../context/PermissionContext';
import type { CanMatrix, ModuleDefinition } from '../constants/permissions';

/**
 * Re-export the primary permission hook so screens can import it from either
 * `../hooks/usePermission` or `../context/PermissionContext`.
 */
export { usePermission };

/**
 * Convenience hook returning the project-scoped `can` matrix.
 * Example: `const can = useCan(); if (can.defect.create) { ... }`
 */
export const useCan = (): CanMatrix => usePermission().can;

/**
 * The account-wide `can` matrix, ignoring the currently selected project.
 * Use this for navigation tabs and dashboard module gating.
 */
export const useGlobalCan = (): CanMatrix => usePermission().globalCan;

/**
 * The list of feature modules the current user may open, filtered by permission.
 * @param scope 'current' uses project-scoped permissions, 'global' ignores scope.
 */
export const useAccessibleModules = (
  scope: 'global' | 'current' = 'current',
): ModuleDefinition[] => usePermission().getAccessibleModules(scope);
