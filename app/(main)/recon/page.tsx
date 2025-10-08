import { GradientHeader } from "@/components/ui/gradient-header";
import { GlassCard } from "@/components/ui/glass-card";
import { StatusChip } from "@/components/common/status-chip";
import { StatementImportWizard } from "@/components/ikimina/statement-import-wizard";
import { ReconciliationTable } from "@/components/recon/reconciliation-table";
import { SmsInboxPanel } from "@/components/recon/sms-inbox-panel";
import { requireUserAndProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { BilingualText } from "@/components/common/bilingual-text";

const EXCEPTION_STATUSES = ["UNALLOCATED", "PENDING", "REJECTED"] as const;

const parseSmsJson = (value: Database["public"]["Tables"]["sms_inbox"]["Row"]["parsed_json"]): Record<string, unknown> | null => {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch (error) {
      console.warn("Unable to parse SMS JSON string", error);
    }
  }
  return null;
};

export default async function ReconciliationPage() {
  const { profile } = await requireUserAndProfile();
  const supabase = await createSupabaseServerClient();

  type ExceptionRow = Database["public"]["Tables"]["payments"]["Row"] & {
    source: Pick<Database["public"]["Tables"]["sms_inbox"]["Row"], "raw_text" | "parsed_json" | "msisdn" | "received_at"> | null;
  };

  let query = supabase
    .from("payments")
    .select("id, sacco_id, ikimina_id, member_id, msisdn, reference, amount, occurred_at, status, source:sms_inbox(raw_text, parsed_json, msisdn, received_at)")
    .in("status", EXCEPTION_STATUSES)
    .order("occurred_at", { ascending: false })
    .limit(50);

  if (profile.role !== "SYSTEM_ADMIN" && profile.sacco_id) {
    query = query.eq("sacco_id", profile.sacco_id);
  }

  const { data, error } = await query.returns<ExceptionRow[]>();

  if (error) {
    throw error;
  }

  type SmsRow = Pick<Database["public"]["Tables"]["sms_inbox"]["Row"], "id" | "raw_text" | "parsed_json" | "msisdn" | "received_at" | "status" | "confidence" | "error">;

  let smsQuery = supabase
    .from("sms_inbox")
    .select("id, raw_text, parsed_json, msisdn, received_at, status, confidence, error")
    .order("received_at", { ascending: false })
    .limit(60);

  if (profile.role !== "SYSTEM_ADMIN" && profile.sacco_id) {
    smsQuery = smsQuery.eq("sacco_id", profile.sacco_id);
  }

  const { data: smsEntries, error: smsError } = await smsQuery.returns<SmsRow[]>();

  if (smsError) {
    throw smsError;
  }

  const smsPanelItems = (smsEntries ?? []).map((item) => ({
    id: item.id,
    raw_text: item.raw_text,
    parsed_json: parseSmsJson(item.parsed_json),
    msisdn: item.msisdn,
    received_at: item.received_at,
    status: item.status ?? "UNPARSED",
    confidence: item.confidence,
    error: item.error ?? null,
  }));

  return (
    <div className="space-y-8">
      <GradientHeader
        title={<BilingualText primary="Reconciliation" secondary="Guhuza konti" />}
        subtitle={
          <BilingualText
            primary="Resolve unknown references, duplicates, and mismatched deposits to keep ledgers clean."
            secondary="Kuraho amakosa mu makuru y'imishinga, wemeze ko konti zose zihuje neza."
            secondaryClassName="text-xs text-ink/70"
          />
        }
        badge={<StatusChip tone="warning">{(data ?? []).length} pending</StatusChip>}
      />

      <GlassCard
        title={<BilingualText primary="MoMo statement ingest" secondary="Kuzana raporo za MoMo" />}
        subtitle={
          <BilingualText
            primary="Apply validation masks, review parser feedback, and ingest clean deposits."
            secondary="Shyiraho igenzura, usome ibisubizo bya sisitemu, kandi winjize imisanzu isukuye."
            secondaryClassName="text-xs text-neutral-3"
          />
        }
        actions={
          profile.sacco_id ? (
            <StatementImportWizard saccoId={profile.sacco_id} variant="momo" />
          ) : undefined
        }
      >
        {profile.sacco_id ? (
          <div className="space-y-2 text-sm text-neutral-2">
            <p>
              <BilingualText
                primary="Drag-and-drop MTN CSV exports. The wizard normalises Kigali timestamps, phone numbers, and amounts automatically."
                secondary="Kurura dosiye za MTN CSV, umufasha akazihindura igihe cya Kigali, za nimero na z'amafaranga mu buryo bwikora."
                secondaryClassName="text-xs text-neutral-3"
              />
            </p>
            <p>
              <BilingualText
                primary="Parser feedback highlights duplicates, missing references, and invalid rows before anything is posted."
                secondary="Ibisubizo bya sisitemu bigaragaza ibyasubiyemo, uko amakuru abura n'imirongo ituzuye mbere yo kwinjiza mu bubiko."
                secondaryClassName="text-xs text-neutral-3"
              />
            </p>
            <p>
              <BilingualText
                primary="Only validated rows reach Supabase; duplicates and bad records are held back for manual follow-up."
                secondary="Imirongo yemejwe ni yo yonyine igera kuri Supabase; ibyasubiyemo n'amakuru atari yo bigumishwa kugira ngo bisuzumwe n'abakozi."
                secondaryClassName="text-xs text-neutral-3"
              />
            </p>
          </div>
        ) : (
          <p className="text-sm text-neutral-2">
            <BilingualText
              primary="Assign yourself to a SACCO to enable statement ingestion."
              secondary="Iyandikishe kuri SACCO kugira ngo ushobore kwakira raporo."
              secondaryClassName="text-xs text-neutral-3"
            />
          </p>
        )}
      </GlassCard>

      <GlassCard
        title={<BilingualText primary="SMS inbox" secondary="Ubutumwa bwa SMS" />}
        subtitle={
          <BilingualText
            primary="Latest MoMo SMS messages captured by the gateway and ready for parsing."
            secondary="Ubutumwa bwa MoMo bwakiriwe, bwiteguye gusesengurwa."
            secondaryClassName="text-xs text-neutral-3"
          />
        }
      >
        <SmsInboxPanel items={smsPanelItems} />
      </GlassCard>

      <GlassCard
        title={<BilingualText primary="Exceptions" secondary="Ibibazo byabonetse" />}
        subtitle={
          <BilingualText
            primary="Recent issues surfaced by the parser."
            secondary="Ibibazo byagaragaye ubwo hasesengurwaga ubutumwa."
            secondaryClassName="text-xs text-neutral-3"
          />
        }
      >
        <ReconciliationTable rows={data ?? []} saccoId={profile.sacco_id} />
      </GlassCard>
    </div>
  );
}
