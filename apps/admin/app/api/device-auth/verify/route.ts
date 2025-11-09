import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { supabaseSrv } from "@/lib/supabase/server";
import { logError, logInfo, logWarn } from "@/lib/observability/logger";

/**
 * Verify device-signed challenge
 *
 * POST /api/device-auth/verify
 *
 * Body: {
 *   session_id: string,
 *   device_id: string,
 *   signature: string (base64),
 *   signed_message: object,
 *   integrity_token?: string
 * }
 *
 * Verifies the signature from a registered device and upgrades the session.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseSrv();
    const body = await req.json();

    const { session_id, device_id, signature, signed_message, integrity_token } = body;

    // Validate required fields
    if (!session_id || !device_id || !signature || !signed_message) {
      return NextResponse.json(
        { error: "Missing required fields: session_id, device_id, signature, signed_message" },
        { status: 400 }
      );
    }

    // 1. Fetch the challenge
    const { data: challenge, error: challengeError } = await (supabase as any)
      .from("device_auth_challenges")
      .select("*")
      .eq("session_id", session_id)
      .single();

    if (challengeError || !challenge) {
      await logAuditEvent(supabase, "CHALLENGE_FAILED", null, null, null, {
        reason: "Challenge not found",
        session_id,
      });

      return NextResponse.json({ error: "Invalid or expired challenge" }, { status: 404 });
    }

    // 2. Check if challenge is already used
    if (challenge.used_at) {
      await logAuditEvent(supabase, "CHALLENGE_FAILED", null, null, challenge.id, {
        reason: "Challenge already used (replay attack)",
        session_id,
      });

      return NextResponse.json({ error: "Challenge already used" }, { status: 409 });
    }

    // 3. Check if challenge is expired
    if (new Date(challenge.expires_at) < new Date()) {
      await logAuditEvent(supabase, "CHALLENGE_FAILED", null, null, challenge.id, {
        reason: "Challenge expired",
        session_id,
      });

      return NextResponse.json({ error: "Challenge expired" }, { status: 410 });
    }

    // 4. Fetch device public key
    const { data: deviceKey, error: deviceError } = await (supabase as any)
      .from("device_auth_keys")
      .select("*")
      .eq("device_id", device_id)
      .is("revoked_at", null)
      .single();

    if (deviceError || !deviceKey) {
      await logAuditEvent(supabase, "CHALLENGE_FAILED", null, null, challenge.id, {
        reason: "Device not found or revoked",
        device_id,
      });

      return NextResponse.json(
        { error: "Device not registered or has been revoked" },
        { status: 403 }
      );
    }

    // 5. Validate signed message structure
    const requiredFields = [
      "ver",
      "user_id",
      "device_id",
      "session_id",
      "origin",
      "nonce",
      "ts",
      "scope",
      "alg",
    ];
    const missingFields = requiredFields.filter((field) => !(field in signed_message));

    if (missingFields.length > 0) {
      await logAuditEvent(
        supabase,
        "CHALLENGE_FAILED",
        deviceKey.user_id,
        deviceKey.id,
        challenge.id,
        {
          reason: "Invalid signed message structure",
          missing_fields: missingFields,
        }
      );

      return NextResponse.json(
        { error: `Invalid signed message: missing fields ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // 6. Verify message fields match challenge
    if (signed_message.session_id !== session_id) {
      await logAuditEvent(
        supabase,
        "CHALLENGE_FAILED",
        deviceKey.user_id,
        deviceKey.id,
        challenge.id,
        {
          reason: "Session ID mismatch",
        }
      );

      return NextResponse.json({ error: "Session ID mismatch" }, { status: 400 });
    }

    if (signed_message.nonce !== challenge.nonce) {
      await logAuditEvent(
        supabase,
        "CHALLENGE_FAILED",
        deviceKey.user_id,
        deviceKey.id,
        challenge.id,
        {
          reason: "Nonce mismatch",
        }
      );

      return NextResponse.json({ error: "Nonce mismatch" }, { status: 400 });
    }

    if (signed_message.origin !== challenge.origin) {
      await logAuditEvent(
        supabase,
        "CHALLENGE_FAILED",
        deviceKey.user_id,
        deviceKey.id,
        challenge.id,
        {
          reason: "Origin mismatch (possible phishing attempt)",
          expected: challenge.origin,
          received: signed_message.origin,
        }
      );

      return NextResponse.json({ error: "Origin mismatch" }, { status: 400 });
    }

    if (signed_message.device_id !== device_id) {
      await logAuditEvent(
        supabase,
        "CHALLENGE_FAILED",
        deviceKey.user_id,
        deviceKey.id,
        challenge.id,
        {
          reason: "Device ID mismatch",
        }
      );

      return NextResponse.json({ error: "Device ID mismatch" }, { status: 400 });
    }

    // 7. Verify timestamp is recent (within 2 minutes of challenge creation)
    const challengeTime = new Date(challenge.created_at).getTime();
    const signedTime = signed_message.ts * 1000; // Convert to milliseconds
    const timeDiff = Math.abs(signedTime - challengeTime);

    if (timeDiff > 120 * 1000) {
      // 2 minutes
      await logAuditEvent(
        supabase,
        "CHALLENGE_FAILED",
        deviceKey.user_id,
        deviceKey.id,
        challenge.id,
        {
          reason: "Timestamp too old or clock skew",
          time_diff_ms: timeDiff,
        }
      );

      return NextResponse.json({ error: "Signature timestamp invalid" }, { status: 400 });
    }

    // 8. Verify cryptographic signature
    const signatureValid = await verifySignature(
      deviceKey.public_key,
      deviceKey.key_algorithm,
      signed_message,
      signature
    );

    if (!signatureValid) {
      await logAuditEvent(
        supabase,
        "CHALLENGE_FAILED",
        deviceKey.user_id,
        deviceKey.id,
        challenge.id,
        {
          reason: "Invalid signature",
        }
      );

      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 9. Verify Play Integrity token (if provided)
    let integrityStatus: any = null;
    if (integrity_token) {
      integrityStatus = await verifyPlayIntegrity(integrity_token);

      // Update device integrity status
      await (supabase as any)
        .from("device_auth_keys")
        .update({
          integrity_verdict: integrityStatus,
          integrity_status: integrityStatus?.meets_device_integrity
            ? "MEETS_DEVICE_INTEGRITY"
            : "FAILED",
          last_integrity_check_at: new Date().toISOString(),
        })
        .eq("id", deviceKey.id);

      // Optionally reject if integrity check fails
      if (!integrityStatus?.meets_device_integrity) {
        await logAuditEvent(
          supabase,
          "INTEGRITY_CHECK_FAILED",
          deviceKey.user_id,
          deviceKey.id,
          challenge.id,
          {
            integrity_status: integrityStatus,
          }
        );

        // For now, we'll log but not reject. In production, you might want to reject.
        logWarn("deviceAuth.verify.integrity_failed", {
          deviceId: deviceKey.id,
          userId: deviceKey.user_id,
        });
      } else {
        await logAuditEvent(
          supabase,
          "INTEGRITY_CHECK_PASSED",
          deviceKey.user_id,
          deviceKey.id,
          challenge.id,
          {
            integrity_status: integrityStatus,
          }
        );
      }
    }

    // 10. Mark challenge as used
    await (supabase as any)
      .from("device_auth_challenges")
      .update({
        used_at: new Date().toISOString(),
        verified_by_device: deviceKey.id,
      })
      .eq("id", challenge.id);

    // 11. Update device last_used_at
    await (supabase as any)
      .from("device_auth_keys")
      .update({
        last_used_at: new Date().toISOString(),
      })
      .eq("id", deviceKey.id);

    // 12. Log successful verification
    await logAuditEvent(
      supabase,
      "CHALLENGE_VERIFIED",
      deviceKey.user_id,
      deviceKey.id,
      challenge.id,
      {
        ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        integrity_provided: !!integrity_token,
        integrity_passed: integrityStatus?.meets_device_integrity,
      }
    );

    // 13. Create authenticated session for the user
    // This would typically involve setting a session cookie or JWT
    // For now, we'll return success with user info

    return NextResponse.json({
      success: true,
      user_id: deviceKey.user_id,
      device_id: deviceKey.device_id,
      device_label: deviceKey.device_label,
      session_id,
      message: "Authentication successful",
    });
  } catch (error) {
    logError("deviceAuth.verify.unhandled_error", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Verify cryptographic signature
 */
async function verifySignature(
  publicKeyPem: string,
  algorithm: string,
  message: any,
  signatureBase64: string
): Promise<boolean> {
  try {
    // Canonicalize message (deterministic JSON)
    const messageJson = JSON.stringify(message, Object.keys(message).sort());
    const messageBuffer = Buffer.from(messageJson, "utf-8");
    const signatureBuffer = Buffer.from(signatureBase64, "base64");

    // Import public key
    const publicKey = crypto.createPublicKey({
      key: publicKeyPem,
      format: "pem",
    });

    if (algorithm === "ES256") {
      // EC P-256 with SHA-256 (streaming verify)
      const verifier = crypto.createVerify("SHA256");
      verifier.update(messageBuffer);
      verifier.end();
      return verifier.verify(publicKey, signatureBuffer);
    }

    if (algorithm === "Ed25519") {
      // Node's Ed25519 API uses one-shot verify
      return crypto.verify(null, messageBuffer, publicKey, signatureBuffer);
    }

    throw new Error(`Unsupported algorithm: ${algorithm}`);
  } catch (error) {
    logError("deviceAuth.verify.signature_error", { error });
    return false;
  }
}

/**
 * Verify Play Integrity API token
 *
 * In production, this should call Google's Play Integrity API
 * For now, we'll return a mock result
 */
async function verifyPlayIntegrity(token: string): Promise<any> {
  // TODO: Implement actual Play Integrity verification
  // See: https://developer.android.com/google/play/integrity/verdict

  // Mock implementation for development
  logInfo("deviceAuth.verify.play_integrity_mock", { token });

  return {
    meets_device_integrity: true,
    meets_basic_integrity: true,
    device_recognition_verdict: "MEETS_DEVICE_INTEGRITY",
    app_licensing_verdict: "LICENSED",
  };
}

/**
 * Log audit event
 */
async function logAuditEvent(
  supabase: any,
  eventType: string,
  userId: string | null,
  deviceKeyId: string | null,
  challengeId: string | null,
  metadata: any
): Promise<void> {
  await (supabase as any).from("device_auth_audit").insert({
    event_type: eventType,
    user_id: userId,
    device_key_id: deviceKeyId,
    challenge_id: challengeId,
    success: eventType.includes("VERIFIED") || eventType.includes("PASSED"),
    failure_reason: metadata.reason || null,
    metadata,
  });
}
