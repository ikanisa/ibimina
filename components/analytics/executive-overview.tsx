"use client";

import { BilingualText } from "@/components/common/bilingual-text";
import type { ExecutiveAnalyticsSnapshot, RiskLevel } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat("en-RW", {
  style: "currency",
  currency: "RWF",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-RW");

const riskTone: Record<RiskLevel, string> = {
  HIGH: "bg-red-500/20 text-red-200 border border-red-400/60",
  MEDIUM: "bg-amber-500/20 text-amber-100 border border-amber-300/60",
  LOW: "bg-emerald-500/15 text-emerald-100 border border-emerald-300/40",
};

interface ExecutiveOverviewProps {
  analytics: ExecutiveAnalyticsSnapshot;
}

function AutomationSummary({ analytics }: ExecutiveOverviewProps) {
  const cards = [
    {
      label: "Pending reconciliation",
      secondary: "Imisanzu igikeneye gusobanurwa",
      value: analytics.automation.pendingRecon,
    },
    {
      label: "Queued notifications",
      secondary: "Ubutumwa butegereje koherezwa",
      value: analytics.automation.pendingNotifications,
    },
    {
      label: "Escalations triggered",
      secondary: "Ibihutirijwe byashinzwe gukurikiranwa",
      value: analytics.automation.escalations,
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent p-4 shadow-glass backdrop-blur"
        >
          <BilingualText
            primary={card.label}
            secondary={card.secondary}
            className="text-sm font-semibold text-neutral-0"
            secondaryClassName="text-[11px] text-neutral-2"
          />
          <p className="mt-2 text-2xl font-bold text-neutral-0">{numberFormatter.format(card.value)}</p>
        </article>
      ))}
    </div>
  );
}

function MonthlyTrend({ analytics }: ExecutiveOverviewProps) {
  if (!analytics.monthlyTrend.length) {
    return (
      <p className="text-sm text-neutral-2">
        <BilingualText
          primary="No deposits recorded in the past six months."
          secondary="Nta misanzu yanditswe mu mezi atandatu ashize."
          secondaryClassName="text-xs text-neutral-3"
        />
      </p>
    );
  }

  const max = Math.max(...analytics.monthlyTrend.map((entry) => entry.total), 1);

  return (
    <div className="space-y-3">
      {analytics.monthlyTrend.map((entry) => (
        <div key={entry.monthKey} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-neutral-2">
            <span>{entry.label}</span>
            <span>{currency.format(entry.total)}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-300/80 to-sky-300/80"
              style={{ width: `${Math.max(6, Math.round((entry.total / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SaccoLeaders({ analytics }: ExecutiveOverviewProps) {
  if (!analytics.saccoLeaders.length) {
    return (
      <p className="text-sm text-neutral-2">
        <BilingualText
          primary="No SACCO contribution data yet."
          secondary="Nta makuru y'umusanzu wa SACCO arahari."
          secondaryClassName="text-xs text-neutral-3"
        />
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-sm text-neutral-0">
        <thead className="bg-white/5 text-left uppercase tracking-[0.25em] text-[11px] text-neutral-2">
          <tr>
            <th className="px-4 py-3">SACCO</th>
            <th className="px-4 py-3 text-right">Deposits</th>
            <th className="px-4 py-3 text-right">Unallocated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-white/5 text-xs">
          {analytics.saccoLeaders.map((leader) => (
            <tr key={leader.saccoId ?? "all"}>
              <td className="px-4 py-3 font-medium text-neutral-0">{leader.saccoName}</td>
              <td className="px-4 py-3 text-right">{currency.format(leader.total)}</td>
              <td className="px-4 py-3 text-right text-amber-200">{currency.format(leader.unallocated)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RiskSignals({ analytics }: ExecutiveOverviewProps) {
  if (!analytics.riskSignals.length) {
    return (
      <p className="text-sm text-neutral-2">
        <BilingualText
          primary="All ikimina have contributed in the last month."
          secondary="Amatsinda yose yatanze umusanzu mu kwezi gushize."
          secondaryClassName="text-xs text-neutral-3"
        />
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {analytics.riskSignals.map((signal) => (
        <article
          key={signal.ikiminaId}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs shadow-inner backdrop-blur"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-neutral-0">{signal.name}</p>
              {signal.saccoName && <p className="text-[11px] text-neutral-2">{signal.saccoName}</p>}
            </div>
            <span className={cn("rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.3em]", riskTone[signal.risk])}>
              {signal.risk} · {signal.risk === "HIGH" ? "Kibazo" : signal.risk === "MEDIUM" ? "Icyitonderwa" : "Bimeze neza"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-neutral-2">
            <BilingualText
              primary={`Last contribution ${signal.daysSince} days ago`}
              secondary={`Umusanzu uheruka: iminsi ${signal.daysSince} ishize`}
              secondaryClassName="text-[10px]"
            />
          </p>
        </article>
      ))}
    </div>
  );
}

export function ExecutiveOverview({ analytics }: ExecutiveOverviewProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <header>
          <BilingualText
            primary="Automation summary"
            secondary="Igenzura rya automatike"
            className="text-lg font-semibold text-neutral-0"
            secondaryClassName="text-sm text-neutral-2"
          />
        </header>
        <AutomationSummary analytics={analytics} />
      </section>

      <section className="space-y-4">
        <header>
          <BilingualText
            primary="Deposit momentum"
            secondary="Umuvuduko w'umusanzu"
            className="text-lg font-semibold text-neutral-0"
            secondaryClassName="text-sm text-neutral-2"
          />
        </header>
        <MonthlyTrend analytics={analytics} />
      </section>

      <section className="space-y-4">
        <header>
          <BilingualText
            primary="SACCO leaders"
            secondary="SACCO ziyoboye"
            className="text-lg font-semibold text-neutral-0"
            secondaryClassName="text-sm text-neutral-2"
          />
        </header>
        <SaccoLeaders analytics={analytics} />
      </section>

      <section className="space-y-4">
        <header>
          <BilingualText
            primary="Risk signals"
            secondary="Ibimenyetso by'ibibazo"
            className="text-lg font-semibold text-neutral-0"
            secondaryClassName="text-sm text-neutral-2"
          />
        </header>
        <RiskSignals analytics={analytics} />
      </section>
    </div>
  );
}
