import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QrScannerPage } from "@/components/auth/qr-scanner-page";

/**
 * QR Scanner for Web Login
 * 
 * Staff members can scan QR codes displayed on the web dashboard
 * to authenticate using their mobile device with biometric authentication.
 */
export default async function ScanLoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <section className="space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-12">Scan to Login</h1>
        <p className="text-sm text-neutral-11">
          Scan the QR code on your computer to sign in with biometric authentication
        </p>
      </header>
      <QrScannerPage />
    </section>
  );
}
