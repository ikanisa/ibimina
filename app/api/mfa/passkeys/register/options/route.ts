import { NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import { createRegistrationOptions } from "@/lib/mfa/passkeys";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const { user, profile } = await requireUserAndProfile();
  const body = (await request.json().catch(() => ({}))) as { friendlyName?: string | null };
  const friendlyName = body.friendlyName ?? null;
  const defaultAdminName = process.env.ADMIN_DEFAULT_NAME?.trim() || "System Admin";
  const metadataCandidates = [
    user.user_metadata?.full_name,
    user.user_metadata?.name,
  ].map((value) => (typeof value === "string" ? value.trim() : ""));
  const metadataFullName = metadataCandidates.find((value) => value.length > 0) ?? null;
  const fallbackFullName =
    (typeof user.email === "string" && user.email.trim().length > 0 ? user.email : defaultAdminName);
  const registrationFullName = metadataFullName ?? fallbackFullName;

  const { options, stateToken } = await createRegistrationOptions({
    id: user.id,
    email: user.email,
    full_name: registrationFullName,
  });

  await logAudit({
    action: "MFA_PASSKEY_ENROLLMENT_STARTED",
    entity: "USER",
    entityId: user.id,
    diff: { friendlyName },
  });

  const methodSet = new Set([...(profile.mfa_methods ?? ["EMAIL"])]);
  methodSet.add("EMAIL");
  methodSet.add("PASSKEY");
  if (profile.mfa_enabled) {
    methodSet.add("TOTP");
  }

  return NextResponse.json({
    options,
    stateToken,
    friendlyName,
    methods: Array.from(methodSet),
  });
}
