import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { fetchUserAndProfile } from "@/lib/auth/service";
import type { AuthContext, ProfileRow } from "@/lib/auth/service";

export type { AuthContext, ProfileRow } from "@/lib/auth/service";

// E2E testing stub authentication cookie name
const STUB_COOKIE_NAME = "stub-auth";

/**
 * Check if E2E stub authentication is enabled
 * Used during automated testing to bypass real Supabase authentication
 */
function isE2EStubEnabled() {
  return process.env.AUTH_E2E_STUB === "1";
}

/**
 * Get stub authentication context for E2E testing
 * Returns a mock user and profile when the stub-auth cookie is present
 * This allows automated tests to simulate authenticated sessions without real credentials
 */
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

/**
 * Retrieve the current user and their profile
 * Returns null if not authenticated
 * Uses stub authentication in E2E test mode, otherwise queries Supabase
 */
export async function getUserAndProfile(): Promise<AuthContext | null> {
  if (isE2EStubEnabled()) {
    return getStubContext();
  }
  return fetchUserAndProfile();
}

/**
 * Require authentication, redirecting to login if not authenticated
 * Use this in server components and API routes that need authentication
 * @throws Redirects to /login if user is not authenticated
 */
export async function requireUserAndProfile(): Promise<AuthContext> {
  const context = await getUserAndProfile();
  if (!context) {
    redirect("/login");
  }
  return context;
}

/**
 * Redirect authenticated users to the dashboard
 * Use this on public pages (like login) to prevent authenticated users from accessing them
 * @param destination - Where to redirect authenticated users (default: /dashboard)
 */
export async function redirectIfAuthenticated(destination = "/dashboard") {
  const context = await getUserAndProfile();
  if (!context) {
    return;
  }

  redirect(destination);
}
