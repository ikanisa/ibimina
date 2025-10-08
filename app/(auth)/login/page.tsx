import { redirectIfAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <section className="space-y-6 text-center">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Injira mu Ibimina Staff</h1>
        <p className="text-sm text-neutral-2">
          Sign in with your staff credentials to manage Umurenge SACCO ibimina operations.
        </p>
      </header>
      <LoginForm />
    </section>
  );
}
