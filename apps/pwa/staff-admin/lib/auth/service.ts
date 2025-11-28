import { redirect } from "next/navigation";
import { logError } from "@/lib/observability/logger";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient, supabaseSrv } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { MFA_SESSION_COOKIE, readCookieToken, verifyMfaSessionToken } from "@/lib/mfa/session";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

type ProfileSacco = Pick<
  Database["app"]["Tables"]["saccos"]["Row"],
  "id" | "name" | "district" | "province" | "sector_code" | "category"
>;

export type ProfileRow = Omit<UserRow, "mfa_secret_enc"> & {
  sacco?: ProfileSacco | null;
};

export interface AuthContext {
  user: User;
  profile: ProfileRow;
  mfaVerified: boolean;
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
      [
        "id",
        "email",
        "role",
        "sacco_id",
        "created_at",
        "updated_at",
        "mfa_enabled",
        "mfa_enrolled_at",
        "mfa_passkey_enrolled",
        "mfa_methods",
        "mfa_backup_hashes",
        "failed_mfa_count",
        "last_mfa_success_at",
        "last_mfa_step",
      ].join(", ")
    )
    .eq("id", user.id)
    .maybeSingle<UserRow>();

  if (profileError) {
    logError("[auth] failed to load profile", profileError);
    throw new Error("Unable to load staff profile");
  }

  let resolvedProfile: UserRow | null = (profile as UserRow | null) ?? null;

  if (!resolvedProfile) {
    const service = supabaseSrv();
    const { data: fallback, error: fallbackError } = await service
      .from("users")
      .select(
        [
          "id",
          "email",
          "role",
          "sacco_id",
          "created_at",
          "updated_at",
          "mfa_enabled",
          "mfa_enrolled_at",
          "mfa_passkey_enrolled",
          "mfa_methods",
          "mfa_backup_hashes",
          "failed_mfa_count",
          "last_mfa_success_at",
          "last_mfa_step",
        ].join(", ")
      )
      .eq("id", user.id)
      .maybeSingle<UserRow>();

    if (fallbackError || !fallback) {
      logError("[auth] failed to load profile", fallbackError);
      throw new Error("Unable to load staff profile");
    }

    resolvedProfile = fallback as UserRow;
  }

  if (!resolvedProfile) {
    throw new Error("Unable to load staff profile");
  }

  const saccoDetails: ProfileRow["sacco"] = null;

  // Check MFA status
  let mfaVerified = false;
  if (resolvedProfile.mfa_enabled) {
    const token = await readCookieToken(MFA_SESSION_COOKIE);
    if (token) {
      const payload = verifyMfaSessionToken(token);
      if (payload && payload.userId === user.id) {
        mfaVerified = true;
      }
    }
  } else {
    mfaVerified = true;
  }

  return {
    user,
    profile: { ...resolvedProfile, sacco: saccoDetails } as ProfileRow,
    mfaVerified: resolvedProfile.mfa_enabled ? mfaVerified : true,
  };
}

export async function requireUserAndProfile(): Promise<AuthContext> {
  const context = await fetchUserAndProfile();
  if (!context) {
    redirect("/login");
  }

  if (context.profile.mfa_enabled && !context.mfaVerified) {
    redirect("/mfa-challenge");
  }

  return context;
}

export async function redirectIfAuthenticated(destination = "/dashboard") {
  const context = await fetchUserAndProfile();
  if (context) {
    redirect(destination);
  }
}
