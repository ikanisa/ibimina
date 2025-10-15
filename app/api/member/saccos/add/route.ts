import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const addSchema = z.object({ saccoId: z.string().uuid("Invalid SACCO id") });

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("Failed to validate auth", authError);
    return NextResponse.json({ error: "Auth failure" }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const payload = addSchema.safeParse(json);

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const { saccoId } = payload.data;

  const insertPayload: Database["public"]["Tables"]["user_saccos"]["Insert"] = {
    user_id: user.id,
    sacco_id: saccoId,
  };

  const { error } = await supabase
    .from("user_saccos")
    .upsert(insertPayload as never, { onConflict: "user_id,sacco_id" });

  if (error) {
    console.error("Failed to add SACCO", error);
    return NextResponse.json({ error: "Unable to add SACCO" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
