import { cookies } from "next/headers";
import { logWarn } from "@/lib/observability/logger";
import { createSignedToken, verifySignedToken } from "@/lib/mfa/tokens";

export const MFA_SESSION_COOKIE = "ibimina_mfa";
export const TRUSTED_DEVICE_COOKIE = "ibimina_trusted";

const readSecret = (key: string) => {
  const value = process.env[key];
  return typeof value === "string" && value.length > 0 ? value : null;
};

const sessionSecret = () => readSecret("MFA_SESSION_SECRET");
const trustedSecret = () => readSecret("TRUSTED_COOKIE_SECRET");

export const isSessionSecretConfigured = () => Boolean(sessionSecret());
export const isTrustedSecretConfigured = () => Boolean(trustedSecret());

const parseExpiration = (envKey: string, fallbackSeconds: number) => {
  const raw = process.env[envKey];
  const parsed = raw ? Number(raw) : fallbackSeconds;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackSeconds;
};

export const sessionTtlSeconds = () => parseExpiration("MFA_SESSION_TTL_SECONDS", 12 * 60 * 60);
export const trustedTtlSeconds = () =>
  parseExpiration("TRUSTED_DEVICE_TTL_SECONDS", 30 * 24 * 60 * 60);

type SessionPayload = {
  userId: string;
  issuedAt: number;
  expiresAt: number;
};

type TrustedPayload = SessionPayload & {
  deviceId: string;
};

export const createMfaSessionToken = (userId: string, ttlSeconds = sessionTtlSeconds()) => {
  const secret = sessionSecret();
  if (!secret) {
    logWarn("MFA session secret is not configured; skipping cookie issuance.");
    return null;
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    userId,
    issuedAt,
    expiresAt: issuedAt + ttlSeconds,
  };
  return createSignedToken(payload, secret);
};

export const verifyMfaSessionToken = (token: string): SessionPayload | null => {
  const secret = sessionSecret();
  if (!secret) {
    return null;
  }

  const payload = verifySignedToken<SessionPayload>(token, secret);
  if (!payload) return null;
  if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
};

export const createTrustedDeviceToken = (
  userId: string,
  deviceId: string,
  ttlSeconds = trustedTtlSeconds()
) => {
  const secret = trustedSecret();
  if (!secret) {
    logWarn("Trusted device secret is not configured; skipping trusted device cookie issuance.");
    return null;
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: TrustedPayload = {
    userId,
    deviceId,
    issuedAt,
    expiresAt: issuedAt + ttlSeconds,
  };
  return createSignedToken(payload, secret);
};

export const verifyTrustedDeviceToken = (token: string): TrustedPayload | null => {
  const secret = trustedSecret();
  if (!secret) {
    return null;
  }

  const payload = verifySignedToken<TrustedPayload>(token, secret);
  if (!payload) return null;
  if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
};

type CookieJar = {
  get(name: string): { value?: string } | undefined;
};

export const readCookieToken = async (name: string, jar?: CookieJar) => {
  const source = jar ?? (await cookies());
  return source.get(name)?.value ?? null;
};
