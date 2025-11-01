import type { SupabaseClient } from "@supabase/supabase-js";
import { ikiminaGroupSchema, type IkiminaGroup } from "../schemas";

export type GroupFilters = {
  search?: string;
  limit?: number;
  cursor?: string | null;
};

export type GroupRow = {
  id: string | null;
  code: string | null;
  name: string | null;
  sacco_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  settings_json: Record<string, unknown> | null;
};

const transformGroup = (row: GroupRow): IkiminaGroup => {
  const settings = (row.settings_json as Record<string, unknown> | null) ?? {};
  const contribution = (settings?.contribution as Record<string, unknown> | undefined) ?? {};
  const metrics = (settings?.metrics as Record<string, unknown> | undefined) ?? {};

  return ikiminaGroupSchema.parse({
    id: row.id ?? "",
    saccoId: row.sacco_id ?? "",
    code: row.code ?? "",
    name: row.name ?? "Unnamed group",
    contributionAmount: typeof contribution.amount === "number" ? contribution.amount : null,
    contributionCurrency: typeof contribution.currency === "string" ? contribution.currency : "RWF",
    contributionFrequency:
      typeof contribution.frequency === "string" &&
      ["weekly", "monthly", "quarterly", "flexible"].includes(contribution.frequency)
        ? (contribution.frequency as IkiminaGroup["contributionFrequency"])
        : "monthly",
    nextCollectionDate:
      typeof contribution.next_collection_date === "string"
        ? contribution.next_collection_date
        : null,
    memberCount: typeof metrics.member_count === "number" ? metrics.member_count : 0,
    status:
      typeof row.status === "string" && ["active", "inactive", "archived"].includes(row.status)
        ? (row.status as IkiminaGroup["status"])
        : "active",
    lastPaidAt: typeof metrics.last_paid_at === "string" ? metrics.last_paid_at : null,
  });
};

export const fetchGroups = async (
  client: SupabaseClient,
  filters: GroupFilters = {}
): Promise<IkiminaGroup[]> => {
  let query = client
    .from("ibimina")
    .select("id, code, name, sacco_id, status, created_at, updated_at, settings_json")
    .order("updated_at", { ascending: false })
    .limit(filters.limit ?? 20);

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  if (filters.cursor) {
    query = query.lt("updated_at", filters.cursor);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data as GroupRow[]).map(transformGroup);
};

export const fetchGroupById = async (
  client: SupabaseClient,
  groupId: string
): Promise<IkiminaGroup | null> => {
  const { data, error } = await client
    .from("ibimina")
    .select("id, code, name, sacco_id, status, created_at, updated_at, settings_json")
    .eq("id", groupId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return transformGroup(data as GroupRow);
};
