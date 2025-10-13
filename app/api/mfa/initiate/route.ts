import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserAndProfile } from "@/lib/auth";
import { initiateFactor, type Factor } from "@/src/auth/factors";

const schema = z.object({
  factor: z.enum(["totp", "email", "backup", "whatsapp", "passkey"]),
});

export async function POST(request: Request) {
  const { user, profile } = await requireUserAndProfile();

  if (!profile.mfa_enabled) {
    return NextResponse.json({ error: "mfa_not_enabled" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_factor", issues: parsed.error.flatten() }, { status: 400 });
  }

  const factor = parsed.data.factor as Factor;
  const result = await initiateFactor({
    factor,
    userId: user.id,
    email: user.email,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code, ...(result.payload ?? {}) },
      { status: result.status },
    );
  }

  return NextResponse.json({ success: true, ...(result.payload ?? {}) });
}
