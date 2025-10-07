import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type AnyClient = SupabaseClient<any, any, any>;

interface AuditEntry {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  diff?: Record<string, unknown> | null;
}

const SYSTEM_ACTOR = "00000000-0000-0000-0000-000000000000";

export const writeAuditLog = async (supabase: AnyClient, entry: AuditEntry) => {
  const payload = {
    actor_id: entry.actorId ?? SYSTEM_ACTOR,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId,
    diff_json: entry.diff ?? null,
  };

  const { error } = await supabase.from("audit_logs").insert(payload);

  if (error) {
    console.error("audit log error", error);
  }
};
