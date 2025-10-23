import { NextRequest, NextResponse } from "next/server";
import { verifyTotp } from "@/lib/mfa/crypto";
import { preventTotpReplay } from "@/src/auth/limits";
import { verifyOneTimeCode } from "@/src/auth/util/crypto";

function disabled() {
  return NextResponse.json({ error: "not_found" }, { status: 404 });
}

export async function POST(request: NextRequest) {
  if (process.env.AUTH_E2E_STUB !== "1") {
    return disabled();
  }

  type VerifyState = {
    totpSecret?: string | null;
    lastStep?: number | null;
    backupHashes?: string[] | null;
  } | null | undefined;

  type VerifyBody = {
    factor?: string;
    token?: string;
    userId?: string;
    plaintextTotpSecret?: string;
    state?: VerifyState;
  };

  let body: VerifyBody = {};
  try {
    body = (await request.json()) as unknown as VerifyBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const factor = String(body?.factor ?? "");
  const token = String(body?.token ?? "");
  const userId = String(body?.userId ?? "");

  if (!factor || !token || !userId) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  if (factor === "totp") {
    const secret: string | undefined = body?.plaintextTotpSecret ?? body?.state?.totpSecret ?? undefined;
    if (!secret) {
      return NextResponse.json({ ok: false, error: "missing_totp_secret" }, { status: 400 });
    }

    const result = verifyTotp(secret, token);
    if (!result.ok || typeof result.step !== "number") {
      return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 401 });
    }

    if (!preventTotpReplay(userId, result.step)) {
      return NextResponse.json({ ok: false, code: "REPLAY_BLOCKED" }, { status: 401 });
    }

    return NextResponse.json({ ok: true, factor: "totp", step: result.step });
  }

  if (factor === "backup") {
    const normalized = token.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    const backupHashes: string[] = Array.isArray(body?.state?.backupHashes)
      ? (body!.state!.backupHashes as string[])
      : [];
    const index = backupHashes.findIndex((hash) => verifyOneTimeCode(normalized, hash));
    if (index === -1) {
      return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 401 });
    }
    const nextBackupHashes = [...backupHashes];
    nextBackupHashes.splice(index, 1);
    return NextResponse.json({ ok: true, factor: "backup", nextBackupHashes });
  }

  return NextResponse.json({ ok: false, error: "unsupported_factor" }, { status: 400 });
}
