'use client';

import { AuthxLoginForm } from "@/components/auth/authx-login-form";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useTranslation } from "@/providers/i18n-provider";

export default function SmartMFA() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 p-6 text-neutral-0">
      <header className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-3">
          {t("auth.mfa.stepUp", "Step-up authentication")}
        </p>
        <h1 className="text-2xl font-semibold">{t("auth.mfa.title", "Verify your identity")}</h1>
        <p className="text-sm text-neutral-400">
          {t(
            "auth.mfa.description",
            "Choose an available factor to finish signing in. Passkeys, authenticator apps, email, WhatsApp, and backup codes are supported.",
          )}
        </p>
      </header>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <OptimizedImage
          src="/illustrations/mfa-lock.png"
          alt={t("auth.mfa.illustrationAlt", "Security illustration")}
          width={320}
          height={180}
          priority
          className="mx-auto h-auto w-48"
        />
      </div>

      <AuthxLoginForm variant="member" mode="mfa-only" />
    </section>
  );
}
