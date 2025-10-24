import { redirectIfAuthenticated } from "@/lib/auth";
import AdminLoginForm from "@/components/auth/admin-login-form";

export const metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  await redirectIfAuthenticated("/admin");
  return <AdminLoginForm />;
}
