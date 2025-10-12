"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/types";
import {
  Fingerprint,
  KeyRound,
  MailCheck,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Button } from "@/components/ui/button";

type FactorsResponse = {
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

const factorLabels: Record<string, string> = {
  passkey: "Passkey / Biometrics",
  totp: "Authenticator App",
  email: "Email Code",
  whatsapp: "WhatsApp Code",
  backup: "Backup Code",
};

const factorDescriptions: Record<string, string> = {
  passkey: "Use device biometrics or security keys.",
  totp: "Enter the 6-digit code from your authenticator.",
  email: "Receive a one-time code in your inbox.",
  whatsapp: "Send a WhatsApp push to your registered number.",
  backup: "Fallback single-use code for emergencies.",
};

const factorIcons: Record<string, ReactNode> = {
  passkey: <Fingerprint className="h-4 w-4" aria-hidden />,
  totp: <KeyRound className="h-4 w-4" aria-hidden />,
  email: <MailCheck className="h-4 w-4" aria-hidden />,
  whatsapp: <MessageCircle className="h-4 w-4" aria-hidden />,
  backup: <ShieldCheck className="h-4 w-4" aria-hidden />,
};

export default function SmartMFA() {
  const [factors, setFactors] = useState<FactorsResponse | null>(null);
  const [factor, setFactor] = useState<string>("passkey");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trustDevice, setTrustDevice] = useState(true);
  const [loadingAction, setLoadingAction] = useState<"initiate" | "verify" | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/authx/factors/list", { cache: "no-store" });
        if (!res.ok) {
          setError("Unable to load factors");
          return;
        }
        const json = (await res.json()) as FactorsResponse;
        setFactors(json);
        if (json.enrolled.passkey) {
          setFactor("passkey");
        } else if (json.enrolled.totp) {
          setFactor("totp");
        } else if (json.enrolled.email) {
          setFactor("email");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load factors");
      }
    };

    load();
  }, []);

  const availableFactors = useMemo(() => {
    if (!factors) return [];
    return Object.entries(factors.enrolled)
      .filter(([, enrolled]) => enrolled)
      .map(([key]) => key);
  }, [factors]);

  const factorOptions = useMemo(() => {
    return availableFactors.map((key) => ({
      value: key,
      label: factorLabels[key] ?? key,
      description: factorDescriptions[key] ?? undefined,
      icon: factorIcons[key] ?? null,
    }));
  }, [availableFactors]);

  const initiate = useCallback(async () => {
    if (!factor) return;
    setError(null);
    setMessage(null);
    setLoadingAction("initiate");

    try {
      const res = await fetch("/api/authx/challenge/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factor }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: "failed" }));
        setError(payload.error ?? "Failed to initiate");
        return;
      }

      const json = (await res.json()) as InitiateResponse;

      if (json && "factor" in json && json.factor === "passkey" && "options" in json) {
        const passkeyInit = json as PasskeyInitiate;
        const assertion = await startAuthentication({ optionsJSON: passkeyInit.options });
        const payload = { response: assertion, stateToken: passkeyInit.stateToken };
        setToken(JSON.stringify(payload));
        setMessage("Approve the passkey prompt to continue.");
      } else if (json && "channel" in json) {
        setMessage(`Code sent via ${json.channel}. Expires ${(json.expiresAt && new Date(json.expiresAt).toLocaleString()) || "soon"}.`);
      } else {
        setMessage("Factor ready. Enter your code to continue.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to initiate factor");
    } finally {
      setLoadingAction(null);
    }
  }, [factor]);

  const verify = useCallback(async () => {
    if (!factor) return;
    setError(null);
    setMessage(null);
    setLoadingAction("verify");

    try {
      const res = await fetch("/api/authx/challenge/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factor, token, trustDevice }),
      });

      const json = (await res.json()) as VerifyResponse;
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Verification failed");
        return;
      }

      setMessage(json.usedBackup ? "Logged in with backup code" : "MFA challenge satisfied");
      setToken("");
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
      if (!factor || (factor !== "passkey" && token.trim().length === 0)) {
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
              value={factor}
              onValueChange={(next) => {
                if (typeof next !== "string") return;
                setFactor(next);
                setToken("");
                setMessage(null);
                setError(null);
              }}
              options={factorOptions}
              columns={2}
              aria-label="Available factors"
            />
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-2">
              No MFA factors are enrolled. Contact an administrator to configure passkeys or codes.
            </p>
          )}

          {factor !== "passkey" && (
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
            {loadingAction === "initiate" ? "Sending…" : "Send code"}
          </Button>
          <Button
            type="submit"
            disabled={isBusy || !factor || (factor !== "passkey" && token.trim().length === 0)}
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
