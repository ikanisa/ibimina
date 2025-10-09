import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuditPayload = {
  action: string;
  entity: string;
  entityId: string;
  diff?: Record<string, unknown> | null;
};

export const logAudit = async ({ action, entity, entityId, diff }: AuditPayload) => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("audit_logs").insert({
    action,
    entity,
    entity_id: entityId,
    diff_json: diff ?? null,
    actor_id: user?.id ?? "00000000-0000-0000-0000-000000000000",
  });

  if (error) {
    console.error("Failed to insert audit log", error);
  }
};
