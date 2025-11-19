import { NextRequest, NextResponse } from "next/server";
import { createQrAuthSession } from "@/lib/qr-auth/service";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent");

    const session = await createQrAuthSession({ ip, userAgent });

    return NextResponse.json({ success: true, ...session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "session_create_failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
