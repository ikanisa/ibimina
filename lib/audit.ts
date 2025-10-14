import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError } from "@/lib/observability/logger";

let createClient = createSupabaseServerClient;
let emitError = logError;

/**
 * Overrides the Supabase client factory used by {@link logAudit}. Primarily for tests.
 */
export function configureAuditClientFactory(factory?: typeof createSupabaseServerClient) {
  createClient = factory ?? createSupabaseServerClient;
}

/**
 * Overrides the logger used when audit writes fail. Primarily for tests.
 */
export function configureAuditErrorLogger(loggerFn?: typeof logError) {
  emitError = loggerFn ?? logError;
}

type AuditPayload = {
  action: string;
  entity: string;
  entityId: string;
  diff?: Record<string, unknown> | null;
};

export const logAudit = async ({ action, entity, entityId, diff }: AuditPayload) => {
  const supabase = await createClient();
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
    emitError("audit_log_write_failed", { action, entity, entityId, error });
  }
};
