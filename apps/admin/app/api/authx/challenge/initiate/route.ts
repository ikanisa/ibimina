import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/authx/session";
import { startPasskeyChallenge, sendEmailOtp, sendWhatsAppOtp } from "@/lib/authx/start";

const bodySchema = z.object({
  factor: z.enum(["passkey", "totp", "email", "whatsapp"]),
  rememberDevice: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    if (data.factor === "passkey") {
      const result = await startPasskeyChallenge({ id: user.id });
      return NextResponse.json({ factor: "passkey", ...result });
    }

    if (data.factor === "email") {
      const result = await sendEmailOtp({ id: user.id, email: user.email });
      if (!result.sent) {
        return NextResponse.json({ error: result.error ?? "send_failed" }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    if (data.factor === "whatsapp") {
      const result = await sendWhatsAppOtp({ id: user.id });
      if (!result.sent) {
        return NextResponse.json({ error: result.error ?? "send_failed" }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    // TOTP and other local factors do not require initiation
    return NextResponse.json({ ok: true, factor: data.factor });
  } catch (error) {
    console.error("authx.challenge.initiate", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
