import type { MemberProfileRow } from "@/lib/member/data";

interface ProfileOverviewProps {
  profile: MemberProfileRow | null;
  email: string | null;
}

export function ProfileOverview({ profile, email }: ProfileOverviewProps) {
  if (!profile) {
    return (
      <div className="rounded-3xl border border-white/15 bg-white/6 p-6 text-white/80">
        Complete onboarding to populate your profile.
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-3xl border border-white/15 bg-white/8 p-6 text-neutral-0">
      <header>
        <h2 className="text-2xl font-semibold">Profile</h2>
        <p className="text-sm text-white/70">Keep your contact and identity details up to date.</p>
      </header>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-white/70">Email</dt>
          <dd className="text-lg font-medium">{email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-white/70">WhatsApp number</dt>
          <dd className="text-lg font-medium">{profile.whatsapp_msisdn}</dd>
        </div>
        <div>
          <dt className="text-white/70">MoMo number</dt>
          <dd className="text-lg font-medium">{profile.momo_msisdn}</dd>
        </div>
        <div>
          <dt className="text-white/70">Preferred language</dt>
          <dd className="text-lg font-medium">{profile.lang?.toUpperCase() ?? "EN"}</dd>
        </div>
      </dl>
    </section>
  );
}
