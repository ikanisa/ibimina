/**
 * User-related types for Ibimina platform
 */

export type UserRole = 'admin' | 'staff' | 'support' | 'member' | 'guest';

export type UserStatus = 'active' | 'suspended' | 'inactive' | 'pending_verification';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  umurenge_sacco_id?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  email_verified: boolean;
  phone_verified: boolean;
  avatar_url?: string;
  metadata?: Record<string, any>;
}

export interface UserProfile extends User {
  address?: {
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
  };
  national_id?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  occupation?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface StaffUser extends User {
  staff_id: string;
  department: string;
  position: string;
  permissions: string[];
  assigned_umurenge_sacco_id?: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  umurenge_sacco_id?: string;
  password?: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  phone?: string;
  status?: UserStatus;
  avatar_url?: string;
  metadata?: Record<string, any>;
}
