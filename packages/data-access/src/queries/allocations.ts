import type { SupabaseClient } from "@supabase/supabase-js";
import {
  allocationSchema,
  type Allocation,
  referenceTokenSchema,
  type ReferenceToken,
} from "../schemas";

export type AllocationRow = {
  id: string | null;
  reference_token: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  momo_txn_id: string | null;
  posted_at: string | null;
  created_at: string | null;
  group_id: string | null;
  group_name: string | null;
  msisdn: string | null;
  narration: string | null;
};

const toAllocation = (row: AllocationRow): Allocation =>
  allocationSchema.parse({
    id: row.id ?? "",
    referenceToken: row.reference_token ?? "",
    amount: row.amount ?? 0,
    currency: row.currency ?? "RWF",
    status:
      typeof row.status === "string" &&
      ["pending", "posted", "failed", "reconciled"].includes(row.status)
        ? (row.status as Allocation["status"])
        : "pending",
    momoTxnId: row.momo_txn_id,
    postedAt: row.posted_at,
    createdAt: row.created_at ?? new Date().toISOString(),
    groupId: row.group_id,
    groupName: row.group_name,
    msisdn: row.msisdn,
    narration: row.narration,
  });

export type ReferenceTokenRow = {
  token: string | null;
  group_id: string | null;
  group_name: string | null;
  sacco_id: string | null;
  expires_at: string | null;
};

const toReferenceToken = (row: ReferenceTokenRow): ReferenceToken =>
  referenceTokenSchema.parse({
    token: row.token ?? "",
    groupId: row.group_id ?? "",
    groupName: row.group_name ?? "",
    saccoId: row.sacco_id ?? "",
    expiresAt: row.expires_at,
  });

export type AllocationFilters = {
  referenceTokens: string[];
  limit?: number;
};

export const fetchAllocations = async (
  client: SupabaseClient,
  filters: AllocationFilters
): Promise<Allocation[]> => {
  if (!filters.referenceTokens.length) {
    return [];
  }

  const { data, error } = await client
    .from("allocations")
    .select(
      "id, reference_token, amount, currency, status, momo_txn_id, posted_at, created_at, group_id, group_name, msisdn, narration"
    )
    .in("reference_token", filters.referenceTokens)
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 50);

  if (error) {
    throw error;
  }

  return (data as AllocationRow[]).map(toAllocation);
};

export const markAllocationPaid = async (
  client: SupabaseClient,
  allocationId: string
): Promise<Allocation> => {
  const { data, error } = await client
    .from("allocations")
    .update({ status: "posted" })
    .eq("id", allocationId)
    .select(
      "id, reference_token, amount, currency, status, momo_txn_id, posted_at, created_at, group_id, group_name, msisdn, narration"
    )
    .single();

  if (error) {
    throw error;
  }

  return toAllocation(data as AllocationRow);
};

export const fetchReferenceTokens = async (client: SupabaseClient): Promise<ReferenceToken[]> => {
  const { data, error } = await client
    .from("member_reference_tokens")
    .select("token, group_id, group_name, sacco_id, expires_at")
    .order("expires_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as ReferenceTokenRow[]).map(toReferenceToken);
};
