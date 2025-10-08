"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { BilingualText } from "@/components/common/bilingual-text";

type TotpFactorLite = {
  id: string;
  friendly_name?: string | null;
};

type AuthStep = "credentials" | "challenge";

export function LoginForm() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mfaDetails, setMfaDetails] = useState<{
    factorId: string;
    challengeId: string;
    friendlyName?: string | null;
  } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [pending, startTransition] = useTransition();

  const resetFlow = useCallback(() => {
    setStep("credentials");
    setMfaDetails(null);
    setTotpCode("");
    setMessage(null);
    setError(null);
    // Clear any partial session that may have been created during MFA enrollment.
    void supabase.auth.signOut();
  }, [supabase]);

  const startChallengeForFactor = useCallback(
    async (factor: TotpFactorLite) => {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });

      if (challengeError || !challenge) {
        console.error(challengeError);
        setError(challengeError?.message ?? "Unable to start authenticator challenge");
        return false;
      }

      setMfaDetails({
        factorId: factor.id,
        challengeId: challenge.id,
        friendlyName: factor.friendly_name ?? "Authenticator app",
      });
      setTotpCode("");
      setStep("challenge");
      setMessage(
        "Enter the 6-digit code from your authenticator app. / Shyiramo kode y'ibiremo 6 iva muri Google Authenticator."
      );
      setError(null);
      return true;
    },
    [supabase],
  );

  const resolveFactors = useCallback(
    async (data?: { mfa?: { totp?: TotpFactorLite[] } }) => {
      const factors = data?.mfa?.totp ?? [];
      if (factors.length > 0) {
        return factors;
      }

      const { data: listFactors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        console.error(listError);
        setError(listError.message ?? "Unable to load authenticator factors");
        return [];
      }
      return (listFactors?.totp ?? []) as TotpFactorLite[];
    },
    [supabase],
  );

  const handleCredentialsSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setMessage(null);
      setError(null);

      startTransition(async () => {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        const beginMfa = async (payload?: { mfa?: { totp?: TotpFactorLite[] } }) => {
          const factors = await resolveFactors(payload);
          if (factors.length === 0) {
            setError(
              "Authenticator required but not configured. Contact your system administrator. / Porogaramu ya Google Authenticator irakenewe ariko ntiyashyizweho."
            );
            return;
          }
          await startChallengeForFactor(factors[0]!);
        };

        if (signInError) {
          const requiresMfa =
            signInError.status === 400 ||
            signInError.status === 403 ||
            signInError.message?.toLowerCase().includes("mfa");

          if (requiresMfa) {
            await beginMfa(data as { mfa?: { totp?: TotpFactorLite[] } } | undefined);
            return;
          }

          setError(signInError.message ?? "Unable to sign in");
          return;
        }

        if (data?.session) {
          setMessage("Success! Redirecting to dashboard…");
          router.refresh();
          router.push("/dashboard");
          return;
        }

        await beginMfa(data as { mfa?: { totp?: TotpFactorLite[] } } | undefined);
      });
    },
    [email, password, resolveFactors, router, startChallengeForFactor, supabase],
  );

  const handleMfaSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!mfaDetails) {
        setError("Authenticator challenge missing. / Nta gusaba kwa Authenticator kwaboneka.");
        return;
      }

      if (!totpCode || totpCode.length < 6) {
        setError("Enter the 6-digit code" + " / Shyiramo kode y'ibiremo 6");
        return;
      }

      startTransition(async () => {
        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: mfaDetails.factorId,
          challengeId: mfaDetails.challengeId,
          code: totpCode,
        });

        if (verifyError) {
          console.error(verifyError);
          setError(verifyError.message ?? "Invalid authentication code" + " / Kode si yo");
          if (verifyError.message?.toLowerCase().includes("expired") && mfaDetails.factorId) {
            await startChallengeForFactor({ id: mfaDetails.factorId, friendly_name: mfaDetails.friendlyName });
          }
          return;
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          console.error(sessionError);
          setError("Unable to establish session" + " / Ntibyakunze kwinjira");
          return;
        }

        setMessage("Success! Redirecting to dashboard…");
        setError(null);
        setMfaDetails(null);
        setTotpCode("");
        setStep("credentials");
        router.refresh();
        router.push("/dashboard");
      });
    },
    [mfaDetails, router, startChallengeForFactor, supabase, totpCode],
  );

  const resendChallenge = useCallback(async () => {
    if (!mfaDetails) return;
    setMessage(null);
    setError(null);
    await startChallengeForFactor({ id: mfaDetails.factorId, friendly_name: mfaDetails.friendlyName });
  }, [mfaDetails, startChallengeForFactor]);

  const handleSubmit = step === "credentials" ? handleCredentialsSubmit : handleMfaSubmit;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === "credentials" ? (
        <>
          <div className="space-y-2 text-left">
            <label htmlFor="email" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
              <BilingualText primary="Staff email" secondary="Imeli y'umukozi" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
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
              <BilingualText primary="Password" secondary="Ijambo ry'ibanga" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
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
                primary={`Enter the 6-digit code from ${mfaDetails?.friendlyName ?? "your authenticator app"}.`}
                secondary="Shyiramo kode y'ibiremo 6 iva muri Google Authenticator."
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </p>
            <p className="text-[10px] text-neutral-3">
              <BilingualText
                primary="Codes rotate every 30 seconds. Use the latest value shown in Google Authenticator."
                secondary="Kode ihinduka buri masegonda 30. Koresha agaciro ka nyuma kagaragara muri Google Authenticator."
                secondaryClassName="text-[9px] text-neutral-3"
              />
            </p>
          </div>
          <div className="space-y-2 text-left">
            <label htmlFor="totp" className="block text-xs uppercase tracking-[0.3em] text-neutral-2">
              <BilingualText primary="Authenticator code" secondary="Kode ya Authenticator" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
            </label>
            <input
              id="totp"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              value={totpCode}
              onChange={(event) => setTotpCode(event.target.value.replace(/[^0-9]/g, ""))}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue"
              placeholder="123456"
              disabled={pending}
            />
          </div>
        </>
      )}

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {message && <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending || (step === "challenge" && totpCode.length !== 6)}
          className="flex-1 rounded-xl bg-kigali py-3 text-sm font-semibold uppercase tracking-wide text-ink shadow-glass transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
        >
          {step === "credentials"
            ? pending ? "Signing in…" : "Sign in"
            : pending ? "Verifying…" : "Verify code"}
        </button>

        {step === "challenge" && (
          <button
            type="button"
            onClick={resendChallenge}
            disabled={pending}
            className="rounded-xl border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.3em] text-neutral-0 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <BilingualText primary="New code" secondary="Andi makode" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
          </button>
        )}

        {step === "challenge" && (
          <button
            type="button"
            onClick={resetFlow}
            disabled={pending}
            className="rounded-xl border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.3em] text-neutral-0 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <BilingualText primary="Use different account" secondary="Koresha konti indi" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
          </button>
        )}
      </div>
    </form>
  );
}
