"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/*
 * Original MFA step-up UI preserved for future restoration.
 *
 * import { AuthxLoginForm } from "@/components/auth/authx-login-form";
 * import { OptimizedImage } from "@/components/ui/optimized-image";
 * import { useTranslation } from "@/providers/i18n-provider";
 *
 * export default function SmartMFA() {
 *   const { t } = useTranslation();
 *
 *   return (
 *     <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 p-6 text-neutral-0">
 *       ...
 *     </section>
 *   );
 * }
 */

export default function SmartMFA() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
