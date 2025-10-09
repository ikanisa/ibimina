import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUserAndProfile } from "@/lib/auth";
import { MFA_SESSION_COOKIE, verifyMfaSessionToken } from "@/lib/mfa/session";
import { ProfileProvider } from "@/providers/profile-provider";
import { AppShell } from "@/components/layout/app-shell";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await requireUserAndProfile();
  const cookieJar = await cookies();
  const sessionToken = cookieJar.get(MFA_SESSION_COOKIE)?.value ?? null;
  const sessionPayload = sessionToken ? verifyMfaSessionToken(sessionToken) : null;

  if (auth.profile.mfa_enabled && (!sessionPayload || sessionPayload.userId !== auth.user.id)) {
    redirect("/login?mfa=1");
  }

  return (
    <ProfileProvider value={auth}>
      <AppShell profile={auth.profile}>{children}</AppShell>
    </ProfileProvider>
  );
}
