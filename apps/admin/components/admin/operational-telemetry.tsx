import { useTranslation } from "@/providers/i18n-provider";
import { MetricCard } from "@ibimina/ui";

type TelemetryMetric = {
  event: string;
  total: number;
  last_occurred: string | null;
  meta: Record<string, unknown> | null;
};

type MetricAccent = "blue" | "yellow" | "green" | "neutral";

function getMetricMeta(event: string, t: (k: string, f?: string) => string): { title: string; desc: string; accent: MetricAccent } {
  switch (event) {
    case "sms_ingested":
      return { title: t("admin.telemetry.events.smsIngested", "SMS ingested"), desc: t("admin.telemetry.desc.smsIngested", "Messages captured from the GSM modem."), accent: "blue" };
    case "sms_duplicates":
      return { title: t("admin.telemetry.events.smsDuplicates", "SMS duplicates"), desc: t("admin.telemetry.desc.smsDuplicates", "Potential duplicates blocked from posting."), accent: "yellow" };
    case "sms_reprocessed":
      return { title: t("admin.telemetry.events.smsReprocessed", "SMS reprocessed"), desc: t("admin.telemetry.desc.smsReprocessed", "Messages retried after review or automation."), accent: "blue" };
    case "statement_imported":
      return { title: t("admin.telemetry.events.statementImported", "Statements imported"), desc: t("admin.telemetry.desc.statementImported", "Rows parsed via the MoMo statement wizard."), accent: "green" };
    case "members_imported":
      return { title: t("admin.telemetry.events.membersImported", "Members imported"), desc: t("admin.telemetry.desc.membersImported", "Roster entries synced through secure import."), accent: "green" };
    case "payment_action":
      return { title: t("admin.telemetry.events.paymentAction", "Payments applied"), desc: t("admin.telemetry.desc.paymentAction", "Ledger actions triggered from reconciliation."), accent: "green" };
    case "recon_escalations":
      return { title: t("admin.telemetry.events.reconEscalations", "Recon escalations"), desc: t("admin.telemetry.desc.reconEscalations", "Pending deposits escalated for follow-up."), accent: "yellow" };
    case "sms_flagged":
      return { title: t("admin.telemetry.events.smsFlagged", "SMS flagged"), desc: t("admin.telemetry.desc.smsFlagged", "Messages awaiting manual review."), accent: "yellow" };
    default:
      return { title: event, desc: t("admin.telemetry.unmapped", "Unmapped event."), accent: "blue" };
  }
}

interface OperationalTelemetryProps {
  metrics: TelemetryMetric[];
}

export function OperationalTelemetry({ metrics }: OperationalTelemetryProps) {
  const { t } = useTranslation();
  const numberFormatter = new Intl.NumberFormat("en-RW");

  if (!metrics.length) {
    return (
      <p className="text-sm text-neutral-2">
        {t("admin.telemetry.empty", "No telemetry recorded yet.")}
      </p>
    );
  }

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString();
  };

  const sorted = [...metrics].sort((a, b) => {
    const weightA = ["sms_ingested","sms_duplicates","sms_reprocessed","statement_imported","members_imported","payment_action","recon_escalations","sms_flagged"].includes(a.event) ? 0 : 1;
    const weightB = ["sms_ingested","sms_duplicates","sms_reprocessed","statement_imported","members_imported","payment_action","recon_escalations","sms_flagged"].includes(b.event) ? 0 : 1;
    if (weightA !== weightB) return weightA - weightB;
    return (b.last_occurred ? new Date(b.last_occurred).getTime() : 0) - (a.last_occurred ? new Date(a.last_occurred).getTime() : 0);
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sorted.map((metric) => {
        const meta = getMetricMeta(metric.event, t);
        
        return (
          <div key={metric.event} className="space-y-1">
            <MetricCard
              label={meta.title}
              value={numberFormatter.format(metric.total ?? 0)}
              accent={meta.accent}
              trend={
                <span className="text-neutral-2">
                  {t("admin.telemetry.lastOccurred", "Last occurred ")}{formatDate(metric.last_occurred)}
                </span>
              }
            />
            <p className="px-4 text-xs text-neutral-2">{meta.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
