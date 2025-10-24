import type { ProfileRow } from "@/lib/auth";

export interface TenantScope {
  saccoId: string | null;
  includeAll: boolean;
}

export function resolveTenantScope(
  profile: ProfileRow,
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams,
): TenantScope {
  const raw = isUrlSearchParams(searchParams)
    ? searchParams.get("sacco")
    : valueFromRecord(searchParams?.sacco);
  const requested = raw && raw.length > 0 ? raw : null;

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

function isUrlSearchParams(value: unknown): value is URLSearchParams {
  return typeof value === "object" && value !== null && typeof (value as URLSearchParams).get === "function";
}

function valueFromRecord(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const [first] = value;
    return typeof first === "string" ? first : null;
  }
  return null;
}
