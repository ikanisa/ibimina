import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { encryptTotpSecret } from "@/src/auth/util/crypto";
import { verifyFactor } from "@/src/auth/factors";

const requestSchema = z.object({
  factor: z.enum(["totp", "email", "whatsapp", "backup", "passkey"]),
  token: z.string().optional(),
  userId: z.string().uuid(),
  email: z.string().email().optional().nullable(),
  rememberDevice: z.boolean().optional(),
  state: z
    .object({
      totpSecret: z.string().nullable().optional(),
      lastStep: z.number().nullable().optional(),
      backupHashes: z.array(z.string()).optional(),
    })
    .optional(),
  plaintextTotpSecret: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (process.env.AUTH_E2E_STUB !== "1") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let parsed: z.infer<typeof requestSchema>;
  try {
    parsed = requestSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json({ error: "invalid_payload", message: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }

  const baseState = parsed.state ?? {};
  const state = { ...baseState } as typeof baseState;
  if (parsed.plaintextTotpSecret) {
    state.totpSecret = encryptTotpSecret(parsed.plaintextTotpSecret);
  }

  const result = await verifyFactor({
    factor: parsed.factor,
    token: parsed.token,
    userId: parsed.userId,
    email: parsed.email,
    rememberDevice: parsed.rememberDevice,
    state,
  });

  return NextResponse.json(result, { status: result.status });
}
