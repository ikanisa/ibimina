/**
 * @ibimina/types - Shared TypeScript types for Ibimina platform
 * 
 * This package provides type definitions for users, payments, accounts,
 * notifications, and other domain models used across web and mobile apps.
 */

// User types
export * from './user';

// Payment and transaction types
export * from './payment';

// Account types
export * from './account';

// Notification types
export * from './notification';

// Common utility types
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  from_date?: string;
  to_date?: string;
  [key: string]: any;
}

// Environment types
export type Environment = 'development' | 'staging' | 'production';

export interface AppConfig {
  environment: Environment;
  api_base_url: string;
  supabase_url: string;
  supabase_anon_key: string;
  enable_mocks: boolean;
  log_level: 'debug' | 'info' | 'warn' | 'error';
}

// Device types (for mobile apps)
export interface DeviceInfo {
  device_id: string;
  platform: 'android' | 'ios';
  os_version: string;
  app_version: string;
  model: string;
  manufacturer?: string;
}

export interface DeviceSession {
  device_id: string;
  user_id: string;
  device_info: DeviceInfo;
  push_token?: string;
  last_active_at: string;
  created_at: string;
}
