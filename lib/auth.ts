import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ProfileRow = Database["public"]["Tables"]["users"]["Row"] & {
  saccos?: Pick<Database["public"]["Tables"]["saccos"]["Row"], "id" | "name" | "district" | "province" | "sector_code" | "category"> | null;
};

export interface AuthContext {
  user: User;
  profile: ProfileRow;
}

export async function getUserAndProfile(): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select(
      "id, email, role, sacco_id, created_at, updated_at, mfa_enabled, mfa_enrolled_at, mfa_methods, mfa_backup_hashes, failed_mfa_count, last_mfa_success_at, last_mfa_step, saccos(id, name, district, province, sector_code, category)"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile", error);
    throw new Error("Unable to load staff profile");
  }

  if (!profile) {
    throw new Error("Profile not found");
  }

  return { user, profile };
}

export async function requireUserAndProfile(): Promise<AuthContext> {
  const context = await getUserAndProfile();
  if (!context) {
    redirect("/login");
  }
  return context;
}

export async function redirectIfAuthenticated(destination = "/dashboard") {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(destination);
  }
}
