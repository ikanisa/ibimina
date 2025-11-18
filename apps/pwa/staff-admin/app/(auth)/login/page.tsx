import { EmailLoginForm } from "@/components/auth/email-login-form";

export default function LoginPage() {
  return (
    <section className="space-y-8">
      <header className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-kigali">Ibimina Staff Console</p>
        <h1 className="text-3xl font-semibold">Sign in with your work email</h1>
        <p className="text-sm text-neutral-200">
          Use your SACCO+ staff credentials to continue to the admin panel. Multi-factor prompts
          follow after email login.
        </p>
      </header>

      <EmailLoginForm />
    </section>
  );
}
