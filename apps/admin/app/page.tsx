import { redirect } from "next/navigation";
import { requireUserAndProfile } from "@/lib/auth";
import type { ProfileRow } from "@/lib/auth";

const DASHBOARD_ROLES = new Set<ProfileRow["role"]>(["SYSTEM_ADMIN", "SACCO_MANAGER"]);

export const runtime = "nodejs";

export default async function HomePage() {
  const { profile } = await requireUserAndProfile();

  if (DASHBOARD_ROLES.has(profile.role)) {
    redirect("/dashboard");
  }

  redirect("/staff/onboarding");
}
