import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

export const audit = async (actor: string | null, action: string, detail: Record<string, unknown> = {}) => {
  const supabase = createSupabaseAdminClient();
  const payload = {
    actor,
    action,
    detail: detail as Json,
  };

  const admin = supabase as unknown as {
    schema: (name: string) => {
      from: (table: string) => { insert: (values: typeof payload) => Promise<{ error: unknown }> };
    };
  };

  const { error } = await admin.schema("authx").from("audit").insert(payload);
  if (error) {
    console.error("authx.audit failed", error);
  }
};
