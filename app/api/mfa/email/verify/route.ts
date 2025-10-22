import { NextRequest, NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import { verifyEmailOtp } from "@/lib/mfa";

type Payload = {
  code?: string;
};

export async function POST(request: NextRequest) {
  const { user } = await requireUserAndProfile();
  const body = (await request.json().catch(() => null)) as Payload | null;
  const code = body?.code?.trim();

  if (!code) {
    return NextResponse.json({ error: "code_required" }, { status: 400 });
  }

  const result = await verifyEmailOtp(user.id, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 401 });
  }

  return NextResponse.json({ success: true, expiresAt: result.expiresAt });
}

