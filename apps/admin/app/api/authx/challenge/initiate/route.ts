import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/observability/logger";
import { z } from "zod";
import { getSessionUser } from "@/lib/authx/session";
import { initiateFactor } from "@/src/auth/factors";

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
    const result = await initiateFactor({
      factor: data.factor,
      userId: user.id,
      email: user.email,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          ...(result.payload ?? {}),
        },
        { status: result.status }
      );
    }

    return NextResponse.json(result.payload ?? { ok: true, factor: data.factor });
  } catch (error) {
    logError("authx.challenge.initiate", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
