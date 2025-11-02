export const requiredEnvConfig = Object.freeze({
  required: Object.freeze([
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "BACKUP_PEPPER",
    "MFA_SESSION_SECRET",
    "TRUSTED_COOKIE_SECRET",
    "HMAC_SHARED_SECRET",
    "OPENAI_API_KEY",
  ] as const),
  atLeastOne: Object.freeze([["KMS_DATA_KEY", "KMS_DATA_KEY_BASE64"]] as const),
} as const);

export type RequiredEnvConfig = typeof requiredEnvConfig;
