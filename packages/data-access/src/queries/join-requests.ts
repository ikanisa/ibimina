import type { SupabaseClient } from "@supabase/supabase-js";
import { joinRequestSchema, type JoinRequest } from "../schemas";

export type JoinRequestRow = {
  id: string | null;
  group_id: string | null;
  user_id: string | null;
  message: string | null;
  status: string | null;
  created_at: string | null;
};

const toJoinRequest = (row: JoinRequestRow): JoinRequest =>
  joinRequestSchema.parse({
    id: row.id ?? "",
    groupId: row.group_id ?? "",
    userId: row.user_id ?? "",
    message: row.message,
    status:
      typeof row.status === "string" && ["pending", "approved", "rejected"].includes(row.status)
        ? (row.status as JoinRequest["status"])
        : "pending",
    createdAt: row.created_at ?? new Date().toISOString(),
  });

export const submitJoinRequest = async (
  client: SupabaseClient,
  payload: Pick<JoinRequest, "groupId" | "message">
): Promise<JoinRequest> => {
  const { data, error } = await client
    .from("join_requests")
    .insert({
      group_id: payload.groupId,
      message: payload.message,
    })
    .select("id, group_id, user_id, message, status, created_at")
    .single();

  if (error) {
    throw error;
  }

  return toJoinRequest(data as JoinRequestRow);
};

export const listJoinRequests = async (client: SupabaseClient): Promise<JoinRequest[]> => {
  const { data, error } = await client
    .from("join_requests")
    .select("id, group_id, user_id, message, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as JoinRequestRow[]).map(toJoinRequest);
};
