"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AuthError, Factor } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTranslation } from "@/providers/i18n-provider";
import { OptimizedImage } from "@/components/ui/optimized-image";

const otpPattern = /[^0-9]/g;

type Step = "credentials" | "mfa";

type TotpFactor = Factor<"totp", "verified">;

type MfaState = {
  factor: TotpFactor;
  challengeId: string;
  expiresAt: number | null;
};

const ERROR_FALLBACK = "auth.errors.generic";

export function LoginForm() {
  const supabase = getSupabaseBrowserClient();
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
  const errorRef = useRef<HTMLParagraphElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const [mfa, setMfa] = useState<MfaState | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

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

    if (step === "credentials") {
      if (email.trim().length > 0) {
        const activeElement = typeof document !== "undefined" ? document.activeElement : null;
        if (activeElement === emailInputRef.current) {
          return;
        }
        passwordInputRef.current?.focus();
      } else {
        emailInputRef.current?.focus();
      }
    }
  }, [email, step]);

  useEffect(() => {
    const expiresAt = mfa?.expiresAt;
    if (expiresAt == null) {
      setSecondsRemaining(null);
      return undefined;
    }

    const compute = () => {
      const now = Math.round(Date.now() / 1000);
      setSecondsRemaining(Math.max(0, expiresAt - now));
    };

    compute();
    const handle = window.setInterval(compute, 1000);
    return () => window.clearInterval(handle);
  }, [mfa?.expiresAt]);

  const formatAuthError = useCallback(
    (authError: AuthError) => {
      if (authError.status === 400 || authError.status === 401) {
        return t("auth.errors.invalidCredentials", "Email or password was incorrect.");
      }
      if (authError.status === 403) {
        return authError.message;
      }
      return authError.message || t(ERROR_FALLBACK, "Something went wrong. Try again.");
    },
    [t],
  );

  const resetState = useCallback(
    (options?: { clearCredentials?: boolean }) => {
      setStep("credentials");
      setCode("");
      setMfa(null);
      setSecondsRemaining(null);
      setMessage(null);
      setError(null);
      setFormPending(false);
      setResendPending(false);

      if (options?.clearCredentials) {
        setEmail("");
        setPassword("");
      }
    },
    [],
  );

  const startMfaChallenge = useCallback(
    async (factorOverride?: TotpFactor | null) => {
      const fetchFactor = async () => {
        if (factorOverride) {
          return factorOverride;
        }

        const { data, error: listError } = await supabase.auth.mfa.listFactors();
        if (listError) {
          throw new Error(listError.message || "list_factors_failed");
        }

        const totpFactors = (data?.totp ?? []) as TotpFactor[];
        const verified = totpFactors.find((item) => item.status === "verified");
        if (!verified) {
          throw new Error("no_totp_factor");
        }
        return verified;
      };

      const factor = await fetchFactor();
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });

      if (challengeError || !challengeData) {
        throw new Error(challengeError?.message || "challenge_failed");
      }

      let expiresAt: number | null = null;
      const { expires_at: expiresAtRaw } = challengeData;
      if (typeof expiresAtRaw === "number") {
        expiresAt = expiresAtRaw;
      } else if (typeof expiresAtRaw === "string") {
        const parsed = Date.parse(expiresAtRaw);
        expiresAt = Number.isNaN(parsed) ? null : Math.round(parsed / 1000);
      }

      setMfa({
        factor,
        challengeId: challengeData.id,
        expiresAt,
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
    },
    [supabase, t],
  );

  const handleCredentialsSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormPending(true);
      setMessage(null);
      setError(null);

      try {
        const normalizedEmail = email.trim();
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) {
          setError(formatAuthError(signInError));
          return;
        }

        if (data.session) {
          setMessage(t("auth.success.redirect", "Success! Redirecting to dashboard…"));
          router.refresh();
          router.push("/dashboard");
          return;
        }

        try {
          await startMfaChallenge();
        } catch (challengeError) {
          const reason = challengeError instanceof Error ? challengeError.message : "challenge_failed";
          if (reason === "no_totp_factor") {
            setError(t("auth.mfa.missing", "No verified authenticator was found for this account."));
          } else {
            setError(t("auth.mfa.startFailed", "We couldn't start multi-factor authentication."));
          }
          await supabase.auth.signOut();
          resetState();
        }
      } catch (unknownError) {
        console.error("Sign-in failed", unknownError);
        setError(t(ERROR_FALLBACK, "Something went wrong. Try again."));
      } finally {
        setFormPending(false);
      }
    },
    [email, formatAuthError, password, resetState, router, startMfaChallenge, supabase, t],
  );

  const handleMfaSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!mfa) {
        setError(t("auth.mfa.missing", "No verified authenticator was found for this account."));
        return;
      }

      if (code.length < 6) {
        setError(t("auth.errors.enterCode", "Enter the 6-digit code from your authenticator."));
        return;
      }

      setFormPending(true);
      setError(null);
      setMessage(null);

      try {
        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: mfa.factor.id,
          challengeId: mfa.challengeId,
          code,
        });

        if (verifyError) {
          if (verifyError.status === 400 || verifyError.status === 422) {
            setError(t("auth.mfa.invalidCode", "That code was not accepted. Try again."));
          } else {
            setError(verifyError.message || t("auth.mfa.verifyFailed", "Unable to verify the authenticator code."));
          }
          return;
        }

        setMessage(t("auth.success.redirect", "Success! Redirecting to dashboard…"));
        setMfa(null);
        setSecondsRemaining(null);
        setCode("");
        router.refresh();
        router.push("/dashboard");
      } catch (unknownError) {
        console.error("MFA verification failed", unknownError);
        setError(t("auth.mfa.verifyFailed", "Unable to verify the authenticator code."));
      } finally {
        setFormPending(false);
      }
    },
    [code, mfa, router, supabase, t],
  );

  const handleResend = useCallback(async () => {
    if (!mfa?.factor || resendPending) {
      return;
    }

    setResendPending(true);
    setError(null);

    try {
      await startMfaChallenge(mfa.factor);
      setMessage(t("auth.mfa.codeResent", "We've sent a new code to your authenticator."));
    } catch (challengeError) {
      console.error("MFA challenge restart failed", challengeError);
      setError(t("auth.mfa.startFailed", "We couldn't start multi-factor authentication."));
    } finally {
      setResendPending(false);
    }
  }, [mfa?.factor, resendPending, startMfaChallenge, t]);

  const handleSwitchAccount = useCallback(async () => {
    if (switchingAccount) {
      return;
    }

    setSwitchingAccount(true);
    setError(null);
    setMessage(null);

    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error("Failed to sign out before switching accounts", signOutError);
    } finally {
      resetState({ clearCredentials: true });
      setSwitchingAccount(false);
    }
  }, [resetState, supabase, switchingAccount]);

  const submitHandler = step === "credentials" ? handleCredentialsSubmit : handleMfaSubmit;
  const disableInputs = formPending || resendPending || switchingAccount;

  const countdownLabel = useMemo(() => {
    if (secondsRemaining == null) {
      return null;
    }
    if (secondsRemaining <= 0) {
      return t("auth.mfa.expired", "Code expired. Request a new one.");
    }
    const template = t("auth.mfa.countdown", "Code expires in {{seconds}}s");
    return template.replace(/\{\{\s*seconds\s*\}\}/g, secondsRemaining.toString());
  }, [secondsRemaining, t]);

  return (
    <form onSubmit={submitHandler} className="space-y-6">
      <div className="flex flex-col items-center gap-3 text-neutral-0">
        <OptimizedImage src="/window.svg" alt="SACCO+" width={48} height={48} priority />
        <h2 className="text-xl font-semibold">{t("auth.title", "Sign in to SACCO+")}</h2>
        <p className="text-sm text-neutral-2">
          {step === "credentials"
            ? t("auth.subtitle", "Use your staff email and password to continue.")
            : t("auth.mfa.subtitle", "Finish signing in with your authenticator app.")}
        </p>
      </div>

      {error && (
        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      {message && !error && (
        <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      )}

      {step === "credentials" ? (
        <div className="space-y-4">
          <div className="space-y-2 text-left">
            <label htmlFor="email" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
              {t("auth.email.label", "Email")}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              ref={emailInputRef}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              placeholder={t("auth.email.placeholder", "staff@sacco.rw")}
              disabled={disableInputs}
            />
          </div>

          <div className="space-y-2 text-left">
            <label htmlFor="password" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
              {t("auth.password.label", "Password")}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              ref={passwordInputRef}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              placeholder="••••••••"
              disabled={disableInputs}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2 text-left">
            <label htmlFor="mfa-code" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
              {t("auth.mfa.codeLabel", "Authenticator code")}
            </label>
            <input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(otpPattern, ""))}
              ref={codeInputRef}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              placeholder="123456"
              disabled={disableInputs}
            />
          </div>

          <div className="flex flex-col gap-2 text-xs text-neutral-2">
            {countdownLabel ? <span>{countdownLabel}</span> : null}
            <button
              type="button"
              onClick={handleResend}
              className="w-max text-left font-semibold text-rw-blue transition hover:text-rw-blue/80 disabled:text-neutral-4"
              disabled={disableInputs}
            >
              {t("auth.mfa.resend", "Resend code")}
            </button>
            <button
              type="button"
              onClick={() => {
                void handleSwitchAccount();
              }}
              className="w-max text-left text-neutral-3 underline-offset-4 hover:underline disabled:text-neutral-4"
              disabled={disableInputs}
            >
              {t("auth.mfa.switchAccount", "Use a different account")}
            </button>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded-xl bg-rw-blue px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-rw-blue/60"
        disabled={disableInputs}
      >
        {formPending
          ? t("auth.submitting", "Working…")
          : step === "credentials"
            ? t("auth.signIn", "Sign in")
            : t("auth.mfa.verify", "Verify and continue")}
      </button>
    </form>
  );
}
