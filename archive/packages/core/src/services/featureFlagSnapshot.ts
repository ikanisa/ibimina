import type { FeatureFlagSnapshot } from "./types";

export function createFeatureFlagSnapshot(
  flags: Partial<FeatureFlagSnapshot>
): FeatureFlagSnapshot {
  return {
    nfcReferenceCards: Boolean(flags.nfcReferenceCards),
    memberVouchers: Boolean(flags.memberVouchers),
    memberLoans: Boolean(flags.memberLoans),
  };
}
