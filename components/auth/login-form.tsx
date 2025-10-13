"use client";

import { OptimizedImage } from "@/components/ui/optimized-image";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { browserSupportsWebAuthn, platformAuthenticatorIsAvailable, startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/types";
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
  passkeyEnrolled: boolean;
}

type Factor = "passkey" | "totp" | "email" | "whatsapp" | "backup";

type FactorSummary = {
  preferred: string;
  enrolled: {
    passkey: boolean;
    totp: boolean;
    email: boolean;
    whatsapp: boolean;
    backup: boolean;
  };
};

type PasskeyInitiate = {
  factor: "passkey";
  options: PublicKeyCredentialRequestOptionsJSON;
  stateToken: string;
};

type InitiateResponse =
  | PasskeyInitiate
  | { ok: true; factor: string }
  | { channel: "email" | "whatsapp"; sent: boolean; expiresAt?: string; error?: string };

type VerifyResponse = { ok: boolean; factor: string; usedBackup?: boolean; error?: string };

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
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);
  const [codeA, setCodeA] = useState("");
  const [codeB, setCodeB] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  const [mfaToken, setMfaToken] = useState("");
  const [mfaMethod, setMfaMethod] = useState<"totp" | "backup" | "email" | "whatsapp">("totp");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyEnrolled, setPasskeyEnrolled] = useState(false);
  const [passkeyPending, setPasskeyPending] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [emailSending, setEmailSending] = useState(false);
  const [availableFactors, setAvailableFactors] = useState<Factor[]>([]);
  const [whatsappCountdown, setWhatsappCountdown] = useState(0);
  const [whatsappSending, setWhatsappSending] = useState(false);
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

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  useEffect(() => {
    let mounted = true;
    if (!browserSupportsWebAuthn()) {
      setPasskeySupported(false);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        const available = await platformAuthenticatorIsAvailable();
        if (mounted) {
          setPasskeySupported(Boolean(available));
        }
      } catch {
        if (mounted) {
          setPasskeySupported(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

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
    setPasskeyPending(false);
    setEmailCountdown(0);
    setEmailSending(false);
    setWhatsappCountdown(0);
    setWhatsappSending(false);
    setAvailableFactors([]);
  }, []);

  const applyChallengeState = useCallback(
    (enrolled: FactorSummary["enrolled"]) => {
      const factors: Factor[] = [];
      if (enrolled.passkey) factors.push("passkey");
      if (enrolled.totp) factors.push("totp");
      if (enrolled.email) factors.push("email");
      if (enrolled.whatsapp) factors.push("whatsapp");
      if (enrolled.backup) factors.push("backup");

      setAvailableFactors(factors);
      setPasskeyEnrolled(enrolled.passkey);

      const hasTotp = enrolled.totp;
      const hasEmail = enrolled.email;

      if (enrolled.passkey && passkeySupported) {
        if (hasTotp && hasEmail) {
          setMessage(
            t(
              "auth.challenge.passkeyMulti",
              "Approve with your passkey or use the authenticator app/email code.",
            ),
          );
        } else if (!hasTotp && hasEmail && enrolled.whatsapp) {
          setMessage(
            t(
              "auth.challenge.passkeyOmni",
              "Approve with your passkey or request a code by email or WhatsApp.",
            ),
          );
        } else if (!hasTotp && hasEmail) {
          setMessage(
            t("auth.challenge.passkeyEmail", "Approve with your passkey or enter the code we emailed you."),
          );
        } else if (!hasTotp && enrolled.whatsapp) {
          setMessage(
            t(
              "auth.challenge.passkeyWhatsapp",
              "Approve with your passkey or request a code on WhatsApp.",
            ),
          );
        } else {
          setMessage(
            t("auth.challenge.passkeyPrompt", "Approve with your passkey or enter a 6-digit authenticator code."),
          );
        }
      } else if (hasTotp && hasEmail) {
        setMessage(t("auth.challenge.emailPrompt", "Use your authenticator app or request a code by email."));
      } else if (hasTotp && enrolled.whatsapp) {
        setMessage(t("auth.challenge.whatsappFallback", "Use your authenticator app or request a WhatsApp code."));
      } else if (!hasTotp && hasEmail) {
        setMessage(t("auth.challenge.emailOnly", "Enter the code we emailed you."));
      } else if (!hasTotp && enrolled.whatsapp) {
        setMessage(t("auth.whatsapp.prompt", "Request a WhatsApp code to continue."));
      } else if (hasTotp) {
        setMessage(t("auth.challenge.prompt", "Enter the 6-digit code from your authenticator app."));
      } else if (enrolled.backup) {
        setMessage(t("auth.challenge.backupOnly", "Use one of your backup codes to continue."));
      } else {
        setMessage(null);
      }

      setError(null);
      setMfaToken("");
      const nextFactor = hasTotp ? "totp" : hasEmail ? "email" : enrolled.whatsapp ? "whatsapp" : "backup";
      setMfaMethod(nextFactor);
    },
    [passkeySupported, t],
  );

  useEffect(() => {
    if (emailCountdown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setEmailCountdown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCountdown]);

  useEffect(() => {
    if (whatsappCountdown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setWhatsappCountdown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [whatsappCountdown]);

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
        let summary: FactorSummary | null = null;

        try {
          const factorsResponse = await fetch("/api/authx/factors/list", { cache: "no-store" });
          if (factorsResponse.ok) {
            summary = (await factorsResponse.json()) as FactorSummary;
          }
        } catch {
          summary = null;
        }

        if (!cancelled && status.mfaEnabled && status.mfaRequired) {
          const enrolled = summary?.enrolled ?? {
            passkey: Boolean(status.passkeyEnrolled),
            totp: status.methods.includes("TOTP"),
            email: status.methods.includes("EMAIL"),
            whatsapp: status.methods.includes("WHATSAPP"),
            backup: status.methods.includes("BACKUP"),
          };

          if (enrolled.whatsapp) {
            router.replace("/mfa");
            return;
          }

          applyChallengeState(enrolled);
          setStep("challenge");
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
  }, [applyChallengeState, mfaMode, router]);

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

        let summary: FactorSummary | null = null;
        try {
          const factorsResponse = await fetch("/api/authx/factors/list", { cache: "no-store" });
          if (factorsResponse.ok) {
            summary = (await factorsResponse.json()) as FactorSummary;
          }
        } catch {
          summary = null;
        }

        const enrolled = summary?.enrolled ?? {
          passkey: Boolean(status.passkeyEnrolled),
          totp: status.methods.includes("TOTP"),
          email: status.methods.includes("EMAIL"),
          whatsapp: status.methods.includes("WHATSAPP"),
          backup: status.methods.includes("BACKUP"),
        };

        if (status.mfaEnabled && status.mfaRequired && enrolled.whatsapp) {
          router.push("/mfa");
          return;
        }

        setPasskeyEnrolled(enrolled.passkey);

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

        applyChallengeState(enrolled);
        setStep("challenge");
        setRememberDevice(false);
      });
    },
    [applyChallengeState, email, password, router, supabase, t],
  );

  const handleMfaSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!mfaToken) {
        setError(t("auth.errors.enterCode", "Enter the security code"));
        return;
      }

      startTransition(async () => {
        const response = await fetch("/api/authx/challenge/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ factor: mfaMethod, token: mfaToken, trustDevice: rememberDevice }),
        });

        const payload = (await response.json().catch(() => ({ ok: false, error: "failed" }))) as VerifyResponse;

        if (!response.ok || !payload.ok) {
          const code = payload.error ?? "invalid_or_expired";
          if (code === "token_required") {
            setError(t("auth.errors.enterCode", "Enter the security code"));
          } else if (code === "invalid_or_expired") {
            setError(
              mfaMethod === "email"
                ? t("auth.email.invalid", "Email code not accepted.")
                : t("auth.errors.invalidCode", "Invalid code"),
            );
          } else if (code === "rate_limited") {
            setError(t("auth.errors.rateLimit", "Too many attempts. Try again later."));
          } else if (code === "configuration_error") {
            setError(t("auth.errors.config", "Authenticator configuration issue. Contact support."));
          } else {
            setError(t("auth.errors.verifyCode", "Unable to verify authentication code"));
          }
          return;
        }

        setMessage(
          payload.usedBackup
            ? t("auth.challenge.backupSuccess", "Signed in with a backup code. Review your security settings soon.")
            : t("auth.success.redirect", "Success! Redirecting to dashboard…"),
        );
        setError(null);
        setMfaToken("");
        router.refresh();
        router.push("/dashboard");
      });
    },
    [mfaMethod, mfaToken, rememberDevice, router, t],
  );

  const requestEmailCode = useCallback(async () => {
    if (emailSending || emailCountdown > 0) {
      return;
    }
    setEmailSending(true);
    try {
      const response = await fetch("/api/authx/challenge/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factor: "email" }),
      });
      const payload = (await response.json().catch(() => ({}))) as InitiateResponse;

      if (!response.ok || !("channel" in payload) || payload.channel !== "email" || !payload.sent) {
        const code = "error" in payload && payload.error ? payload.error : "send_failed";
        if (code === "rate_limited") {
          setError(t("auth.email.rateLimited", "Check your inbox or try again shortly."));
        } else if (code === "active_limit") {
          setError(t("auth.email.activeLimit", "Too many active codes. Use an existing code or wait until it expires."));
        } else if (code === "missing_email") {
          setError(t("auth.errors.serverKeyMissing", "Security configuration missing. Contact support."));
        } else {
          setError(t("auth.errors.emailSend", "Unable to send email code"));
        }
        return;
      }

      const retryAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
      const delta = retryAt ? Math.ceil(Math.max(0, retryAt.getTime() - Date.now()) / 1000) : 60;
      setEmailCountdown(delta);
      setMfaMethod("email");
      setMessage(t("auth.email.sent", "We sent a security code to your email."));
      setError(null);
    } finally {
      setEmailSending(false);
    }
  }, [emailCountdown, emailSending, t]);

  const requestWhatsappCode = useCallback(async () => {
    if (whatsappSending || whatsappCountdown > 0) {
      return;
    }
    setWhatsappSending(true);
    try {
      const response = await fetch("/api/authx/challenge/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factor: "whatsapp" }),
      });
      const payload = (await response.json().catch(() => ({}))) as InitiateResponse;

      if (!response.ok || !("channel" in payload) || payload.channel !== "whatsapp" || !payload.sent) {
        const code = "error" in payload && payload.error ? payload.error : "send_failed";
        if (code === "not_enrolled") {
          setError(t("auth.whatsapp.notEnrolled", "WhatsApp MFA is not configured for this account."));
        } else if (code === "missing_msisdn") {
          setError(t("auth.whatsapp.missingNumber", "We are missing your registered WhatsApp number."));
        } else if (code === "rate_limited") {
          setError(t("auth.errors.rateLimit", "Too many attempts. Try again later."));
        } else {
          setError(t("auth.whatsapp.failed", "Unable to send WhatsApp security code."));
        }
        return;
      }

      const retryAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
      const delta = retryAt ? Math.ceil(Math.max(0, retryAt.getTime() - Date.now()) / 1000) : 120;
      setWhatsappCountdown(delta);
      setMfaMethod("whatsapp");
      setMessage(t("auth.whatsapp.sent", "We sent a WhatsApp code to your registered phone."));
      setError(null);
    } finally {
      setWhatsappSending(false);
    }
  }, [t, whatsappCountdown, whatsappSending]);

  const handlePasskeyChallenge = useCallback(async () => {
    if (!passkeySupported || !passkeyEnrolled || passkeyPending) {
      return;
    }

    setPasskeyPending(true);
    setError(null);

    try {
      const initiateResponse = await fetch("/api/authx/challenge/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factor: "passkey", rememberDevice }),
      });

      const initiatePayload = (await initiateResponse.json().catch(() => ({}))) as InitiateResponse;

      if (!initiateResponse.ok || !("factor" in initiatePayload) || initiatePayload.factor !== "passkey") {
        setError(t("auth.errors.passkeyOptions", "Unable to start passkey approval."));
        setPasskeyPending(false);
        return;
      }

      const { options, stateToken } = initiatePayload as PasskeyInitiate;

      const assertion = await startAuthentication({ optionsJSON: options });

      const verifyResponse = await fetch("/api/authx/challenge/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factor: "passkey",
          token: JSON.stringify({ response: assertion, stateToken }),
          trustDevice: rememberDevice,
        }),
      });

      const verifyPayload = (await verifyResponse.json().catch(() => ({ ok: false, error: "verification_failed" }))) as VerifyResponse;

      if (!verifyResponse.ok || !verifyPayload.ok) {
        const code = verifyPayload.error ?? "verification_failed";
        if (code === "rate_limited") {
          setError(t("auth.errors.rateLimit", "Too many attempts. Try again later."));
        } else if (code === "invalid_payload") {
          setError(t("auth.errors.passkeyOptions", "Unable to start passkey approval."));
        } else {
          setError(t("auth.errors.passkeyVerification", "Passkey approval was not accepted."));
        }
        setPasskeyPending(false);
        return;
      }

      setMessage(t("auth.success.redirect", "Success! Redirecting to dashboard…"));
      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      console.error("Passkey challenge failed", error);
      setError(t("auth.errors.passkeyUnknown", "Unable to complete passkey approval."));
    } finally {
      setPasskeyPending(false);
    }
  }, [passkeySupported, passkeyEnrolled, passkeyPending, rememberDevice, router, t]);

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
                <OptimizedImage
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
            <p>
              {passkeySupported && passkeyEnrolled
                ? t("auth.challenge.passkeyPrompt", "Approve with your passkey or enter a 6-digit authenticator code.")
                : mfaMethod === "email"
                  ? t("auth.email.challenge", "Enter the code we emailed you. Codes expire in 10 minutes.")
                  : mfaMethod === "whatsapp"
                    ? t("auth.whatsapp.challenge", "Enter the WhatsApp code we sent. Codes expire in 10 minutes.")
                    : mfaMethod === "backup"
                      ? t("auth.challenge.backupMessage", "Enter one of your backup codes to continue.")
                      : t("auth.challenge.prompt", "Enter the 6-digit code from your authenticator app.")}
            </p>
            {mfaMethod === "totp" && (
              <p className="text-[10px] text-neutral-3">{t("auth.challenge.rotate", "Codes rotate every 30 seconds.")}</p>
            )}
          </div>
          <div className="space-y-2 text-left">
            <label htmlFor="mfa-token" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
              {mfaMethod === "backup"
                ? t("auth.challenge.backupCode", "Backup code")
                : mfaMethod === "email"
                  ? t("auth.email.codeLabel", "Email code")
                  : mfaMethod === "whatsapp"
                    ? t("auth.whatsapp.codeLabel", "WhatsApp code")
                    : t("auth.challenge.authCode", "Authenticator code")}
            </label>
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
              placeholder={
                mfaMethod === "backup"
                  ? "ABCD-EFGH"
                  : mfaMethod === "whatsapp"
                    ? t("auth.whatsapp.placeholder", "Enter the 6-digit WhatsApp code")
                    : "123456"
              }
            disabled={pending}
          />
          </div>
          {passkeySupported && passkeyEnrolled && (
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-neutral-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-neutral-0">{t("auth.challenge.passkeyTitle", "Prefer to use your passkey?")}</p>
                <p className="text-[10px] text-neutral-3">{t("auth.challenge.passkeySubtitle", "Approve with your device's screen lock instead of entering a code.")}</p>
              </div>
              <button
                type="button"
                onClick={handlePasskeyChallenge}
                disabled={passkeyPending || pending}
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neutral-0 transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {passkeyPending ? t("auth.challenge.passkeyWaiting", "Waiting…") : t("auth.challenge.passkeyButton", "Use passkey")}
              </button>
            </div>
          )}
          <div className="flex flex-col gap-3 text-xs text-neutral-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(event) => setRememberDevice(event.target.checked)}
                className="h-4 w-4 rounded border border-white/20 bg-white/10"
              />
              {t("auth.challenge.trustDevice", "Trust this device for 30 days")}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {availableFactors.includes("totp") && availableFactors.includes("backup") && (
                <button
                  type="button"
                  className="text-[11px] uppercase tracking-[0.3em] text-neutral-2 hover:text-neutral-0"
                  onClick={() => {
                    setMfaMethod((prev) => (prev === "totp" ? "backup" : "totp"));
                    setMfaToken("");
                  }}
                >
                  {mfaMethod === "totp"
                    ? t("auth.challenge.useBackup", "Use a backup code")
                    : t("auth.challenge.useTotp", "Use authenticator app")}
                </button>
              )}
              {availableFactors.includes("email") && (
                <button
                  type="button"
                  onClick={requestEmailCode}
                  disabled={emailCountdown > 0 || emailSending}
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neutral-0 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {emailCountdown > 0
                    ? t("auth.email.resendIn", "Resend in {{seconds}}s").replace("{{seconds}}", String(emailCountdown))
                    : emailSending
                      ? t("auth.email.sending", "Sending…")
                      : t("auth.email.sendCode", "Send email code")}
                </button>
              )}
              {availableFactors.includes("whatsapp") && (
                <button
                  type="button"
                  onClick={requestWhatsappCode}
                  disabled={whatsappCountdown > 0 || whatsappSending}
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neutral-0 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {whatsappCountdown > 0
                    ? t("auth.whatsapp.resendIn", "WhatsApp in {{seconds}}s").replace(
                        "{{seconds}}",
                        String(whatsappCountdown),
                      )
                    : whatsappSending
                      ? t("auth.whatsapp.sending", "Sending…")
                      : t("auth.whatsapp.sendCode", "Send WhatsApp code")}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {error && (
        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      )}

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
