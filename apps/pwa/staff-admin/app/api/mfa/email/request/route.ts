import { NextResponse } from "next/server";
import { requireUserAndProfile } from "@/lib/auth";
import { issueEmailOtp } from "@/lib/mfa";

export async function POST() {
  const { user } = await requireUserAndProfile();

  if (!user.email) {
    return NextResponse.json({ error: "email_missing" }, { status: 400 });
  }

  const result = await issueEmailOtp(user.id, user.email);

  if (result.status === "rate_limited") {
    return NextResponse.json(
      {
        error: "rate_limited",
        retryAt: result.retryAt.toISOString(),
        reason: result.reason,
      },
      { status: 429 }
    );
  }

  return NextResponse.json({ success: true, expiresAt: result.expiresAt, channel: "EMAIL" });
}
