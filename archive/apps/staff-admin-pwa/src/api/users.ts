import { apiClient } from './client';
import {
  User,
  UserCreate,
  UserUpdate,
  UsersListResponse,
  UsersListResponseSchema,
  UserSchema,
} from '@/types/user';

export interface UsersListParams {
  query?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export const usersApi = {
  list: async (params: UsersListParams = {}): Promise<UsersListResponse> => {
    const { data } = await apiClient.get('/users', { params });
    return UsersListResponseSchema.parse(data);
  },

  get: async (id: string): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return UserSchema.parse(data);
  },

  create: async (user: UserCreate): Promise<User> => {
    const { data } = await apiClient.post('/users', user);
    return UserSchema.parse(data);
  },

  update: async (id: string, updates: UserUpdate): Promise<User> => {
    const { data } = await apiClient.put(`/users/${id}`, updates);
    return UserSchema.parse(data);
  },

  updateStatus: async (id: string, status: string): Promise<User> => {
    const { data } = await apiClient.patch(`/users/${id}/status`, { status });
    return UserSchema.parse(data);
  },
};
