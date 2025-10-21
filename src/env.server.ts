import { Buffer } from "node:buffer";
import { z } from "zod";
import requiredEnvConfig from "@/config/required-env.json" assert { type: "json" };

const rawEnv = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID,
  NEXT_PUBLIC_E2E: process.env.NEXT_PUBLIC_E2E,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  BACKUP_PEPPER: process.env.BACKUP_PEPPER,
  RATE_LIMIT_SECRET: process.env.RATE_LIMIT_SECRET,
  EMAIL_OTP_PEPPER: process.env.EMAIL_OTP_PEPPER,
  MFA_SESSION_SECRET: process.env.MFA_SESSION_SECRET,
  TRUSTED_COOKIE_SECRET: process.env.TRUSTED_COOKIE_SECRET,
  MFA_SESSION_TTL_SECONDS: process.env.MFA_SESSION_TTL_SECONDS ?? "43200",
  TRUSTED_DEVICE_TTL_SECONDS: process.env.TRUSTED_DEVICE_TTL_SECONDS ?? "2592000",
  MFA_RP_ID: process.env.MFA_RP_ID,
  MFA_ORIGIN: process.env.MFA_ORIGIN,
  MFA_RP_NAME: process.env.MFA_RP_NAME ?? "SACCO+",
  MFA_EMAIL_LOCALE: process.env.MFA_EMAIL_LOCALE ?? "en",
  MFA_EMAIL_FROM: process.env.MFA_EMAIL_FROM ?? "security@example.com",
  ANALYTICS_CACHE_TOKEN: process.env.ANALYTICS_CACHE_TOKEN,
  REPORT_SIGNING_KEY: process.env.REPORT_SIGNING_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_OCR_MODEL: process.env.OPENAI_OCR_MODEL ?? "gpt-4.1-mini",
  OPENAI_RESPONSES_MODEL: process.env.OPENAI_RESPONSES_MODEL ?? "gpt-4.1-mini",
  MAIL_FROM: process.env.MAIL_FROM ?? "SACCO+ <no-reply@sacco.plus>",
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ?? "587",
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  LOG_DRAIN_URL: process.env.LOG_DRAIN_URL,
  LOG_DRAIN_TOKEN: process.env.LOG_DRAIN_TOKEN,
  LOG_DRAIN_SOURCE: process.env.LOG_DRAIN_SOURCE,
  LOG_DRAIN_TIMEOUT_MS: process.env.LOG_DRAIN_TIMEOUT_MS ?? "2000",
  LOG_DRAIN_ALERT_WEBHOOK: process.env.LOG_DRAIN_ALERT_WEBHOOK,
  LOG_DRAIN_ALERT_TOKEN: process.env.LOG_DRAIN_ALERT_TOKEN,
  LOG_DRAIN_ALERT_COOLDOWN_MS: process.env.LOG_DRAIN_ALERT_COOLDOWN_MS ?? "300000",
  LOG_DRAIN_SILENT: process.env.LOG_DRAIN_SILENT,
  HMAC_SHARED_SECRET: process.env.HMAC_SHARED_SECRET,
  KMS_DATA_KEY: process.env.KMS_DATA_KEY,
  KMS_DATA_KEY_BASE64: process.env.KMS_DATA_KEY_BASE64,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886",
  SITE_URL: process.env.SITE_URL,
  EDGE_URL: process.env.EDGE_URL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
  VERCEL_URL: process.env.VERCEL_URL,
  VERCEL_REGION: process.env.VERCEL_REGION,
  DISABLE_PWA: process.env.DISABLE_PWA,
  ANALYZE_BUNDLE: process.env.ANALYZE_BUNDLE,
  AUTH_E2E_STUB: process.env.AUTH_E2E_STUB,
  E2E_BACKUP_PEPPER: process.env.E2E_BACKUP_PEPPER,
  E2E_MFA_SESSION_SECRET: process.env.E2E_MFA_SESSION_SECRET,
  E2E_TRUSTED_COOKIE_SECRET: process.env.E2E_TRUSTED_COOKIE_SECRET,
  E2E_RATE_LIMIT_SECRET: process.env.E2E_RATE_LIMIT_SECRET,
  E2E_KMS_DATA_KEY: process.env.E2E_KMS_DATA_KEY,
  PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL,
  PLAYWRIGHT_SUPABASE_URL: process.env.PLAYWRIGHT_SUPABASE_URL,
  PLAYWRIGHT_SUPABASE_ANON_KEY: process.env.PLAYWRIGHT_SUPABASE_ANON_KEY,
  CI: process.env.CI,
};

const optionalString = z
  .string()
  .trim()
  .min(1)
  .optional();

const positiveNumberString = z
  .string()
  .trim()
  .regex(/^\d+$/, { message: "Expected a positive integer" });

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]),
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
    OPENAI_API_KEY: z
      .string({ required_error: "OPENAI_API_KEY is required" })
      .trim()
      .min(1, "OPENAI_API_KEY is required"),
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
    TWILIO_ACCOUNT_SID: optionalString,
    TWILIO_AUTH_TOKEN: optionalString,
    TWILIO_WHATSAPP_FROM: z.string().trim().min(1),
    SITE_URL: optionalString,
    EDGE_URL: optionalString,
    VERCEL_ENV: optionalString,
    VERCEL_GIT_COMMIT_SHA: optionalString,
    VERCEL_URL: optionalString,
    VERCEL_REGION: optionalString,
    DISABLE_PWA: optionalString,
    ANALYZE_BUNDLE: optionalString,
    AUTH_E2E_STUB: optionalString,
    E2E_BACKUP_PEPPER: optionalString,
    E2E_MFA_SESSION_SECRET: optionalString,
    E2E_TRUSTED_COOKIE_SECRET: optionalString,
    E2E_RATE_LIMIT_SECRET: optionalString,
    E2E_KMS_DATA_KEY: optionalString,
    PLAYWRIGHT_BASE_URL: optionalString,
    PLAYWRIGHT_SUPABASE_URL: optionalString,
    PLAYWRIGHT_SUPABASE_ANON_KEY: optionalString,
    CI: optionalString,
  })
  .superRefine((values, ctx) => {
    const kmsCandidates = [values.KMS_DATA_KEY, values.KMS_DATA_KEY_BASE64].filter(
      (candidate): candidate is string => Boolean(candidate && candidate.trim().length > 0),
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
  });

function parsePositiveInteger(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

let parsedEnv: z.infer<typeof schema>;
try {
  parsedEnv = schema.parse(rawEnv);
} catch (error) {
  if (error instanceof z.ZodError) {
    const details = error.issues
      .map((issue) => `- ${issue.path.join(".") || "<root>"}: ${issue.message}`)
      .join("\n");
    console.error("\nEnvironment validation failed:\n" + details + "\n");
  }
  throw error;
}

const rateLimitSecret = parsedEnv.RATE_LIMIT_SECRET ?? parsedEnv.BACKUP_PEPPER;
const emailOtpPepper = parsedEnv.EMAIL_OTP_PEPPER ?? parsedEnv.BACKUP_PEPPER;
const kmsDataKey = parsedEnv.KMS_DATA_KEY ?? parsedEnv.KMS_DATA_KEY_BASE64!;

export const env = Object.freeze({
  ...parsedEnv,
  MFA_SESSION_TTL_SECONDS: parsePositiveInteger(parsedEnv.MFA_SESSION_TTL_SECONDS, 12 * 60 * 60),
  TRUSTED_DEVICE_TTL_SECONDS: parsePositiveInteger(parsedEnv.TRUSTED_DEVICE_TTL_SECONDS, 30 * 24 * 60 * 60),
  LOG_DRAIN_TIMEOUT_MS: parsePositiveInteger(parsedEnv.LOG_DRAIN_TIMEOUT_MS, 2000),
  LOG_DRAIN_ALERT_COOLDOWN_MS: parsePositiveInteger(parsedEnv.LOG_DRAIN_ALERT_COOLDOWN_MS, 5 * 60 * 1000),
  SMTP_PORT: parsePositiveInteger(parsedEnv.SMTP_PORT, 587),
  rateLimitSecret,
  emailOtpPepper,
  kmsDataKey,
});

export type ServerEnv = typeof env;

export const clientEnv = Object.freeze({
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL ?? null,
  NEXT_PUBLIC_BUILD_ID: env.NEXT_PUBLIC_BUILD_ID ?? null,
});

export const requiredServerEnv: ReadonlyArray<string> = Object.freeze(requiredEnvConfig.required);
export const atLeastOneServerEnv: ReadonlyArray<ReadonlyArray<string>> = Object.freeze(
  requiredEnvConfig.atLeastOne.map((group) => [...group]),
);
