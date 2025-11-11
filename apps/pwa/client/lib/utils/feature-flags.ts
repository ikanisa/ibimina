/**
 * Enhanced Feature Flag Utilities
 *
 * Supports regulatory tier-based feature toggles with org-specific overrides
 */

import { ClientFeatureMatrix, FeatureDomain, OrgFeatureOverride } from "../types/supa-app";

/**
 * Default feature matrix (P0 tier - no licenses required)
 */
export const DEFAULT_FEATURE_MATRIX: ClientFeatureMatrix = {
  savings: {
    enabled: true,
    tier: "P0",
    features: {
      ussd_deposit_reference: true,
      allocation_evidence: true,
      group_vault_proxy: false,
      direct_account_api: false,
    },
  },
  loans: {
    enabled: false,
    tier: "P0",
    features: {
      digital_applications: false,
      doc_collection: false,
      pre_scoring: false,
      offer_accept_disburse: false,
    },
  },
  wallet: {
    enabled: false,
    tier: "P0",
    features: {
      proxy_wallet: false,
      transaction_evidence: false,
      light_custodial: false,
      full_custodial: false,
    },
  },
  tokens: {
    enabled: false,
    tier: "P0",
    features: {
      voucher_tokens_offchain: false,
      stablecoin_onramp: false,
      multi_chain_settlement: false,
    },
  },
  nfc: {
    enabled: false,
    tier: "P0",
    features: {
      ndef_tag_reference: false,
      hce_vouchers: false,
      card_emulation_closed_loop: false,
    },
  },
  kyc: {
    enabled: true,
    tier: "P0",
    features: {
      ocr_selfie_capture: true,
      third_party_screening: false,
      full_kyc_account_opening: false,
    },
  },
  ai_agent: {
    enabled: false,
    tier: "P0",
    features: {
      faq_ussd_help: false,
      whatsapp_bot: false,
      voice_ivr_ticketing: false,
    },
  },
};

/**
 * Check if a domain feature is enabled
 */
export function isDomainEnabled(
  domain: FeatureDomain,
  matrix: ClientFeatureMatrix = DEFAULT_FEATURE_MATRIX
): boolean {
  return matrix[domain]?.enabled ?? false;
}

/**
 * Check if a specific feature within a domain is enabled
 */
export function isFeatureEnabled(
  domain: FeatureDomain,
  feature: string,
  matrix: ClientFeatureMatrix = DEFAULT_FEATURE_MATRIX
): boolean {
  const domainConfig = matrix[domain];
  if (!domainConfig || !domainConfig.enabled) {
    return false;
  }
  return domainConfig.features[feature] ?? false;
}

/**
 * Apply org-specific overrides to the base matrix
 */
export function applyOrgOverrides(
  baseMatrix: ClientFeatureMatrix,
  orgOverrides: OrgFeatureOverride[]
): ClientFeatureMatrix {
  const matrix = { ...baseMatrix };

  for (const override of orgOverrides) {
    if (override.enabled && matrix[override.feature_domain]) {
      matrix[override.feature_domain] = {
        enabled: override.enabled,
        tier: override.tier,
        features: {
          ...matrix[override.feature_domain].features,
          ...override.feature_config,
        },
      };
    }
  }

  return matrix;
}

/**
 * Get all enabled domains
 */
export function getEnabledDomains(
  matrix: ClientFeatureMatrix = DEFAULT_FEATURE_MATRIX
): FeatureDomain[] {
  return (Object.keys(matrix) as FeatureDomain[]).filter((domain) => matrix[domain].enabled);
}

/**
 * Get all enabled features for a domain
 */
export function getEnabledFeatures(
  domain: FeatureDomain,
  matrix: ClientFeatureMatrix = DEFAULT_FEATURE_MATRIX
): string[] {
  const domainConfig = matrix[domain];
  if (!domainConfig || !domainConfig.enabled) {
    return [];
  }
  return Object.keys(domainConfig.features).filter((feature) => domainConfig.features[feature]);
}

/**
 * Check if user has required tier access
 */
export function hasRequiredTier(
  domain: FeatureDomain,
  requiredTier: "P0" | "P1" | "P2",
  matrix: ClientFeatureMatrix = DEFAULT_FEATURE_MATRIX
): boolean {
  const domainConfig = matrix[domain];
  if (!domainConfig || !domainConfig.enabled) {
    return false;
  }

  const tierLevels = { P0: 0, P1: 1, P2: 2 };
  const currentLevel = tierLevels[domainConfig.tier];
  const requiredLevel = tierLevels[requiredTier];

  return currentLevel >= requiredLevel;
}

/**
 * Validate feature flag configuration
 */
export function validateFeatureMatrix(matrix: ClientFeatureMatrix): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate each domain
  const domains: FeatureDomain[] = [
    "savings",
    "loans",
    "wallet",
    "tokens",
    "nfc",
    "kyc",
    "ai_agent",
  ];
  for (const domain of domains) {
    if (!matrix[domain]) {
      errors.push(`Missing domain configuration for: ${domain}`);
      continue;
    }

    const domainConfig = matrix[domain];

    // Validate tier
    if (!["P0", "P1", "P2"].includes(domainConfig.tier)) {
      errors.push(`Invalid tier for ${domain}: ${domainConfig.tier}`);
    }

    // Validate features object
    if (typeof domainConfig.features !== "object") {
      errors.push(`Invalid features object for ${domain}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
