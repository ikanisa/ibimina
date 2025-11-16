"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AuthxLoginForm } from "@/components/auth/authx-login-form";
import { AuthNotice } from "@/components/auth/auth-notice";
import { useTranslation } from "@/providers/i18n-provider";

export default function SmartMFA() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-6">
      <header className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-atlas-blue/10 text-atlas-blue">
          <ShieldCheck className="h-7 w-7" aria-hidden />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {t("auth.mfa.title", "Verify it’s really you")}
          </h1>
          <p className="text-sm text-neutral-600">
            {t(
              "auth.mfa.subtitle",
              "Choose a factor and complete the challenge without leaving this page."
            )}
          </p>
        </div>
      </header>

      <AuthNotice
        tone="muted"
        title={t("auth.mfa.inline", "Pick your best option, enter the code, and you’re done.")}
        description={t(
          "auth.mfa.inlineDescription",
          "Switching factors won’t interrupt the current session; we’ll keep trusted devices in mind."
        )}
        action={
          <Link className="font-semibold text-atlas-blue hover:underline" href="/login">
            {t("auth.mfa.back", "Back to sign-in")}
          </Link>
        }
      />

      <AuthxLoginForm variant="admin" mode="mfa-only" showHeader={false} />
    </section>
  );
}
