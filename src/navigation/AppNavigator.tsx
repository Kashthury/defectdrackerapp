import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import ProjectDetailScreen from '../screens/ProjectDetail/ProjectDetailScreen';
import ProjectScreen from '../screens/Project/ProjectScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ProjectSummaryScreen from '../screens/ProjectDetail/ProjectSummaryScreen';
import TestCasesScreen from '../screens/TestCases/TestCasesScreen';
import DefectsScreen from '../screens/Defects/DefectsScreen';
import { Colors } from '../constants/colors';
import { usePermission } from '../context/PermissionContext';
import { withProjectPermission } from '../components/common/ProtectedScreen';
import { PERMISSIONS } from '../constants/permissions';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Protected-navigation wrappers: these screens are project-scoped, so entering
// them loads that project's permissions and blocks access (Access Denied) when
// the user lacks the required read permission. Defined at module scope so the
// component identity stays stable across renders.
const ProtectedDefectsScreen = withProjectPermission(DefectsScreen, PERMISSIONS.DEFECT_READ);
const ProtectedTestCasesScreen = withProjectPermission(TestCasesScreen, PERMISSIONS.TEST_CASE_READ);

const TabNavigator = () => {
  const { isAdmin, globalCan, accessibleProjects, getAccessibleModules, permissionsReady } =
    usePermission();

  // Wait for the initial permission bootstrap before deciding the landing tab.
  // Rendering the tabs before permissions are ready would compute the default
  // route from empty permissions and strand the user on "Projects" even when
  // they should land on the Dashboard. React Navigation only reads
  // `initialRouteName` once, so it must be correct on first mount.
  if (!permissionsReady) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Dashboard is shown when the user can view it, has any accessible module, or
  // is allocated to at least one project. This is fully permission-driven — no
  // hardcoded "always true" anymore.
  const canViewDashboard =
    isAdmin ||
    globalCan.dashboard.view ||
    accessibleProjects.length > 0 ||
    getAccessibleModules('global').length > 0;

  return (
    <Tab.Navigator
      // After login the user lands on the Dashboard by default whenever they can
      // view it; only users without any dashboard access start on Projects.
      initialRouteName={canViewDashboard ? 'Dashboard' : 'Projects'}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          if (route.name === 'Dashboard') iconName = 'grid';
          else if (route.name === 'Projects') iconName = 'folder';
          else if (route.name === 'Profile') iconName = 'user';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      {canViewDashboard && (
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Overview' }}
        />
      )}
      <Tab.Screen name="Projects" component={ProjectScreen} options={{ title: 'My Projects' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: Colors.primary },
      headerTintColor: Colors.white,
    }}
  >
    <Stack.Screen
      name="Main"
      component={TabNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ProjectSummary"
      component={ProjectSummaryScreen}
      options={{ title: 'Project Overview' }}
    />
    <Stack.Screen
      name="ProjectDetail"
      component={ProjectDetailScreen}
      options={{ title: 'Project Details' }}
    />
    <Stack.Screen
      name="TestCases"
      component={ProtectedTestCasesScreen}
      options={{ title: 'Test Cases' }}
    />
    <Stack.Screen
      name="Defects"
      component={ProtectedDefectsScreen}
      options={{ title: 'Defects' }}
    />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

export default AppNavigator;
