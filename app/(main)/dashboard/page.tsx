import type { Route } from "next";
import { GradientHeader } from "@/components/ui/gradient-header";
import { GlassCard } from "@/components/ui/glass-card";
import { KPIStat } from "@/components/dashboard/kpi-stat";
import { QuickAction } from "@/components/dashboard/quick-action";
import { StatusChip } from "@/components/common/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { MissedContributorsList } from "@/components/dashboard/missed-contributors-list";
import { requireUserAndProfile } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/dashboard";
import { BilingualText } from "@/components/common/bilingual-text";
import { TopIkiminaTable } from "@/components/dashboard/top-ikimina-table";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(amount);
}

const quickActions = [
  {
    label: "Create Ikimina",
    description: "Launch a new group with the configured policies.",
    secondaryLabel: "Tangira ikimina",
    secondaryDescription: "Tangira itsinda rishya uko amategeko abiteganya.",
    href: "/ikimina" as Route,
  },
  {
    label: "Import Members",
    description: "Bulk-upload CSV or spreadsheet rosters.",
    secondaryLabel: "Injiza abanyamuryango",
    secondaryDescription: "Kuramo urutonde rw'abanyamuryango mu ikimina.",
    href: "/ikimina" as Route,
  },
  {
    label: "Import Statement",
    description: "Drop MoMo statements for matching and posting.",
    secondaryLabel: "Shyiramo raporo ya MoMo",
    secondaryDescription: "Ohereza raporo za MoMo zisuzumwa.",
    href: "/recon" as Route,
  },
  {
    label: "Go to Reconciliation",
    description: "Review unknown references and exceptions.",
    secondaryLabel: "Jya mu guhuzwa",
    secondaryDescription: "Reba amafaranga atahuye n'abanyamuryango.",
    href: "/recon" as Route,
  },
] as const;

export default async function DashboardPage() {
  const { profile } = await requireUserAndProfile();
  const summary = await getDashboardSummary(profile.role === "SYSTEM_ADMIN" ? null : profile.sacco_id);

  const kpis = [
    { label: "Today's Deposits", value: formatCurrency(summary.totals.today), accent: "blue" as const },
    { label: "Week to Date", value: formatCurrency(summary.totals.week), accent: "yellow" as const },
    { label: "Month to Date", value: formatCurrency(summary.totals.month), accent: "green" as const },
    { label: "Unallocated", value: summary.totals.unallocated.toString(), accent: "neutral" as const },
  ];

  return (
    <div className="space-y-8">
      <GradientHeader
        title={<BilingualText primary="SACCO overview" secondary="Inshamake ya SACCO" />}
        subtitle={
          <BilingualText
            primary="Monitor deposits, member activity, and reconciliation health across your Umurenge SACCO."
            secondary="Kurikira ubwizigame, ibikorwa by'abanyamuryango n'imiterere yo guhuzwa muri SACCO yawe."
            secondaryClassName="text-xs text-ink/70"
          />
        }
        badge={<StatusChip tone="neutral">Staff access</StatusChip>}
      >
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {kpis.map((kpi) => (
            <KPIStat key={kpi.label} label={kpi.label} value={kpi.value} accent={kpi.accent} />
          ))}
        </div>
      </GradientHeader>

      <GlassCard
        title={<BilingualText primary="Quick actions" secondary="Ibikorwa byihuse" />}
        subtitle={
          <BilingualText
            primary="Shave seconds off your daily workflows with the most common tasks."
            secondary="Bika umwanya ukoresha mu bikorwa by'umunsi ku munsi."
            secondaryClassName="text-xs text-neutral-3"
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <QuickAction key={action.label} {...action} />
          ))}
        </div>
      </GlassCard>

      <GlassCard
        title={<BilingualText primary="Missed contributors" secondary="Abadasigira amafaranga" />}
        subtitle={
          <BilingualText
            primary="Members without a recorded contribution in the last month."
            secondary="Abanyamuryango batagize umusanzu muri uku kwezi."
            secondaryClassName="text-xs text-neutral-3"
          />
        }
      >
        {summary.missedContributors.length > 0 ? (
          <MissedContributorsList contributors={summary.missedContributors} />
        ) : (
          <EmptyState
            title="All caught up"
            description="Every active member has a recent contribution."
          />
        )}
      </GlassCard>

      <GlassCard
        title={<BilingualText primary="Top Ikimina" secondary="Amatsinda akora neza" />}
        subtitle={
          <BilingualText
            primary="Most active groups by deposit volume this month."
            secondary="Amatsinda afite umusaruro munini w'ukwezi."
            secondaryClassName="text-xs text-neutral-3"
          />
        }
        actions={<StatusChip tone="neutral">{summary.activeIkimina} active</StatusChip>}
      >
        <TopIkiminaTable data={summary.topIkimina} />
      </GlassCard>
    </div>
  );
}
