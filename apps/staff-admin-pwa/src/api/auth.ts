import { apiClient } from './client';
import {
  LoginRequest,
  LoginResponse,
  LoginResponseSchema,
  RefreshRequest,
  RefreshResponse,
  RefreshResponseSchema,
} from '@/types/auth';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return LoginResponseSchema.parse(data);
  },

  refresh: async (request: RefreshRequest): Promise<RefreshResponse> => {
    const { data } = await apiClient.post('/auth/refresh', request);
    return RefreshResponseSchema.parse(data);
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
