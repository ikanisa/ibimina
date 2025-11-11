import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { fetchCurrentUser, updatePreferredLocale } from "@ibimina/data-access";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface ProfileData {
  id: string;
  fullName: string | null;
  primaryMsisdn: string | null;
  whatsappMsisdn: string | null;
  momoMsisdn: string | null;
  locale: string | null;
  referenceToken: string | null;
  createdAt: string | null;
}

export async function loadProfile(): Promise<ProfileData | null> {
  const supabase = await createSupabaseServerClient();
  const currentUser = await fetchCurrentUser(supabase);

  if (!currentUser) {
    return null;
  }

  const { data, error } = await supabase
    .from("member_profiles_public")
    .select(
      "id, full_name, primary_msisdn, whatsapp_msisdn, momo_msisdn, locale, reference_token, created_at"
    )
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) {
    console.error("Failed to load member profile", error);
    return {
      id: currentUser.id,
      fullName: currentUser.fullName,
      primaryMsisdn: currentUser.primaryMsisdn,
      whatsappMsisdn: currentUser.primaryMsisdn,
      momoMsisdn: currentUser.primaryMsisdn,
      locale: currentUser.locale,
      referenceToken: currentUser.referenceToken,
      createdAt: currentUser.createdAt,
    };
  }

  const row = data?.[0] as
    | (Database["public"]["Views"]["member_profiles_public"]["Row"] & { id: string })
    | undefined;

  if (!row) {
    return {
      id: currentUser.id,
      fullName: currentUser.fullName,
      primaryMsisdn: currentUser.primaryMsisdn,
      whatsappMsisdn: currentUser.primaryMsisdn,
      momoMsisdn: currentUser.primaryMsisdn,
      locale: currentUser.locale,
      referenceToken: currentUser.referenceToken,
      createdAt: currentUser.createdAt,
    };
  }

  return {
    id: row.id ?? currentUser.id,
    fullName: row.full_name ?? currentUser.fullName,
    primaryMsisdn: row.primary_msisdn ?? currentUser.primaryMsisdn,
    whatsappMsisdn: row.whatsapp_msisdn ?? currentUser.primaryMsisdn,
    momoMsisdn: row.momo_msisdn ?? currentUser.primaryMsisdn,
    locale: row.locale ?? currentUser.locale,
    referenceToken: row.reference_token ?? currentUser.referenceToken,
    createdAt: row.created_at ?? currentUser.createdAt,
  };
}

const localeSchema = z.object({
  locale: z.string().min(2).max(10),
});

export async function updateLocaleAction(formData: FormData) {
  "use server";

  const parsed = localeSchema.safeParse({ locale: formData.get("locale") });
  if (!parsed.success) {
    return { success: false, error: "Invalid locale" } as const;
  }

  const supabase = await createSupabaseServerClient();
  await updatePreferredLocale(supabase, parsed.data.locale);
  revalidatePath("/profile");
  return { success: true } as const;
}
