import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const audit = async (actor: string | null, action: string, detail: Record<string, unknown> = {}) => {
  const supabase = createSupabaseAdminClient();
  const payload = {
    actor,
    action,
    detail,
  };

  const { error } = await supabase.schema("authx").from("audit").insert(payload);
  if (error) {
    console.error("authx.audit failed", error);
  }
};
