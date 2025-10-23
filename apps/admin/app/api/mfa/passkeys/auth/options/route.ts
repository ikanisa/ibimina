import { NextRequest, NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import { createAuthenticationOptions } from "@/lib/mfa/passkeys";

type Payload = {
  rememberDevice?: boolean;
};

export async function POST(request: NextRequest) {
  const { user } = await requireUserAndProfile();
  const body = (await request.json().catch(() => null)) as Payload | null;
  const rememberDevice = Boolean(body?.rememberDevice);

  try {
    const { options, stateToken } = await createAuthenticationOptions(user, rememberDevice);
    return NextResponse.json({ options, stateToken });
  } catch (error) {
    console.warn("Passkey auth options failed", error);
    return NextResponse.json({ error: "no_credentials" }, { status: 400 });
  }
}
