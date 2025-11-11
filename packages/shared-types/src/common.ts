// Common shared types across apps

export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface TimestampedEntity {
  created_at: string;
  updated_at: string;
}

export interface SoftDeletedEntity extends TimestampedEntity {
  deleted_at?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: 'SACCO' | 'MFI';
  country_id: string;
  district_id?: string;
  merchant_code?: string;
}

export interface Group {
  id: string;
  org_id: string;
  country_id: string;
  name: string;
  settings: {
    amount: number;
    frequency: string;
    cycle: string;
  };
}

export interface GroupMember extends TimestampedEntity {
  id: string;
  group_id: string;
  user_id: string;
  member_code: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Allocation extends TimestampedEntity {
  id: string;
  org_id: string;
  country_id: string;
  group_id: string;
  member_id: string;
  txn_id?: string;
  amount: number;
  raw_ref: string;
  status: 'pending' | 'settled' | 'failed';
  source: 'ussd' | 'upload' | 'manual';
  audit?: Record<string, any>;
}
