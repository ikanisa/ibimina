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
import { startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/types";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/providers/i18n-provider";
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

type PasskeyRecord = {
  id: string;
  credentialId: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  deviceType: string | null;
  backedUp: boolean;
};

type ProfileState = {
  mfaEnabled: boolean;
  enrolledAt: string | null;
  backupCount: number;
  trustedDevices: TrustedDevice[];
  passkeyEnrolled: boolean;
  passkeys: PasskeyRecord[];
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
  const { t } = useTranslation();
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
  const [registeringPasskey, setRegisteringPasskey] = useState(false);

  const fetchProfile = useCallback(async () => {
    startRefreshing(async () => {
      setLoading(true);
      const response = await fetch("/api/mfa/profile", { cache: "no-store" });
      if (!response.ok) {
        error("Unable to load MFA settings");
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
      error("Provide a new password");
      return;
    }

    if (password !== confirmPassword) {
      error("Passwords do not match");
      return;
    }

    startUpdatingPassword(async () => {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        console.error(updateError);
        error(updateError.message ?? "Unable to update password");
        return;
      }

      success("Password updated");
      setPassword("");
      setConfirmPassword("");
    });
  };

  const beginEnrollment = async () => {
    startProcessingEnrollment(async () => {
      const response = await fetch("/api/mfa/enroll", { method: "POST" });
      if (!response.ok) {
        error("Unable to start enrollment");
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
      notify("Scan the QR code or use the secret with Google Authenticator.");
    });
  };

  const confirmEnrollment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!enrollment) return;
    if (codeA.length < 6 || codeB.length < 6) {
      error("Enter two consecutive codes");
      return;
    }

    startProcessingEnrollment(async () => {
      const response = await fetch("/api/mfa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: enrollment.pendingToken, codes: [codeA, codeB] }),
      });

      if (!response.ok) {
        const { error: code } = await response.json().catch(() => ({ error: "unknown" }));
        if (code === "invalid_codes") {
          error("Authenticator codes were not accepted.");
        } else if (code === "configuration_error") {
          error("Authenticator configuration error. Contact support.");
        } else {
          error("Unable to confirm enrollment");
        }
        return;
      }

      const data = (await response.json()) as { backupCodes: string[] };
      setEnrollment(null);
      setBackupCodes(data.backupCodes);
      await fetchProfile();
    });
  };

  const registerPasskey = useCallback(async () => {
    if (registeringPasskey) return;

    if (!window.PublicKeyCredential) {
      error(t("profile.passkeys.unsupported", "Passkeys are not supported in this browser."));
      return;
    }

    const friendlyName = window
      .prompt(t("profile.passkeys.namePrompt", "Give this passkey a label (optional)"), t("profile.passkeys.defaultName", "Work laptop"))
      ?.trim();

    try {
      setRegisteringPasskey(true);

      const optionsResponse = await fetch("/api/mfa/passkeys/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendlyName: friendlyName && friendlyName.length > 0 ? friendlyName : null }),
      });

      if (!optionsResponse.ok) {
        const { error: code } = await optionsResponse.json().catch(() => ({ error: "unknown" }));
        if (code === "invalid_payload") {
          error(t("profile.passkeys.optionsInvalid", "Unable to start passkey registration."));
        } else {
          error(t("profile.passkeys.optionsFailed", "Could not prepare passkey registration."));
        }
        return;
      }

      const { options, stateToken } = (await optionsResponse.json()) as {
        options: PublicKeyCredentialCreationOptionsJSON;
        stateToken: string;
      };

      const credential = await startRegistration({ optionsJSON: options });

      const verifyResponse = await fetch("/api/mfa/passkeys/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: credential, stateToken, friendlyName: friendlyName && friendlyName.length > 0 ? friendlyName : null }),
      });

      if (!verifyResponse.ok) {
        const { error: code } = await verifyResponse.json().catch(() => ({ error: "unknown" }));
        if (code === "registration_failed") {
          error(t("profile.passkeys.registrationFailed", "Unable to verify the passkey."));
        } else {
          error(t("profile.passkeys.registrationUnknown", "Passkey registration did not complete."));
        }
        return;
      }

      success(t("profile.passkeys.registered", "Passkey added."));
      await fetchProfile();
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        error(t("profile.passkeys.cancelled", "Passkey approval was cancelled."));
      } else {
        console.error("Passkey registration error", err);
        error(t("profile.passkeys.registrationUnknown", "Passkey registration did not complete."));
      }
    } finally {
      setRegisteringPasskey(false);
    }
  }, [error, fetchProfile, registeringPasskey, success, t]);

  const removePasskey = useCallback(
    async (credentialId: string) => {
      if (!window.confirm(t("profile.passkeys.deleteConfirm", "Remove this passkey?"))) {
        return;
      }

      const response = await fetch(`/api/mfa/passkeys/${credentialId}`, { method: "DELETE" });
      if (!response.ok) {
        const { error: code } = await response.json().catch(() => ({ error: "delete_failed" }));
        if (code === "not_found") {
          error(t("profile.passkeys.deleteMissing", "Passkey not found."));
        } else {
          error(t("profile.passkeys.deleteFailed", "Unable to remove passkey."));
        }
        return;
      }

      success(t("profile.passkeys.deleted", "Passkey removed."));
      await fetchProfile();
    },
    [error, fetchProfile, success, t],
  );

  const disableMfa = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!disableCode) {
      error("Enter a code");
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
        if (code === "invalid_code") {
          error("Code was not accepted");
        } else if (code === "configuration_error") {
          error("Authenticator configuration error. Contact support.");
        } else {
          error("Unable to disable two-factor");
        }
        return;
      }

      success("Two-factor authentication disabled");
      setDisableCode("");
      setBackupCodes(null);
      setEnrollment(null);
      await fetchProfile();
    });
  };

  const revokeDevice = async (deviceId: string) => {
    const response = await fetch(`/api/mfa/trusted-devices/${deviceId}`, { method: "DELETE" });
    if (!response.ok) {
      error("Unable to revoke device");
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
        <span className="sr-only">{t("profile.loading", "Loading profile")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <GlassCard
        title={
          <div className="flex items-center gap-2 text-lg font-semibold text-neutral-0">
            <KeyRound className="h-5 w-5 text-rw-blue" />
            <span>{t("profile.security.title", "Account security")}</span>
          </div>
        }
        subtitle={t("profile.security.subtitle", "Manage your password and authenticator preferences.")}
        actions={
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-0 transition hover:border-white/30"
          >
            {t("profile.actions.goDashboard", "Go to dashboard")}
          </Link>
        }
      >
        <form onSubmit={onUpdatePassword} className="grid gap-4 md:grid-cols-2">
          <Input label={t("common.email", "Email")} value={email} readOnly disabled />
          <div className="h-0" />
          <Input
            label={t("profile.password.new", "New password")}
            id="new-password"
            name="new-password"
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            helperText={t("profile.password.hint", "Use at least 8 characters")}
          />
          <Input
            label={t("profile.password.confirm", "Confirm password")}
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
            {updatingPassword ? t("profile.password.updating", "Updating…") : t("profile.password.update", "Update password")}
          </button>
        </form>
      </GlassCard>

      <GlassCard
        title={
          <div className="flex items-center gap-2 text-lg font-semibold text-neutral-0">
            <ShieldCheck className="h-5 w-5 text-rw-blue" />
            <span>{t("profile.mfa.title", "Two-factor authentication")}</span>
          </div>
        }
        subtitle={
          profile.mfaEnabled
            ? t("profile.mfa.enforced", "Authenticator app is required on every sign-in.")
            : t("profile.mfa.prompt", "Enable Google Authenticator or compatible app to protect your account.")
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
                {t("profile.mfa.enable", "Enable authenticator")}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-0">
                  <p className="font-semibold">{t("profile.mfa.scanTitle", "Scan or tap to add authenticator")}</p>
                  <div className="mt-3 flex flex-col gap-2 text-xs text-neutral-2">
                    <a
                      href={enrollment.otpauth}
                      className="inline-flex w-max items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neutral-0 hover:border-white/30"
                    >
                      {t("profile.mfa.openApp", "Open in authenticator app")}
                    </a>
                    <p>
                      {t("profile.mfa.secretKey", "Secret key")}: <span className="font-mono text-neutral-0">{enrollment.secret}</span>
                    </p>
                    <p className="text-[10px] text-neutral-3">{t("profile.mfa.codesHint", "Enter two consecutive codes to confirm.")}</p>
                  </div>
                </div>
                <form onSubmit={confirmEnrollment} className="grid gap-3 md:grid-cols-2">
                  <Input
                    label={t("auth.enroll.code1", "Code 1")}
                    value={codeA}
                    onChange={(event) => setCodeA(event.target.value.replace(/[^0-9]/g, ""))}
                    inputMode="numeric"
                    maxLength={6}
                    required
                  />
                  <Input
                    label={t("auth.enroll.code2", "Code 2")}
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
                    {processingEnrollment ? t("auth.buttons.verifyCode", "Verify code") : t("auth.buttons.confirmSetup", "Confirm setup")}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-0">
              <p className="font-semibold">{t("profile.mfa.enabledTitle", "Authenticator enabled")}</p>
              <p className="text-xs text-neutral-2">{t("profile.mfa.enabledOn", "Enabled on")} {profile.enrolledAt ? new Date(profile.enrolledAt).toLocaleString() : t("common.unknown", "unknown")}</p>
              <p className="text-xs text-neutral-2">{t("profile.mfa.backupRemaining", "Backup codes remaining:")} {profile.backupCount}</p>
            </div>

            <form onSubmit={disableMfa} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label={t("profile.mfa.disableInputLabel", "Authenticator or backup code")}
                  value={disableCode}
                  onChange={(event) => setDisableCode(event.target.value.replace(/\s+/g, ""))}
                  required
                  helperText={t("profile.mfa.disableHint", "Provide a valid code to disable two-factor")}
                />
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-neutral-2">{t("profile.mfa.codeType", "Code type")}</label>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-neutral-0 focus:outline-none"
                    value={disableMethod}
                    onChange={(event) => setDisableMethod(event.target.value as "totp" | "backup")}
                  >
                    <option value="totp">{t("profile.mfa.codeType.totp", "Authenticator code")}</option>
                    <option value="backup">{t("profile.mfa.codeType.backup", "Backup code")}</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="interactive-scale inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-100 disabled:opacity-50"
                disabled={processingDisable}
              >
                <Trash2 className="h-4 w-4" />
                {t("profile.mfa.disable", "Disable two-factor")}
              </button>
            </form>
          </div>
        )}

        {backupCodes && backupCodes.length > 0 && (
          <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-0">
            <div className="flex items-center justify-between">
              <span>{t("profile.mfa.backup.title", "Backup codes")}</span>
              {backupDownload && (
                <a
                  href={backupDownload}
                  download="backup-codes.txt"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-neutral-0 hover:border-white/30"
                >
                  {t("common.download", "Download")}
                </a>
              )}
            </div>
            <p className="text-[11px] text-neutral-2">
              {t("profile.mfa.backup.hint", "Each code can be used once. Store them securely and do not share.")}
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

      <GlassCard
        title={
          <div className="flex items-center gap-2 text-lg font-semibold text-neutral-0">
            <BadgeCheck className="h-5 w-5 text-rw-blue" />
            <span>{t("profile.passkeys.title", "Passkeys")}</span>
          </div>
        }
        subtitle={t("profile.passkeys.subtitle", "Use device-bound approvals instead of typing codes.")}
      >
        <div className="space-y-3">
          <button
            type="button"
            onClick={registerPasskey}
            disabled={registeringPasskey}
            className="interactive-scale inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-0 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {registeringPasskey ? t("profile.passkeys.registering", "Waiting for approval…") : t("profile.passkeys.add", "Add passkey")}
          </button>

          {profile.passkeys.length === 0 ? (
            <p className="text-xs text-neutral-2">{t("profile.passkeys.empty", "No passkeys registered yet. Add one from a compatible device.")}</p>
          ) : (
            <div className="space-y-3">
              {profile.passkeys.map((passkey) => (
                <div key={passkey.id} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1 text-xs text-neutral-2">
                    <p className="font-semibold text-neutral-0">{passkey.label ?? t("profile.passkeys.unnamed", "Unnamed passkey")}</p>
                    <p>
                      {t("profile.passkeys.created", "Created")}: {new Date(passkey.createdAt).toLocaleString()}
                    </p>
                    <p>
                      {t("profile.passkeys.lastUsed", "Last used")}: {passkey.lastUsedAt ? new Date(passkey.lastUsedAt).toLocaleString() : t("profile.passkeys.neverUsed", "Never used")}
                    </p>
                    <p>
                      {t("profile.passkeys.deviceType", "Device type")}: {passkey.deviceType ?? t("common.unknown", "Unknown")}
                    </p>
                    <p>
                      {t("profile.passkeys.backedUp", "Backed up")}: {passkey.backedUp ? t("common.yes", "Yes") : t("common.no", "No")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePasskey(passkey.id)}
                    className="inline-flex w-max items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-0 transition hover:border-white/30"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("profile.passkeys.remove", "Remove")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {profile.trustedDevices.length > 0 && (
        <GlassCard
          title={
            <div className="flex items-center gap-2 text-lg font-semibold text-neutral-0">
              <Smartphone className="h-5 w-5 text-rw-blue" />
              <span>{t("profile.trusted.title", "Trusted devices")}</span>
            </div>
          }
          subtitle={t("profile.trusted.subtitle", "Devices that can skip MFA when the trusted cookie is present.")}
        >
          <div className="space-y-3">
            {profile.trustedDevices.map((device) => (
              <div key={device.deviceId} className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center">
                <div className="space-y-1 text-xs text-neutral-2">
                  <p className="font-semibold text-neutral-0">{t("profile.trusted.deviceId", "Device ID")}: {device.deviceId}</p>
                  <p>{t("profile.trusted.created", "Created")}: {new Date(device.createdAt).toLocaleString()}</p>
                  <p>{t("profile.trusted.lastUsed", "Last used")}: {new Date(device.lastUsedAt).toLocaleString()}</p>
                  <p>{t("profile.trusted.ipPrefix", "IP prefix")}: {device.ipPrefix ?? t("common.unknown", "Unknown")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => revokeDevice(device.deviceId)}
                  className="inline-flex w-max items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-0 transition hover:border-white/30"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("profile.trusted.revoke", "Revoke")}
                </button>
              </div>
            ))}
            <p className="flex items-center gap-2 text-[11px] text-neutral-2">
              <RefreshCw className="h-4 w-4" />
              {t("profile.trusted.revokeHint", "Revoke devices you no longer control.")}
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
