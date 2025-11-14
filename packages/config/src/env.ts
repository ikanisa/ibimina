import { Buffer } from "node:buffer";
import { z } from "zod";
import { requiredEnvConfig } from "./data/requiredEnvConfig";

type ProcessEnvSource = Partial<Record<string, string | undefined>>;

function buildRawEnv(source: ProcessEnvSource) {
  const analyticsCacheToken = source.ANALYTICS_CACHE_TOKEN?.trim();

  return {
    NODE_ENV: source.NODE_ENV ?? "development",
    APP_ENV: source.APP_ENV ?? source.NODE_ENV ?? "development",
    NETLIFY_CONTEXT: source.NETLIFY_CONTEXT ?? source.CONTEXT,
    APP_REGION: source.APP_REGION,
    GIT_COMMIT_SHA: source.GIT_COMMIT_SHA,
    NEXT_PUBLIC_SUPABASE_URL: source.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: source.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: source.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_BUILD_ID: source.NEXT_PUBLIC_BUILD_ID,
    NEXT_PUBLIC_E2E: source.NEXT_PUBLIC_E2E,
    NEXT_PUBLIC_SENTRY_DSN: source.NEXT_PUBLIC_SENTRY_DSN,
    SENTRY_DSN: source.SENTRY_DSN,
    SENTRY_TRACES_SAMPLE_RATE: source.SENTRY_TRACES_SAMPLE_RATE,
    SENTRY_PROFILES_SAMPLE_RATE: source.SENTRY_PROFILES_SAMPLE_RATE,
    POSTHOG_API_KEY: source.POSTHOG_API_KEY,
    POSTHOG_HOST: source.POSTHOG_HOST,
    SUPABASE_SERVICE_ROLE_KEY: source.SUPABASE_SERVICE_ROLE_KEY,
    BACKUP_PEPPER: source.BACKUP_PEPPER,
    RATE_LIMIT_SECRET: source.RATE_LIMIT_SECRET,
    EMAIL_OTP_PEPPER: source.EMAIL_OTP_PEPPER,
    MFA_SESSION_SECRET: source.MFA_SESSION_SECRET,
    TRUSTED_COOKIE_SECRET: source.TRUSTED_COOKIE_SECRET,
    MFA_SESSION_TTL_SECONDS: source.MFA_SESSION_TTL_SECONDS ?? "43200",
    TRUSTED_DEVICE_TTL_SECONDS: source.TRUSTED_DEVICE_TTL_SECONDS ?? "2592000",
    MFA_RP_ID: source.MFA_RP_ID,
    MFA_ORIGIN: source.MFA_ORIGIN,
    MFA_RP_NAME: source.MFA_RP_NAME ?? "SACCO+",
    MFA_EMAIL_LOCALE: source.MFA_EMAIL_LOCALE ?? "en",
    MFA_EMAIL_FROM: source.MFA_EMAIL_FROM ?? "security@example.com",
    ANALYTICS_CACHE_TOKEN:
      analyticsCacheToken && analyticsCacheToken.length > 0 ? analyticsCacheToken : undefined,
    REPORT_SIGNING_KEY: source.REPORT_SIGNING_KEY,
    OPENAI_API_KEY: source.OPENAI_API_KEY,
    OPENAI_OCR_MODEL: source.OPENAI_OCR_MODEL ?? "gpt-4.1-mini",
    OPENAI_RESPONSES_MODEL: source.OPENAI_RESPONSES_MODEL ?? "gpt-4.1-mini",
    MAIL_FROM: source.MAIL_FROM ?? "SACCO+ <no-reply@sacco.plus>",
    SMTP_HOST: source.SMTP_HOST,
    SMTP_PORT: source.SMTP_PORT ?? "587",
    SMTP_USER: source.SMTP_USER,
    SMTP_PASS: source.SMTP_PASS,
    LOG_DRAIN_URL: source.LOG_DRAIN_URL,
    LOG_DRAIN_TOKEN: source.LOG_DRAIN_TOKEN,
    LOG_DRAIN_SOURCE: source.LOG_DRAIN_SOURCE,
    LOG_DRAIN_TIMEOUT_MS: source.LOG_DRAIN_TIMEOUT_MS ?? "2000",
    LOG_DRAIN_ALERT_WEBHOOK: source.LOG_DRAIN_ALERT_WEBHOOK,
    LOG_DRAIN_ALERT_TOKEN: source.LOG_DRAIN_ALERT_TOKEN,
    LOG_DRAIN_ALERT_COOLDOWN_MS: source.LOG_DRAIN_ALERT_COOLDOWN_MS ?? "300000",
    LOG_DRAIN_SILENT: source.LOG_DRAIN_SILENT,
    HMAC_SHARED_SECRET: source.HMAC_SHARED_SECRET,
    KMS_DATA_KEY: source.KMS_DATA_KEY,
    KMS_DATA_KEY_BASE64: source.KMS_DATA_KEY_BASE64,
    META_WHATSAPP_ACCESS_TOKEN: source.META_WHATSAPP_ACCESS_TOKEN,
    META_WHATSAPP_PHONE_NUMBER_ID: source.META_WHATSAPP_PHONE_NUMBER_ID,
    META_WHATSAPP_BUSINESS_ACCOUNT_ID: source.META_WHATSAPP_BUSINESS_ACCOUNT_ID,
    SITE_URL: source.SITE_URL,
    EDGE_URL: source.EDGE_URL,
    DISABLE_PWA: source.DISABLE_PWA,
    ANALYZE_BUNDLE: source.ANALYZE_BUNDLE,
    AUTH_E2E_STUB: source.AUTH_E2E_STUB,
    AUTH_GUEST_MODE: source.AUTH_GUEST_MODE,
    E2E_BACKUP_PEPPER: source.E2E_BACKUP_PEPPER,
    E2E_MFA_SESSION_SECRET: source.E2E_MFA_SESSION_SECRET,
    E2E_TRUSTED_COOKIE_SECRET: source.E2E_TRUSTED_COOKIE_SECRET,
    E2E_RATE_LIMIT_SECRET: source.E2E_RATE_LIMIT_SECRET,
    E2E_KMS_DATA_KEY: source.E2E_KMS_DATA_KEY,
    PLAYWRIGHT_BASE_URL: source.PLAYWRIGHT_BASE_URL,
    PLAYWRIGHT_SUPABASE_URL: source.PLAYWRIGHT_SUPABASE_URL,
    PLAYWRIGHT_SUPABASE_ANON_KEY: source.PLAYWRIGHT_SUPABASE_ANON_KEY,
    CI: source.CI,
    CONFIGCAT_OFFERS_SDK_KEY: source.CONFIGCAT_OFFERS_SDK_KEY,
    CONFIGCAT_ENVIRONMENT: source.CONFIGCAT_ENVIRONMENT,
    CONFIGCAT_OFFERS_FALLBACK: source.CONFIGCAT_OFFERS_FALLBACK,
    CONFIGCAT_OFFERS_OVERRIDES: source.CONFIGCAT_OFFERS_OVERRIDES,
    CONFIGCAT_SETTINGS_URL: source.CONFIGCAT_SETTINGS_URL,
    AI_AGENT_SESSION_STORE: source.AI_AGENT_SESSION_STORE ?? "supabase",
    AI_AGENT_SESSION_TTL_SECONDS: source.AI_AGENT_SESSION_TTL_SECONDS ?? "3600",
    AI_AGENT_RATE_LIMIT_MAX_REQUESTS: source.AI_AGENT_RATE_LIMIT_MAX_REQUESTS ?? "60",
    AI_AGENT_RATE_LIMIT_WINDOW_SECONDS: source.AI_AGENT_RATE_LIMIT_WINDOW_SECONDS ?? "60",
    AI_AGENT_USAGE_LOG_ENABLED: source.AI_AGENT_USAGE_LOG_ENABLED ?? "true",
    AI_AGENT_USAGE_LOG_TABLE: source.AI_AGENT_USAGE_LOG_TABLE ?? "agent_usage_events",
    AI_AGENT_OPTOUT_TABLE: source.AI_AGENT_OPTOUT_TABLE ?? "agent_opt_outs",
    AI_AGENT_REDIS_URL: source.AI_AGENT_REDIS_URL,
  } as Record<string, string | undefined>;
}

const optionalString = z.string().trim().min(1).optional();

const positiveNumberString = z
  .string()
  .trim()
  .regex(/^\d+$/, { message: "Expected a positive integer" });

function isProductionLikeContext({
  appEnv,
  nodeEnv,
  netlifyContext,
}: {
  appEnv: string;
  nodeEnv: string;
  netlifyContext?: string;
}) {
  const normalizedContext = netlifyContext?.trim().toLowerCase();
  if (normalizedContext && ["production", "prod"].includes(normalizedContext)) {
    return true;
  }
  return appEnv === "production" || nodeEnv === "production";
}

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]),
    APP_ENV: z
      .enum(["development", "test", "preview", "staging", "production"])
      .default("development"),
    NETLIFY_CONTEXT: optionalString,
    APP_REGION: optionalString,
    GIT_COMMIT_SHA: optionalString,
    NEXT_PUBLIC_SUPABASE_URL: z
      .string({ required_error: "NEXT_PUBLIC_SUPABASE_URL is required" })
      .trim()
      .url({ message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL" }),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z
      .string({ required_error: "NEXT_PUBLIC_SUPABASE_ANON_KEY is required" })
      .trim()
      .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
    NEXT_PUBLIC_SITE_URL: optionalString,
    NEXT_PUBLIC_BUILD_ID: optionalString,
    NEXT_PUBLIC_E2E: optionalString,
    NEXT_PUBLIC_SENTRY_DSN: optionalString,
    SENTRY_DSN: optionalString,
    SENTRY_TRACES_SAMPLE_RATE: optionalString,
    SENTRY_PROFILES_SAMPLE_RATE: optionalString,
    POSTHOG_API_KEY: optionalString,
    POSTHOG_HOST: optionalString,
    SUPABASE_SERVICE_ROLE_KEY: z
      .string({ required_error: "SUPABASE_SERVICE_ROLE_KEY is required" })
      .trim()
      .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
    BACKUP_PEPPER: z
      .string({ required_error: "BACKUP_PEPPER is required" })
      .trim()
      .min(1, "BACKUP_PEPPER is required"),
    RATE_LIMIT_SECRET: optionalString,
    EMAIL_OTP_PEPPER: optionalString,
    MFA_SESSION_SECRET: z
      .string({ required_error: "MFA_SESSION_SECRET is required" })
      .trim()
      .min(1, "MFA_SESSION_SECRET is required"),
    TRUSTED_COOKIE_SECRET: z
      .string({ required_error: "TRUSTED_COOKIE_SECRET is required" })
      .trim()
      .min(1, "TRUSTED_COOKIE_SECRET is required"),
    MFA_SESSION_TTL_SECONDS: positiveNumberString,
    TRUSTED_DEVICE_TTL_SECONDS: positiveNumberString,
    MFA_RP_ID: optionalString,
    MFA_ORIGIN: optionalString,
    MFA_RP_NAME: z.string().trim().min(1),
    MFA_EMAIL_LOCALE: z.string().trim().min(1),
    MFA_EMAIL_FROM: z.string().trim().min(3),
    ANALYTICS_CACHE_TOKEN: optionalString,
    REPORT_SIGNING_KEY: optionalString,
    OPENAI_API_KEY: optionalString,
    OPENAI_OCR_MODEL: z.string().trim().min(1),
    OPENAI_RESPONSES_MODEL: z.string().trim().min(1),
    MAIL_FROM: z.string().trim().min(3),
    SMTP_HOST: optionalString,
    SMTP_PORT: positiveNumberString,
    SMTP_USER: optionalString,
    SMTP_PASS: optionalString,
    LOG_DRAIN_URL: optionalString,
    LOG_DRAIN_TOKEN: optionalString,
    LOG_DRAIN_SOURCE: optionalString,
    LOG_DRAIN_TIMEOUT_MS: positiveNumberString,
    LOG_DRAIN_ALERT_WEBHOOK: optionalString,
    LOG_DRAIN_ALERT_TOKEN: optionalString,
    LOG_DRAIN_ALERT_COOLDOWN_MS: positiveNumberString,
    LOG_DRAIN_SILENT: optionalString,
    HMAC_SHARED_SECRET: z
      .string({ required_error: "HMAC_SHARED_SECRET is required" })
      .trim()
      .min(1, "HMAC_SHARED_SECRET is required"),
    KMS_DATA_KEY: optionalString,
    KMS_DATA_KEY_BASE64: optionalString,
    META_WHATSAPP_ACCESS_TOKEN: optionalString,
    META_WHATSAPP_PHONE_NUMBER_ID: optionalString,
    META_WHATSAPP_BUSINESS_ACCOUNT_ID: optionalString,
    SITE_URL: optionalString,
    EDGE_URL: optionalString,
    DISABLE_PWA: optionalString,
    ANALYZE_BUNDLE: optionalString,
    AUTH_E2E_STUB: optionalString,
    AUTH_GUEST_MODE: optionalString,
    E2E_BACKUP_PEPPER: optionalString,
    E2E_MFA_SESSION_SECRET: optionalString,
    E2E_TRUSTED_COOKIE_SECRET: optionalString,
    E2E_RATE_LIMIT_SECRET: optionalString,
    E2E_KMS_DATA_KEY: optionalString,
    PLAYWRIGHT_BASE_URL: optionalString,
    PLAYWRIGHT_SUPABASE_URL: optionalString,
    PLAYWRIGHT_SUPABASE_ANON_KEY: optionalString,
    CI: optionalString,
    CONFIGCAT_OFFERS_SDK_KEY: optionalString,
    CONFIGCAT_ENVIRONMENT: optionalString,
    CONFIGCAT_OFFERS_FALLBACK: optionalString,
    CONFIGCAT_OFFERS_OVERRIDES: optionalString,
    CONFIGCAT_SETTINGS_URL: optionalString,
    AI_AGENT_SESSION_STORE: z.enum(["supabase", "redis"]).default("supabase"),
    AI_AGENT_SESSION_TTL_SECONDS: positiveNumberString,
    AI_AGENT_RATE_LIMIT_MAX_REQUESTS: positiveNumberString,
    AI_AGENT_RATE_LIMIT_WINDOW_SECONDS: positiveNumberString,
    AI_AGENT_USAGE_LOG_ENABLED: z.string().default("true"),
    AI_AGENT_USAGE_LOG_TABLE: z.string().default("agent_usage_events"),
    AI_AGENT_OPTOUT_TABLE: z.string().default("agent_opt_outs"),
    AI_AGENT_REDIS_URL: optionalString,
  })
  .superRefine((values, ctx) => {
    const kmsCandidates = [values.KMS_DATA_KEY, values.KMS_DATA_KEY_BASE64].filter(
      (candidate): candidate is string => Boolean(candidate && candidate.trim().length > 0)
    );

    if (kmsCandidates.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide KMS_DATA_KEY or KMS_DATA_KEY_BASE64 (32-byte base64 string)",
        path: ["KMS_DATA_KEY"],
      });
    } else {
      for (const candidate of kmsCandidates) {
        const decoded = Buffer.from(candidate, "base64");
        if (decoded.length !== 32) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "KMS data key must decode to 32 bytes",
            path: ["KMS_DATA_KEY"],
          });
          break;
        }
      }
    }

    const requiresOpenAiKey = isProductionLikeContext({
      appEnv: values.APP_ENV,
      nodeEnv: values.NODE_ENV,
      netlifyContext: values.NETLIFY_CONTEXT,
    });

    if (requiresOpenAiKey && (!values.OPENAI_API_KEY || values.OPENAI_API_KEY.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "OPENAI_API_KEY is required in production deployments.",
        path: ["OPENAI_API_KEY"],
      });
    }
  });

export type RawEnv = z.infer<typeof schema>;

function withStubFallbacks(raw: ProcessEnvSource): ProcessEnvSource {
  const nodeEnv = raw.NODE_ENV ?? "development";
  const isDevelopmentMode = nodeEnv === "development" || nodeEnv === "test";
  const isStubMode = raw.AUTH_E2E_STUB === "1" || raw.AUTH_GUEST_MODE === "1";

  if (!isDevelopmentMode && !isStubMode) {
    return raw;
  }

  const stubbedDefaults = Object.freeze({
    NEXT_PUBLIC_SUPABASE_URL: "https://stub.supabase.local",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "stub-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "stub-service-role-key",
    BACKUP_PEPPER: "stub-backup-pepper",
    MFA_SESSION_SECRET: "stub-mfa-session-secret",
    TRUSTED_COOKIE_SECRET: "stub-trusted-cookie-secret",
    HMAC_SHARED_SECRET: "stub-hmac-shared-secret",
    OPENAI_API_KEY: "stub-openai-api-key",
    KMS_DATA_KEY_BASE64: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  } as const);

  const withFallback = (value: string | undefined, fallback: string) => {
    if (typeof value === "string" && value.trim().length > 0 && value.trim() !== "-") {
      return value;
    }
    return fallback;
  };

  const augmented: ProcessEnvSource = { ...raw };

  const applyWithFallback = (key: keyof typeof stubbedDefaults) => {
    const fallback = stubbedDefaults[key];
    const original = raw[key];
    const value = withFallback(original, fallback);
    augmented[key] = value;

    if (typeof original !== "string" || original.trim().length === 0 || original.trim() === "-") {
      process.env[key] = value;
    }
  };

  applyWithFallback("NEXT_PUBLIC_SUPABASE_URL");
  applyWithFallback("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  applyWithFallback("SUPABASE_SERVICE_ROLE_KEY");
  applyWithFallback("BACKUP_PEPPER");
  applyWithFallback("MFA_SESSION_SECRET");
  applyWithFallback("TRUSTED_COOKIE_SECRET");
  applyWithFallback("HMAC_SHARED_SECRET");
  applyWithFallback("OPENAI_API_KEY");

  const hasKmsDataKey = Boolean(
    raw.KMS_DATA_KEY && raw.KMS_DATA_KEY.trim().length > 0 && raw.KMS_DATA_KEY.trim() !== "-"
  );
  const hasKmsDataKeyBase64 = Boolean(
    raw.KMS_DATA_KEY_BASE64 &&
      raw.KMS_DATA_KEY_BASE64.trim().length > 0 &&
      raw.KMS_DATA_KEY_BASE64.trim() !== "-"
  );

  if (!hasKmsDataKey && !hasKmsDataKeyBase64) {
    augmented.KMS_DATA_KEY_BASE64 = stubbedDefaults.KMS_DATA_KEY_BASE64;
    if (!process.env.KMS_DATA_KEY_BASE64) {
      process.env.KMS_DATA_KEY_BASE64 = stubbedDefaults.KMS_DATA_KEY_BASE64;
    }
  }

  return augmented;
}

function parsePositiveInteger(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function parseSampleRateValue(value: string | undefined, fallback: number): number {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
}

export type ServerEnv = ReturnType<typeof prepareServerEnv>;

function prepareServerEnv(parsedEnv: RawEnv) {
  const rateLimitSecret = parsedEnv.RATE_LIMIT_SECRET ?? parsedEnv.BACKUP_PEPPER;
  const emailOtpPepper = parsedEnv.EMAIL_OTP_PEPPER ?? parsedEnv.BACKUP_PEPPER;
  const kmsDataKey = parsedEnv.KMS_DATA_KEY ?? parsedEnv.KMS_DATA_KEY_BASE64!;

  return Object.freeze({
    ...parsedEnv,
    MFA_SESSION_TTL_SECONDS: parsePositiveInteger(parsedEnv.MFA_SESSION_TTL_SECONDS, 12 * 60 * 60),
    TRUSTED_DEVICE_TTL_SECONDS: parsePositiveInteger(
      parsedEnv.TRUSTED_DEVICE_TTL_SECONDS,
      30 * 24 * 60 * 60
    ),
    LOG_DRAIN_TIMEOUT_MS: parsePositiveInteger(parsedEnv.LOG_DRAIN_TIMEOUT_MS, 2000),
    LOG_DRAIN_ALERT_COOLDOWN_MS: parsePositiveInteger(
      parsedEnv.LOG_DRAIN_ALERT_COOLDOWN_MS,
      5 * 60 * 1000
    ),
    SMTP_PORT: parsePositiveInteger(parsedEnv.SMTP_PORT, 587),
    SENTRY_TRACES_SAMPLE_RATE: parseSampleRateValue(
      parsedEnv.SENTRY_TRACES_SAMPLE_RATE,
      parsedEnv.APP_ENV === "production" ? 0.2 : 1
    ),
    SENTRY_PROFILES_SAMPLE_RATE: parseSampleRateValue(
      parsedEnv.SENTRY_PROFILES_SAMPLE_RATE,
      parsedEnv.APP_ENV === "production" ? 0.1 : 1
    ),
    rateLimitSecret,
    emailOtpPepper,
    kmsDataKey,
  });
}

function loadRawEnv(source: ProcessEnvSource): RawEnv {
  const base = buildRawEnv(source);
  const envWithFallbacks = withStubFallbacks(base);

  try {
    return schema.parse(envWithFallbacks);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues
        .map((issue) => `- ${issue.path.join(".") || "<root>"}: ${issue.message}`)
        .join("\n");
      console.error("\nEnvironment validation failed:\n" + details + "\n");
    }
    throw error;
  }
}

let cachedServerEnv: ServerEnv | null = null;

export function loadServerEnv(overrides: ProcessEnvSource = process.env): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  const parsed = loadRawEnv(overrides);
  cachedServerEnv = prepareServerEnv(parsed);
  return cachedServerEnv;
}

export const env = loadServerEnv();

export const clientEnv = Object.freeze({
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL ?? null,
  NEXT_PUBLIC_BUILD_ID: env.NEXT_PUBLIC_BUILD_ID ?? null,
  NEXT_PUBLIC_SENTRY_DSN: env.NEXT_PUBLIC_SENTRY_DSN ?? null,
});

export const requiredServerEnv: ReadonlyArray<string> = Object.freeze(requiredEnvConfig.required);
export const atLeastOneServerEnv: ReadonlyArray<ReadonlyArray<string>> = Object.freeze(
  requiredEnvConfig.atLeastOne.map((group) => [...group])
);

export type ClientEnv = typeof clientEnv;
export type RequiredServerEnvGroups = typeof atLeastOneServerEnv;
