"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useRouter } from "next/navigation";
import {
  AUTHX_FACTORS,
  initiateAuthxFactor,
  listAuthxFactors,
  signInWithPassword,
  signOut,
  verifyAuthxFactor,
  type AuthxFactor,
  type AuthxFactorsSummary,
} from "@/lib/auth/client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useTranslation } from "@/providers/i18n-provider";
import { AuthNotice } from "@/components/auth/auth-notice";
import { MFACodeInput } from "@/components/auth/mfa-code-input";
import { OptimizedImage } from "@/components/ui/optimized-image";

const otpPattern = /[^0-9]/g;

type Step = "credentials" | "mfa";

const CODE_FACTORS: AuthxFactor[] = ["totp", "email", "whatsapp", "backup"];
const OTP_FACTORS: AuthxFactor[] = ["totp", "email", "whatsapp"];

const fallbackFactorLabels: Record<AuthxFactor, string> = {
  passkey: "Passkey / Biometrics",
  totp: "Authenticator App",
  email: "Email Code",
  whatsapp: "WhatsApp Code",
  backup: "Backup Code",
};

const otpFactors = new Set(OTP_FACTORS);
const codeFactors = new Set(CODE_FACTORS);

const ADMIN_ROLE = "SYSTEM_ADMIN";

export type AuthxLoginVariant = "member" | "admin";

type L10n = {
  key: string;
  fallback: string;
};

type VariantConfig = {
  testId: string;
  ids: {
    email: string;
    password: string;
    factor: string;
    code: string;
    trustDevice: string;
  };
  title: L10n;
  subtitle: L10n;
  selectMethod: L10n;
  selectOption: L10n;
  factorLabels: Record<AuthxFactor, L10n>;
  prompts: {
    passkey: L10n;
    totp: L10n;
    backup: L10n;
  };
  channelSent: {
    email: L10n;
    whatsapp: L10n;
  };
  passkeyHelp: L10n;
  errors: {
    general: L10n;
    verifyFailed: L10n;
    missing: L10n;
    backupRequired: L10n;
    unauthorized?: L10n;
  };
  success: {
    message: L10n;
    redirectPath: string;
  };
  logPrefix: string;
  switchRoute: string;
  passkeyCta: L10n;
};

const VARIANT_CONFIG: Record<AuthxLoginVariant, VariantConfig> = {
  member: {
    testId: "login-form",
    ids: {
      email: "email",
      password: "password",
      factor: "factor",
      code: "code",
      trustDevice: "trust-device",
    },
    title: { key: "auth.welcomeBack", fallback: "Welcome back" },
    subtitle: {
      key: "auth.subtitle",
      fallback: "Sign in to manage sacco operations and member activity.",
    },
    selectMethod: {
      key: "auth.mfa.selectMethod",
      fallback: "Choose a verification method",
    },
    selectOption: {
      key: "auth.mfa.selectOption",
      fallback: "Select a method",
    },
    factorLabels: {
      passkey: { key: "auth.mfa.passkey", fallback: fallbackFactorLabels.passkey },
      totp: { key: "auth.mfa.authenticator", fallback: fallbackFactorLabels.totp },
      email: { key: "auth.mfa.email", fallback: fallbackFactorLabels.email },
      whatsapp: { key: "auth.mfa.whatsapp", fallback: fallbackFactorLabels.whatsapp },
      backup: { key: "auth.mfa.backup", fallback: fallbackFactorLabels.backup },
    },
    prompts: {
      passkey: {
        key: "auth.mfa.passkeyPrompt",
        fallback: "Use your device biometrics or security key to finish signing in.",
      },
      totp: {
        key: "auth.mfa.prompt",
        fallback: "Enter the 6-digit code from your authenticator app to finish signing in.",
      },
      backup: {
        key: "auth.mfa.backupPrompt",
        fallback: "Enter one of your backup codes to continue.",
      },
    },
    channelSent: {
      email: {
        key: "auth.mfa.emailSent",
        fallback: "We emailed you a security code. Enter it to finish signing in.",
      },
      whatsapp: {
        key: "auth.mfa.whatsappSent",
        fallback: "Check WhatsApp for your security code. Enter it to finish signing in.",
      },
    },
    passkeyHelp: {
      key: "auth.mfa.passkeyHelp",
      fallback: "Use your device biometrics or a registered security key to finish signing in.",
    },
    errors: {
      general: { key: "auth.errors.generic", fallback: "Something went wrong. Try again." },
      verifyFailed: {
        key: "auth.mfa.verifyFailed",
        fallback: "Unable to verify the authenticator code.",
      },
      missing: {
        key: "auth.mfa.missing",
        fallback: "No verified authenticator was found for this account.",
      },
      backupRequired: {
        key: "auth.mfa.backupRequired",
        fallback: "Enter one of your backup codes to continue.",
      },
    },
    success: {
      message: {
        key: "auth.success.redirect",
        fallback: "Success! Redirecting to dashboard…",
      },
      redirectPath: "/dashboard",
    },
    logPrefix: "auth",
    switchRoute: "/login",
    passkeyCta: {
      key: "auth.mfa.usePasskey",
      fallback: "Use passkey & continue",
    },
  },
  admin: {
    testId: "admin-login-form",
    ids: {
      email: "admin-email",
      password: "admin-password",
      factor: "admin-factor",
      code: "admin-code",
      trustDevice: "admin-trust-device",
    },
    title: { key: "adminAuth.title", fallback: "Administrator sign in" },
    subtitle: {
      key: "adminAuth.subtitle",
      fallback: "Sign in with elevated credentials to manage SACCO+ operations.",
    },
    selectMethod: {
      key: "adminAuth.mfa.selectMethod",
      fallback: "Choose a verification method",
    },
    selectOption: {
      key: "adminAuth.mfa.selectOption",
      fallback: "Select a method",
    },
    factorLabels: {
      passkey: { key: "adminAuth.mfa.passkey", fallback: fallbackFactorLabels.passkey },
      totp: {
        key: "adminAuth.mfa.prompt",
        fallback: "Enter the 6-digit code from your authenticator app.",
      },
      email: { key: "adminAuth.mfa.email", fallback: fallbackFactorLabels.email },
      whatsapp: { key: "adminAuth.mfa.whatsapp", fallback: fallbackFactorLabels.whatsapp },
      backup: { key: "adminAuth.mfa.backup", fallback: fallbackFactorLabels.backup },
    },
    prompts: {
      passkey: {
        key: "adminAuth.mfa.passkeyPrompt",
        fallback: "Use your device biometrics or security key to finish signing in.",
      },
      totp: {
        key: "adminAuth.mfa.prompt",
        fallback: "Enter the 6-digit code from your authenticator app.",
      },
      backup: {
        key: "adminAuth.mfa.backupPrompt",
        fallback: "Enter one of your backup codes to continue.",
      },
    },
    channelSent: {
      email: {
        key: "adminAuth.mfa.emailSent",
        fallback: "We emailed you a security code. Enter it to continue.",
      },
      whatsapp: {
        key: "adminAuth.mfa.whatsappSent",
        fallback: "Check WhatsApp for your security code. Enter it to continue.",
      },
    },
    passkeyHelp: {
      key: "adminAuth.mfa.passkeyPrompt",
      fallback: "Use your device biometrics or security key to finish signing in.",
    },
    errors: {
      general: { key: "auth.errors.generic", fallback: "Something went wrong. Try again." },
      verifyFailed: {
        key: "adminAuth.mfa.verifyFailed",
        fallback: "Unable to verify the authenticator code.",
      },
      missing: {
        key: "adminAuth.mfa.missing",
        fallback: "No verified authenticator was found for this account.",
      },
      backupRequired: {
        key: "adminAuth.mfa.backupPrompt",
        fallback: "Enter one of your backup codes to continue.",
      },
      unauthorized: {
        key: "adminAuth.errors.notAdmin",
        fallback: "You do not have administrative privileges.",
      },
    },
    success: {
      message: {
        key: "adminAuth.success.redirect",
        fallback: "Success! Redirecting to admin dashboard…",
      },
      redirectPath: "/admin",
    },
    logPrefix: "admin-auth",
    switchRoute: "/admin/login",
    passkeyCta: {
      key: "adminAuth.mfa.usePasskey",
      fallback: "Use passkey & continue",
    },
  },
};

type EnsureAccessResult = { ok: true } | { ok: false };

export function AuthxLoginForm({
  variant,
  mode = "full",
  showHeader = true,
}: {
  variant: AuthxLoginVariant;
  mode?: "full" | "mfa-only";
  showHeader?: boolean;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const supabase = getSupabaseBrowserClient();

  const config = VARIANT_CONFIG[variant];

  const initialStep: Step = mode === "mfa-only" ? "mfa" : "credentials";
  const [step, setStep] = useState<Step>(initialStep);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [formPending, setFormPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [mfaSummary, setMfaSummary] = useState<AuthxFactorsSummary | null>(null);
  const [selectedFactor, setSelectedFactor] = useState<AuthxFactor | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [trustDevice, setTrustDevice] = useState(true);
  const [isHydrating, setIsHydrating] = useState(mode === "mfa-only");

  const errorRef = useRef<HTMLParagraphElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const activeElement = document.activeElement;

    if (step === "mfa") {
      const factorForFocus = selectedFactor;
      if (
        factorForFocus &&
        codeFactors.has(factorForFocus) &&
        codeInputRef.current &&
        activeElement !== codeInputRef.current
      ) {
        codeInputRef.current.focus();
      }
      return;
    }

    if (mode === "mfa-only") {
      return;
    }

    const emailField = emailInputRef.current;
    const passwordField = passwordInputRef.current;
    const hasEmail = email.trim().length > 0;

    if (hasEmail) {
      if (activeElement !== emailField && activeElement !== passwordField) {
        passwordField?.focus();
      }
    } else if (activeElement !== emailField) {
      emailField?.focus();
    }
  }, [email, mode, selectedFactor, step]);

  useEffect(() => {
    if (!otpExpiresAt) {
      setSecondsRemaining(null);
      return undefined;
    }

    const parsed = Date.parse(otpExpiresAt);
    if (Number.isNaN(parsed)) {
      setSecondsRemaining(null);
      return undefined;
    }

    const expirySeconds = Math.round(parsed / 1000);
    const tick = () => {
      const now = Math.round(Date.now() / 1000);
      setSecondsRemaining(Math.max(0, expirySeconds - now));
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [otpExpiresAt]);

  const parsedSeconds = useMemo(() => secondsRemaining ?? 0, [secondsRemaining]);

  const resetAll = useCallback(
    (options?: { clearCredentials?: boolean }) => {
      setStep(mode === "mfa-only" ? "mfa" : "credentials");
      setFormPending(false);
      setResendPending(false);
      setError(null);
      setMessage(null);
      setCode("");
      setSecondsRemaining(null);
      setMfaSummary(null);
      setSelectedFactor(null);
      setOtpExpiresAt(null);
      setTrustDevice(true);

      if (options?.clearCredentials) {
        setEmail("");
        setPassword("");
      }
    },
    [mode]
  );

  const availableFactors = useMemo<AuthxFactor[]>(() => {
    if (!mfaSummary) {
      return [];
    }
    return AUTHX_FACTORS.filter((factor) => mfaSummary.enrolled[factor]);
  }, [mfaSummary]);

  const factorRequiresCode = useMemo(() => {
    if (!selectedFactor) return false;
    return codeFactors.has(selectedFactor);
  }, [selectedFactor]);

  const factorIsOtp = useMemo(() => {
    if (!selectedFactor) return false;
    return otpFactors.has(selectedFactor);
  }, [selectedFactor]);

  const factorLabel = useMemo(() => {
    if (!selectedFactor) {
      return t(config.selectMethod.key, config.selectMethod.fallback);
    }

    const fallback = fallbackFactorLabels[selectedFactor];
    const labelConfig = config.factorLabels[selectedFactor];
    return t(labelConfig.key, labelConfig.fallback ?? fallback);
  }, [config, selectedFactor, t]);

  const ensureAccess = useCallback(async (): Promise<EnsureAccessResult> => {
    if (variant !== "admin") {
      return { ok: true };
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || !sessionData.user) {
      return { ok: false };
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", sessionData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return { ok: false };
    }

    if (profile.role !== ADMIN_ROLE) {
      return { ok: false };
    }

    return { ok: true };
  }, [supabase, variant]);

  const completeLogin = useCallback(async () => {
    if (variant === "admin") {
      const adminCheck = await ensureAccess();
      if (!adminCheck.ok) {
        const unauthorized = config.errors.unauthorized ?? config.errors.general;
        setError(t(unauthorized.key, unauthorized.fallback));
        await signOut();
        resetAll({ clearCredentials: false });
        return false;
      }
    }

    setMessage(t(config.success.message.key, config.success.message.fallback));
    resetAll();
    router.refresh();
    router.push(config.success.redirectPath);
    return true;
  }, [config, ensureAccess, resetAll, router, t, variant]);

  const prepareFactor = useCallback(
    async (factor: AuthxFactor, rememberDeviceOverride?: boolean) => {
      setError(null);
      setMessage(null);
      setOtpExpiresAt(null);
      setSecondsRemaining(null);

      if (factor === "passkey") {
        setMessage(t(config.prompts.passkey.key, config.prompts.passkey.fallback));
        return;
      }

      if (factor === "backup") {
        setMessage(t(config.prompts.backup.key, config.prompts.backup.fallback));
        return;
      }

      if (factor === "totp") {
        setMessage(t(config.prompts.totp.key, config.prompts.totp.fallback));
      }

      const rememberDevice = rememberDeviceOverride ?? trustDevice;

      try {
        setResendPending(true);
        const initiation = await initiateAuthxFactor(factor, { rememberDevice });
        if (initiation.status === "error") {
          setError(
            initiation.message || t(config.errors.general.key, config.errors.general.fallback)
          );
          return;
        }

        if (initiation.status === "passkey") {
          setMessage(t(config.prompts.passkey.key, config.prompts.passkey.fallback));
          return;
        }

        if (initiation.status === "otp") {
          setOtpExpiresAt(initiation.expiresAt);
          if (factor === "email") {
            setMessage(t(config.channelSent.email.key, config.channelSent.email.fallback));
          } else if (factor === "whatsapp") {
            setMessage(t(config.channelSent.whatsapp.key, config.channelSent.whatsapp.fallback));
          }
        }
      } catch (cause) {
        console.error(`[${config.logPrefix}] initiate factor failed`, cause);
        setError(t(config.errors.general.key, config.errors.general.fallback));
      } finally {
        setResendPending(false);
      }
    },
    [config, t, trustDevice]
  );

  const transitionToMfa = useCallback(
    (summary: AuthxFactorsSummary) => {
      setMfaSummary(summary);
      const nextFactor = summary.preferred;
      setSelectedFactor(nextFactor);
      setStep("mfa");
      setCode("");
      setTrustDevice(true);
      setError(null);
      setMessage(null);
      void prepareFactor(nextFactor, true);
    },
    [prepareFactor]
  );

  useEffect(() => {
    if (mode !== "mfa-only") {
      return;
    }
    let cancelled = false;
    const hydrate = async () => {
      try {
        const summary = await listAuthxFactors();
        if (!cancelled) {
          setIsHydrating(false);
          transitionToMfa(summary);
        }
      } catch (cause) {
        if (!cancelled) {
          console.error(`[${config.logPrefix}] standalone MFA factors failed`, cause);
          setError(t(config.errors.general.key, config.errors.general.fallback));
          setIsHydrating(false);
        }
      }
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [
    config.errors.general.fallback,
    config.errors.general.key,
    config.logPrefix,
    mode,
    t,
    transitionToMfa,
  ]);

  const handleCredentialsSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (formPending) {
        return;
      }

      setFormPending(true);
      setError(null);
      setMessage(null);

      try {
        const result = await signInWithPassword(email, password);

        if (result.status === "error") {
          setError(result.message || t(config.errors.general.key, config.errors.general.fallback));
          return;
        }

        if (result.status === "authenticated") {
          await completeLogin();
          return;
        }

        transitionToMfa(result.factors);
      } catch (cause) {
        console.error(`[${config.logPrefix}] credentials submit failed`, cause);
        setError(t(config.errors.general.key, config.errors.general.fallback));
      } finally {
        setFormPending(false);
      }
    },
    [completeLogin, config, email, formPending, password, t, transitionToMfa]
  );

  const handleResend = useCallback(async () => {
    if (!selectedFactor) {
      return;
    }

    await prepareFactor(selectedFactor, trustDevice);
  }, [prepareFactor, selectedFactor, trustDevice]);

  const handlePasskey = useCallback(async () => {
    if (!selectedFactor || selectedFactor !== "passkey") {
      return;
    }

    setFormPending(true);
    setError(null);
    setMessage(null);

    try {
      const initiation = await initiateAuthxFactor("passkey", { rememberDevice: trustDevice });
      if (initiation.status !== "passkey") {
        setError(
          initiation.status === "error"
            ? initiation.message || t(config.errors.general.key, config.errors.general.fallback)
            : t(config.errors.general.key, config.errors.general.fallback)
        );
        return;
      }

      const assertion = await startAuthentication({
        optionsJSON: initiation.options,
      });

      const verification = await verifyAuthxFactor({
        factor: "passkey",
        passkeyPayload: {
          response: assertion,
          stateToken: initiation.stateToken,
        },
        trustDevice,
      });

      if (verification.status === "error") {
        setError(
          verification.message ||
            t(config.errors.verifyFailed.key, config.errors.verifyFailed.fallback)
        );
        return;
      }

      await completeLogin();
    } catch (cause) {
      console.error(`[${config.logPrefix}] passkey verification failed`, cause);
      setError(t(config.errors.verifyFailed.key, config.errors.verifyFailed.fallback));
    } finally {
      setFormPending(false);
    }
  }, [completeLogin, config, selectedFactor, t, trustDevice]);

  const handleMfaSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedFactor) {
        setError(t(config.errors.missing.key, config.errors.missing.fallback));
        return;
      }

      if (selectedFactor === "passkey") {
        await handlePasskey();
        return;
      }

      if (factorIsOtp) {
        return;
      }

      if (!factorRequiresCode) {
        setError(t(config.errors.missing.key, config.errors.missing.fallback));
        return;
      }

      const trimmed = factorIsOtp ? code.replace(otpPattern, "") : code.trim();

      if (factorIsOtp && trimmed.length !== 6) {
        setError(t(config.errors.verifyFailed.key, config.errors.verifyFailed.fallback));
        codeInputRef.current?.focus();
        return;
      }

      if (!factorIsOtp && trimmed.length === 0) {
        setError(t(config.errors.backupRequired.key, config.errors.backupRequired.fallback));
        codeInputRef.current?.focus();
        return;
      }

      setFormPending(true);
      setError(null);
      setMessage(null);

      try {
        const verification = await verifyAuthxFactor({
          factor: selectedFactor,
          token: trimmed,
          trustDevice,
        });

        if (verification.status === "error") {
          setError(
            verification.message ||
              t(config.errors.verifyFailed.key, config.errors.verifyFailed.fallback)
          );
          return;
        }

        await completeLogin();
      } catch (cause) {
        console.error(`[${config.logPrefix}] verify mfa failed`, cause);
        setError(t(config.errors.verifyFailed.key, config.errors.verifyFailed.fallback));
      } finally {
        setFormPending(false);
      }
    },
    [
      code,
      completeLogin,
      config,
      factorIsOtp,
      factorRequiresCode,
      handlePasskey,
      selectedFactor,
      t,
      trustDevice,
    ]
  );

  const switchAccount = useCallback(async () => {
    setSwitchingAccount(true);
    resetAll({ clearCredentials: true });
    try {
      await signOut();
    } finally {
      router.push(config.switchRoute);
    }
  }, [config, resetAll, router]);

  const handleOtpVerify = useCallback(
    async (token: string): Promise<{ success: boolean; error?: string }> => {
      if (!selectedFactor) {
        return {
          success: false,
          error: t(config.errors.missing.key, config.errors.missing.fallback),
        };
      }

      const verification = await verifyAuthxFactor({
        factor: selectedFactor,
        token,
        trustDevice,
      });

      if (verification.status === "error") {
        return {
          success: false,
          error:
            verification.message ||
            t(config.errors.verifyFailed.key, config.errors.verifyFailed.fallback),
        };
      }

      await completeLogin();
      return { success: true };
    },
    [
      completeLogin,
      config.errors.missing.fallback,
      config.errors.missing.key,
      config.errors.verifyFailed.fallback,
      config.errors.verifyFailed.key,
      selectedFactor,
      t,
      trustDevice,
    ]
  );

  const secondsLabel = useMemo(() => {
    if (!secondsRemaining || secondsRemaining <= 0) {
      return t("auth.mfa.expiresSoon", "Code expiring soon");
    }
    const template = t("auth.mfa.codeExpiresIn", "Code expires in {{seconds}}s");
    return template.replace("{{seconds}}", String(parsedSeconds));
  }, [parsedSeconds, secondsRemaining, t]);

  const canResend = selectedFactor === "email" || selectedFactor === "whatsapp";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8" data-testid={config.testId}>
      {showHeader ? (
        <header className="flex flex-col items-center gap-4 text-center">
          <OptimizedImage
            src="/logo.svg"
            width={80}
            height={80}
            alt={t("auth.logoAlt", "SACCO+ logo")}
            priority
          />
          <h1 className="text-2xl font-semibold">{t(config.title.key, config.title.fallback)}</h1>
          <p className="text-muted-foreground">
            {t(config.subtitle.key, config.subtitle.fallback)}
          </p>
        </header>
      ) : null}

      {message ? <AuthNotice tone="success" title={message} /> : null}

      {error ? (
        <div ref={errorRef} tabIndex={-1}>
          <AuthNotice tone="error" title={error} />
        </div>
      ) : null}

      {step === "credentials" ? (
        <form className="flex flex-col gap-4" onSubmit={handleCredentialsSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor={config.ids.email}>
            {t("auth.emailLabel", "Work email")}
            <input
              id={config.ids.email}
              ref={emailInputRef}
              type="email"
              autoComplete="email"
              required
              disabled={formPending}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor={config.ids.password}>
            {t("auth.passwordLabel", "Password")}
            <input
              id={config.ids.password}
              ref={passwordInputRef}
              type="password"
              autoComplete="current-password"
              required
              disabled={formPending}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={formPending || email.trim().length === 0 || password.length === 0}
          >
            {formPending ? t("auth.signingIn", "Signing in…") : t("auth.signIn", "Sign in")}
          </button>
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleMfaSubmit}>
          {isHydrating ? (
            <AuthNotice
              tone="loading"
              title={t("auth.mfa.loading", "Loading verification methods…")}
              description={t(
                "auth.mfa.loadingDescription",
                "We are preparing your saved MFA options."
              )}
            />
          ) : null}

          {availableFactors.length > 1 && (
            <label className="flex flex-col gap-2 text-sm font-medium" htmlFor={config.ids.factor}>
              {t(config.selectMethod.key, config.selectMethod.fallback)}
              <select
                id={config.ids.factor}
                value={selectedFactor ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  if (!AUTHX_FACTORS.includes(value as AuthxFactor)) {
                    return;
                  }
                  const nextFactor = value as AuthxFactor;
                  setSelectedFactor(nextFactor);
                  setCode("");
                  void prepareFactor(nextFactor);
                }}
                className="rounded border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>
                  {t(config.selectOption.key, config.selectOption.fallback)}
                </option>
                {availableFactors.map((factor) => (
                  <option key={factor} value={factor}>
                    {fallbackFactorLabels[factor]}
                  </option>
                ))}
              </select>
            </label>
          )}

          {selectedFactor && factorIsOtp ? (
            <div className="space-y-3">
              <AuthNotice
                tone="muted"
                title={secondsRemaining && secondsRemaining > 0 ? secondsLabel : factorLabel}
                description={message ?? t(config.prompts.totp.key, config.prompts.totp.fallback)}
              />
              <MFACodeInput
                label={factorLabel}
                description={t(config.prompts.totp.key, config.prompts.totp.fallback)}
                onVerify={handleOtpVerify}
                onSuccess={() =>
                  setMessage(t(config.success.message.key, config.success.message.fallback))
                }
              />
            </div>
          ) : null}

          {factorRequiresCode && !factorIsOtp && (
            <label className="flex flex-col gap-2 text-sm font-medium" htmlFor={config.ids.code}>
              {factorLabel}
              <input
                id={config.ids.code}
                ref={codeInputRef}
                type="text"
                inputMode="text"
                autoComplete="off"
                required
                disabled={formPending}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                maxLength={32}
                className="rounded border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          )}

          {selectedFactor === "passkey" && (
            <p className="text-sm text-muted-foreground">
              {t(config.passkeyHelp.key, config.passkeyHelp.fallback)}
            </p>
          )}

          <label className="flex items-center gap-2 text-sm" htmlFor={config.ids.trustDevice}>
            <input
              id={config.ids.trustDevice}
              type="checkbox"
              checked={trustDevice}
              onChange={(event) => setTrustDevice(event.target.checked)}
              disabled={formPending}
              className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span>{t("auth.mfa.rememberDevice", "Trust this device for 30 days")}</span>
          </label>

          <div className="flex items-center justify-between text-sm">
            {canResend ? (
              <button
                type="button"
                disabled={resendPending || formPending}
                onClick={handleResend}
                className="text-primary underline-offset-2 hover:underline disabled:opacity-60"
              >
                {resendPending
                  ? t("auth.mfa.resending", "Sending…")
                  : t("auth.mfa.resend", "Resend code")}
              </button>
            ) : (
              <span className="text-muted-foreground">{factorLabel}</span>
            )}
            <button
              type="button"
              onClick={() => resetAll()}
              className="text-muted-foreground underline-offset-2 hover:underline"
            >
              {t("auth.mfa.useDifferentAccount", "Use a different account")}
            </button>
          </div>

          {selectedFactor === "passkey" || (factorRequiresCode && !factorIsOtp) ? (
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                formPending ||
                (selectedFactor === "passkey"
                  ? false
                  : factorRequiresCode && !factorIsOtp
                    ? code.trim().length === 0
                    : false)
              }
            >
              {formPending
                ? t("auth.mfa.verifying", "Verifying…")
                : selectedFactor === "passkey"
                  ? t(config.passkeyCta.key, config.passkeyCta.fallback)
                  : t("auth.mfa.verify", "Verify & continue")}
            </button>
          ) : null}
        </form>
      )}

      <button
        type="button"
        onClick={switchAccount}
        disabled={switchingAccount}
        className="text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-60"
      >
        {switchingAccount
          ? t("auth.switchingAccounts", "Switching accounts…")
          : t("auth.notYou", "Not you? Switch account")}
      </button>
    </div>
  );
}
