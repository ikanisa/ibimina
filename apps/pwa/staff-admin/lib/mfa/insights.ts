import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/observability/logger";
import type { Database } from "@/lib/supabase/types";

export type MfaRiskReason =
  | { type: "disabled" }
  | { type: "stale"; days: number }
  | { type: "failures"; failures: number };

export interface MfaRiskAccount {
  id: string;
  email: string | null;
  saccoId: string | null;
  saccoName: string | null;
  lastSuccessAt: string | null;
  failures: number;
  reason: MfaRiskReason[];
}

export interface MfaSaccoCoverage {
  saccoId: string | null;
  saccoName: string;
  userCount: number;
  mfaEnabled: number;
}

export interface MfaInsights {
  totals: {
    users: number;
    mfaEnabled: number;
    passkeyUsers: number;
    passkeyCredentials: number;
    totpUsers: number;
    emailUsers: number;
    trustedDevices: number;
    outstandingEmailCodes: number;
  };
  riskAccounts: MfaRiskAccount[];
  saccoCoverage: MfaSaccoCoverage[];
}

type UserRow = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  | "id"
  | "email"
  | "mfa_enabled"
  | "mfa_methods"
  | "mfa_passkey_enrolled"
  | "last_mfa_success_at"
  | "failed_mfa_count"
  | "sacco_id"
  | "role"
> & { saccos?: { name: string | null } | null };

const STALE_DAYS_THRESHOLD = 30;
const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;

function calculateDaysSince(dateIso: string | null): number | null {
  if (!dateIso) return null;
  const value = Date.parse(dateIso);
  if (Number.isNaN(value)) return null;
  const diff = Date.now() - value;
  return Math.max(0, Math.round(diff / MILLIS_PER_DAY));
}

export async function getMfaInsights(): Promise<MfaInsights> {
  const supabase = createSupabaseAdminClient();

  const [
    { data: userRowsRaw, error: userError },
    { count: trustedCount },
    { count: passkeyCount },
    emailCodesResult,
  ] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, email, mfa_enabled, mfa_methods, mfa_passkey_enrolled, last_mfa_success_at, failed_mfa_count, sacco_id, role, saccos(name)"
      ),
    supabase.from("trusted_devices").select("id", { count: "exact", head: true }),
    supabase.from("webauthn_credentials").select("id", { count: "exact", head: true }),
    supabase
      .schema("app")
      .from("mfa_email_codes")
      .select("id", { count: "exact", head: true })
      .is("consumed_at", null)
      .gte("expires_at", new Date().toISOString()),
  ]);

  if (userError) {
    throw userError;
  }

  if (emailCodesResult.error) {
    logError("mfa_insights: failed to load email code metadata", emailCodesResult.error);
  }

  const userRows = (userRowsRaw ?? []) as UserRow[];

  let mfaEnabled = 0;
  let passkeyUsers = 0;
  let totpUsers = 0;
  let emailUsers = 0;

  const riskAccounts: MfaRiskAccount[] = [];
  const saccoCoverage = new Map<string | null, MfaSaccoCoverage>();

  userRows.forEach((user) => {
    const methods = new Set(user.mfa_methods ?? []);
    const saccoKey = user.sacco_id ?? null;
    const saccoEntry = saccoCoverage.get(saccoKey) ?? {
      saccoId: saccoKey,
      saccoName: user.saccos?.name ?? (saccoKey ? saccoKey : "Unassigned"),
      userCount: 0,
      mfaEnabled: 0,
    };
    saccoEntry.userCount += 1;

    const reasons: MfaRiskReason[] = [];
    const daysSince = calculateDaysSince(user.last_mfa_success_at);

    if (user.mfa_enabled) {
      mfaEnabled += 1;
      saccoEntry.mfaEnabled += 1;
    } else {
      reasons.push({ type: "disabled" });
    }

    if (user.mfa_passkey_enrolled) {
      passkeyUsers += 1;
    }

    if (methods.has("TOTP")) {
      totpUsers += 1;
    }

    if (methods.has("EMAIL")) {
      emailUsers += 1;
    }

    if (typeof daysSince === "number" && daysSince >= STALE_DAYS_THRESHOLD) {
      reasons.push({ type: "stale", days: daysSince });
    }

    const failures = user.failed_mfa_count ?? 0;
    if (failures >= 3) {
      reasons.push({ type: "failures", failures });
    }

    if (reasons.length > 0) {
      riskAccounts.push({
        id: user.id,
        email: user.email ?? null,
        saccoId: saccoKey,
        saccoName: saccoEntry.saccoName,
        lastSuccessAt: user.last_mfa_success_at ?? null,
        failures,
        reason: reasons,
      });
    }

    saccoCoverage.set(saccoKey, saccoEntry);
  });

  const sortedRisk = riskAccounts
    .sort((a, b) => {
      const score = (entry: MfaRiskAccount) => {
        const disabled = entry.reason.some((reason) => reason.type === "disabled");
        const stale = entry.reason.some((reason) => reason.type === "stale");
        const failures = entry.reason.some((reason) => reason.type === "failures");
        return [disabled ? 1 : 0, stale ? 1 : 0, failures ? 1 : 0].reduce(
          (acc, flag, index) => acc + flag * (3 - index),
          0
        );
      };
      const scoreDiff = score(b) - score(a);
      if (scoreDiff !== 0) return scoreDiff;
      const lastA = a.lastSuccessAt ? Date.parse(a.lastSuccessAt) : 0;
      const lastB = b.lastSuccessAt ? Date.parse(b.lastSuccessAt) : 0;
      return lastA - lastB;
    })
    .slice(0, 10);

  const saccoCoverageList = Array.from(saccoCoverage.values()).sort(
    (a, b) => b.mfaEnabled - a.mfaEnabled
  );

  return {
    totals: {
      users: userRows.length,
      mfaEnabled,
      passkeyUsers,
      passkeyCredentials: passkeyCount ?? 0,
      totpUsers,
      emailUsers,
      trustedDevices: trustedCount ?? 0,
      outstandingEmailCodes: emailCodesResult.count ?? 0,
    },
    riskAccounts: sortedRisk,
    saccoCoverage: saccoCoverageList,
  };
}
