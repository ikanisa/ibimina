// Allocation and reconciliation API contracts
import type { Allocation, Result, PaginatedResponse, PaginationParams } from '@ibimina/shared-types';

/**
 * Create allocation request
 */
export interface CreateAllocationRequest {
  org_id: string;
  country_id: string;
  group_id: string;
  member_id: string;
  amount: number;
  raw_ref: string;
  source: 'ussd' | 'upload' | 'manual';
  txn_id?: string;
  audit?: Record<string, any>;
}

/**
 * Create allocation response
 */
export interface CreateAllocationResponse extends Result<Allocation> {}

/**
 * Query allocations request
 */
export interface QueryAllocationsRequest extends PaginationParams {
  org_id?: string;
  country_id?: string;
  group_id?: string;
  member_id?: string;
  status?: 'pending' | 'settled' | 'failed';
  source?: 'ussd' | 'upload' | 'manual';
  date_from?: string;
  date_to?: string;
}

/**
 * Query allocations response
 */
export interface QueryAllocationsResponse extends PaginatedResponse<Allocation> {}

/**
 * Update allocation status request
 */
export interface UpdateAllocationStatusRequest {
  allocation_id: string;
  status: 'pending' | 'settled' | 'failed';
  audit_note?: string;
}

/**
 * Update allocation status response
 */
export interface UpdateAllocationStatusResponse extends Result<Allocation> {}

/**
 * Reconciliation summary
 */
export interface ReconciliationSummary {
  total_allocations: number;
  settled_count: number;
  pending_count: number;
  failed_count: number;
  total_amount: number;
  settled_amount: number;
  pending_amount: number;
}

/**
 * Get reconciliation summary request
 */
export interface GetReconciliationSummaryRequest {
  org_id: string;
  date_from?: string;
  date_to?: string;
}

/**
 * Get reconciliation summary response
 */
export interface GetReconciliationSummaryResponse extends Result<ReconciliationSummary> {}
