"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  KeyRound,
  Loader2,
  ShieldCheck,
  Smartphone,
  Trash2,
  RefreshCw,
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

type TrustedDevice = {
  deviceId: string;
  createdAt: string;
  lastUsedAt: string;
  ipPrefix: string | null;
};

type ProfileState = {
  mfaEnabled: boolean;
  enrolledAt: string | null;
  backupCount: number;
  trustedDevices: TrustedDevice[];
  methods: string[];
};

type EnrollmentState = {
  secret: string;
  secretPreview: string;
  otpauth: string;
  pendingToken: string;
};

export function ProfileClient({ email }: ProfileClientProps) {
  const router = useRouter();
  const { success, error, notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, startUpdatingPassword] = useTransition();
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);
  const [codeA, setCodeA] = useState("");
  const [codeB, setCodeB] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disableCode, setDisableCode] = useState("");
  const [disableMethod, setDisableMethod] = useState<"totp" | "backup">("totp");
  const [processingEnrollment, startProcessingEnrollment] = useTransition();
  const [processingDisable, startProcessingDisable] = useTransition();
  const [refreshing, startRefreshing] = useTransition();

  const fetchProfile = useCallback(async () => {
    startRefreshing(async () => {
      setLoading(true);
      const response = await fetch("/api/mfa/profile", { cache: "no-store" });
      if (!response.ok) {
        error("Unable to load MFA settings" + " / Kwiyobora kwa MFA kwanze");
        setLoading(false);
        return;
      }
      const data = (await response.json()) as ProfileState;
      setProfile(data);
      setLoading(false);
    });
  }, [error, startRefreshing]);

  useEffect(() => {
    const initialise = async () => {
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) {
        router.replace("/login");
        return;
      }
      await fetchProfile();
    };

    initialise();
  }, [fetchProfile, router]);

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

  const beginEnrollment = async () => {
    startProcessingEnrollment(async () => {
      const response = await fetch("/api/mfa/enroll", { method: "POST" });
      if (!response.ok) {
        error("Unable to start enrollment" + " / Ntibyakunze gutangira kwiyandikisha");
        return;
      }
      const data = (await response.json()) as EnrollmentState & { secret: string };
      setEnrollment({
        secret: data.secret,
        secretPreview: data.secretPreview,
        otpauth: data.otpauth,
        pendingToken: data.pendingToken,
      });
      setCodeA("");
      setCodeB("");
      setBackupCodes(null);
      notify(
        "Scan the QR code or use the secret with Google Authenticator." +
          " / Sikana QR cyangwa ukoreshe ijambo rihishe muri Google Authenticator."
      );
    });
  };

  const confirmEnrollment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!enrollment) return;
    if (codeA.length < 6 || codeB.length < 6) {
      error("Enter two consecutive codes" + " / Shyiramo kode ebyiri zikurikirana");
      return;
    }

    startProcessingEnrollment(async () => {
      const response = await fetch("/api/mfa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: enrollment.pendingToken, codes: [codeA, codeB] }),
      });

      if (!response.ok) {
        const { error: code } = await response.json();
        error(
          code === "invalid_codes"
            ? "Authenticator codes were not accepted." + " / Kode zitari zo."
            : "Unable to confirm enrollment" + " / Ntibyakunze kwemeza kwiyandikisha"
        );
        return;
      }

      const data = (await response.json()) as { backupCodes: string[] };
      setEnrollment(null);
      setBackupCodes(data.backupCodes);
      await fetchProfile();
    });
  };

  const disableMfa = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!disableCode) {
      error("Enter a code" + " / Shyiramo kode");
      return;
    }

    startProcessingDisable(async () => {
      const response = await fetch("/api/mfa/enroll", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: disableCode, method: disableMethod }),
      });

      if (!response.ok) {
        const { error: code } = await response.json().catch(() => ({ error: "unknown" }));
        error(
          code === "invalid_code"
            ? "Code was not accepted" + " / Kode ntiyakiriwe"
            : "Unable to disable two-factor" + " / Ntibyakunze kuzimya 2FA"
        );
        return;
      }

      success("Two-factor authentication disabled" + " / 2FA yarahagaritswe");
      setDisableCode("");
      setBackupCodes(null);
      setEnrollment(null);
      await fetchProfile();
    });
  };

  const revokeDevice = async (deviceId: string) => {
    const response = await fetch(`/api/mfa/trusted-devices/${deviceId}`, { method: "DELETE" });
    if (!response.ok) {
      error("Unable to revoke device" + " / Ntibyakunze gukuraho igikoresho");
      return;
    }
    await fetchProfile();
  };

  const backupDownload = useMemo(() => {
    if (!backupCodes || backupCodes.length === 0) return null;
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    return URL.createObjectURL(blob);
  }, [backupCodes]);

  const busy = updatingPassword || processingEnrollment || processingDisable || refreshing;

  if (loading || !profile) {
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
            <ShieldCheck className="h-5 w-5 text-rw-blue" />
            <BilingualText
              primary="Two-factor authentication"
              secondary="Umutekano wa 2FA"
              secondaryClassName="text-xs text-neutral-3"
            />
          </div>
        }
        subtitle={
          profile.mfaEnabled ? (
            <BilingualText
              primary="Authenticator app is required on every sign-in."
              secondary="Porogaramu ya Authenticator irakenewe buri kwinjira."
              secondaryClassName="text-xs text-neutral-3"
            />
          ) : (
            <BilingualText
              primary="Enable Google Authenticator or compatible app to protect your account."
              secondary="Bikore ukoresheje Google Authenticator cyangwa izindi porogaramu."
              secondaryClassName="text-xs text-neutral-3"
            />
          )
        }
      >
        {!profile.mfaEnabled ? (
          <div className="space-y-4">
            {!enrollment ? (
              <button
                type="button"
                onClick={beginEnrollment}
                className="interactive-scale inline-flex items-center gap-2 rounded-full bg-kigali px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass"
                disabled={busy}
              >
                <BadgeCheck className="h-4 w-4" />
                Enable authenticator
              </button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-0">
                  <p className="font-semibold">Scan or tap to add authenticator</p>
                  <div className="mt-3 flex flex-col gap-2 text-xs text-neutral-2">
                    <a
                      href={enrollment.otpauth}
                      className="inline-flex w-max items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neutral-0 hover:border-white/30"
                    >
                      Open in authenticator app
                    </a>
                    <p>
                      Secret key: <span className="font-mono text-neutral-0">{enrollment.secret}</span>
                    </p>
                    <p className="text-[10px] text-neutral-3">
                      <BilingualText
                        primary="Enter two consecutive codes to confirm."
                        secondary="Shyiramo kode ebyiri zikurikirana kugirango wemeze."
                        secondaryClassName="text-[10px]"
                      />
                    </p>
                  </div>
                </div>
                <form onSubmit={confirmEnrollment} className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Code 1"
                    value={codeA}
                    onChange={(event) => setCodeA(event.target.value.replace(/[^0-9]/g, ""))}
                    inputMode="numeric"
                    maxLength={6}
                    required
                  />
                  <Input
                    label="Code 2"
                    value={codeB}
                    onChange={(event) => setCodeB(event.target.value.replace(/[^0-9]/g, ""))}
                    inputMode="numeric"
                    maxLength={6}
                    required
                  />
                  <button
                    type="submit"
                    className="interactive-scale md:col-span-2 rounded-full bg-kigali px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass disabled:opacity-50"
                    disabled={processingEnrollment}
                  >
                    {processingEnrollment ? "Verifying…" : "Confirm setup"}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-0">
              <p className="font-semibold">Authenticator enabled</p>
              <p className="text-xs text-neutral-2">
                <BilingualText
                  primary={`Enabled on ${profile.enrolledAt ? new Date(profile.enrolledAt).toLocaleString() : "unknown"}`}
                  secondary="Byakajijwe"
                  secondaryClassName="text-[11px]"
                />
              </p>
              <p className="text-xs text-neutral-2">
                <BilingualText
                  primary={`${profile.backupCount} backup codes remaining.`}
                  secondary={`${profile.backupCount} backup codes zisigaye.`}
                  secondaryClassName="text-[11px]"
                />
              </p>
            </div>

            <form onSubmit={disableMfa} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Authenticator or backup code"
                  value={disableCode}
                  onChange={(event) => setDisableCode(event.target.value.replace(/\s+/g, ""))}
                  required
                  helperText="Provide a valid code to disable two-factor"
                />
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">
                    <BilingualText primary="Code type" secondary="Ubwoko bwa kode" layout="inline" secondaryClassName="text-[10px] text-neutral-3" />
                  </label>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-neutral-0 focus:outline-none"
                    value={disableMethod}
                    onChange={(event) => setDisableMethod(event.target.value as "totp" | "backup")}
                  >
                    <option value="totp">Authenticator code</option>
                    <option value="backup">Backup code</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="interactive-scale inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-100 disabled:opacity-50"
                disabled={processingDisable}
              >
                <Trash2 className="h-4 w-4" />
                Disable two-factor
              </button>
            </form>
          </div>
        )}

        {backupCodes && backupCodes.length > 0 && (
          <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-0">
            <div className="flex items-center justify-between">
              <BilingualText
                primary="Backup codes"
                secondary="Kode z'inyunganizi"
                secondaryClassName="text-[11px] text-neutral-3"
              />
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
            <p className="text-[11px] text-neutral-2">
              <BilingualText
                primary="Each code can be used once. Store them securely and do not share."
                secondary="Bika izi kode neza, buri imwe ikoreshwa rimwe gusa."
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </p>
            <ul className="grid gap-2 md:grid-cols-2">
              {backupCodes.map((code) => (
                <li key={code} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 font-mono text-neutral-0">
                  {code}
                </li>
              ))}
            </ul>
          </div>
        )}
      </GlassCard>

      {profile.trustedDevices.length > 0 && (
        <GlassCard
          title={
            <div className="flex items-center gap-2 text-lg font-semibold text-neutral-0">
              <Smartphone className="h-5 w-5 text-rw-blue" />
              <BilingualText
                primary="Trusted devices"
                secondary="Ibikoresho byizewe"
                secondaryClassName="text-xs text-neutral-3"
              />
            </div>
          }
          subtitle={
            <BilingualText
              primary="Devices that can skip MFA when the trusted cookie is present."
              secondary="Ibikoresho bishobora kwinjira bitongeye kwemezwa nibyo byizewe."
              secondaryClassName="text-xs text-neutral-3"
            />
          }
        >
          <div className="space-y-3">
            {profile.trustedDevices.map((device) => (
              <div key={device.deviceId} className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center">
                <div className="space-y-1 text-xs text-neutral-2">
                  <p className="font-semibold text-neutral-0">Device ID: {device.deviceId}</p>
                  <p>Created: {new Date(device.createdAt).toLocaleString()}</p>
                  <p>Last used: {new Date(device.lastUsedAt).toLocaleString()}</p>
                  <p>IP prefix: {device.ipPrefix ?? "Unknown"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => revokeDevice(device.deviceId)}
                  className="inline-flex w-max items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-0 transition hover:border-white/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Revoke
                </button>
              </div>
            ))}
            <p className="flex items-center gap-2 text-[11px] text-neutral-2">
              <RefreshCw className="h-4 w-4" />
              <BilingualText
                primary="Revoke devices you no longer control."
                secondary="Kuraho ibikoresho utacyizeye."
                secondaryClassName="text-[10px] text-neutral-3"
              />
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
