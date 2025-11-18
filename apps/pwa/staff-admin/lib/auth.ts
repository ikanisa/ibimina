import { redirect } from "next/navigation";
import { fetchUserAndProfile } from "@/lib/auth/service";
import type { AuthContext } from "@/lib/auth/service";
import { logError } from "@/lib/observability/logger";

export type { AuthContext, ProfileRow } from "@/lib/auth/service";

export async function getUserAndProfile(): Promise<AuthContext | null> {
  const context = await fetchUserAndProfile();
  if (!context) {
    return null;
  }

  const role =
    (context.user.app_metadata as { role?: string } | null)?.role || context.profile.role;
  if (!role) {
    logError("auth.missing_role", { userId: context.user.id });
    return null;
  }

  if (role !== context.profile.role) {
    logError("auth.role.mismatch", {
      userId: context.user.id,
      role,
      profileRole: context.profile.role,
    });
  }

  return {
    ...context,
    profile: { ...context.profile, role },
  } as AuthContext;
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
