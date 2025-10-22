"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import {
  initiateAuthxFactor,
  listAuthxFactors,
  verifyAuthxFactor,
  type AuthxFactor,
  type AuthxFactorsSummary,
} from "@/lib/auth/client";
import {
  Fingerprint,
  KeyRound,
  MailCheck,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";

const factorLabels: Record<AuthxFactor, string> = {
  passkey: "Passkey / Biometrics",
  totp: "Authenticator App",
  email: "Email Code",
  whatsapp: "WhatsApp Code",
  backup: "Backup Code",
};

const factorDescriptions: Record<AuthxFactor, string> = {
  passkey: "Use device biometrics or security keys.",
  totp: "Enter the 6-digit code from your authenticator.",
  email: "Receive a one-time code in your inbox.",
  whatsapp: "Send a WhatsApp push to your registered number.",
  backup: "Fallback single-use code for emergencies.",
};

const factorIcons: Record<AuthxFactor, ReactNode> = {
  passkey: <Fingerprint className="h-4 w-4" aria-hidden />,
  totp: <KeyRound className="h-4 w-4" aria-hidden />,
  email: <MailCheck className="h-4 w-4" aria-hidden />,
  whatsapp: <MessageCircle className="h-4 w-4" aria-hidden />,
  backup: <ShieldCheck className="h-4 w-4" aria-hidden />,
};

export default function SmartMFA() {
  const [summary, setSummary] = useState<AuthxFactorsSummary | null>(null);
  const [factor, setFactor] = useState<AuthxFactor | null>(null);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trustDevice, setTrustDevice] = useState(true);
  const [loadingAction, setLoadingAction] = useState<"initiate" | "verify" | null>(null);
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoadingFactors(true);
      try {
        const details = await listAuthxFactors();
        if (!active) return;
        setSummary(details);
        setFactor(details.preferred);
      } catch (err) {
        console.error(err);
        if (!active) return;
        setError("Unable to load factors");
      } finally {
        if (active) {
          setLoadingFactors(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const availableFactors = useMemo(() => {
    if (!summary) return [] as AuthxFactor[];
    return (Object.entries(summary.enrolled) as [AuthxFactor, boolean][])
      .filter(([, enrolled]) => enrolled)
      .map(([key]) => key);
  }, [summary]);

  const factorOptions = useMemo(() => {
    return availableFactors.map((key) => ({
      value: key,
      label: factorLabels[key],
      description: factorDescriptions[key],
      icon: factorIcons[key],
    }));
  }, [availableFactors]);

  const initiate = useCallback(async () => {
    if (!factor) return;
    setError(null);
    setMessage(null);
    setOtpExpiresAt(null);
    setLoadingAction("initiate");

    try {
      if (factor === "passkey") {
        const initiation = await initiateAuthxFactor("passkey", { rememberDevice: trustDevice });

        if (initiation.status !== "passkey") {
          const message =
            initiation.status === "error" && initiation.message
              ? initiation.message
              : "Unable to start passkey verification";
          setError(message);
          return;
        }

        try {
          await startAuthentication({ optionsJSON: initiation.options });
        } catch (cause) {
          console.error(cause);
          setError("Passkey challenge was cancelled");
          return;
        }

        setLoadingAction("verify");

        const verification = await verifyAuthxFactor({
          factor: "passkey",
          token: initiation.stateToken,
          trustDevice,
        });

        if (verification.status === "error") {
          setError(verification.message ?? "Verification failed");
          return;
        }

        setMessage("Passkey verified. MFA challenge satisfied.");
        return;
      }

      const initiation = await initiateAuthxFactor(factor, { rememberDevice: trustDevice });

      if (initiation.status === "error") {
        setError(initiation.message ?? "Failed to initiate factor");
        return;
      }

      if (initiation.status === "otp") {
        setOtpExpiresAt(initiation.expiresAt ?? null);
        const channel = initiation.factor === "email" ? "Email" : "WhatsApp";
        setMessage(
          `Code sent via ${channel}. ${
            initiation.expiresAt
              ? `Expires ${new Date(initiation.expiresAt).toLocaleString()}.`
              : "Expires soon."
          }`,
        );
        return;
      }

      setMessage("Factor ready. Enter your code to continue.");
    } catch (err) {
      console.error(err);
      setError("Failed to initiate factor");
    } finally {
      setLoadingAction(null);
    }
  }, [factor, trustDevice]);

  const verify = useCallback(async () => {
    if (!factor || factor === "passkey") return;
    setError(null);
    setMessage(null);
    setLoadingAction("verify");

    try {
      const sanitized = factor === "backup" ? token.trim() : token.replace(/[^0-9]/g, "");
      if (factor === "backup" && sanitized.length === 0) {
        setError("Enter your backup code to continue");
        return;
      }
      if (factor !== "backup" && sanitized.length !== 6) {
        setError("Enter the 6-digit verification code");
        return;
      }
      const verification = await verifyAuthxFactor({
        factor,
        token: sanitized,
        trustDevice,
      });

      if (verification.status === "error") {
        setError(verification.message ?? "Verification failed");
        return;
      }

      setMessage(verification.usedBackup ? "Logged in with backup code" : "MFA challenge satisfied");
      setToken("");
      setOtpExpiresAt(null);
    } catch (err) {
      console.error(err);
      setError("Verification failed");
    } finally {
      setLoadingAction(null);
    }
  }, [factor, token, trustDevice]);

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!factor || factor === "passkey") {
        return;
      }
      const sanitized = factor === "backup" ? token.trim() : token.replace(/[^0-9]/g, "");
      if (factor === "backup" && sanitized.length === 0) {
        setError("Enter your backup code to continue");
        return;
      }
      if (factor !== "backup" && sanitized.length !== 6) {
        setError("Enter the 6-digit verification code");
        return;
      }
      void verify();
    },
    [factor, token, verify],
  );

  const isBusy = loadingAction !== null;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 p-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">Step-up authentication</p>
        <h1 className="text-2xl font-semibold text-neutral-0">SACCO+ · Smart MFA</h1>
        <p className="text-sm text-neutral-400">
          Choose an available factor to satisfy step-up authentication. Passkeys, authenticator apps, email, WhatsApp and backup codes are supported.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5" aria-busy={isBusy}>
        <fieldset className="space-y-4" disabled={isBusy}>
          <legend className="sr-only">Factor selection</legend>
          {factorOptions.length > 0 ? (
            <SegmentedControl
              value={factor ?? ""}
              onValueChange={(next) => {
                if (typeof next !== "string") return;
                if (!availableFactors.includes(next as AuthxFactor)) return;
                setFactor(next as AuthxFactor);
                setToken("");
                setMessage(null);
                setError(null);
                setOtpExpiresAt(null);
              }}
              options={factorOptions}
              columns={2}
              aria-label="Available factors"
            />
          ) : loadingFactors ? (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-2">
              Loading available factors…
            </p>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-2">
              No MFA factors are enrolled. Contact an administrator to configure passkeys or codes.
            </p>
          )}

          {factor && factor !== "passkey" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400" htmlFor="mfa-token">
                {factor === "backup" ? "Backup code" : "Verification code"}
              </label>
              <input
                id="mfa-token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder={factor === "backup" ? "Enter backup code" : "Enter 6-digit code"}
                inputMode={factor === "backup" ? "text" : "numeric"}
                autoComplete="one-time-code"
                className="w-full rounded-xl border border-white/20 bg-white/5 p-3 text-sm text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ink focus:ring-white/40"
              />
              {otpExpiresAt && (
                <p className="text-xs text-neutral-400">
                  Code expires {new Date(otpExpiresAt).toLocaleTimeString()}.
                </p>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-neutral-300" htmlFor="mfa-trust-device">
            <input
              id="mfa-trust-device"
              type="checkbox"
              checked={trustDevice}
              onChange={(event) => setTrustDevice(event.target.checked)}
              className="h-5 w-5 rounded border border-white/30 bg-white/5 text-rw-green focus:ring-2 focus:ring-offset-2 focus:ring-offset-ink focus:ring-rw-green/60"
            />
            Trust this device for 30 days
          </label>
        </fieldset>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={initiate}
            disabled={isBusy || !factor}
            variant="secondary"
            fullWidth
          >
            {factor === "passkey"
              ? loadingAction !== null
                ? "Verifying…"
                : "Verify with passkey"
              : loadingAction === "initiate"
                ? "Sending…"
                : "Send code"}
          </Button>
          <Button
            type="submit"
            disabled={isBusy || !factor || factor === "passkey" || token.trim().length === 0}
            fullWidth
          >
            {loadingAction === "verify" ? "Verifying…" : "Verify"}
          </Button>
        </div>
      </form>

      {message && (
        <p role="status" aria-live="polite" className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
