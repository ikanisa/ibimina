"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Trans } from "@/components/common/trans";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const supabase = getSupabaseBrowserClient();

interface ProfileClientProps {
  email: string;
}

export function ProfileClient({ email }: ProfileClientProps) {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.replace("/login");
        return;
      }
      setCheckingSession(false);
    };

    void verifySession();
  }, [router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="space-y-6">
      <GlassCard
        title={<Trans i18nKey="profile.account.title" fallback="Account" />}
        subtitle={
          <Trans
            i18nKey="profile.account.subtitle"
            fallback="Manage your basic account details. Multi-factor and legacy factors have been retired."
            className="text-xs text-neutral-3"
          />
        }
      >
        <div className="space-y-3 text-sm text-neutral-1">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-2">
              <Trans i18nKey="profile.account.emailLabel" fallback="Email" />
            </p>
            <p className="mt-1 text-lg font-semibold text-neutral-0">{email || "—"}</p>
          </div>
          <p>
            <Trans
              i18nKey="profile.account.simplifiedAuth"
              fallback="Additional MFA, passkey, and SMS verification steps have been removed for this release."
            />
          </p>
          <p className="text-neutral-3">
            <Trans
              i18nKey="profile.account.sessionInfo"
              fallback="You stay signed in on this device until you explicitly sign out or your session expires."
            />
          </p>
        </div>
        <div className="mt-6 flex gap-3">
          <Button onClick={handleSignOut} disabled={checkingSession || signingOut}>
            {signingOut ? (
              <Trans i18nKey="profile.account.signingOut" fallback="Signing out…" />
            ) : (
              <Trans i18nKey="profile.account.signOut" fallback="Sign out" />
            )}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
