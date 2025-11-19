import { NextRequest, NextResponse } from "next/server";
import { exchangeQrAuthSession } from "@/lib/qr-auth/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, accessToken, refreshToken, deviceId, fingerprint } = body ?? {};

    if (!token || !accessToken || !refreshToken) {
      return NextResponse.json({ success: false, error: "missing_parameters" }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const result = await exchangeQrAuthSession({
      token,
      accessToken,
      refreshToken,
      deviceId,
      fingerprint,
      ip,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "exchange_failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
