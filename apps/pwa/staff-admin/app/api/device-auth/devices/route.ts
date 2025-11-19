import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/observability/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserAndProfile } from "@/lib/auth";

/**
 * List user's registered devices
 *
 * GET /api/device-auth/devices
 */
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const auth = await getUserAndProfile();

    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Fetch user's devices
    const { data: devices, error } = await (supabase as any)
      .from("device_auth_keys")
      .select(
        "id, device_id, device_label, key_algorithm, device_info, integrity_status, created_at, last_used_at, revoked_at"
      )
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logError("Failed to fetch devices:", error);
      return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      devices: devices || [],
    });
  } catch (error) {
    logError("Error fetching devices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Revoke a device
 *
 * DELETE /api/device-auth/devices?device_id=xxx
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const auth = await getUserAndProfile();

    if (!auth) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const deviceId = req.nextUrl.searchParams.get("device_id");

    if (!deviceId) {
      return NextResponse.json({ error: "Missing device_id parameter" }, { status: 400 });
    }

    // Fetch the device to verify ownership
    const { data: device, error: fetchError } = await (supabase as any)
      .from("device_auth_keys")
      .select("*")
      .eq("id", deviceId)
      .single();

    if (fetchError || !device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    // Verify ownership
    if (device.user_id !== auth.user.id) {
      return NextResponse.json({ error: "Unauthorized to revoke this device" }, { status: 403 });
    }

    // Check if already revoked
    if (device.revoked_at) {
      return NextResponse.json({ error: "Device already revoked" }, { status: 409 });
    }

    // Revoke the device
    const { error: revokeError } = await (supabase as any)
      .from("device_auth_keys")
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by: auth.user.id,
        revocation_reason: "User-initiated revocation",
      })
      .eq("id", deviceId);

    if (revokeError) {
      logError("Failed to revoke device:", revokeError);
      return NextResponse.json({ error: "Failed to revoke device" }, { status: 500 });
    }

    // Log audit event
    await (supabase as any).from("device_auth_audit").insert({
      event_type: "DEVICE_REVOKED",
      user_id: auth.user.id,
      device_key_id: device.id,
      success: true,
      metadata: {
        revoked_by: auth.user.id,
        reason: "User-initiated revocation",
        device_label: device.device_label,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Device revoked successfully",
    });
  } catch (error) {
    logError("Error revoking device:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
