import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/observability/logger";
import crypto from "node:crypto";
import { supabaseSrv } from "@/lib/supabase/server";

/**
 * Generate a QR challenge for device-bound authentication
 *
 * POST /api/device-auth/challenge
 *
 * Creates a short-lived challenge that the mobile app will scan and sign.
 * The challenge includes session_id, nonce, origin, and expiry.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseSrv();

    // Get the origin from request headers or config
    const origin =
      req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://admin.ibimina.rw";

    // Generate unique identifiers
    const sessionId = crypto.randomUUID();
    const nonce = crypto.randomBytes(16).toString("hex"); // 128-bit random

    // Set expiry (60 seconds from now)
    const expiresAt = new Date(Date.now() + 60 * 1000);
    const exp = Math.floor(expiresAt.getTime() / 1000);

    // Create challenge payload
    const challengeData = {
      ver: 1,
      session_id: sessionId,
      origin,
      nonce,
      exp,
      aud: "web-login",
    };

    // Get client IP and user agent for audit
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Store challenge in database
    const { data: challenge, error } = await (supabase as any)
      .from("device_auth_challenges")
      .insert({
        session_id: sessionId,
        nonce,
        origin,
        challenge_data: challengeData,
        expires_at: expiresAt.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (error) {
      logError("Failed to create challenge:", error);
      return NextResponse.json(
        { error: "Failed to create authentication challenge" },
        { status: 500 }
      );
    }

    // Log audit event
    await (supabase as any).from("device_auth_audit").insert({
      event_type: "CHALLENGE_CREATED",
      challenge_id: challenge.id,
      success: true,
      metadata: {
        ip_address: ipAddress,
        user_agent: userAgent,
        origin,
      },
    });

    // Return challenge data for QR encoding
    return NextResponse.json({
      success: true,
      challenge: challengeData,
      session_id: sessionId,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    logError("Challenge creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
