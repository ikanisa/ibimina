import { NextResponse } from "next/server";
import { env } from "@/src/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    buildId: env.NEXT_PUBLIC_BUILD_ID ?? env.VERCEL_GIT_COMMIT_SHA ?? "local-dev",
    region: env.VERCEL_REGION ?? null,
    timestamp: new Date().toISOString(),
  });
}
