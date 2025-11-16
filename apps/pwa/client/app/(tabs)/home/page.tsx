import Link from "next/link";
import { headers } from "next/headers";

import { getSurfaceCopy } from "@ibimina/locales";

import { fmtCurrency } from "@/utils/format";
import { loadHomeDashboard } from "@/lib/data/home";
import { getLocaleMessages } from "@/lib/i18n/messages";
import { defaultLocale } from "@/i18n";
import { resolveClientLocaleCode } from "@/lib/content/pack";
import { BalanceCard } from "@/src/components/cards/BalanceCard";
import { ActivityCard } from "@/src/components/cards/ActivityCard";
import { UpcomingDeadlinesCard } from "@/src/components/cards/UpcomingDeadlinesCard";
import { QuickActionsRow } from "@/src/components/ui/QuickActionsRow";
import {
  IoCardOutline,
  IoCashOutline,
  IoDocumentTextOutline,
  IoStatsChartOutline,
} from "react-icons/io5";

import styles from "./page.module.css";

const defaultSurfaceCopy = getSurfaceCopy(resolveClientLocaleCode(defaultLocale), "client");

export const metadata = {
  title: defaultSurfaceCopy.home.metadata.title.long,
  description: defaultSurfaceCopy.home.metadata.description.long,
};

type DashboardData = Awaited<ReturnType<typeof loadHomeDashboard>>;
type DashboardAllocations = DashboardData["recentAllocations"];
type DashboardGroups = DashboardData["groups"];

const QUICK_ACTIONS = [
  { id: "pay", label: "Pay dues", icon: IoCardOutline, href: "/pay" },
  { id: "send", label: "Send money", icon: IoCashOutline, href: "/pay?mode=transfer" },
  { id: "loan", label: "Apply loan", icon: IoStatsChartOutline, href: "/loans" },
  { id: "statement", label: "Statements", icon: IoDocumentTextOutline, href: "/statements" },
  { id: "pay", label: "pay", icon: "💳", href: "/pay" },
  { id: "send", label: "send", icon: "💸", href: "/pay?mode=transfer" },
  { id: "loan", label: "loan", icon: "📊", href: "/loans" },
  { id: "statement", label: "statement", icon: "📄", href: "/statements" },
];

function mapActivities(allocations: DashboardAllocations, fallbackLabel: string) {
  return allocations.slice(0, 5).map((allocation) => ({
    id: allocation.id,
    kind: allocation.status === "pending" ? "payment" : "deposit",
    amount: allocation.amount,
    currency: allocation.currency ?? "RWF",
    timestamp: allocation.createdAt,
    label: allocation.groupName ?? allocation.narration ?? fallbackLabel,
  }));
}

function computeDueDate(lastContributionAt: string | null): string {
  if (!lastContributionAt) {
    return new Date().toISOString();
  }
  const last = new Date(lastContributionAt);
  if (Number.isNaN(last.getTime())) {
    return new Date().toISOString();
  }
  last.setDate(last.getDate() + 7);
  return last.toISOString();
}

function mapDeadlines(groups: DashboardGroups, actionLabel: string) {
  return groups
    .filter((group) => group.pendingCount > 0)
    .slice(0, 4)
    .map((group) => ({
      id: group.groupId,
      title: group.groupName,
      amount: group.contribution.amount ?? group.totalConfirmed,
      currency: group.contribution.currency ?? "RWF",
      dueDate: computeDueDate(group.lastContributionAt),
      actionHref: `/pay?group=${group.groupId}`,
      actionLabel,
    }));
}

export default async function HomePage() {
  const localeHeader = headers().get("x-next-intl-locale");
  const messages = getLocaleMessages(localeHeader);
  const { home, locale } = messages;
  const localeCopy = getSurfaceCopy(resolveClientLocaleCode(locale), "client");
  const dashboard = await loadHomeDashboard();

  const activities = mapActivities(
    dashboard.recentAllocations,
    localeCopy.home.activity.fallbackLabel.long
  );
  const deadlines = mapDeadlines(dashboard.groups, home.cards.deadlines.cta);
  const quickActions = QUICK_ACTIONS.map((action) => {
    switch (action.id) {
      case "pay":
        return { ...action, label: home.quickActions.items.pay.label };
      case "send":
        return { ...action, label: home.quickActions.items.send.label };
      case "loan":
        return { ...action, label: home.quickActions.items.loan.label };
      case "statement":
        return { ...action, label: home.quickActions.items.statement.label };
      default:
        return action;
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.fullWidth}>
        <BalanceCard total={dashboard.totals.confirmedAmount} label={home.cards.balance.label} />
      </div>

      <div className={styles.fullWidth}>
        <section aria-labelledby="quick-actions" role="region">
          <h2 id="quick-actions" className={styles.sectionTitle}>
            {home.quickActions.title}
          </h2>
          <QuickActionsRow actions={quickActions} />
        </section>
      </div>

      <div className={styles.halfWidth}>
        <ActivityCard
          activities={activities}
          title={home.cards.activity.title}
          emptyLabel={home.cards.activity.empty}
          locale={locale}
        />
      </div>

      <div className={styles.halfWidth}>
        <UpcomingDeadlinesCard
          deadlines={deadlines}
          title={home.cards.deadlines.title}
          emptyLabel={home.cards.deadlines.empty}
          actionLabel={home.cards.deadlines.cta}
          locale={locale}
        />
      </div>

      <section className={styles.fullWidth} aria-labelledby="groups-heading">
        <h2 id="groups-heading" className={styles.sectionTitle}>
          {home.groups.title}
        </h2>
        {dashboard.groups.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{home.groups.empty}</p>
            <Link href="/groups" className={styles.cta}>
              {home.groups.cta}
            </Link>
          </div>
        ) : (
          <div className={styles.groupGrid}>
            {dashboard.groups.map((group) => (
              <Link
                key={group.groupId}
                href={`/groups/${group.groupId}`}
                className={styles.groupCard}
              >
                <span className={styles.groupTitle}>{group.groupName}</span>
                <div className={styles.groupMeta}>
                  <span>{localeCopy.home.groups.totalSaved.short}</span>
                  <strong>{fmtCurrency(group.totalConfirmed)}</strong>
                </div>
                <div className={styles.groupMeta}>
                  <span>{localeCopy.home.groups.pending.short}</span>
                  <strong>{group.pendingCount}</strong>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
