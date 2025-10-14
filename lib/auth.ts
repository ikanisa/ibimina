import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const STUB_COOKIE_NAME = "stub-auth";

function isE2EStubEnabled() {
  return process.env.AUTH_E2E_STUB === "1";
}

async function getStubContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const marker = cookieStore.get(STUB_COOKIE_NAME);
  if (!marker || marker.value !== "1") {
    return null;
  }

  const now = new Date().toISOString();
  const stubUser = {
    id: "00000000-0000-4000-8000-000000000001",
    email: "qa.staff@example.com",
    email_confirmed_at: now,
    phone: "",
    last_sign_in_at: now,
    role: "authenticated",
    app_metadata: { provider: "stub", providers: ["stub"] },
    user_metadata: {},
    identities: [],
    created_at: now,
    updated_at: now,
    factors: [],
    aud: "authenticated",
  } as User;

  const stubProfile: ProfileRow = {
    id: stubUser.id,
    email: stubUser.email!,
    role: "SACCO_MANAGER",
    sacco_id: "stub-sacco",
    created_at: now,
    updated_at: now,
    mfa_enabled: false,
    mfa_enrolled_at: null,
    mfa_passkey_enrolled: false,
    mfa_methods: [],
    mfa_backup_hashes: [],
    mfa_secret_enc: null,
    failed_mfa_count: 0,
    last_mfa_success_at: now,
    last_mfa_step: null,
    saccos: {
      id: "stub-sacco",
      name: "Kigali Downtown",
      district: "Gasabo",
      province: "Kigali",
      sector_code: "001",
      category: "UMURENGE",
    },
  } as ProfileRow;

  return { user: stubUser, profile: stubProfile };
}

export type ProfileRow = Database["public"]["Tables"]["users"]["Row"] & {
  saccos?: Pick<Database["public"]["Tables"]["saccos"]["Row"], "id" | "name" | "district" | "province" | "sector_code" | "category"> | null;
};

export interface AuthContext {
  user: User;
  profile: ProfileRow;
}

export async function getUserAndProfile(): Promise<AuthContext | null> {
  if (isE2EStubEnabled()) {
    return getStubContext();
  }

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
      "id, email, role, sacco_id, created_at, updated_at, mfa_enabled, mfa_enrolled_at, mfa_passkey_enrolled, mfa_methods, mfa_backup_hashes, failed_mfa_count, last_mfa_success_at, last_mfa_step, saccos(id, name, district, province, sector_code, category)"
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

  redirect(destination);
}
