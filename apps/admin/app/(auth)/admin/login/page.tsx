import { redirect } from "next/navigation";

/*
 * Original secure admin login page retained for reference.
 *
 * import { redirectIfAuthenticated } from "@/lib/auth";
 * import AdminLoginForm from "@/components/auth/admin-login-form";
 *
 * export const metadata = {
 *   title: "Admin Login",
 * };
 *
 * export default async function AdminLoginPage() {
 *   await redirectIfAuthenticated("/admin");
 *   return <AdminLoginForm />;
 * }
 */

export const metadata = {
  title: "Admin Login (disabled)",
};

export default function AdminLoginPage() {
  redirect("/dashboard");
}
