import { redirect } from "next/navigation";

/*
 * Authentication UI temporarily disabled. Original implementation preserved below
 * for quick restoration when secure login flows return.
 *
 * import Link from "next/link";
 * import { redirectIfAuthenticated } from "@/lib/auth";
 * import { LoginForm } from "@/components/auth/login-form";
 * import { Smartphone } from "lucide-react";
 *
 * type SearchParams = { [key: string]: string | string[] | undefined };
 *
 * interface LoginPageProps {
 *   searchParams?: SearchParams | Promise<SearchParams>;
 * }
 *
 * export default async function LoginPage({ searchParams }: LoginPageProps) {
 *   await redirectIfAuthenticated();
 *
 *   const resolvedSearchParams = searchParams ? await searchParams : undefined;
 *   const rawMfaParam = resolvedSearchParams?.mfa;
 *   const mfaMode =
 *     typeof rawMfaParam === "string"
 *       ? rawMfaParam
 *       : Array.isArray(rawMfaParam)
 *         ? rawMfaParam[0]
 *         : undefined;
 *   if (mfaMode === "1") {
 *     redirect("/mfa");
 *   }
 *
 *   return (
 *     <section className="space-y-6 text-center">
 *       <header className="space-y-2">
 *         <h1 className="text-2xl font-semibold">SACCO+</h1>
 *         <p className="text-sm text-neutral-2">Sign in to manage Umurenge SACCO operations.</p>
 *       </header>
 *       <LoginForm />
 *       <div className="relative my-6">
 *         <div className="absolute inset-0 flex items-center">
 *           <div className="w-full border-t border-neutral-6"></div>
 *         </div>
 *         <div className="relative flex justify-center text-sm">
 *           <span className="bg-neutral-1 px-4 text-neutral-11">Or</span>
 *         </div>
 *       </div>
 *       <Link
 *         href="/device-login"
 *         className="inline-flex items-center gap-2 rounded-lg border-2 border-atlas-blue bg-atlas-blue/5 px-6 py-3 text-sm font-medium text-atlas-blue transition-colors hover:bg-atlas-blue/10"
 *       >
 *         <Smartphone className="h-5 w-5" />
 *         Sign in with Biometric Authentication
 *       </Link>
 *     </section>
 *   );
 * }
 */

export default function LoginPage() {
  redirect("/dashboard");
}
