import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { MFA_SESSION_COOKIE, sessionTtlSeconds, verifyMfaSessionToken } from "@/lib/mfa/session";

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
  const context = await getUserAndProfile();
  if (!context) {
    return;
  }

  if (context.profile.mfa_enabled) {
    const cookieJar = await cookies();
    const sessionToken = cookieJar.get(MFA_SESSION_COOKIE)?.value ?? null;
    const sessionPayload = sessionToken ? verifyMfaSessionToken(sessionToken) : null;
    const lastSuccessRaw = context.profile.last_mfa_success_at ? Date.parse(context.profile.last_mfa_success_at) : Number.NaN;
    const lastSuccessValid = Number.isFinite(lastSuccessRaw);
    const profileSessionValid = lastSuccessValid && Date.now() - lastSuccessRaw <= sessionTtlSeconds() * 1000;

    if ((!sessionPayload || sessionPayload.userId !== context.user.id) && !profileSessionValid) {
      return;
    }
  }

  redirect(destination);
}
