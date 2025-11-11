import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/observability/logger";
import { supabaseSrv } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    const supabase = supabaseSrv();

    const { data: challenge, error } = await (supabase as any)
      .from("device_auth_challenges")
      .select("*, verified_by_device")
      .eq("session_id", sessionId)
      .single();

    if (error || !challenge) {
      return NextResponse.json({ success: false, verified: false });
    }

    if (!challenge.used_at || !challenge.verified_by_device) {
      return NextResponse.json({ success: false, verified: false });
    }

    const { data: deviceKey } = await (supabase as any)
      .from("device_auth_keys")
      .select("user_id, device_id, device_label")
      .eq("id", challenge.verified_by_device)
      .single();

    if (!deviceKey) {
      return NextResponse.json({ success: false, verified: false });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      user_id: deviceKey.user_id,
      device_id: deviceKey.device_id,
      device_label: deviceKey.device_label,
      session_id: sessionId,
    });
  } catch (error) {
    logError("Verify status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
