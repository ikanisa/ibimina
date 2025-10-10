import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

type TelemetryMetric = {
  event: string;
  total: number;
  last_occurred: string | null;
  meta: Record<string, unknown> | null;
};

const METRIC_LABELS: Record<
  string,
  {
    primary: string;
    secondary: string;
    description: string;
    secondaryDescription: string;
    accent?: "blue" | "green" | "amber";
  }
> = {
  sms_ingested: {
    primary: "SMS ingested",
    secondary: "Ubutumwa bwakiriwe",
    description: "Messages captured from the GSM modem.",
    secondaryDescription: "Ubutumwa bwinjiye bivuye kuri modem GSM.",
    accent: "blue",
  },
  sms_duplicates: {
    primary: "SMS duplicates",
    secondary: "Ubutumwa bwisubiyemo",
    description: "Potential duplicates blocked from posting.",
    secondaryDescription: "Ubutumwa bwagaragaye kabiri bukumirwa kubyemezwa.",
    accent: "amber",
  },
  sms_reprocessed: {
    primary: "SMS reprocessed",
    secondary: "Ubutumwa bwongeye gusobanurwa",
    description: "Messages retried after review or automation.",
    secondaryDescription: "Ubutumwa bwongeye gusuzumwa nyuma yo kugenzurwa.",
    accent: "blue",
  },
  statement_imported: {
    primary: "Statements imported",
    secondary: "Raporo zinjiye",
    description: "Rows parsed via the MoMo statement wizard.",
    secondaryDescription: "Imbata zinjiye ukoresheje wizard ya MoMo.",
    accent: "green",
  },
  members_imported: {
    primary: "Members imported",
    secondary: "Abanyamuryango yinjiye",
    description: "Roster entries synced through secure import.",
    secondaryDescription: "Urutonde rw'abanyamuryango rwinjiye binyuze mu buryo bwizewe.",
    accent: "green",
  },
  payment_action: {
    primary: "Payments applied",
    secondary: "Imisanzu yatunganijwe",
    description: "Ledger actions triggered from reconciliation.",
    secondaryDescription: "Ibikorwa by'ibaruramari byavuye mu guhuzwa.",
    accent: "green",
  },
  recon_escalations: {
    primary: "Recon escalations",
    secondary: "Ibyakomeje mu guhuzwa",
    description: "Pending deposits escalated for follow-up.",
    secondaryDescription: "Imisanzu itarashyingurwa yashyizwe mu rwego rwo gukurikiranwa.",
    accent: "amber",
  },
  sms_flagged: {
    primary: "SMS flagged",
    secondary: "Ubutumwa bwashyizweho ibimenyetso",
    description: "Messages awaiting manual review.",
    secondaryDescription: "Ubutumwa butegereje gusuzumwa n'intoki.",
    accent: "amber",
  },
};

const numberFormatter = new Intl.NumberFormat("en-RW");

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

interface OperationalTelemetryProps {
  metrics: TelemetryMetric[];
}

export function OperationalTelemetry({ metrics }: OperationalTelemetryProps) {
  const { t } = useTranslation();
  if (!metrics.length) {
    return (
      <p className="text-sm text-neutral-2">
        {t("admin.telemetry.empty", "No telemetry recorded yet.")}
      </p>
    );
  }

  const sorted = [...metrics].sort((a, b) => {
    const weightA = METRIC_LABELS[a.event] ? 0 : 1;
    const weightB = METRIC_LABELS[b.event] ? 0 : 1;
    if (weightA !== weightB) return weightA - weightB;
    return (b.last_occurred ? new Date(b.last_occurred).getTime() : 0) - (a.last_occurred ? new Date(a.last_occurred).getTime() : 0);
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sorted.map((metric) => {
        const meta = METRIC_LABELS[metric.event] ?? {
          primary: metric.event,
          secondary: metric.event,
          description: t("admin.telemetry.unmapped", "Unmapped event."),
          secondaryDescription: "",
          accent: "blue" as const,
        };

        const accentClass =
          meta.accent === "green"
            ? "bg-gradient-to-br from-emerald-400/15 to-transparent border-emerald-400/30"
            : meta.accent === "amber"
              ? "bg-gradient-to-br from-amber-300/15 to-transparent border-amber-300/30"
              : "bg-gradient-to-br from-sky-400/15 to-transparent border-sky-400/30";

        return (
          <article
            key={metric.event}
            className={cn(
              "rounded-2xl border bg-white/5 p-4 shadow-glass backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl",
              accentClass,
            )}
          >
            <header className="space-y-1">
              <span className="text-sm font-semibold text-neutral-0">{meta.primary}</span>
              <p className="text-xs text-neutral-2">{meta.description}</p>
            </header>
            <p className="mt-3 text-3xl font-bold text-neutral-0">{numberFormatter.format(metric.total ?? 0)}</p>
            <p className="mt-2 text-xs text-neutral-2">
              <span>{t("admin.telemetry.lastOccurred", "Last occurred ")}{formatDate(metric.last_occurred)}</span>
            </p>
          </article>
        );
      })}
    </div>
  );
}
