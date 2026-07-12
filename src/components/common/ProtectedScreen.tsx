import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { usePermission } from '../../context/PermissionContext';
import AccessDenied from './AccessDenied';

interface ProtectedScreenProps {
  /** Permission required to view the screen. */
  permission?: string;
  /** Any-of permissions; holding at least one grants access. */
  anyOf?: string[];
  /**
   * If provided, the guard waits until the permission context is scoped to this
   * project (so it checks project-specific permissions, not global ones).
   */
  projectId?: number | string | null;
  /** Custom denied message. */
  deniedMessage?: string;
  children: React.ReactNode;
}

/**
 * Guards a screen's content behind a permission check. While permissions are
 * loading it shows a spinner; if the user lacks access it shows an AccessDenied
 * state; otherwise it renders the screen. This centralizes protected-navigation
 * logic so individual screens don't reimplement it.
 */
export const ProtectedScreen: React.FC<ProtectedScreenProps> = ({
  permission,
  anyOf,
  projectId,
  deniedMessage,
  children,
}) => {
  const {
    isLoading,
    permissionsReady,
    currentProjectId,
    hasPermission,
    hasAnyPermission,
  } = usePermission();

  const scopeAligned =
    projectId === null || projectId === undefined
      ? true
      : Number(currentProjectId) === Number(projectId);

  if (!permissionsReady || isLoading || !scopeAligned) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const allowed = anyOf && anyOf.length
    ? hasAnyPermission(anyOf)
    : permission
    ? hasPermission(permission)
    : true;

  if (!allowed) {
    return <AccessDenied message={deniedMessage} />;
  }

  return <>{children}</>;
};

/**
 * HOC that wraps a screen with project-scoped protection. It reads `projectId`
 * from the route params, tells the PermissionContext to scope to that project
 * (loading its permissions), and only renders the screen when the required
 * permission is satisfied for that project.
 *
 * This is how we implement "protected navigation": users cannot open a screen
 * they lack permission for — they get a clean Access Denied instead.
 */
export function withProjectPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  anyOf?: string[],
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => {
    const route = useRoute<any>();
    const routeProjectId = route.params?.projectId ?? null;
    const { setCurrentProject } = usePermission();

    useEffect(() => {
      // Re-scope whenever the target project changes, and force a fresh fetch of
      // that project's permissions so entering a protected screen always
      // reflects the latest access (e.g. permissions changed on the web app).
      setCurrentProject(routeProjectId, { force: true });
    }, [routeProjectId, setCurrentProject]);

    return (
      <ProtectedScreen permission={permission} anyOf={anyOf} projectId={routeProjectId}>
        <Component {...props} />
      </ProtectedScreen>
    );
  };
  Wrapped.displayName = `withProjectPermission(${Component.displayName || Component.name || 'Screen'})`;
  return Wrapped;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

export default ProtectedScreen;
