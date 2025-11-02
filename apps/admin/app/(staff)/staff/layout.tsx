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
    <div className="min-h-screen bg-nyungwe text-neutral-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">SACCO+ staff console</p>
            <h1 className="text-3xl font-semibold text-white">
              {auth.profile.sacco?.name ?? "Operations"}
            </h1>
            <p className="text-sm text-white/70">
              Logged in as{" "}
              {auth.profile.user.email ?? auth.profile.user.phone ?? auth.profile.user.id}
            </p>
          </div>
          <StaffNav />
        </header>
        <main className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glass backdrop-blur">
          {children}
        </main>
      </div>
    </div>
  );
}
