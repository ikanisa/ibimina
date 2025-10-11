"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTranslation } from "@/providers/i18n-provider";
// i18n migrated: prefer t() over BilingualText

type AuthStep = "credentials" | "enroll" | "challenge";
type EnrollmentState = {
  secret: string;
  secretPreview: string;
  otpauth: string;
  pendingToken: string;
};

interface MfaStatusResponse {
  mfaEnabled: boolean;
  mfaRequired: boolean;
  trustedDevice: boolean;
  methods: string[];
}

export function LoginForm() {
  const { t } = useTranslation();
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mfaMode = searchParams.get("mfa");

  const [step, setStep] = useState<AuthStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);
  const [codeA, setCodeA] = useState("");
  const [codeB, setCodeB] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  const [mfaToken, setMfaToken] = useState("");
  const [mfaMethod, setMfaMethod] = useState<"totp" | "backup">("totp");
  const [rememberDevice, setRememberDevice] = useState(false);
  const qrCodeUrl = useMemo(
    () =>
      enrollment
        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(enrollment.otpauth)}`
        : null,
    [enrollment],
  );

  const backupDownload = useMemo(() => {
    if (!backupCodes || backupCodes.length === 0) {
      return null;
    }
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    return URL.createObjectURL(blob);
  }, [backupCodes]);

  useEffect(() => {
    if (!backupDownload) {
      return;
    }
    return () => {
      URL.revokeObjectURL(backupDownload);
    };
  }, [backupDownload]);

  const reset = useCallback(() => {
    setStep("credentials");
    setMessage(null);
    setError(null);
    setEnrollment(null);
    setCodeA("");
    setCodeB("");
    setBackupCodes(null);
    setMfaToken("");
    setMfaMethod("totp");
    setRememberDevice(false);
  }, []);

  useEffect(() => {
    if (mfaMode !== "1") {
      return;
    }

    let cancelled = false;

    const bootstrapMfaChallenge = async () => {
      try {
        const response = await fetch("/api/mfa/status", { cache: "no-store" });
        const contentType = response.headers.get("content-type") ?? "";
        if (!response.ok || !contentType.includes("application/json")) {
          return;
        }

        const status = (await response.json()) as MfaStatusResponse;
        if (!cancelled && status.mfaEnabled && status.mfaRequired) {
          setStep("challenge");
          setMessage(t("auth.challenge.prompt", "Enter the 6-digit code from your authenticator app."));
          setError(null);
          setMfaToken("");
          setMfaMethod("totp");
          setRememberDevice(false);
        }
      } catch (mfaError) {
        console.warn("Failed to bootstrap MFA challenge", mfaError);
      }
    };

    bootstrapMfaChallenge();

    return () => {
      cancelled = true;
    };
  }, [mfaMode, t]);

  const handleCredentialsSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setMessage(null);
      setError(null);
      setEnrollment(null);
      setCodeA("");
      setCodeB("");
      setBackupCodes(null);

      startTransition(async () => {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          setError(signInError.message ?? t("auth.errors.signIn", "Unable to sign in"));
          return;
        }

        if (!data?.session) {
          setError(t("auth.errors.noSession", "Unable to establish a session"));
          return;
        }

        const statusResponse = await fetch("/api/mfa/status", { cache: "no-store" });
        if (!statusResponse.ok) {
          setError(t("auth.errors.status", "Unable to verify security requirements"));
          return;
        }

        const status = (await statusResponse.json()) as MfaStatusResponse;
        if (!status.mfaRequired) {
          setMessage(t("auth.success.redirect", "Success! Redirecting to dashboard…"));
          router.refresh();
          router.push("/dashboard");
          return;
        }

        if (!status.mfaEnabled) {
          const enrollmentResponse = await fetch("/api/mfa/enroll", { method: "POST" });
          if (!enrollmentResponse.ok) {
            setError(t("auth.errors.startEnroll", "Unable to start authenticator setup"));
            await supabase.auth.signOut();
            return;
          }

          const data = (await enrollmentResponse.json()) as EnrollmentState;
          setEnrollment({
            secret: data.secret,
            secretPreview: data.secretPreview,
            otpauth: data.otpauth,
            pendingToken: data.pendingToken,
          });
          setStep("enroll");
          setMessage(t("auth.enroll.scanMessage", "Scan the QR code or use the secret with Google Authenticator."));
          setError(null);
          setCodeA("");
          setCodeB("");
          setMfaToken("");
          setMfaMethod("totp");
          return;
        }

        setStep("challenge");
        setMessage(t("auth.challenge.prompt", "Enter the 6-digit code from your authenticator app."));
        setError(null);
        setMfaToken("");
        setMfaMethod("totp");
      });
    },
    [email, password, router, supabase, t],
  );

  const handleMfaSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!mfaToken) {
        setError(t("auth.errors.enterCode", "Enter the security code"));
        return;
      }

      startTransition(async () => {
        const response = await fetch("/api/mfa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: mfaToken, method: mfaMethod, rememberDevice }),
        });

        if (!response.ok) {
          const { error: code } = await response.json().catch(() => ({ error: "invalid_code" }));
          if (code === "invalid_code") {
            setError(t("auth.errors.invalidCode", "Invalid code"));
          } else if (code === "rate_limit_exceeded") {
            setError(t("auth.errors.rateLimit", "Too many attempts. Try again later."));
          } else {
            setError(t("auth.errors.verifyCode", "Unable to verify authentication code"));
          }
          return;
        }

        setMessage(t("auth.success.redirect", "Success! Redirecting to dashboard…"));
        setError(null);
        setMfaToken("");
        router.refresh();
        router.push("/dashboard");
      });
    },
    [mfaMethod, mfaToken, rememberDevice, router, t],
  );

  const handleEnrollmentSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!enrollment) {
        setError(t("auth.errors.startEnroll", "Unable to start authenticator setup"));
        return;
      }
      if (codeA.length < 6 || codeB.length < 6) {
        setError(t("auth.errors.enterTwoCodes", "Enter two consecutive codes"));
        return;
      }

      startTransition(async () => {
        const response = await fetch("/api/mfa/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: enrollment.pendingToken, codes: [codeA, codeB] }),
        });

        if (!response.ok) {
          const { error: code } = await response.json().catch(() => ({ error: "unknown" }));
          if (code === "invalid_codes") {
            setError(t("auth.errors.invalidCodes", "Authenticator codes were not accepted."));
          } else {
            setError(t("auth.errors.confirmEnroll", "Unable to confirm enrollment"));
          }
          return;
        }

        const { backupCodes: issuedCodes } = (await response.json()) as { backupCodes: string[] };
        setEnrollment(null);
        setBackupCodes(issuedCodes);
        setCodeA("");
        setCodeB("");
        setMessage(t("auth.enroll.verifiedNextCode", "Authenticator verified. Enter the next 6-digit code to finish signing in."));
        setError(null);
        setStep("challenge");
        setMfaToken("");
        setMfaMethod("totp");
        setRememberDevice(false);
      });
    },
    [codeA, codeB, enrollment, setRememberDevice, startTransition, t],
  );

  const handleSubmit =
    step === "credentials"
      ? handleCredentialsSubmit
      : step === "enroll"
        ? handleEnrollmentSubmit
        : handleMfaSubmit;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === "credentials" && (
        <>
          <div className="space-y-2 text-left">
            <label htmlFor="email" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">{t("auth.email.label", "Staff email")}</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              placeholder={t("auth.email.placeholder", "staff@sacco.rw")}
              disabled={pending}
            />
          </div>
          <div className="space-y-2 text-left">
            <label htmlFor="password" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">{t("auth.password.label", "Password")}</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              placeholder="••••••••"
              disabled={pending}
            />
          </div>
        </>
      )}

      {step === "enroll" && enrollment && (
        <>
          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xs text-neutral-2">
            <p className="text-sm text-neutral-0">{t("auth.enroll.intro", "Before continuing, add “SACCO+” to the Google Authenticator app.")}</p>
            {qrCodeUrl && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4">
                <Image
                  src={qrCodeUrl}
                  alt={t("auth.enroll.qrAlt", "Scan this QR code with Google Authenticator to add SACCO+")}
                  width={220}
                  height={220}
                  className="h-44 w-44 rounded-lg border border-white/10 bg-neutral-0/5 p-2"
                  priority
                />
                <p className="text-[11px] text-neutral-3 text-center">{t("auth.enroll.scanInstruction", "Open Google Authenticator, tap the + button, and choose “Scan a QR code”.")}</p>
              </div>
            )}
            <div className="space-y-2 text-neutral-2">
              <ol className="list-decimal list-inside space-y-1 text-[11px]">
                <li dangerouslySetInnerHTML={{ __html: t("auth.enroll.step1", "Open Google Authenticator and tap the <strong>+</strong> button.") }} />
                <li>{t("auth.enroll.step2", "Scan the QR code above or choose “Enter a setup key” and copy the code below.")}</li>
                <li dangerouslySetInnerHTML={{ __html: t("auth.enroll.step3", "Give it the name <strong>SACCO+</strong>, confirm, then enter the next two 6-digit codes.") }} />
              </ol>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-neutral-0">
              <div className="flex flex-col gap-2">
                <a
                  href={enrollment.otpauth}
                  className="inline-flex w-max items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neutral-0 hover:border-white/30"
                >
                  {t("auth.enroll.openInApp", "Open in authenticator app")}
                </a>
                <p className="text-xs text-neutral-2">{t("auth.enroll.secretLabel", "Secret key:")} <span className="font-mono text-neutral-0">{enrollment.secret}</span></p>
                <p className="text-[10px] text-neutral-3">{t("auth.enroll.enterTwoCodes", "Enter the next two codes generated after adding the account.")}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 text-left">
              <label htmlFor="mfa-code-a" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">{t("auth.enroll.code1", "Code 1")}</label>
              <input
                id="mfa-code-a"
                inputMode="numeric"
                maxLength={6}
                value={codeA}
                onChange={(event) => setCodeA(event.target.value.replace(/[^0-9]/g, ""))}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
                placeholder="123456"
                disabled={pending}
              />
            </div>
            <div className="space-y-2 text-left">
              <label htmlFor="mfa-code-b" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">{t("auth.enroll.code2", "Code 2")}</label>
              <input
                id="mfa-code-b"
                inputMode="numeric"
                maxLength={6}
                value={codeB}
                onChange={(event) => setCodeB(event.target.value.replace(/[^0-9]/g, ""))}
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
                placeholder="654321"
                disabled={pending}
              />
            </div>
          </div>
        </>
      )}

      {step === "enroll" && !enrollment && (
        <p className="text-sm text-neutral-2">{t("auth.enroll.preparing", "Preparing authenticator setup…")}</p>
      )}

      {step === "challenge" && (
        <>
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-neutral-2">
            <p>{t("auth.challenge.prompt", "Enter the 6-digit code from your authenticator app.")}</p>
            <p className="text-[10px] text-neutral-3">{t("auth.challenge.rotate", "Codes rotate every 30 seconds.")}</p>
          </div>
          <div className="space-y-2 text-left">
            <label htmlFor="mfa-token" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">{mfaMethod === "backup" ? t("auth.challenge.backupCode", "Backup code") : t("auth.challenge.authCode", "Authenticator code")}</label>
            <input
              id="mfa-token"
              inputMode={mfaMethod === "backup" ? "text" : "numeric"}
              pattern={mfaMethod === "backup" ? undefined : "[0-9]*"}
              maxLength={mfaMethod === "backup" ? 12 : 6}
              autoFocus
              value={mfaToken}
              onChange={(event) =>
                setMfaToken(
                  mfaMethod === "backup"
                    ? event.target.value.replace(/\s+/g, "").toUpperCase()
                    : event.target.value.replace(/[^0-9]/g, "")
                )
              }
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              placeholder={mfaMethod === "backup" ? "ABCD-EFGH" : "123456"}
              disabled={pending}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(event) => setRememberDevice(event.target.checked)}
                className="h-4 w-4 rounded border border-white/20 bg-white/10"
              />
              {t("auth.challenge.trustDevice", "Trust this device for 30 days")}
            </label>
            <button
              type="button"
              className="text-[11px] uppercase tracking-[0.3em] text-neutral-2 hover:text-neutral-0"
              onClick={() => {
                setMfaMethod(mfaMethod === "totp" ? "backup" : "totp");
                setMfaToken("");
              }}
            >
              {mfaMethod === "totp" ? t("auth.challenge.useBackup", "Use backup code") : t("auth.challenge.useAuthenticator", "Use authenticator")}
            </button>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}
      {message && <p className="text-sm text-emerald-300">{message}</p>}

      {backupCodes && backupCodes.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px]">{t("auth.backup.title", "Backup codes")}</span>
            {backupDownload && (
              <a
                href={backupDownload}
                download="backup-codes.txt"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neutral-0 hover:border-white/30"
              >
                Download
              </a>
            )}
          </div>
          <p className="text-[10px] text-neutral-3">{t("auth.backup.storeInfo", "Store these codes securely. Each one can be used once if you lose access to the authenticator app.")}</p>
          <ul className="grid gap-2 md:grid-cols-2">
            {backupCodes.map((code) => (
              <li key={code} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 font-mono text-neutral-0">
                {code}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="submit"
        className="interactive-scale w-full rounded-full bg-kigali px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-50"
        disabled={pending}
      >
        {pending
          ? t("auth.buttons.processing", "Processing…")
          : step === "credentials"
            ? t("auth.buttons.signIn", "Sign in")
            : step === "enroll"
              ? t("auth.buttons.confirmSetup", "Confirm setup")
              : t("auth.buttons.verifyCode", "Verify code")}
      </button>

      {step !== "credentials" && (
        <button
          type="button"
          className="w-full text-center text-xs text-neutral-2 hover:text-neutral-0"
          onClick={reset}
        >
          {t("auth.buttons.cancelAndSignInAgain", "Cancel and sign in again")}
        </button>
      )}
    </form>
  );
}
