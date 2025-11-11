import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUserAndProfile } from "@/lib/auth";
import { initiateFactor, type Factor } from "@/src/auth/factors";
import { applyRateLimit } from "@/src/auth/limits";
import { recordMfaAudit } from "@/src/auth/audit";
import { hashRateLimitKey } from "@/src/auth/util/crypto";

const schema = z.object({
  factor: z.enum(["totp", "email", "backup", "whatsapp", "passkey"]),
});

export async function POST(request: NextRequest) {
  const { user, profile } = await requireUserAndProfile();

  if (!profile.mfa_enabled) {
    return NextResponse.json({ error: "mfa_not_enabled" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_factor", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const factor = parsed.data.factor as Factor;

  const headerList = await headers();
  const forwarded =
    headerList.get("x-forwarded-for") ??
    headerList.get("x-real-ip") ??
    headerList.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    null;
  const ip = forwarded?.split(",")[0]?.trim() ?? null;
  const hashedIp = ip ? hashRateLimitKey("ip", ip) : null;

  const respondRateLimited = async (scope: "user" | "ip", retryAt: Date | null) => {
    await recordMfaAudit("MFA_RATE_LIMITED", user.id, {
      scope,
      channel: factor.toUpperCase(),
      retryAt: retryAt ? retryAt.toISOString() : null,
      hashedIp,
    });

    return NextResponse.json(
      {
        error: "rate_limited",
        scope,
        retryAt: retryAt ? retryAt.toISOString() : undefined,
      },
      { status: 429 }
    );
  };

  const userLimit = await applyRateLimit(`mfa-init:${user.id}:${factor}`, {
    maxHits: 4,
    windowSeconds: 90,
  });

  if (!userLimit.ok) {
    return respondRateLimited("user", userLimit.retryAt ?? null);
  }

  if (ip) {
    const ipLimit = await applyRateLimit(`mfa-init-ip:${factor}:${ip}`, {
      maxHits: 12,
      windowSeconds: 90,
    });

    if (!ipLimit.ok) {
      return respondRateLimited("ip", ipLimit.retryAt ?? null);
    }
  }

  const result = await initiateFactor({
    factor,
    userId: user.id,
    email: user.email,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code, ...(result.payload ?? {}) },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true, ...(result.payload ?? {}) });
}
