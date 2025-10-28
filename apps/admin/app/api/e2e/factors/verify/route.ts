import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyFactor, type FactorState } from "@/src/auth/factors";
import { encryptTotpSecret } from "@/src/auth/util/crypto";

const payloadSchema = z.object({
  factor: z.enum(["totp", "backup", "email", "whatsapp", "passkey"] as const),
  token: z.string().min(1),
  userId: z.string().min(1),
  email: z.string().email().optional(),
  plaintextTotpSecret: z.string().min(1).optional(),
  rememberDevice: z.boolean().optional(),
  state: z
    .object({
      totpSecret: z.string().nullable().optional(),
      lastStep: z.number().nullable().optional(),
      backupHashes: z.array(z.string()).optional(),
    })
    .optional(),
});

function e2eEnabled() {
  return process.env.AUTH_E2E_STUB === "1";
}

export async function POST(request: NextRequest) {
  if (!e2eEnabled()) {
    return NextResponse.json({ ok: false, error: "e2e_stub_disabled" }, { status: 404 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const state: FactorState = {
    totpSecret: null,
    lastStep: null,
    backupHashes: [],
  };

  if (parsed.data.state?.totpSecret ?? null) {
    state.totpSecret = parsed.data.state?.totpSecret ?? null;
  }
  if (typeof parsed.data.state?.lastStep !== "undefined") {
    state.lastStep = parsed.data.state?.lastStep ?? null;
  }
  if (parsed.data.state?.backupHashes) {
    state.backupHashes = parsed.data.state.backupHashes;
  }

  if (parsed.data.plaintextTotpSecret) {
    try {
      state.totpSecret = encryptTotpSecret(parsed.data.plaintextTotpSecret);
    } catch (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "secret_encryption_failed",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  }

  const result = await verifyFactor({
    factor: parsed.data.factor,
    token: parsed.data.token,
    userId: parsed.data.userId,
    email: parsed.data.email ?? null,
    state,
    rememberDevice: parsed.data.rememberDevice,
  });

  return NextResponse.json(result, { status: result.status });
}
