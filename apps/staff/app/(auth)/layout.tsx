import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        {children}
      </div>
    </main>
  );
}
