import { redirect } from "next/navigation";
import { redirectIfAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

type SearchParams = { [key: string]: string | string[] | undefined };

interface LoginPageProps {
  searchParams?: SearchParams | Promise<SearchParams>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawMfaParam = resolvedSearchParams?.mfa;
  const mfaMode =
    typeof rawMfaParam === "string"
      ? rawMfaParam
      : Array.isArray(rawMfaParam)
        ? rawMfaParam[0]
        : undefined;
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
