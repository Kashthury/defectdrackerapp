import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginApi, logout as logoutApi } from '../services/authService';

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
        const token = await AsyncStorage.getItem('token');
        const userString = await AsyncStorage.getItem('user');
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

      setUserToken(token);
      setUser(user);
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
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
      // Clear storage regardless of API success
      setUserToken(null);
      setUser(null);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('refreshToken');
    }
  };

  return (
    <AuthContext.Provider value={{ user, userToken, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};