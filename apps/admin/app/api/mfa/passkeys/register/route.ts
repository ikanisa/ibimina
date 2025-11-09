import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/observability/logger";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { requireUserAndProfile } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { markPasskeyEnrollment, verifyRegistration } from "@/lib/mfa/passkeys";

type Payload = {
  response: RegistrationResponseJSON;
  stateToken: string;
  friendlyName?: string | null;
};

export async function POST(request: NextRequest) {
  const { user } = await requireUserAndProfile();
  const body = (await request.json().catch(() => null)) as Payload | null;

  if (!body?.response || !body.stateToken) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    const { credential, firstPasskey } = await verifyRegistration(
      user,
      body.response,
      body.stateToken,
      body.friendlyName ?? null
    );
    await markPasskeyEnrollment(user.id, firstPasskey);

    await logAudit({
      action: "MFA_PASSKEY_ENROLLED",
      entity: "USER",
      entityId: user.id,
      diff: {
        credentialId: credential.credential_id,
        deviceType: credential.device_type,
        friendlyName: credential.friendly_name,
      },
    });

    return NextResponse.json({
      success: true,
      credential: {
        id: credential.id,
        label: credential.friendly_name,
        deviceType: credential.device_type,
        lastUsedAt: credential.last_used_at,
      },
    });
  } catch (error) {
    logError("Passkey registration failed", error);
    return NextResponse.json({ error: "registration_failed" }, { status: 400 });
  }
}
