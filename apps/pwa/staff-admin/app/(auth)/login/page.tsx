import { EmailLoginForm } from "@/components/auth/email-login-form";
import { redirectIfAuthenticated } from "@/lib/auth/service";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <section className="mx-auto flex max-w-lg flex-col gap-8 rounded-2xl border border-neutral-6 bg-neutral-1 p-8 shadow-lg">
      <header className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-9">Ibimina Staff</p>
        <h1 className="text-2xl font-semibold text-neutral-12">Sign in with your email</h1>
        <p className="text-sm text-neutral-10">
          We will send a short-lived login link to your work inbox. No password required.
        </p>
      </header>

      <EmailLoginForm />
    </section>
  );
}
