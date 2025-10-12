"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/types";

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

export default function SmartMFA() {
  const [factors, setFactors] = useState<FactorsResponse | null>(null);
  const [factor, setFactor] = useState<string>("passkey");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trustDevice, setTrustDevice] = useState(true);
  const [loading, setLoading] = useState(false);

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

  const initiate = useCallback(async () => {
    if (!factor) return;
    setError(null);
    setMessage(null);
    setLoading(true);

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
      setLoading(false);
    }
  }, [factor]);

  const verify = useCallback(async () => {
    if (!factor) return;
    setError(null);
    setMessage(null);
    setLoading(true);

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
      setLoading(false);
    }
  }, [factor, token, trustDevice]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">SACCO+ · Smart MFA</h1>
      <p className="text-sm text-neutral-400">
        Choose an available factor to satisfy step-up authentication. Passkeys, authenticator apps, email, WhatsApp and backup codes are supported.
      </p>

      <label className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">Factor</label>
      <select
        value={factor}
        onChange={(event) => {
          setFactor(event.target.value);
          setToken("");
          setMessage(null);
          setError(null);
        }}
        className="rounded border border-white/20 bg-white/5 p-2 text-sm text-neutral-100"
      >
        {availableFactors.map((key) => (
          <option key={key} value={key}>
            {factorLabels[key] ?? key}
          </option>
        ))}
        {availableFactors.length === 0 && <option value="">No factors enrolled</option>}
      </select>

      {factor !== "passkey" && (
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder={factor === "backup" ? "Enter backup code" : "Enter 6-digit code"}
          className="rounded border border-white/20 bg-white/5 p-2 text-sm text-neutral-100"
        />
      )}

      <label className="flex items-center gap-2 text-xs text-neutral-300">
        <input type="checkbox" checked={trustDevice} onChange={(event) => setTrustDevice(event.target.checked)} />
        Trust this device for 30 days
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={initiate}
          disabled={loading || !factor}
          className="rounded bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Initiate
        </button>
        <button
          type="button"
          onClick={verify}
          disabled={loading || !factor || (factor !== "passkey" && token.length === 0)}
          className="rounded bg-green-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          Verify
        </button>
      </div>

      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
