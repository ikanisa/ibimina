import {
  HSTS_HEADER as BASE_HSTS_HEADER,
  SECURITY_HEADERS as BASE_SECURITY_HEADERS,
  createContentSecurityPolicy as createSharedContentSecurityPolicy,
  createNonce as createSharedNonce,
  createRequestId as createSharedRequestId,
  type CspOptions as SharedCspOptions,
} from "@ibimina/lib";

import { getRuntimeConfig } from "../../src/lib/runtime-config";

export const SECURITY_HEADERS = BASE_SECURITY_HEADERS;
export const HSTS_HEADER = BASE_HSTS_HEADER;

export type CspOptions = {
  nonce: string;
  isDev?: boolean;
};

const runtimeCrypto = globalThis.crypto;

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  if (typeof btoa === "function") {
    return btoa(binary);
  }

  return Buffer.from(binary, "binary").toString("base64");
}

function sanitizeUuid(uuid: string): string {
  return uuid.replace(/-/g, "");
}

function getSupabaseUrl(): string | undefined {
  const candidate = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function safeRuntimeConfig() {
  try {
    return getRuntimeConfig();
  } catch {
    return null;
  }
}

function appendDirective(
  target: SharedCspOptions["appendDirectives"],
  directive: string,
  values: string[]
): SharedCspOptions["appendDirectives"] {
  if (!values.length) {
    return target;
  }

  const next = target ? { ...target } : {};
  const existing = next[directive] ?? [];
  next[directive] = [...existing, ...values];
  return next;
}

function buildDirectiveAllowlist(): SharedCspOptions["appendDirectives"] {
  const runtimeConfig = safeRuntimeConfig();
  let appendDirectives: SharedCspOptions["appendDirectives"];

  if (runtimeConfig?.siteUrl) {
    try {
      const { origin } = new URL(runtimeConfig.siteUrl);
      appendDirectives = appendDirective(appendDirectives, "connect-src", [origin]);
      appendDirectives = appendDirective(appendDirectives, "img-src", [origin]);
    } catch (error) {
      console.warn("Invalid siteUrl provided in runtime config for CSP allowlist", error);
    }
  }

  return appendDirectives;
}

export function createNonce(size = 16): string {
  try {
    return createSharedNonce(size);
  } catch (error) {
    if (typeof runtimeCrypto?.getRandomValues === "function") {
      const buffer = new Uint8Array(size);
      runtimeCrypto.getRandomValues(buffer);
      return encodeBase64(buffer);
    }

    if (typeof runtimeCrypto?.randomUUID === "function") {
      return sanitizeUuid(runtimeCrypto.randomUUID());
    }

    throw error;
  }
}

export function createRequestId(): string {
  try {
    return createSharedRequestId();
  } catch (error) {
    if (typeof runtimeCrypto?.randomUUID === "function") {
      return runtimeCrypto.randomUUID();
    }

    if (typeof runtimeCrypto?.getRandomValues === "function") {
      const buffer = new Uint8Array(16);
      runtimeCrypto.getRandomValues(buffer);
      return Array.from(buffer)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    }

    throw error;
  }
}

export function createContentSecurityPolicy({ nonce, isDev }: CspOptions): string {
  const appendDirectives = buildDirectiveAllowlist();

  return createSharedContentSecurityPolicy({
    nonce,
    isDev,
    supabaseUrl: getSupabaseUrl(),
    appendDirectives,
  });
}
