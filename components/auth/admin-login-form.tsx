"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Factor } from "@supabase/supabase-js";
import {
  resendTotpChallenge,
  signInWithPassword,
  signOut,
  verifyTotpCode,
  type SignInSuccess,
} from "@/lib/auth/client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTranslation } from "@/providers/i18n-provider";
import { OptimizedImage } from "@/components/ui/optimized-image";

type Step = "credentials" | "mfa";

type TotpFactor = Factor<"totp", "verified">;

type MfaState = {
  factor: TotpFactor;
  challengeId: string;
  expiresAt: number | null;
};

const ADMIN_ROLE = "SYSTEM_ADMIN";
const GENERIC_ERROR = "auth.errors.generic";

export default function AdminLoginForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = getSupabaseBrowserClient();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [mfa, setMfa] = useState<MfaState | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  useEffect(() => {
    if (step === "mfa") {
      codeInputRef.current?.focus();
      return;
    }

    if (email.trim().length > 0) {
      passwordInputRef.current?.focus();
    } else {
      emailInputRef.current?.focus();
    }
  }, [email, step]);

  useEffect(() => {
    const expiresAt = mfa?.expiresAt;
    if (!expiresAt) {
      setSecondsRemaining(null);
      return undefined;
    }

    const compute = () => {
      const now = Math.round(Date.now() / 1000);
      setSecondsRemaining(Math.max(0, expiresAt - now));
    };

    compute();
    const interval = window.setInterval(compute, 1000);
    return () => window.clearInterval(interval);
  }, [mfa?.expiresAt]);

  const parsedSeconds = useMemo(() => secondsRemaining ?? 0, [secondsRemaining]);

  const resetAll = useCallback((options?: { clearCredentials?: boolean }) => {
    setStep("credentials");
    setFormPending(false);
    setResendPending(false);
    setError(null);
    setMessage(null);
    setCode("");
    setMfa(null);
    setSecondsRemaining(null);

    if (options?.clearCredentials) {
      setEmail("");
      setPassword("");
    }
  }, []);

  const ensureAdminRole = useCallback(async () => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !sessionData.user) {
      return { ok: false, reason: "session" as const };
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", sessionData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return { ok: false, reason: "profile" as const };
    }

    if (profile.role !== ADMIN_ROLE) {
      return { ok: false, reason: "not_admin" as const };
    }

    return { ok: true as const };
  }, [supabase]);

  const transitionToMfa = useCallback((payload: Extract<SignInSuccess, { status: "mfa_required" }>) => {
    setMfa({
      factor: payload.factor,
      challengeId: payload.challengeId,
      expiresAt: payload.expiresAt,
    });
    setStep("mfa");
    setCode("");
    setMessage(
      t("adminAuth.mfa.prompt", "Enter the 6-digit code from your authenticator app."),
    );
    setError(null);
  }, [t]);

  const handleCredentialsSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormPending(true);
      setError(null);
      setMessage(null);

      try {
        const result = await signInWithPassword(email, password);

        if (result.status === "error") {
          setError(result.message || t(GENERIC_ERROR, "Something went wrong. Try again."));
          return;
        }

        if (result.status === "authenticated") {
          const adminCheck = await ensureAdminRole();
          if (!adminCheck.ok) {
            setError(t("adminAuth.errors.notAdmin", "You do not have administrative privileges."));
            await signOut();
            resetAll({ clearCredentials: false });
            return;
          }

          setMessage(t("adminAuth.success.redirect", "Success! Redirecting to admin dashboard…"));
          router.refresh();
          router.push("/admin");
          return;
        }

        transitionToMfa(result);
      } catch (cause) {
        console.error("[admin-auth] credentials submit failed", cause);
        setError(t(GENERIC_ERROR, "Something went wrong. Try again."));
      } finally {
        setFormPending(false);
      }
    },
    [email, ensureAdminRole, password, resetAll, router, t, transitionToMfa],
  );

  const handleMfaSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!mfa) {
        setError(t("adminAuth.mfa.missing", "No verified authenticator was found for this account."));
        return;
      }

      const sanitizedCode = code.replace(/[^0-9]/g, "");
      if (sanitizedCode.length !== 6) {
        setError(t("auth.mfa.invalidCode", "Codes must be 6 digits."));
        codeInputRef.current?.focus();
        return;
      }

      setFormPending(true);
      setError(null);
      setMessage(null);

      try {
        const result = await verifyTotpCode({
          factor: mfa.factor,
          challengeId: mfa.challengeId,
          code: sanitizedCode,
        });

        if (result.status === "error") {
          setError(result.message || t(GENERIC_ERROR, "Something went wrong. Try again."));
          return;
        }

        const adminCheck = await ensureAdminRole();
        if (!adminCheck.ok) {
          setError(t("adminAuth.errors.notAdmin", "You do not have administrative privileges."));
          await signOut();
          resetAll({ clearCredentials: true });
          return;
        }

        setMessage(t("adminAuth.success.redirect", "Success! Redirecting to admin dashboard…"));
        resetAll();
        router.refresh();
        router.push("/admin");
      } catch (cause) {
        console.error("[admin-auth] verify mfa failed", cause);
        setError(t(GENERIC_ERROR, "Something went wrong. Try again."));
      } finally {
        setFormPending(false);
      }
    },
    [code, ensureAdminRole, mfa, resetAll, router, t],
  );

  const handleResend = useCallback(async () => {
    if (!mfa) {
      return;
    }

    setResendPending(true);
    setError(null);

    try {
      const refreshed = await resendTotpChallenge(mfa.factor);
      if (refreshed.status === "ok") {
        setMfa({
          factor: refreshed.factor,
          challengeId: refreshed.challengeId,
          expiresAt: refreshed.expiresAt,
        });
        setMessage(
          t(
            "adminAuth.mfa.resendSuccess",
            "A new code was issued. Enter it to finish signing in.",
          ),
        );
      } else {
        setError(refreshed.message ?? t(GENERIC_ERROR, "Something went wrong. Try again."));
      }
    } catch (cause) {
      console.error("[admin-auth] resend mfa failed", cause);
      setError(t(GENERIC_ERROR, "Something went wrong. Try again."));
    } finally {
      setResendPending(false);
    }
  }, [mfa, t]);

  const switchAccount = useCallback(async () => {
    setSwitchingAccount(true);
    resetAll({ clearCredentials: true });
    try {
      await signOut();
    } finally {
      router.push("/admin/login");
    }
  }, [resetAll, router]);

  const secondsLabel = useMemo(() => {
    if (!secondsRemaining || secondsRemaining <= 0) {
      return t("auth.mfa.expiresSoon", "Code expiring soon");
    }
    const template = t("auth.mfa.codeExpiresIn", "Code expires in {{seconds}}s");
    return template.replace("{{seconds}}", String(parsedSeconds));
  }, [parsedSeconds, secondsRemaining, t]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8" data-testid="admin-login-form">
      <header className="flex flex-col items-center gap-4 text-center">
        <OptimizedImage src="/logo.svg" width={80} height={80} alt="SACCO+" priority />
        <h1 className="text-2xl font-semibold">{t("adminAuth.title", "Admin sign in")}</h1>
        <p className="text-muted-foreground">
          {t("adminAuth.subtitle", "Access operations dashboards and manage system configuration.")}
        </p>
      </header>

      {message && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success" role="status">
          {message}
        </p>
      )}

      {error && (
        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {step === "credentials" ? (
        <form className="flex flex-col gap-4" onSubmit={handleCredentialsSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="admin-email">
            {t("auth.emailLabel", "Work email")}
            <input
              id="admin-email"
              ref={emailInputRef}
              type="email"
              autoComplete="email"
              required
              disabled={formPending}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="admin-password">
            {t("auth.passwordLabel", "Password")}
            <input
              id="admin-password"
              ref={passwordInputRef}
              type="password"
              autoComplete="current-password"
              required
              disabled={formPending}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={formPending || email.trim().length === 0 || password.length === 0}
          >
            {formPending
              ? t("auth.signingIn", "Signing in…")
              : t("auth.signIn", "Sign in")}
          </button>
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleMfaSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="admin-code">
            {secondsRemaining && secondsRemaining > 0
              ? secondsLabel
              : t("adminAuth.mfa.enterCode", "Enter your 6-digit code")}
            <input
              id="admin-code"
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              required
              disabled={formPending}
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ""))}
              className="rounded border border-input bg-background px-3 py-2 text-center text-lg tracking-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              disabled={resendPending || formPending}
              onClick={handleResend}
              className="text-primary underline-offset-2 hover:underline disabled:opacity-60"
            >
              {resendPending
                ? t("auth.mfa.resending", "Sending…")
                : t("auth.mfa.resend", "Resend code")}
            </button>
            <button
              type="button"
              onClick={() => resetAll()}
              className="text-muted-foreground underline-offset-2 hover:underline"
            >
              {t("auth.mfa.useDifferentAccount", "Use a different account")}
            </button>
          </div>

          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={formPending || code.length !== 6}
          >
            {formPending
              ? t("auth.mfa.verifying", "Verifying…")
              : t("auth.mfa.verify", "Verify & continue")}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={switchAccount}
        disabled={switchingAccount}
        className="text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-60"
      >
        {switchingAccount
          ? t("auth.switchingAccounts", "Switching accounts…")
          : t("auth.notYou", "Not you? Switch account")}
      </button>
    </div>
  );
}
