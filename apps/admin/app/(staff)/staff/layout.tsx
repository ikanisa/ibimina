import Link from "next/link";
import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { StaffNav } from "@/components/staff/staff-nav";
import { requireUserAndProfile } from "@/lib/auth";

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const auth = await requireUserAndProfile();

  const role = auth.profile.role;
  const isStaffRole = role === "SACCO_STAFF" || role === "SACCO_MANAGER";
  if (!isStaffRole || !auth.profile.sacco) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--gradient-brand-mesh)] text-[color:var(--color-foreground-inverse,#f8fafc)] transition-colors duration-300 bg-nyungwe text-neutral-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--color-foreground-inverse,#f8fafc)]/70">
              SACCO+ staff console
            </p>
            <div>
              <h1 className="text-3xl font-semibold text-[color:var(--color-foreground-inverse,#f8fafc)]">
                {auth.profile.sacco?.name ?? "Operations"}
              </h1>
              <p className="text-sm text-[color:var(--color-foreground-inverse,#f8fafc)]/70">
                Logged in as {auth.user.email ?? auth.user.phone ?? auth.user.id}
              </p>
            </div>
            <div className="flex flex-col gap-2 text-right lg:items-end">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">
                Native automation
              </p>
              <Link
                href="/settings/sms-ingestion"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-50 transition hover:bg-emerald-500/20"
              >
                SMS hand-off guide ↗
              </Link>
            </div>
          </div>
          <StaffNav />
        </header>
        <main className="rounded-3xl border border-[color:var(--color-border-subtle,rgba(255,255,255,0.12))] bg-[color:var(--surface-glass-strong,rgba(255,255,255,0.08))] p-6 shadow-glass backdrop-blur border-white/10 bg-white/5">
          {children}
        </main>
      </div>
    </div>
  );
}
