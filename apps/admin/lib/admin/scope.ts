import type { ProfileRow } from "@/lib/auth";

export interface TenantScope {
  saccoId: string | null;
  includeAll: boolean;
}

export function resolveTenantScope(
  profile: ProfileRow,
  searchParams?: Record<string, string | string[] | undefined>,
): TenantScope {
  const raw = searchParams?.sacco;
  const requested = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : null;

  if (profile.role === "SYSTEM_ADMIN") {
    if (!requested || requested === "") {
      return { saccoId: null, includeAll: true };
    }
    return { saccoId: requested, includeAll: false };
  }

  if (requested && requested === profile.sacco_id) {
    return { saccoId: profile.sacco_id ?? null, includeAll: false };
  }

  return { saccoId: profile.sacco_id ?? null, includeAll: false };
}
