import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireUserAndProfile } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await requireUserAndProfile();
  if (auth.profile.role !== "SYSTEM_ADMIN") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:py-12">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Admin</p>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold leading-tight">Platform settings</h1>
            <p className="text-sm text-gray-600">
              Manage staff access and the essential controls needed to keep Ibimina running.
            </p>
          </div>
          <AdminNav />
        </header>
        <main className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
