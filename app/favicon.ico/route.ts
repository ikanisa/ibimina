import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  const redirectUrl = new URL("/icons/icon.svg", request.url);
  return NextResponse.redirect(redirectUrl, 308);
}
