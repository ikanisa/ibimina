import { redirect } from "next/navigation";
import { redirectIfAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated();

  const mfaMode = typeof searchParams?.mfa === "string" ? searchParams?.mfa : Array.isArray(searchParams?.mfa) ? searchParams?.mfa[0] : undefined;
  if (mfaMode === "1") {
    redirect("/mfa");
  }

  // Client-only translation hook cannot run here; render static fallbacks.
  return (
    <section className="space-y-6 text-center">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">SACCO+</h1>
        <p className="text-sm text-neutral-2">Sign in to manage Umurenge SACCO operations.</p>
      </header>
      <LoginForm />
    </section>
  );
}
