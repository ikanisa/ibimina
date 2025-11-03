import { AuthUser } from '@/types/auth';
import { authApi } from '@/api/auth';

let accessToken: string | null = null;
let currentUser: AuthUser | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const getAccessToken = (): string | null => {
  return accessToken;
};

export const setCurrentUser = (user: AuthUser) => {
  currentUser = user;
};

export const getCurrentUser = (): AuthUser | null => {
  return currentUser;
};

export const clearAuth = () => {
  accessToken = null;
  currentUser = null;
};

export const refreshAccessToken = async (): Promise<string> => {
  try {
    const response = await authApi.refresh({});
    return response.accessToken;
  } catch (error) {
    clearAuth();
    throw error;
  }
};

export const isAuthenticated = (): boolean => {
  return accessToken !== null && currentUser !== null;
};
