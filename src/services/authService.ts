import api from '../lib/api';
import { ENDPOINTS } from '../constants/endpoints';

export const login = (email: string, password: string) =>
  api.post(ENDPOINTS.LOGIN, { email: email.trim(), password });

export const forgotPassword = (email: string) =>
  api.post(ENDPOINTS.FORGOT_PASSWORD, { email: email.trim() });

export const resetPassword = (token: string, newPassword: string) =>
  api.post(ENDPOINTS.RESET_PASSWORD, { token, newPassword });

/**
 * Changes the password for the currently authenticated user. The request is
 * authenticated via the Bearer token injected by the axios request interceptor.
 * NOTE: adjust the field names if your backend expects e.g. `oldPassword`.
 */
export const changePassword = (currentPassword: string, newPassword: string) =>
  api.post(ENDPOINTS.CHANGE_PASSWORD, { currentPassword, newPassword });

export const refreshToken = () => api.post(ENDPOINTS.REFRESH_TOKEN);

export const logout = () => api.post(ENDPOINTS.LOGOUT);