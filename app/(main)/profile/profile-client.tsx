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
  channelSummary: {
    policy: {
      primary: "PASSKEY" | "TOTP";
      recovery: string[];
      sessionSeconds: number;
      trustedDeviceSeconds: number;
    };
    channels: Array<{
      id: "PASSKEY" | "TOTP" | "EMAIL";
      enrolled: boolean;
      available: boolean;
      passkeyCount?: number;
      lastUsedAt?: string | null;
      enrolledAt?: string | null;
      backupCodesRemaining?: number;
      destination?: string | null;
      activeCodes?: number;
      lastConsumedAt?: string | null;
      lastIssuedAt?: string | null;
    }>;
  };
  emailAudit: Array<{
    id: string;
    action: string;
    createdAt: string | null;
    diff: Record<string, unknown> | null;
  }>;
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
  const formatMessage = useCallback(
    (key: string, fallback: string, vars: Record<string, string | number | null>) => {
      let template = t(key, fallback);
      Object.entries(vars).forEach(([name, value]) => {
        const replacement = value === null || value === undefined ? "" : String(value);
        template = template.replace(`{{${name}}}`, replacement);
      });
      return template;
    },
    [t],
  );
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
  const [updatingEmail, setUpdatingEmail] = useState(false);

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

  const updateEmailChannel = useCallback(
    async (enable: boolean) => {
      if (updatingEmail) return;
      setUpdatingEmail(true);

      try {
        const response = await fetch("/api/mfa/email", { method: enable ? "POST" : "DELETE" });
        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          console.error("Email MFA toggle failed", payload.error);
          if (enable) {
            error(t("profile.channels.email.enableError", "Unable to enable email codes."));
          } else {
            error(t("profile.channels.email.disableError", "Unable to disable email codes."));
          }
          return;
        }
        if (enable) {
          success(t("profile.channels.email.enabled", "Email codes enabled."));
        } else {
          success(t("profile.channels.email.disabled", "Email codes disabled."));
        }
        await fetchProfile();
      } finally {
        setUpdatingEmail(false);
      }
    },
    [error, fetchProfile, success, t, updatingEmail],
  );

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

  const channelCopy = useMemo(
    () => ({
      PASSKEY: {
        label: t("profile.channels.passkey.label", "Passkey approval"),
        description: t("profile.channels.passkey.desc", "Use device-bound approvals from compatible laptops or phones."),
      },
      TOTP: {
        label: t("profile.channels.totp.label", "Authenticator app"),
        description: t("profile.channels.totp.desc", "6-digit codes from Google Authenticator or similar."),
      },
      EMAIL: {
        label: t("profile.channels.email.label", "Email one-time code"),
        description: t("profile.channels.email.desc", "6-digit code delivered to your staff inbox for sign-in."),
      },
    }),
    [t],
  );

  const formatTimestamp = useCallback(
    (value: string | null) => {
      if (!value) {
        return t("profile.channels.never", "Never recorded");
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      return date.toLocaleString();
    },
    [t],
  );

  const channelStatus = useCallback(
    (channel: ProfileState["channelSummary"]["channels"][number]) => {
      if (channel.enrolled) {
        return {
          label: t("profile.channels.status.enrolled", "Enrolled"),
          tone: "text-emerald-300",
        };
      }
      if (channel.available) {
        return {
          label: t("profile.channels.status.available", "Available"),
          tone: "text-neutral-2",
        };
      }
      return {
        label: t("profile.channels.status.unavailable", "Unavailable"),
        tone: "text-red-300",
      };
    },
    [t],
  );

  const describeAuditAction = useCallback(
    (action: string) => {
      if (action === "MFA_EMAIL_CODE_SENT") {
        return t("profile.channels.audit.sent", "Code sent");
      }
      if (action === "MFA_EMAIL_VERIFIED") {
        return t("profile.channels.audit.verified", "Code verified");
      }
      if (action === "MFA_EMAIL_FAILED") {
        return t("profile.channels.audit.failed", "Code failed");
      }
      return action;
    },
    [t],
  );

  const summariseDiff = useCallback((diff: Record<string, unknown> | null) => {
    if (!diff) return null;
    const entries = Object.entries(diff);
    if (entries.length === 0) return null;
    return entries
      .map(([key, value]) => {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          return `${key}: ${String(value)}`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join(", ");
  }, []);

  const renderChannelMeta = useCallback(
    (channel: ProfileState["channelSummary"]["channels"][number]) => {
      if (channel.id === "PASSKEY") {
        return (
          <div className="text-right text-[11px] text-neutral-3">
            <p>{formatMessage("profile.channels.passkey.count", "{{count}} registered", { count: channel.passkeyCount ?? 0 })}</p>
            <p>{formatMessage("profile.channels.passkey.lastUsed", "Last used: {{value}}", { value: formatTimestamp(channel.lastUsedAt ?? null) })}</p>
          </div>
        );
      }

      if (channel.id === "TOTP") {
        if (!channel.enrolled) {
          return (
            <div className="text-right text-[11px] text-neutral-3">
              <p>{t("profile.channels.totp.notEnabled", "Authenticator codes are currently disabled.")}</p>
            </div>
          );
        }
        return (
          <div className="text-right text-[11px] text-neutral-3">
            <p>{formatMessage("profile.channels.totp.enabled", "Enabled on {{value}}", { value: channel.enrolledAt ? formatTimestamp(channel.enrolledAt) : t("profile.channels.never", "Never recorded") })}</p>
            <p>{formatMessage("profile.channels.totp.backups", "Backup codes: {{count}}", { count: channel.backupCodesRemaining ?? 0 })}</p>
          </div>
        );
      }

      if (!channel.available) {
        return (
          <div className="text-right text-[11px] text-neutral-3">
            <p>{t("profile.channels.email.missing", "No email configured")}</p>
          </div>
        );
      }

      if (!channel.enrolled) {
        return (
          <div className="text-right text-[11px] text-neutral-3">
            <p>{t("profile.channels.email.notEnabled", "Email codes are currently disabled.")}</p>
          </div>
        );
      }

      return (
        <div className="text-right text-[11px] text-neutral-3">
          <p>
            {channel.destination
              ? formatMessage("profile.channels.email.destination", "Delivered to {{email}}", { email: channel.destination })
              : t("profile.channels.email.missing", "No email configured")}
          </p>
          <p>
            {formatMessage("profile.channels.email.active", "Active codes: {{count}}", { count: channel.activeCodes ?? 0 })}
          </p>
          <p>
            {formatMessage("profile.channels.email.lastIssued", "Last sent: {{value}}", {
              value: channel.lastIssuedAt ? formatTimestamp(channel.lastIssuedAt) : t("profile.channels.never", "Never recorded"),
            })}
          </p>
        </div>
      );
    },
    [formatMessage, formatTimestamp, t],
  );

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

  const totpChannel = profile.channelSummary.channels.find((channel) => channel.id === "TOTP");
  const totpEnabled = Boolean(totpChannel?.enrolled);

  const recoverySummaryRaw = profile.channelSummary.policy.recovery
    .map((key) => channelCopy[key as "PASSKEY" | "TOTP" | "EMAIL"]?.label ?? key)
    .filter(Boolean)
    .join(", ");
  const recoverySummary = recoverySummaryRaw.length > 0
    ? recoverySummaryRaw
    : t("profile.channels.recoveryNone", "No alternate channel enabled yet.");

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
            ? t("profile.mfa.enforced", "Multi-factor verification is required on every sign-in. Use any active channel below.")
            : t("profile.mfa.prompt", "Turn on an authenticator app or email codes to protect your account.")
        }
      >
        <div className="space-y-6">
          {profile.channelSummary && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-0">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-3">
                  {t("profile.channels.policyTitle", "Authentication policy")}
                </p>
                <p className="text-[11px] text-neutral-2">
                  {formatMessage("profile.channels.primary", "Primary: {{channel}}", {
                    channel: channelCopy[profile.channelSummary.policy.primary].label,
                  })}
                </p>
              </div>
              <p className="text-[11px] text-neutral-3">
                {formatMessage("profile.channels.recovery", "Recovery options: {{channels}}", { channels: recoverySummary })}
              </p>
              <div className="mt-3 space-y-3">
                {profile.channelSummary.channels.map((channel) => {
                  const status = channelStatus(channel);
                  const meta = renderChannelMeta(channel);
                  const showEmailAction = channel.id === "EMAIL" && channel.available;
                  return (
                    <div
                      key={channel.id}
                      className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/10 p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-neutral-0">{channelCopy[channel.id].label}</p>
                          <span className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${status.tone}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-3">{channelCopy[channel.id].description}</p>
                      </div>
                      <div className="flex flex-col gap-2 text-right md:items-end">
                        {meta}
                        {showEmailAction && (
                          <button
                            type="button"
                            onClick={() => updateEmailChannel(!channel.enrolled)}
                            disabled={updatingEmail}
                            className="inline-flex items-center justify-center rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-0 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {channel.enrolled
                              ? t("profile.channels.email.disableAction", "Disable email codes")
                              : t("profile.channels.email.enableAction", "Require email codes")}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!totpEnabled ? (
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

          {profile.emailAudit.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-0">
              <p className="font-semibold">
                {t("profile.channels.audit.title", "Recent email code activity")}
              </p>
              <div className="mt-3 space-y-3">
                {profile.emailAudit.map((entry) => {
                  const diffSummary = summariseDiff(entry.diff);
                  return (
                    <div key={entry.id} className="rounded-xl border border-white/10 bg-white/10 p-3 text-[11px] text-neutral-2">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <span className="font-semibold uppercase tracking-[0.2em] text-neutral-1">
                          {describeAuditAction(entry.action)}
                        </span>
                        <span>{formatTimestamp(entry.createdAt)}</span>
                      </div>
                      {diffSummary && <p className="mt-1 text-neutral-3">{diffSummary}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
