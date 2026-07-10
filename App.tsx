import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { PermissionProvider } from './src/context/PermissionContext';
import { ToastProvider } from './src/context/ToastContext';
import { Colors } from './src/constants/colors';
import RootNavigator from './src/navigation/RootNavigator.tsx';

const App = () => {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <ToastProvider>
        <AuthProvider>
          <PermissionProvider>
            <RootNavigator />
          </PermissionProvider>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
};

export default App;