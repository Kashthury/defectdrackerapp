import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, logout as logoutApi } from '../services/authService';
import { STORAGE_KEYS, SESSION_STORAGE_KEYS } from '../constants/storageKeys';

interface User {
  id?: string | number;
  email: string;
  name?: string;
  role?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  userToken: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        const userString = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        if (token && userString) {
          setUserToken(token);
          setUser(JSON.parse(userString));
        }
      } catch (e) {
        console.error('Failed to load auth data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrapAsync();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email);
      const response = await loginApi(email, password);
      console.log('✅ Login response:', response.data);

      // Destructure from response.data.data (your backend structure).
      // Guard against unexpected shapes so we surface a clean error instead of
      // crashing on "Cannot destructure property 'token' of undefined".
      const payload = response?.data?.data;
      if (!payload || !payload.token) {
        console.error('❌ No token in response');
        throw new Error('Invalid response from server');
      }

      const { token, refreshToken, userId, email: userEmail, firstName, lastName, roles, globalPermissions } = payload;

      const user = {
        id: userId,
        email: userEmail,
        name: `${firstName} ${lastName}`.trim() || userEmail,
        role: roles?.[0] || 'USER',
        permissions: globalPermissions || [],
      };

      // Wipe any leftover cached data from a previous session BEFORE storing the
      // new session, so a fresh login always reloads everything from the server
      // and no stale permissions/project selection can leak across accounts.
      await AsyncStorage.removeMany(SESSION_STORAGE_KEYS);

      setUserToken(token);
      setUser(user);
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      if (refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }

      console.log('✅ Token saved, userToken state updated');
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🔓 Attempting logout');
      await logoutApi(); // Hit the logout endpoint so the server can revoke the session
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      // Clear ALL cached session data regardless of API success: token, user,
      // refresh token, the permission snapshot, and the selected project. This
      // is the cache-invalidation step — clearing `user` also triggers the
      // PermissionContext to reset its in-memory permission state. A subsequent
      // login reloads everything fresh from the server.
      setUserToken(null);
      setUser(null);
      try {
        await AsyncStorage.removeMany(SESSION_STORAGE_KEYS);
      } catch (e) {
        console.warn('⚠️ Failed to clear session storage on logout:', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, userToken, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};