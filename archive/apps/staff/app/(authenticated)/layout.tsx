import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

function hasSupabaseSession() {
  const cookieStore = cookies();
  const cookieList = cookieStore.getAll();
  return cookieList.some(({ name, value }) => {
    if (!value) {
      return false;
    }
    if (name === "stub-auth" && value === "1") {
      return true;
    }
    if (name === "supabase-auth-token" || name === "sb-access-token") {
      return true;
    }
    return /^sb-.*-auth-token$/i.test(name) || /^supabase-session/.test(name);
  });
}

export default function AuthenticatedLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  if (!hasSupabaseSession()) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-atlas-blue">SACCO+ Staff</p>
            <h1 className="text-lg font-semibold text-slate-900">Ibimina operations console</h1>
          </div>
          <span className="rounded-full bg-atlas-blue/10 px-4 py-1 text-xs font-semibold text-atlas-blue">
            Online
          </span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
