import { cookies } from "next/headers";
import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { createSignedToken, verifySignedToken } from "@/lib/mfa/tokens";

export const MFA_SESSION_COOKIE = "ibimina_mfa";
export const TRUSTED_DEVICE_COOKIE = "ibimina_trusted";

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
};

const sessionSecret = () => requireEnv("MFA_SESSION_SECRET");
const trustedSecret = () => requireEnv("TRUSTED_COOKIE_SECRET");

const parseExpiration = (envKey: string, fallbackSeconds: number) => {
  const raw = process.env[envKey];
  const parsed = raw ? Number(raw) : fallbackSeconds;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackSeconds;
};

export const sessionTtlSeconds = () => parseExpiration("MFA_SESSION_TTL_SECONDS", 12 * 60 * 60);
export const trustedTtlSeconds = () => parseExpiration("TRUSTED_DEVICE_TTL_SECONDS", 30 * 24 * 60 * 60);

type SessionPayload = {
  userId: string;
  issuedAt: number;
  expiresAt: number;
};

type TrustedPayload = SessionPayload & {
  deviceId: string;
};

export const createMfaSessionToken = (userId: string, ttlSeconds = sessionTtlSeconds()) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    userId,
    issuedAt,
    expiresAt: issuedAt + ttlSeconds,
  };
  return createSignedToken(payload, sessionSecret());
};

export const verifyMfaSessionToken = (token: string): SessionPayload | null => {
  const payload = verifySignedToken<SessionPayload>(token, sessionSecret());
  if (!payload) return null;
  if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
};

export const createTrustedDeviceToken = (userId: string, deviceId: string, ttlSeconds = trustedTtlSeconds()) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: TrustedPayload = {
    userId,
    deviceId,
    issuedAt,
    expiresAt: issuedAt + ttlSeconds,
  };
  return createSignedToken(payload, trustedSecret());
};

export const verifyTrustedDeviceToken = (token: string): TrustedPayload | null => {
  const payload = verifySignedToken<TrustedPayload>(token, trustedSecret());
  if (!payload) return null;
  if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
};

export const readCookieToken = async (name: string, jar?: RequestCookies) => {
  const source = jar ?? (await cookies());
  return source.get(name)?.value ?? null;
};
