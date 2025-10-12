import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/authx/session";
import { listUserFactors } from "@/lib/authx/factors";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  try {
    const factors = await listUserFactors(user.id);
    return NextResponse.json(factors);
  } catch (error) {
    console.error("authx.factors.list", error);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
