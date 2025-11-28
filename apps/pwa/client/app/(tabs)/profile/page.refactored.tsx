/**
 * Refactored Profile Page using Modern Design System
 * 
 * Improvements:
 * - Uses Stack, Container, Grid, DataCard for layout
 * - Cleaner component composition
 * - Better visual hierarchy
 * - More maintainable code
 */

import { AnimatedPage, Container, Stack, Grid, DataCard } from "@ibimina/ui";
import { MessageCircle, Phone, Globe, FileText, Shield, QrCode } from "lucide-react";
import { ReferenceCard } from "@/components/reference/reference-card";
import { SmsConsentCard } from "@/components/sms/sms-consent-card";
import { loadProfile, updateLocaleAction } from "@/lib/data/profile";

const LANGUAGES = [
  { code: "rw", label: "Kinyarwanda" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

export const metadata = {
  title: "Profile | SACCO+ Client",
  description: "Your profile and settings",
};

export default async function ProfilePage() {
  const profile = await loadProfile();

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-background">
        {/* Hero Header */}
        <header className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 py-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <Container size="xl" className="relative">
            <h1 className="mb-2 text-3xl font-bold text-primary-foreground drop-shadow-sm">
              {profile?.fullName ?? "Member"}
            </h1>
            {profile?.createdAt && (
              <p className="text-sm text-primary-foreground/80 drop-shadow-sm">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            )}
          </Container>
        </header>

        {/* Main Content */}
        <Container size="xl" padding="md">
          <Stack gap="lg" className="pb-20">
            {/* Reference Code Section */}
            {profile?.referenceToken && (
              <section>
                <h2 className="mb-4 text-lg font-semibold">My reference code</h2>
                <ReferenceCard
                  reference={profile.referenceToken}
                  memberName={profile.fullName ?? "Member"}
                  showQR={true}
                />
              </section>
            )}

            {/* Contact Information */}
            <section>
              <h2 className="mb-4 text-lg font-semibold">Contact information</h2>
              <Grid cols={2} gap="md" responsive={{ sm: 1, md: 2 }}>
                <DataCard>
                  <DataCard.Header icon={MessageCircle} title="WhatsApp" />
                  <DataCard.Value value={profile?.whatsappMsisdn ?? "Not set"} />
                  <DataCard.Description>
                    Used for notifications and communication
                  </DataCard.Description>
                </DataCard>

                <DataCard>
                  <DataCard.Header icon={Phone} title="Mobile Money" />
                  <DataCard.Value value={profile?.momoMsisdn ?? "Not set"} />
                  <DataCard.Description>
                    Linked to your payment account
                  </DataCard.Description>
                </DataCard>
              </Grid>
              
              <p className="mt-4 text-xs text-muted-foreground">
                To update contact information, please contact your SACCO staff.
              </p>
            </section>

            {/* Language Settings */}
            <section>
              <h2 className="mb-4 text-lg font-semibold">Language preference</h2>
              <DataCard>
                <DataCard.Header icon={Globe} title="App Language" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </DataCard>
            </section>

            {/* SMS Consent */}
            <SmsConsentCard />

            {/* Quick Links */}
            <section>
              <h2 className="mb-4 text-lg font-semibold">More options</h2>
              <Stack gap="sm">
                <a
                  href="/help"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                >
                  <FileText className="h-5 w-5" />
                  <span>Help & Support</span>
                </a>
                <a
                  href="/privacy"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                >
                  <Shield className="h-5 w-5" />
                  <span>Privacy Policy</span>
                </a>
              </Stack>
            </section>
          </Stack>
        </Container>
      </div>
    </AnimatedPage>
  );
}
