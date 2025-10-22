"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/auth/errors";

export type SignInSuccess =
  | {
      status: "authenticated";
    }
  | {
      status: "mfa_required";
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

  const challenge = await initiateTotpChallenge();
  if (challenge.status === "error") {
    return challenge;
  }

  return { status: "mfa_required", expiresAt: challenge.expiresAt };
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient();
  await supabase.auth.signOut();
}

type TotpChallenge = { status: "ok"; expiresAt: number | null } | { status: "error"; message: string };

async function initiateTotpChallenge(): Promise<TotpChallenge> {
  try {
    const response = await fetch("/api/authx/challenge/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factor: "totp" }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return {
        status: "error",
        message: payload?.error ?? "Unable to initiate an MFA challenge. Try again.",
      };
    }

    return {
      status: "ok",
      expiresAt: Math.round(Date.now() / 1000) + 60,
    };
  } catch (cause) {
    console.error("[auth] initiateTotpChallenge failed", cause);
    return {
      status: "error",
      message: "We couldn't send an MFA challenge. Try again in a moment.",
    };
  }
}

export async function resendTotpChallenge() {
  return initiateTotpChallenge();
}

export async function verifyTotpCode(args: { code: string }): Promise<{ status: "authenticated" } | { status: "error"; message: string }> {
  const sanitizedCode = args.code.replace(/[^0-9]/g, "");

  try {
    const response = await fetch("/api/authx/challenge/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ factor: "totp", token: sanitizedCode, trustDevice: true }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return {
        status: "error",
        message: payload?.error ?? "Unable to verify the authenticator code.",
      };
    }

    return { status: "authenticated" };
  } catch (cause) {
    console.error("[auth] verifyTotpCode failed", cause);
    return {
      status: "error",
      message: "Unable to verify the authenticator code.",
    };
  }
}
