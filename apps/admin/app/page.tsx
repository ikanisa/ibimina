import { redirect } from "next/navigation";
import { requireUserAndProfile } from "@/lib/auth";

export default async function Home() {
  const auth = await requireUserAndProfile();
  if (auth.profile.role === "SYSTEM_ADMIN") {
    redirect("/dashboard");
  }
  redirect("/staff/onboarding");
}
