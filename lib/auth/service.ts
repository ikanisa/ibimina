import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

// The ProfileRow type represents a user's profile in our application.  It is
// based on the row definition for the `public.users` table, with the secret
// MFA fields removed.  We also include an optional nested `saccos` object
// representing the Sacco that the user belongs to.  When migrating to the
// `app.user_profiles` table we continue to hydrate this type manually by
// combining data from `public.users` and `app.user_profiles`.
export type ProfileRow = Omit<
  Database["public"]["Tables"]["users"]["Row"],
  "mfa_secret_enc"
> & {
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

/**
 * Fetch the currently authenticated user and their profile.
 *
 * This function previously queried the `public.users` table and joined
 * directly against `saccos` using the `sacco_id` column.  After the
 * introduction of the `app.user_profiles` table the old join will fail if
 * the foreign key between `users.sacco_id` and `saccos.id` does not exist.
 *
 * To support both schemas we now perform two separate queries:
 *   1. Fetch the user row from `public.users` to obtain the core user
 *      properties (email, MFA settings, etc.).
 *   2. Fetch the corresponding row from `app.user_profiles` to obtain the
 *      user’s role and sacco relationship, including the nested Sacco
 *      record.  We specify the `app` schema explicitly so that the
 *      `user_profiles` table is queried even when the default schema is
 *      `public`.
 *
 * The resulting objects are merged to produce a `ProfileRow` instance.  If
 * either query fails we log the error and propagate a user-friendly error
 * message.
 */
export async function fetchUserAndProfile(): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();

  // Fetch the currently authenticated user via the auth API.  If no user
  // exists we return null to signal unauthenticated state.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // Retrieve the core user fields from the `public.users` table.  We omit
  // `mfa_secret_enc` from the selection because it is excluded from the
  // ProfileRow type.  We do not join against saccos here because the
  // relationship may not exist on older deployments.
  const {
    data: userRow,
    error: userRowError,
  } = await supabase
    .from("users")
    .select(
      "id, email, role, sacco_id, created_at, updated_at, mfa_enabled, mfa_enrolled_at, mfa_passkey_enrolled, mfa_methods, mfa_backup_hashes, failed_mfa_count, last_mfa_success_at, last_mfa_step"
    )
    .eq("id", user.id)
    .maybeSingle();

  // Retrieve the user profile from the `app.user_profiles` table.  We use
  // `.schema('app')` to target the correct schema.  The `saccos` relation
  // is automatically resolved based on the foreign key defined in the
  // database.  If no profile exists for the user (for example, before
  // migrations have run) this will return null.
  const {
    data: userProfileRow,
    error: userProfileError,
  } = await supabase
    .schema("app")
    .from("user_profiles")
    .select(
      "role, sacco_id, saccos(id, name, district, province, sector_code, category)"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (userRowError || userProfileError) {
    console.error(
      "[auth] failed to load profile",
      userRowError ?? userProfileError
    );
    return null;
  }

  if (!userRow) {
    return null;
  }

  // Merge the two records.  The role and sacco_id from the user_profiles
  // table take precedence over values from the users table because the
  // former reflects the canonical mapping in the new schema.  If
  // userProfileRow is null we fall back to the userRow values and leave
  // `saccos` undefined.
  const userShape = userRow as Omit<ProfileRow, "saccos">;
  type UserRole = Database["public"]["Tables"]["users"]["Row"]["role"];
  const overrideRole = userProfileRow?.role as UserRole | null | undefined;
  const overrideSaccoId = userProfileRow?.sacco_id ?? null;

  const profile: ProfileRow = {
    ...userShape,
    role: (overrideRole ?? userShape.role) as UserRole,
    sacco_id: overrideSaccoId ?? userShape.sacco_id,
    saccos: userProfileRow?.saccos ?? null,
  };

  return {
    user,
    profile,
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
