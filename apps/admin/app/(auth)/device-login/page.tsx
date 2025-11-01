import { redirect } from "next/navigation";
import { redirectIfAuthenticated } from "@/lib/auth";
import { DeviceLoginPage } from "@/components/auth/device-login-page";

export default async function BiometricLoginPage() {
  await redirectIfAuthenticated();

  return (
    <section className="space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-12">SACCO+ Staff Portal</h1>
        <p className="text-sm text-neutral-11">
          Sign in securely using your Staff Mobile App
        </p>
      </header>
      <DeviceLoginPage />
    </section>
  );
}
