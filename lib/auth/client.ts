"use client";

import type { Factor } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/auth/errors";

type TotpFactor = Factor<"totp", "verified">;

export type SignInSuccess =
  | {
      status: "authenticated";
    }
  | {
      status: "mfa_required";
      factor: TotpFactor;
      challengeId: string;
      expiresAt: number | null;
    };

export type SignInFailure = {
  status: "error";
  message: string;
};

export async function signInWithPassword(email: string, password: string): Promise<SignInSuccess | SignInFailure> {
  const supabase = getSupabaseBrowserClient();
  const normalizedEmail = email.trim();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: mapAuthError(error),
    };
  }

  if (data.session) {
    return { status: "authenticated" };
  }

  const mfaDetails = await startTotpChallenge(supabase);
  if (mfaDetails.status === "error") {
    return mfaDetails;
  }

  return {
    status: "mfa_required",
    factor: mfaDetails.factor,
    challengeId: mfaDetails.challengeId,
    expiresAt: mfaDetails.expiresAt,
  };
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
}

type TotpChallenge =
  | {
      status: "ok";
      factor: TotpFactor;
      challengeId: string;
      expiresAt: number | null;
    }
  | {
      status: "error";
      message: string;
    };

async function startTotpChallenge(
  supabase = getSupabaseBrowserClient(),
  factorOverride?: TotpFactor | null,
): Promise<TotpChallenge> {
  const fetchFactor = async () => {
    if (factorOverride) {
      return factorOverride;
    }

    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      throw new Error(error.message || "list_factors_failed");
    }

    const factors = (data?.totp ?? []) as TotpFactor[];
    const verified = factors.find((factor) => factor.status === "verified");
    if (!verified) {
      throw new Error("no_totp_factor");
    }

    return verified;
  };

  try {
    const factor = await fetchFactor();
    const { data, error } = await supabase.auth.mfa.challenge({
      factorId: factor.id,
    });

    if (error || !data) {
      throw new Error(error?.message || "challenge_failed");
    }

    return {
      status: "ok",
      factor,
      challengeId: data.id,
      expiresAt: parseExpiresAt(data.expires_at),
    };
  } catch (cause) {
    console.error("[auth] startTotpChallenge failed", cause);
    return {
      status: "error",
      message: "We couldn't send an MFA challenge. Try again in a moment.",
    };
  }
}

export async function resendTotpChallenge(factor: TotpFactor) {
  return startTotpChallenge(getSupabaseBrowserClient(), factor);
}

export async function verifyTotpCode(args: {
  factor: TotpFactor;
  challengeId: string;
  code: string;
}): Promise<{ status: "authenticated" } | { status: "error"; message: string }> {
  const supabase = getSupabaseBrowserClient();
  const sanitizedCode = args.code.replace(/[^0-9]/g, "");

  const { data, error } = await supabase.auth.mfa.verify({
    factorId: args.factor.id,
    challengeId: args.challengeId,
    code: sanitizedCode,
  });

  if (error || !data) {
    return {
      status: "error",
      message: mapAuthError(error),
    };
  }

  return { status: "authenticated" };
}

function parseExpiresAt(expiresAtRaw: unknown) {
  if (typeof expiresAtRaw === "number") {
    return expiresAtRaw;
  }

  if (typeof expiresAtRaw === "string") {
    const parsed = Date.parse(expiresAtRaw);
    if (!Number.isNaN(parsed)) {
      return Math.round(parsed / 1000);
    }
  }

  return null;
}
