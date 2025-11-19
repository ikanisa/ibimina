import { NextRequest, NextResponse } from "next/server";
import { pollQrAuthSession } from "@/lib/qr-auth/service";

export async function POST(req: NextRequest) {
  try {
    const { token } = (await req.json()) ?? {};

    if (!token) {
      return NextResponse.json({ success: false, error: "missing_token" }, { status: 400 });
    }

    const result = await pollQrAuthSession({ token });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "poll_failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
