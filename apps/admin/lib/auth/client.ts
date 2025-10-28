"use client";

import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/auth/errors";

export const AUTHX_FACTORS = ["passkey", "totp", "email", "whatsapp", "backup"] as const;

export type AuthxFactor = (typeof AUTHX_FACTORS)[number];

export type FactorEnrollmentMap = Record<AuthxFactor, boolean>;

export type AuthxFactorsSummary = {
  preferred: AuthxFactor;
  enrolled: FactorEnrollmentMap;
};

type PasskeyAssertionPayload = {
  response: AuthenticationResponseJSON;
  stateToken: string;
};

export type SignInSuccess =
  | {
      status: "authenticated";
    }
  | {
      status: "mfa_required";
      factors: AuthxFactorsSummary;
    };

export type SignInFailure = {
  status: "error";
  message: string;
};

type MfaStatusResponse = {
  mfaEnabled: boolean;
  mfaRequired: boolean;
  trustedDevice: boolean;
  passkeyEnrolled: boolean;
};

const EMPTY_ENROLLMENT = AUTHX_FACTORS.reduce<FactorEnrollmentMap>((acc, factor) => {
  acc[factor] = false;
  return acc;
}, {} as FactorEnrollmentMap);

const parseFactor = (value: unknown): AuthxFactor | null => {
  if (typeof value !== "string") {
    return null;
  }
  return AUTHX_FACTORS.includes(value as AuthxFactor) ? (value as AuthxFactor) : null;
};

const normaliseEnrollment = (raw: unknown): FactorEnrollmentMap => {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_ENROLLMENT };
  }

  const parsed: FactorEnrollmentMap = { ...EMPTY_ENROLLMENT };
  for (const factor of AUTHX_FACTORS) {
    const value = (raw as Record<string, unknown>)[factor];
    parsed[factor] = typeof value === "boolean" ? value : false;
  }
  return parsed;
};

const choosePreferred = (summary: {
  preferred?: unknown;
  enrolled: FactorEnrollmentMap;
}): AuthxFactor => {
  const requested = parseFactor(summary.preferred);
  if (requested && summary.enrolled[requested]) {
    return requested;
  }

  for (const factor of AUTHX_FACTORS) {
    if (summary.enrolled[factor]) {
      return factor;
    }
  }

  return "totp";
};

const fetchMfaStatus = async (): Promise<MfaStatusResponse | null> => {
  try {
    const response = await fetch("/api/mfa/status", { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    const json = (await response.json()) as MfaStatusResponse;
    return json;
  } catch (error) {
    console.error("[auth] fetchMfaStatus failed", error);
    return null;
  }
};

export const listAuthxFactors = async (): Promise<AuthxFactorsSummary> => {
  const response = await fetch("/api/authx/factors/list", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("authx_factors_failed");
  }

  const payload = await response.json();
  const enrolled = normaliseEnrollment((payload as Record<string, unknown>).enrolled);
  const preferred = choosePreferred({
    preferred: (payload as Record<string, unknown>).preferred,
    enrolled,
  });

  return { preferred, enrolled };
};

export async function signInWithPassword(
  email: string,
  password: string
): Promise<SignInSuccess | SignInFailure> {
  const supabase = getSupabaseBrowserClient();
  const normalizedEmail = email.trim();

  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: mapAuthError(error),
    };
  }

  const status = await fetchMfaStatus();
  if (!status || !status.mfaEnabled || !status.mfaRequired) {
    return { status: "authenticated" };
  }

  try {
    const factors = await listAuthxFactors();
    return { status: "mfa_required", factors };
  } catch (cause) {
    console.error("[auth] listAuthxFactors failed", cause);
    return {
      status: "error",
      message: "We couldn't load available MFA methods. Try again.",
    };
  }
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
}

export type AuthxInitiationResult =
  | { status: "ready"; factor: AuthxFactor }
  | {
      status: "passkey";
      factor: "passkey";
      options: PublicKeyCredentialRequestOptionsJSON;
      stateToken: string;
    }
  | { status: "otp"; factor: "email" | "whatsapp"; expiresAt: string | null }
  | { status: "error"; factor: AuthxFactor; message: string; code?: string; retryAt?: string };

export const initiateAuthxFactor = async (
  factor: AuthxFactor,
  options: { rememberDevice?: boolean } = {}
): Promise<AuthxInitiationResult> => {
  try {
    const response = await fetch("/api/authx/challenge/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factor, rememberDevice: options.rememberDevice }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = typeof payload.error === "string" ? payload.error : "initiate_failed";
      const code = typeof payload.code === "string" ? payload.code : undefined;
      const retryAt = typeof payload.retryAt === "string" ? payload.retryAt : undefined;
      return { status: "error", factor, message, code, retryAt };
    }

    if (payload && typeof payload === "object") {
      if (payload.factor === "passkey" && payload.options && payload.stateToken) {
        return {
          status: "passkey",
          factor: "passkey",
          options: payload.options as PublicKeyCredentialRequestOptionsJSON,
          stateToken: String(payload.stateToken),
        };
      }

      if (payload.channel === "email" || payload.channel === "whatsapp") {
        const expiresAt = typeof payload.expiresAt === "string" ? payload.expiresAt : null;
        return { status: "otp", factor: payload.channel, expiresAt };
      }
    }

    return { status: "ready", factor };
  } catch (error) {
    console.error("[auth] initiateAuthxFactor failed", error);
    return { status: "error", factor, message: "network_error" };
  }
};

export type VerifyAuthxResult =
  | { status: "authenticated"; factor: AuthxFactor; usedBackup: boolean }
  | { status: "error"; message: string; code?: string };

export const verifyAuthxFactor = async (input: {
  factor: AuthxFactor;
  token?: string;
  trustDevice?: boolean;
  passkeyPayload?: PasskeyAssertionPayload;
}): Promise<VerifyAuthxResult> => {
  try {
    const body: {
      factor: AuthxFactor;
      token?: string;
      trustDevice?: boolean;
    } = {
      factor: input.factor,
      trustDevice: input.trustDevice,
    };

    if (input.passkeyPayload) {
      body.token = JSON.stringify(input.passkeyPayload);
    } else if (input.token) {
      body.token = input.token;
    }

    const response = await fetch("/api/authx/challenge/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));

    if (response.ok && payload && payload.ok) {
      return {
        status: "authenticated",
        factor: parseFactor(payload.factor) ?? input.factor,
        usedBackup: Boolean(payload.usedBackup),
      };
    }

    const message = typeof payload.error === "string" ? payload.error : "verification_failed";
    const code = typeof payload.code === "string" ? payload.code : undefined;
    return { status: "error", message, code };
  } catch (error) {
    console.error("[auth] verifyAuthxFactor failed", error);
    return { status: "error", message: "verification_failed" };
  }
};
