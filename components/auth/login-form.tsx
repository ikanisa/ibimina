"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  resendTotpChallenge,
  signInWithPassword,
  signOut,
  verifyTotpCode,
  type SignInSuccess,
} from "@/lib/auth/client";
import { useTranslation } from "@/providers/i18n-provider";
import { OptimizedImage } from "@/components/ui/optimized-image";

const otpPattern = /[^0-9]/g;

type Step = "credentials" | "mfa";

type MfaState = {
  expiresAt: number | null;
};

const GENERIC_ERROR = "auth.errors.generic";

export function LoginForm() {
  const router = useRouter();
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [formPending, setFormPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mfa, setMfa] = useState<MfaState | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const errorRef = useRef<HTMLParagraphElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const activeElement = document.activeElement;

    if (step === "mfa") {
      if (activeElement !== codeInputRef.current) {
        codeInputRef.current?.focus();
      }
      return;
    }

    if (step === "credentials") {
      const emailField = emailInputRef.current;
      const passwordField = passwordInputRef.current;
      const hasEmail = email.trim().length > 0;

      if (hasEmail) {
        if (activeElement !== emailField && activeElement !== passwordField) {
          passwordField?.focus();
        }
      } else if (activeElement !== emailField) {
        emailField?.focus();
      }
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

  const transitionToMfa = useCallback((payload: Extract<SignInSuccess, { status: "mfa_required" }>) => {
    setMfa({
      expiresAt: payload.expiresAt,
    });
    setStep("mfa");
    setCode("");
    setMessage(
      t(
        "auth.mfa.prompt",
        "Enter the 6-digit code from your authenticator app to finish signing in.",
      ),
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
          setMessage(t("auth.success.redirect", "Success! Redirecting to dashboard…"));
          router.refresh();
          router.push("/dashboard");
          return;
        }

        transitionToMfa(result);
      } catch (cause) {
        console.error("[auth] credentials submit failed", cause);
        setError(t(GENERIC_ERROR, "Something went wrong. Try again."));
      } finally {
        setFormPending(false);
      }
    },
    [email, password, router, t, transitionToMfa],
  );

  const handleMfaSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!mfa) {
        setError(t("auth.mfa.missing", "No verified authenticator was found for this account."));
        return;
      }

      const sanitized = code.replace(otpPattern, "");
      if (sanitized.length !== 6) {
        setError(t("auth.mfa.invalidCode", "Codes must be 6 digits."));
        codeInputRef.current?.focus();
        return;
      }

      setFormPending(true);
      setError(null);
      setMessage(null);

      try {
        const result = await verifyTotpCode({ code: sanitized });

       if (result.status === "error") {
         setError(result.message || t("auth.mfa.verifyFailed", "Unable to verify the authenticator code."));
         return;
       }

        setMessage(t("auth.success.redirect", "Success! Redirecting to dashboard…"));
        resetAll();
        router.refresh();
        router.push("/dashboard");
      } catch (cause) {
        console.error("[auth] verify mfa failed", cause);
        setError(t(GENERIC_ERROR, "Something went wrong. Try again."));
      } finally {
        setFormPending(false);
      }
    },
    [code, mfa, resetAll, router, t],
  );

  const handleResend = useCallback(async () => {
    if (!mfa) {
      return;
    }

    setResendPending(true);
    setError(null);

    try {
      const refreshed = await resendTotpChallenge();

      if (refreshed.status === "ok") {
        setMfa({
          expiresAt: refreshed.expiresAt,
        });
        setMessage(
          t(
            "auth.mfa.resendSuccess",
            "A new code was issued. Enter it to finish signing in.",
          ),
        );
      } else {
        setError(refreshed.message ?? t(GENERIC_ERROR, "Something went wrong. Try again."));
      }
    } catch (cause) {
      console.error("[auth] resend mfa failed", cause);
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
      router.push("/login");
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
    <div className="mx-auto flex w-full max-w-md flex-col gap-8" data-testid="login-form">
      <header className="flex flex-col items-center gap-4 text-center">
        <OptimizedImage
          src="/logo.svg"
          width={80}
          height={80}
          alt={t("auth.logoAlt", "SACCO+ logo")}
          priority
        />
        <h1 className="text-2xl font-semibold">{t("auth.welcomeBack", "Welcome back")}</h1>
        <p className="text-muted-foreground">
          {t("auth.subtitle", "Sign in to manage sacco operations and member activity.")}
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
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="email">
            {t("auth.emailLabel", "Work email")}
            <input
              id="email"
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

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="password">
            {t("auth.passwordLabel", "Password")}
            <input
              id="password"
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
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="code">
            {secondsRemaining && secondsRemaining > 0 ? secondsLabel : t("auth.mfa.enterCode", "Enter your 6-digit code")}
            <input
              id="code"
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              required
              disabled={formPending}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(otpPattern, ""))}
              maxLength={6}
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
              {resendPending ? t("auth.mfa.resending", "Sending…") : t("auth.mfa.resend", "Resend code")}
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
