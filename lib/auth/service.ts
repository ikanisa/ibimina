import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ProfileRow = Omit<Database["public"]["Tables"]["users"]["Row"], "mfa_secret_enc"> & {
  saccos?: {
    id: string | null;
    name: string | null;
    district: string | null;
    province: string | null;
    sector_code: string | null;
    category: string | null;
  } | null;
};

export interface AuthContext {
  user: User;
  profile: ProfileRow;
}

export async function fetchUserAndProfile(): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(
      "id, email, role, sacco_id, created_at, updated_at, mfa_enabled, mfa_enrolled_at, mfa_passkey_enrolled, mfa_methods, mfa_backup_hashes, failed_mfa_count, last_mfa_success_at, last_mfa_step, saccos(id, name, district, province, sector_code, category)"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[auth] failed to load profile", profileError);
    throw new Error("Unable to load staff profile");
  }

  if (!profile) {
    return null;
  }

  return {
    user,
    profile: profile as ProfileRow,
  };
}

export async function requireUserAndProfile(): Promise<AuthContext> {
  const context = await fetchUserAndProfile();
  if (!context) {
    redirect("/login");
  }
  return context;
}

export async function redirectIfAuthenticated(destination = "/dashboard") {
  const context = await fetchUserAndProfile();
  if (context) {
    redirect(destination);
  }
}

