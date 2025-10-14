import { requireUserAndProfile } from "@/lib/auth";
import { ProfileProvider } from "@/providers/profile-provider";
import { AppShell } from "@/components/layout/app-shell";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await requireUserAndProfile();

  return (
    <ProfileProvider value={auth}>
      <AppShell profile={auth.profile}>{children}</AppShell>
    </ProfileProvider>
  );
}
