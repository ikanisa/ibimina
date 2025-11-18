import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ibimina Staff — Sign in",
};

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerAuthSession();
  if (session?.user) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-slate-900 to-neutral-900 text-neutral-50">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-12">
        <div className="w-full space-y-8 rounded-3xl border border-white/5 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  );
}
