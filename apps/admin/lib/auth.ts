import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { fetchUserAndProfile } from "@/lib/auth/service";
import type { AuthContext, ProfileRow } from "@/lib/auth/service";

export type { AuthContext, ProfileRow } from "@/lib/auth/service";

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

export async function getUserAndProfile(): Promise<AuthContext | null> {
  if (isE2EStubEnabled()) {
    return getStubContext();
  }
  return fetchUserAndProfile();
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
