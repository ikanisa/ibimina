import { notFound } from "next/navigation";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IkiminaSettingsEditor } from "@/components/ikimina/ikimina-settings-editor";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SettingsPage({ params }: PageProps) {
  const { id } = await params;
  const { profile } = await requireUserAndProfile();
  const supabase = await createSupabaseServerClient();

  const { data: group, error } = await supabase
    .from("ibimina")
    .select("id, sacco_id, name, settings_json")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!group) {
    notFound();
  }

  if (profile.role !== "SYSTEM_ADMIN" && profile.sacco_id && profile.sacco_id !== group.sacco_id) {
    notFound();
  }

  const { data: historyRows } = await supabase
    .from("audit_logs")
    .select("id, action, created_at, diff_json, actor_id")
    .eq("entity", "ibimina")
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  const typedHistory = (historyRows ?? []) as Array<{
    id: string;
    action: string;
    created_at: string | null;
    diff_json: Record<string, unknown> | null;
    actor_id: string | null;
  }>;

  const actorIds = Array.from(new Set(typedHistory.map((row) => row.actor_id).filter((value): value is string => Boolean(value))));
  let actorMap = new Map<string, string | null>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("users")
      .select("id, email")
      .in("id", actorIds);
    if (actors) {
      actorMap = new Map(actors.map((row: { id: string; email: string | null }) => [row.id, row.email]));
    }
  }

  const history = typedHistory.map((row) => ({
    id: row.id,
    action: row.action,
    actorLabel: row.actor_id ? actorMap.get(row.actor_id) ?? row.actor_id : "System",
    createdAt: row.created_at ?? new Date().toISOString(),
    diff: (row.diff_json as Record<string, unknown> | null) ?? null,
  }));

  return (
    <IkiminaSettingsEditor
      ikiminaId={group.id}
      ikiminaName={group.name}
      saccoId={group.sacco_id}
      initialSettings={group.settings_json as Record<string, unknown> | null}
      history={history}
    />
  );
}
