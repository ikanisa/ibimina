import type { SupabaseClient } from "@supabase/supabase-js";
import { userSchema, type User } from "../schemas";

export type UserProfileRow = {
  id: string | null;
  full_name: string | null;
  primary_msisdn: string | null;
  locale: string | null;
  avatar_url: string | null;
  reference_token: string | null;
  created_at: string | null;
};

const toUser = (row: UserProfileRow): User =>
  userSchema.parse({
    id: row.id ?? "",
    fullName: row.full_name ?? "",
    primaryMsisdn: row.primary_msisdn ?? "",
    locale: row.locale ?? "en",
    avatarUrl: row.avatar_url,
    referenceToken: row.reference_token,
    createdAt: row.created_at ?? new Date().toISOString(),
  });

export const fetchCurrentUser = async (client: SupabaseClient): Promise<User | null> => {
  const { data, error } = await client
    .from("member_profiles_public")
    .select("id, full_name, primary_msisdn, locale, avatar_url, reference_token, created_at")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    throw error;
  }

  if (!data?.length) {
    return null;
  }

  return toUser(data[0] as UserProfileRow);
};

export const updatePreferredLocale = async (
  client: SupabaseClient,
  locale: string
): Promise<User> => {
  const { data, error } = await client
    .from("member_profiles_public")
    .update({ locale })
    .select("id, full_name, primary_msisdn, locale, avatar_url, reference_token, created_at")
    .single();

  if (error) {
    throw error;
  }

  return toUser(data as UserProfileRow);
};

export const updateContactChannels = async (
  client: SupabaseClient,
  payload: { whatsapp?: string | null; momoNumber?: string | null }
): Promise<User> => {
  const { data, error } = await client
    .from("member_profiles_public")
    .update({
      whatsapp_msisdn: payload.whatsapp,
      momo_msisdn: payload.momoNumber,
    })
    .select("id, full_name, primary_msisdn, locale, avatar_url, reference_token, created_at")
    .single();

  if (error) {
    throw error;
  }

  return toUser(data as UserProfileRow);
};
