import React from 'react';
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
import { useAuth } from '../hooks/useAuth';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { user } = useAuth();

  // Example permission logic:
  // If user has 'VIEW_DASHBOARD' permission or is ADMIN, show Dashboard.
  const canViewDashboard = user?.role === 'ADMIN' || user?.permissions?.includes('VIEW_DASHBOARD') || true;

  return (
    <Tab.Navigator
      initialRouteName={canViewDashboard ? "Dashboard" : "Projects"}
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
      component={TestCasesScreen}
      options={{ title: 'Test Cases' }}
    />
    <Stack.Screen
      name="Defects"
      component={DefectsScreen}
      options={{ title: 'Defects' }}
    />
  </Stack.Navigator>
);

export default AppNavigator;