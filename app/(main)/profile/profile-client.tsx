"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BadgeCheck,
  KeyRound,
  Loader2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { BilingualText } from "@/components/common/bilingual-text";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/providers/toast-provider";

const supabase = getSupabaseBrowserClient();

interface ProfileClientProps {
  email: string;
}

type TotpFactor = {
  id: string;
  factor_type: string;
  friendly_name?: string | null;
  status: string;
};

type TotpSetupState = {
  factorId: string;
  challengeId: string;
  qrCode: string;
  secret: string;
};

export function ProfileClient({ email }: ProfileClientProps) {
  const router = useRouter();
  const { success, error, notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, startUpdatingPassword] = useTransition();
  const [totpFactor, setTotpFactor] = useState<TotpFactor | null>(null);
  const [totpSetup, setTotpSetup] = useState<TotpSetupState | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [verifyingTotp, startVerifyingTotp] = useTransition();
  const [unenrolling, startUnenrolling] = useTransition();

  const refreshFactors = useCallback(async () => {
    const { data, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      console.error(factorsError);
      error("Unable to load multi-factor settings");
      return;
    }
    setTotpFactor((data?.totp?.[0] as TotpFactor | undefined) ?? null);
  }, [error]);

  useEffect(() => {
    const initialise = async () => {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) {
        router.replace("/login");
        return;
      }

      await refreshFactors();
      setLoading(false);
    };

    initialise();
  }, [refreshFactors, router]);

  const onUpdatePassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password || !confirmPassword) {
      error("Provide a new password" + " / Shyiraho ijambobanga rishya");
      return;
    }

    if (password !== confirmPassword) {
      error("Passwords do not match" + " / Amagambo y'ibanga ntiyahuye");
      return;
    }

    startUpdatingPassword(async () => {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        console.error(updateError);
        error(updateError.message ?? "Unable to update password");
        return;
      }

      success("Password updated" + " / Ijambobanga ryavuguruwe");
      setPassword("");
      setConfirmPassword("");
    });
  };

  const beginTotpEnrollment = async () => {
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator App",
      issuer: "Umurenge SACCO",
    });

    if (enrollError || !data) {
      console.error(enrollError);
      error(enrollError?.message ?? "Unable to start authenticator setup");
      return;
    }

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: data.id,
    });

    if (challengeError || !challenge || !data.totp?.qr_code || !data.totp?.secret) {
      console.error(challengeError);
      error(challengeError?.message ?? "Unable to start verification challenge");
      return;
    }

    setTotpSetup({
      factorId: data.id,
      challengeId: challenge.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
    setTotpCode("");
    notify("Scan the code with your authenticator" + " / Sikana ikode ukoresheje porogaramu yawe");
  };

  const verifyTotp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!totpSetup) return;

    if (!totpCode || totpCode.length < 6) {
      error("Enter the 6-digit code" + " / Shyiramo kode y'ibiremo 6");
      return;
    }

    startVerifyingTotp(async () => {
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpSetup.factorId,
        challengeId: totpSetup.challengeId,
        code: totpCode,
      });

      if (verifyError) {
        console.error(verifyError);
        error(verifyError.message ?? "Invalid authentication code");
        return;
      }

      success("Two-factor authentication enabled" + " / Uburyo bwa 2FA bwashyizweho");
      setTotpSetup(null);
      setTotpCode("");
      await refreshFactors();
    });
  };

  const disableTotp = () => {
    if (!totpFactor) return;

    startUnenrolling(async () => {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id,
      });

      if (unenrollError) {
        console.error(unenrollError);
        error(unenrollError.message ?? "Unable to disable authenticator");
        return;
      }

      success("Two-factor authentication disabled" + " / Uburyo bwa 2FA bwarahagaritswe");
      await refreshFactors();
    });
  };

  const totpEnabled = Boolean(totpFactor);
  const busy = updatingPassword || verifyingTotp || unenrolling;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-2" aria-hidden />
        <span className="sr-only">Loading profile</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <GlassCard
        title={
          <div className="flex items-center gap-2 text-lg font-semibold text-neutral-0">
            <KeyRound className="h-5 w-5 text-rw-blue" />
            <BilingualText
              primary="Account security"
              secondary="Umutekano w'uburenganzira"
              secondaryClassName="text-xs text-neutral-3"
            />
          </div>
        }
        subtitle={
          <BilingualText
            primary="Manage your password and authenticator preferences."
            secondary="Hindura ijambobanga ushyireho cyangwa ukureho uburyo bwa 2FA."
            secondaryClassName="text-xs text-neutral-3"
          />
        }
        actions={
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-0 transition hover:border-white/30"
          >
            Go to dashboard
          </Link>
        }
      >
        <form onSubmit={onUpdatePassword} className="grid gap-4 md:grid-cols-2">
          <Input label="Email" value={email} readOnly disabled />
          <div className="h-0" />
          <Input
            label="New password"
            id="new-password"
            name="new-password"
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            helperText="Use at least 8 characters"
          />
          <Input
            label="Confirm password"
            id="confirm-password"
            name="confirm-password"
            type="password"
            minLength={8}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <button
            type="submit"
            className="interactive-scale md:col-span-2 rounded-full bg-kigali px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-60"
            disabled={updatingPassword}
          >
            {updatingPassword ? "Updating…" : "Update password"}
          </button>
        </form>
      </GlassCard>

      <GlassCard
        title={
          <div className="flex items-center gap-2 text-lg font-semibold text-neutral-0">
            <ShieldCheck className="h-5 w-5 text-rw-green" />
            <BilingualText
              primary="Two-factor authentication"
              secondary="Uburyo bwa 2FA"
              secondaryClassName="text-xs text-neutral-3"
            />
          </div>
        }
        subtitle={
          <BilingualText
            primary="Secure sign-in with a 6-digit code from an authenticator app."
            secondary="Teza umutekano w'ukwinjira ukoresheje kode ivuye mu porogaramu."
            secondaryClassName="text-xs text-neutral-3"
          />
        }
      >
        <div className="space-y-6">
          <div
            className={
              totpEnabled
                ? "rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"
                : "rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"
            }
          >
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em]">
              {totpEnabled ? <BadgeCheck className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
              {totpEnabled ? "Enabled" : "Not enabled"}
            </div>
            <p className="mt-2 text-xs text-neutral-0">
              {totpEnabled
                ? "Your authenticator app will be required when signing in."
                : "Enable an authenticator app to protect your account."}
            </p>
          </div>

          {totpSetup ? (
            <form onSubmit={verifyTotp} className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="flex flex-col items-center justify-center rounded-3xl border border-white/15 bg-white/5 p-6">
                <Image
                  src={totpSetup.qrCode}
                  alt="Authenticator QR code"
                  width={168}
                  height={168}
                  className="h-40 w-40"
                  unoptimized
                />
                <p className="mt-4 text-xs text-neutral-2 text-center">
                  Scan this QR code with Google Authenticator, Authy, or a compatible app.
                </p>
              </div>
              <div className="space-y-4">
                <Input label="Manual setup code" value={totpSetup.secret} readOnly />
                <Input
                  label="Enter 6-digit code"
                  id="totp-code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={totpCode}
                  onChange={(event) => setTotpCode(event.target.value.replace(/[^0-9]/g, ""))}
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="interactive-scale rounded-full bg-kigali px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-60"
                    disabled={verifyingTotp || busy}
                  >
                    {verifyingTotp ? "Verifying…" : "Verify code"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-0 hover:border-white/30"
                    onClick={() => setTotpSetup(null)}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={beginTotpEnrollment}
                className="interactive-scale rounded-full bg-kigali px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-60"
                disabled={totpEnabled || busy}
              >
                {totpEnabled ? "Authenticator enabled" : "Enable authenticator"}
              </button>
              {totpEnabled && (
                <button
                  type="button"
                  onClick={disableTotp}
                  className="rounded-full border border-red-400/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-200 hover:border-red-300"
                  disabled={unenrolling || busy}
                >
                  {unenrolling ? "Disabling…" : "Disable two-factor"}
                </button>
              )}
            </div>
          )}

          <div className="h-px bg-white/10" />
          <p className="text-xs text-neutral-3">
            If you lose access to your authenticator, contact a system administrator to reset multi-factor authentication. Store the secret or backup codes securely.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
