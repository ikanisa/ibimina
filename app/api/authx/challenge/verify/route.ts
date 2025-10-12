import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/authx/session";
import { audit } from "@/lib/authx/audit";
import { consumeBackup } from "@/lib/authx/backup";
import {
  issueSessionCookies,
  verifyEmailOtp,
  verifyPasskey,
  verifyTotp,
  verifyWhatsAppOtp,
  type PasskeyVerificationPayload,
} from "@/lib/authx/verify";

const bodySchema = z.object({
  factor: z.enum(["passkey", "totp", "email", "whatsapp", "backup"]),
  token: z.string().optional(),
  trustDevice: z.boolean().optional(),
});

const parsePasskeyPayload = (value: string | undefined): PasskeyVerificationPayload | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as PasskeyVerificationPayload;
  } catch (jsonError) {
    try {
      const decoded = Buffer.from(value, "base64").toString("utf8");
      return JSON.parse(decoded) as PasskeyVerificationPayload;
    } catch (base64Error) {
      console.error("authx.passkey payload parse failed", jsonError, base64Error);
      return null;
    }
  }
};

export async function POST(request: Request) {
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
    let verified = false;
    let usedBackup = false;
    let rememberDevice = data.trustDevice ?? false;

    if (data.factor === "passkey") {
      const payload = parsePasskeyPayload(data.token);
      if (!payload) {
        return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
      }
      const result = await verifyPasskey({ id: user.id }, payload);
      verified = result.ok;
      rememberDevice = result.ok ? result.rememberDevice ?? rememberDevice : rememberDevice;
    } else if (data.factor === "totp") {
      if (!data.token) {
        return NextResponse.json({ error: "token_required" }, { status: 400 });
      }
      const result = await verifyTotp({ id: user.id }, data.token);
      verified = result.ok;
    } else if (data.factor === "email") {
      if (!data.token) {
        return NextResponse.json({ error: "token_required" }, { status: 400 });
      }
      const result = await verifyEmailOtp({ id: user.id }, data.token);
      verified = result.ok;
    } else if (data.factor === "whatsapp") {
      if (!data.token) {
        return NextResponse.json({ error: "token_required" }, { status: 400 });
      }
      const result = await verifyWhatsAppOtp({ id: user.id }, data.token);
      verified = result.ok;
    } else if (data.factor === "backup") {
      if (!data.token) {
        return NextResponse.json({ error: "token_required" }, { status: 400 });
      }
      usedBackup = await consumeBackup(user.id, data.token);
      verified = usedBackup;
    }

    if (!verified) {
      await audit(user.id, "MFA_FAILED", { factor: data.factor });
      return NextResponse.json({ error: "invalid_or_expired" }, { status: 401 });
    }

    await audit(user.id, usedBackup ? "MFA_BACKUP_SUCCESS" : "MFA_SUCCESS", { factor: data.factor });
    await issueSessionCookies(user.id, rememberDevice);

    return NextResponse.json({ ok: true, factor: data.factor, usedBackup });
  } catch (error) {
    console.error("authx.challenge.verify", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
