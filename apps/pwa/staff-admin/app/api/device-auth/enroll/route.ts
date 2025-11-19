import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserAndProfile } from "@/lib/auth";
import { logError, logInfo } from "@/lib/observability/logger";

/**
 * Enroll a new device for device-bound authentication
 *
 * POST /api/device-auth/enroll
 *
 * Body: {
 *   device_id: string (unique identifier from Android),
 *   device_label: string (user-friendly name),
 *   public_key: string (PEM format),
 *   key_algorithm: "ES256" | "Ed25519",
 *   device_info: {
 *     model: string,
 *     manufacturer: string,
 *     os_version: string,
 *     app_version: string
 *   },
 *   integrity_token?: string (Play Integrity API token)
 * }
 *
 * Requires authenticated user session.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const auth = await getUserAndProfile();

    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { device_id, device_label, public_key, key_algorithm, device_info, integrity_token } =
      body;

    // Validate required fields
    if (!device_id || !public_key || !key_algorithm) {
      return NextResponse.json(
        { error: "Missing required fields: device_id, public_key, key_algorithm" },
        { status: 400 }
      );
    }

    // Validate algorithm
    if (!["ES256", "Ed25519"].includes(key_algorithm)) {
      return NextResponse.json(
        { error: "Invalid key_algorithm. Must be ES256 or Ed25519" },
        { status: 400 }
      );
    }

    // Validate public key format (basic check)
    if (!public_key.includes("BEGIN PUBLIC KEY")) {
      return NextResponse.json(
        { error: "Invalid public key format. Must be PEM format" },
        { status: 400 }
      );
    }

    // Verify Play Integrity token if provided
    let integrityStatus: any = null;
    let integrityVerdict: string | null = null;

    if (integrity_token) {
      integrityStatus = await verifyPlayIntegrity(integrity_token);
      integrityVerdict = integrityStatus?.meets_device_integrity
        ? "MEETS_DEVICE_INTEGRITY"
        : "FAILED";
    }

    // Check if device already exists for this user
    const { data: existingDevice } = await (supabase as any)
      .from("device_auth_keys")
      .select("id, device_label, revoked_at")
      .eq("user_id", auth.user.id)
      .eq("device_id", device_id)
      .single();

    if (existingDevice && !existingDevice.revoked_at) {
      // Device already enrolled and not revoked
      return NextResponse.json(
        {
          error: "Device already enrolled",
          device_id: existingDevice.id,
          device_label: existingDevice.device_label,
        },
        { status: 409 }
      );
    }

    // If device was previously revoked, we'll create a new entry
    // (Old entry remains for audit trail)

    // Create new device key entry
    const { data: deviceKey, error: insertError } = await (supabase as any)
      .from("device_auth_keys")
      .insert({
        user_id: auth.user.id,
        device_id,
        device_label: device_label || `Device ${device_id.slice(0, 8)}`,
        public_key,
        key_algorithm,
        device_info,
        integrity_verdict: integrityStatus,
        integrity_status: integrityVerdict,
        last_integrity_check_at: integrity_token ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      logError("deviceAuth.enroll.insert_failed", {
        error: insertError,
        deviceId: device_id,
        userId: user.id,
      });
      return NextResponse.json({ error: "Failed to enroll device" }, { status: 500 });
    }

    // Log audit event
    await (supabase as any).from("device_auth_audit").insert({
      event_type: "DEVICE_ENROLLED",
      user_id: auth.user.id,
      device_key_id: deviceKey.id,
      success: true,
      metadata: {
        device_info,
        integrity_provided: !!integrity_token,
        integrity_status: integrityVerdict,
        ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
      },
    });

    if (integrityStatus) {
      await (supabase as any).from("device_auth_audit").insert({
        event_type: integrityStatus?.meets_device_integrity
          ? "INTEGRITY_CHECK_PASSED"
          : "INTEGRITY_CHECK_FAILED",
        user_id: auth.user.id,
        device_key_id: deviceKey.id,
        success: integrityStatus?.meets_device_integrity || false,
        metadata: {
          integrity_status: integrityStatus,
        },
      });
    }

    return NextResponse.json({
      success: true,
      device: {
        id: deviceKey.id,
        device_id: deviceKey.device_id,
        device_label: deviceKey.device_label,
        key_algorithm: deviceKey.key_algorithm,
        created_at: deviceKey.created_at,
        integrity_status: integrityVerdict,
      },
      message: "Device enrolled successfully",
    });
  } catch (error) {
    logError("deviceAuth.enroll.unhandled_error", { error });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
  logInfo("deviceAuth.enroll.play_integrity_mock", { token });

  return {
    meets_device_integrity: true,
    meets_basic_integrity: true,
    device_recognition_verdict: "MEETS_DEVICE_INTEGRITY",
    app_licensing_verdict: "LICENSED",
  };
}
