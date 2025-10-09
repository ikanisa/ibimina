"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { BilingualText } from "@/components/common/bilingual-text";

type AuthStep = "credentials" | "challenge";

interface MfaStatusResponse {
  mfaEnabled: boolean;
  mfaRequired: boolean;
  trustedDevice: boolean;
  methods: string[];
}

export function LoginForm() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [mfaToken, setMfaToken] = useState("");
  const [mfaMethod, setMfaMethod] = useState<"totp" | "backup">("totp");
  const [rememberDevice, setRememberDevice] = useState(false);

  const reset = useCallback(() => {
    setStep("credentials");
    setMessage(null);
    setError(null);
    setMfaToken("");
    setMfaMethod("totp");
    setRememberDevice(false);
  }, []);

  const handleCredentialsSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setMessage(null);
      setError(null);

      startTransition(async () => {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          setError(signInError.message ?? "Unable to sign in");
          return;
        }

        if (!data?.session) {
          setError("Unable to establish a session");
          return;
        }

        const statusResponse = await fetch("/api/mfa/status", { cache: "no-store" });
        if (!statusResponse.ok) {
          setError("Unable to verify security requirements");
          return;
        }

        const status = (await statusResponse.json()) as MfaStatusResponse;
        if (!status.mfaEnabled || !status.mfaRequired) {
          setMessage("Success! Redirecting to dashboard…");
          router.refresh();
          router.push("/dashboard");
          return;
        }

        setStep("challenge");
        setMessage(
          "Enter the 6-digit code from your authenticator app. / Shyiramo kode y'ibiremo 6 iva muri Google Authenticator."
        );
        setError(null);
        setMfaToken("");
        setMfaMethod("totp");
      });
    },
    [email, password, router, supabase],
  );

  const handleMfaSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!mfaToken) {
        setError("Enter the security code" + " / Shyiramo kode" );
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
            setError("Invalid code" + " / Kode si yo");
          } else if (code === "rate_limit_exceeded") {
            setError("Too many attempts. Try again later." + " / Wagerageje kenshi, gerageza nyuma" );
          } else {
            setError("Unable to verify authentication code" + " / Ntibyakunze kugenzura kode" );
          }
          return;
        }

        setMessage("Success! Redirecting to dashboard…");
        setError(null);
        setMfaToken("");
        router.refresh();
        router.push("/dashboard");
      });
    },
    [mfaMethod, mfaToken, rememberDevice, router],
  );

  const handleSubmit = step === "credentials" ? handleCredentialsSubmit : handleMfaSubmit;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === "credentials" ? (
        <>
          <div className="space-y-2 text-left">
            <label htmlFor="email" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
              <BilingualText
                primary="Staff email"
                secondary="Imeli y'umukozi"
                layout="inline"
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              placeholder="staff@sacco.rw / staff@ikimina.rw"
              disabled={pending}
            />
          </div>
          <div className="space-y-2 text-left">
            <label htmlFor="password" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
              <BilingualText
                primary="Password"
                secondary="Ijambo ry'ibanga"
                layout="inline"
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </label>
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
      ) : (
        <>
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-neutral-2">
            <p>
              <BilingualText
                primary="Enter the 6-digit code from your authenticator app."
                secondary="Shyiramo kode y'ibiremo 6 iva muri Google Authenticator."
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </p>
            <p className="text-[10px] text-neutral-3">
              <BilingualText
                primary="Codes rotate every 30 seconds."
                secondary="Kode ihinduka buri masegonda 30."
                secondaryClassName="text-[9px] text-neutral-3"
              />
            </p>
          </div>
          <div className="space-y-2 text-left">
            <label htmlFor="mfa-token" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
              <BilingualText
                primary={mfaMethod === "backup" ? "Backup code" : "Authenticator code"}
                secondary={mfaMethod === "backup" ? "Kode y'ingoboka" : "Kode ya Authenticator"}
                layout="inline"
                secondaryClassName="text-[10px] text-neutral-3"
              />
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
              <BilingualText
                primary="Trust this device for 30 days"
                secondary="Izere iyi mashini iminsi 30"
                layout="inline"
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </label>
            <button
              type="button"
              className="text-[11px] uppercase tracking-[0.3em] text-neutral-2 hover:text-neutral-0"
              onClick={() => {
                setMfaMethod(mfaMethod === "totp" ? "backup" : "totp");
                setMfaToken("");
              }}
            >
              {mfaMethod === "totp" ? "Use backup code" : "Use authenticator"}
            </button>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}
      {message && <p className="text-sm text-emerald-300">{message}</p>}

      <button
        type="submit"
        className="interactive-scale w-full rounded-full bg-kigali px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-50"
        disabled={pending}
      >
        {pending ? "Processing…" : step === "credentials" ? "Sign in" : "Verify code"}
      </button>

      {step === "challenge" && (
        <button
          type="button"
          className="w-full text-center text-xs text-neutral-2 hover:text-neutral-0"
          onClick={reset}
        >
          Cancel and sign in again
        </button>
      )}
    </form>
  );
}
