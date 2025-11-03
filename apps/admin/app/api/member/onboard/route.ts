import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const onboardSchema = z.object({
  whatsapp_msisdn: z.string().min(5, "WhatsApp number is required"),
  momo_msisdn: z.string().min(5, "MoMo number is required"),
  ocr_json: z
    .object({
      name: z.string().nullable().optional(),
      idNumber: z.string().nullable().optional(),
      dob: z.string().nullable().optional(),
      sex: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  preferred_language: z.string().trim().toLowerCase().min(2).max(5).optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  // Member app tables are optional; use untyped client to accommodate missing local schema

  const legacyClient = supabase as any;
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("Failed to validate auth", authError);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const payload = onboardSchema.safeParse(json);

  if (!payload.success) {
    return NextResponse.json({ error: payload.error.flatten() }, { status: 400 });
  }

  const data = payload.data;
  const now = new Date().toISOString();

  const updatePayload = {
    whatsapp_msisdn: data.whatsapp_msisdn,
    momo_msisdn: data.momo_msisdn,
    ocr_json: data.ocr_json ?? null,
    id_number: data.ocr_json?.idNumber ?? null,
    lang: data.preferred_language ?? null,
    updated_at: now,
  };

  const { data: existing, error: existingError } = await legacyClient
    .from("members_app_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to load existing profile", existingError);
    return NextResponse.json({ error: "Unable to complete onboarding" }, { status: 500 });
  }

  if (existing) {
    const { error } = await legacyClient
      .from("members_app_profiles")
      .update(updatePayload)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to update profile", error);
      return NextResponse.json({ error: "Unable to update profile" }, { status: 500 });
    }
  } else {
    const insertPayload = {
      user_id: user.id,
      whatsapp_msisdn: data.whatsapp_msisdn,
      momo_msisdn: data.momo_msisdn,
      ocr_json: data.ocr_json ?? null,
      id_number: data.ocr_json?.idNumber ?? null,
      lang: data.preferred_language ?? null,
      created_at: now,
      updated_at: now,
    };
    const { error } = await legacyClient.from("members_app_profiles").insert(insertPayload);

    if (error) {
      console.error("Failed to create profile", error);
      return NextResponse.json({ error: "Unable to create profile" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
