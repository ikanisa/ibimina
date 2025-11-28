/**
 * Refactored Home Page using Modern Design System
 * 
 * Changes from original:
 * - Uses Stack and Grid for layout (replaces CSS modules)
 * - Uses DataCard for metrics (consistent with design system)
 * - Uses QuickActions component (enhanced with AI suggestions)
 * - Uses AnimatedPage for smooth transitions
 * - Uses Container for consistent max-width
 * - More accessible and maintainable code
 * 
 * Date: November 28, 2024
 * Refactor: Phase 5 - Modern Design System Implementation
 */

import Link from "next/link";
import { headers } from "next/headers";
import { 
  Stack, Grid, Container, DataCard, 
  QuickActions as ModernQuickActions, 
  AnimatedPage 
} from "@ibimina/ui";
import { getSurfaceCopy } from "@ibimina/locales";

import { fmtCurrency } from "@/utils/format";
import { loadHomeDashboard } from "@/lib/data/home";
import { getLocaleMessages } from "@/lib/i18n/messages";
import { defaultLocale } from "@/i18n";
import { resolveClientLocaleCode } from "@/lib/content/pack";
import { ActivityCard } from "@/src/components/cards/ActivityCard";
import { UpcomingDeadlinesCard } from "@/src/components/cards/UpcomingDeadlinesCard";
import {
  IoCardOutline,
  IoCashOutline,
  IoDocumentTextOutline,
  IoStatsChartOutline,
  IoWalletOutline,
  IoTrendingUpOutline,
} from "react-icons/io5";

const defaultSurfaceCopy = getSurfaceCopy(resolveClientLocaleCode(defaultLocale), "client");

export const metadata = {
  title: defaultSurfaceCopy.home.metadata.title.long,
  description: defaultSurfaceCopy.home.metadata.description.long,
};

type DashboardData = Awaited<ReturnType<typeof loadHomeDashboard>>;
type DashboardAllocations = DashboardData["recentAllocations"];
type DashboardGroups = DashboardData["groups"];

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

  // Transform quick actions to new format
  const quickActions = [
    { 
      id: "pay", 
      label: home.quickActions.items.pay.label, 
      icon: IoCardOutline, 
      action: () => {}, // Client-side navigation needed
    },
    { 
      id: "send", 
      label: home.quickActions.items.send.label, 
      icon: IoCashOutline, 
      action: () => {},
    },
    { 
      id: "loan", 
      label: home.quickActions.items.loan.label, 
      icon: IoStatsChartOutline, 
      action: () => {},
      ai: true, // AI-suggested action
    },
    { 
      id: "statement", 
      label: home.quickActions.items.statement.label, 
      icon: IoDocumentTextOutline, 
      action: () => {},
    },
  ];

  // Calculate stats
  const totalGroups = dashboard.groups.length;
  const pendingPayments = dashboard.groups.reduce((sum, g) => sum + g.pendingCount, 0);
  const recentActivityCount = dashboard.recentAllocations.length;

  return (
    <AnimatedPage>
      <Container size="xl" padding="md">
        <Stack gap="lg">
          {/* Balance Card - Featured */}
          <DataCard className="bg-gradient-to-br from-primary/10 to-primary/5">
            <DataCard.Header icon={IoWalletOutline} title={home.cards.balance.label} />
            <DataCard.Value 
              value={fmtCurrency(dashboard.totals.confirmedAmount)} 
              trend="up" 
            />
            <DataCard.Description>
              Total confirmed balance
            </DataCard.Description>
          </DataCard>

          {/* Quick Actions Section */}
          <section aria-labelledby="quick-actions" role="region">
            <h2 id="quick-actions" className="text-lg font-semibold mb-3">
              {home.quickActions.title}
            </h2>
            <ModernQuickActions actions={quickActions} maxVisible={4} />
          </section>

          {/* Stats Grid */}
          <Grid cols={3} gap="md" responsive={{ sm: 1, md: 3 }}>
            <DataCard>
              <DataCard.Header icon={IoWalletOutline} title="My Groups" />
              <DataCard.Value value={totalGroups} />
            </DataCard>
            
            <DataCard>
              <DataCard.Header icon={IoTrendingUpOutline} title="Pending" />
              <DataCard.Value value={pendingPayments} trend={pendingPayments > 0 ? "down" : "neutral"} />
            </DataCard>
            
            <DataCard>
              <DataCard.Header icon={IoStatsChartOutline} title="Activity" />
              <DataCard.Value value={recentActivityCount} trend="up" />
            </DataCard>
          </Grid>

          {/* Activity & Deadlines Row */}
          <Grid cols={2} gap="md" responsive={{ sm: 1, md: 2 }}>
            <ActivityCard
              activities={activities}
              title={home.cards.activity.title}
              emptyLabel={home.cards.activity.empty}
              locale={locale}
            />
            
            <UpcomingDeadlinesCard
              deadlines={deadlines}
              title={home.cards.deadlines.title}
              emptyLabel={home.cards.deadlines.empty}
              actionLabel={home.cards.deadlines.cta}
              locale={locale}
            />
          </Grid>

          {/* Groups Section */}
          <section aria-labelledby="groups-heading">
            <h2 id="groups-heading" className="text-lg font-semibold mb-4">
              {home.groups.title}
            </h2>
            
            {dashboard.groups.length === 0 ? (
              <div className="text-center py-12 bg-muted rounded-lg">
                <p className="text-muted-foreground mb-4">{home.groups.empty}</p>
                <Link
                  href="/groups"
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {home.groups.cta}
                </Link>
              </div>
            ) : (
              <Grid cols={2} gap="md" responsive={{ sm: 1, md: 2 }}>
                {dashboard.groups.map((group) => (
                  <Link
                    key={group.groupId}
                    href={`/groups/${group.groupId}`}
                    className="block"
                  >
                    <DataCard className="hover:border-primary/50 hover:shadow-lg transition-all">
                      <DataCard.Header title={group.groupName} />
                      <DataCard.Value
                        value={fmtCurrency(group.totalConfirmed)}
                        suffix={localeCopy.home.groups.totalSaved.short}
                      />
                      <DataCard.Footer>
                        <span className="text-sm text-muted-foreground">
                          {group.pendingCount} {localeCopy.home.groups.pending.short}
                        </span>
                      </DataCard.Footer>
                    </DataCard>
                  </Link>
                ))}
              </Grid>
            )}
          </section>
        </Stack>
      </Container>
    </AnimatedPage>
  );
}
