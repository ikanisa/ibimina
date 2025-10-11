import { NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import { deletePasskeyCredential } from "@/lib/mfa/passkeys";
import { logAudit } from "@/lib/audit";

interface Params {
  credentialId: string;
}

export async function DELETE(_request: Request, context: { params: Params }) {
  const { user } = await requireUserAndProfile();
  const credentialId = context.params?.credentialId;

  if (!credentialId) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  try {
    const removed = await deletePasskeyCredential(user.id, credentialId);
    if (!removed) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    await logAudit({
      action: "MFA_PASSKEY_DELETED",
      entity: "USER",
      entityId: user.id,
      diff: { credentialId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete passkey", error);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
