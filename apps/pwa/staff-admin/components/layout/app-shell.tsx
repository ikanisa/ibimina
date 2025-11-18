"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, ListPlus, Menu, Settings2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ProfileRow } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import {
  CommandPaletteProvider,
  useCommandPalette,
  type CommandActionGroup as PaletteActionGroup,
  type CommandNavTarget as PaletteNavTarget,
} from "@/src/components/common/CommandPalette";
import { OfflineQueueIndicator } from "@/components/system/offline-queue-indicator.ssr-wrapper";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { NetworkStatusIndicator } from "@/components/system/network-status-indicator";
import { OfflineBanner } from "@/components/system/offline-banner";
import { OfflineConflictDialog } from "@/components/system/offline-conflict-dialog";
import {
  getBreadcrumbChain,
  getGroupDescription,
  getNavigationGroups,
} from "@/app/(main)/route-config";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { NavigationRail } from "@/components/layout/navigation-rail";
import type { NavigationRailProps } from "@/components/layout/navigation-rail";
import { Drawer } from "@/components/ui/drawer";
import { QueuedSyncSummary } from "@/components/system/queued-sync-summary";

const GUEST_MODE = process.env.NEXT_PUBLIC_AUTH_GUEST_MODE === "1";

interface AppShellHeroProps {
  children: ReactNode;
}

export function AppShellHero({ children }: AppShellHeroProps) {
  return <>{children}</>;
}

interface AppShellProps {
  children: React.ReactNode;
  profile: ProfileRow;
}

const BADGE_TONE_STYLES = {
  critical: "border-red-500/40 bg-red-500/15 text-red-200",
  info: "border-sky-500/40 bg-sky-500/15 text-sky-100",
  success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
} as const;

type QuickActionBadge = { label: string; tone: keyof typeof BADGE_TONE_STYLES };

type QuickActionDefinition = {
  href: string;
  primary: string;
  secondary: string;
  description: string;
  secondaryDescription: string;
  badge?: QuickActionBadge;
};

type QuickActionGroupDefinition = {
  id: string;
  title: string;
  subtitle: string;
  actions: QuickActionDefinition[];
};

type UiNavTarget = {
  href: string;
  primary: string;
  secondary: string;
  icon: LucideIcon;
  badge?: { label: string; tone: keyof typeof BADGE_TONE_STYLES } | null;
  groupId: string;
};

export function AppShell({ children, profile }: AppShellProps) {
  const pathname = usePathname();
  const isAdminPanel = pathname?.startsWith("/admin");
  if (isAdminPanel) {
    return <>{children}</>;
  }
  if (GUEST_MODE) {
    return <GuestAppShell profile={profile}>{children}</GuestAppShell>;
  }
  return <DefaultAppShell profile={profile}>{children}</DefaultAppShell>;
}

const GUEST_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ikimina", label: "Ikimina" },
  { href: "/recon", label: "Reconciliation" },
] as const;

function GuestAppShell({ children, profile }: AppShellProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const saccoName = useMemo(
    () => profile.sacco?.name ?? t("sacco.all", "All SACCOs"),
    [profile.sacco?.name, t]
  );

  return (
    <div className="min-h-screen bg-neutral-1 text-neutral-12">
      <header className="sticky top-0 z-20 border-b border-neutral-6 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-9">
              Ibimina Staff Console
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-11">
              <span className="font-medium text-neutral-12">{saccoName}</span>
              <span className="rounded-full bg-neutral-3 px-3 py-0.5 text-xs text-neutral-11">
                Preview Mode
              </span>
              {profile.email && (
                <span className="text-xs text-neutral-10">Signed in as {profile.email}</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav className="flex items-center gap-3 text-sm font-medium text-neutral-11">
              {GUEST_NAV.map(({ href, label }) => {
                const active = pathname?.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1.5 transition",
                      active
                        ? "bg-neutral-3 text-neutral-12"
                        : "text-neutral-10 hover:text-neutral-12"
                    )}
                  >
                    <span className="text-xs uppercase tracking-wide">{label}</span>
                  </Link>
                );
              })}
            </nav>
            <LanguageSwitcher popover side="bottom" className="text-neutral-11" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}

function DefaultAppShell({ children, profile }: AppShellProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const saccoName = useMemo(
    () => profile.sacco?.name ?? t("sacco.all", "All SACCOs"),
    [profile.sacco?.name, t]
  );

  const navBadges = useMemo(() => {
    const badges: Record<string, { label: string; tone: keyof typeof BADGE_TONE_STYLES }> = {};
    badges["/admin"] =
      profile.role === "SYSTEM_ADMIN"
        ? { label: t("nav.badges.superUser", "Admin"), tone: "info" }
        : { label: t("nav.badges.limited", "Limited"), tone: "critical" };
    return badges;
  }, [profile.role, t]);

  const quickActionGroups = useMemo<QuickActionGroupDefinition[]>(() => {
    return [
      {
        id: "tasks",
        title: t("dashboard.quick.group.tasks", "Tasks"),
        subtitle: t("dashboard.quick.group.tasksSubtitle", "Core workflows"),
        actions: [
          {
            href: "/ikimina" as const,
            primary: "Create Ikimina",
            secondary: "Tangira ikimina",
            description: "Launch a new saving group.",
            secondaryDescription: "Fungura itsinda rishya ry'ubwizigame.",
          },
          {
            href: "/ikimina" as const,
            primary: "Import Members",
            secondary: "Injiza abanyamuryango",
            description: "Bulk-upload roster to an ikimina.",
            secondaryDescription: "Kuramo urutonde rw'abanyamuryango mu ikimina.",
          },
          {
            href: "/recon" as const,
            primary: "Import Statement",
            secondary: "Shyiramo raporo ya MoMo",
            description: "Drop MoMo statements for parsing.",
            secondaryDescription: "Ohereza raporo za MoMo zisobanurwa.",
          },
          {
            href: "/recon" as const,
            primary: "Review Recon",
            secondary: "Suzuma guhuzwa",
            description: "Clear unassigned deposits.",
            secondaryDescription: "Huza amafaranga ataritangirwa ibisobanuro.",
          },
        ],
      },
      {
        id: "insights",
        title: t("dashboard.quick.group.insights", "Insights"),
        subtitle: t("dashboard.quick.group.insightsSubtitle", "Data-driven decisions"),
        actions: [
          {
            href: "/analytics" as const,
            primary: "View Analytics",
            secondary: "Reba isesengura",
            description: "Track contribution trends and risk signals.",
            secondaryDescription: "Kurikirana uko imisanzu ihagaze n'ibimenyetso byo kuburira.",
          },
          {
            href: "/reports" as const,
            primary: "Generate Report",
            secondary: "Kora raporo",
            description: "Export SACCO or ikimina statements.",
            secondaryDescription: "Sohora raporo za SACCO cyangwa ikimina.",
          },
        ],
      },
      {
        id: "operations",
        title: t("dashboard.quick.group.operations", "Operations"),
        subtitle: t("dashboard.quick.group.operationsSubtitle", "Stability"),
        actions: [
          {
            href: "/ops" as const,
            primary: "Operations Center",
            secondary: "Ikigo cy'imikorere",
            description: "Review incidents, notifications, and backlog signals.",
            secondaryDescription: "Reba ibibazo, ubutumwa bwateguwe, n'ibimenyetso by'umusubirizo.",
          },
          {
            href: "/profile" as const,
            primary: "Account Security",
            secondary: "Umutekano w'uburenganzira",
            description: "Review your account basics and session status.",
            secondaryDescription: "Reba ibisobanuro by'uruhushya rwawe n'uko wiyandikishije.",
          },
        ],
      },
    ];
  }, [t]);

  const navigationGroups = useMemo<NavigationRailProps["groups"]>(() => {
    const groups = getNavigationGroups();
    return groups
      .map(({ group, routes }) => {
        const descriptionMeta = getGroupDescription(group.id);
        return {
          id: group.id,
          title: t(group.titleKey, group.fallbackTitle),
          description: descriptionMeta
            ? t(descriptionMeta.labelKey, descriptionMeta.fallbackLabel)
            : undefined,
          items: routes.map((route) => {
            const label = t(route.titleKey, route.fallbackTitle);
            const description = route.descriptionKey
              ? t(route.descriptionKey, route.fallbackDescription ?? "")
              : (route.fallbackDescription ?? "");
            const Icon = route.icon ?? Settings2;
            return {
              id: route.id,
              href: route.path,
              label,
              description: description || undefined,
              icon: Icon,
              badge: navBadges[route.path] ?? null,
            };
          }),
        };
      })
      .filter((group) => group.items.length > 0);
  }, [navBadges, t]);

  const uiNavTargets = useMemo<UiNavTarget[]>(
    () =>
      navigationGroups.flatMap((group) =>
        group.items.map((item) => ({
          href: item.href,
          primary: item.label,
          secondary: item.description ?? item.label,
          icon: item.icon,
          badge: item.badge ?? null,
          groupId: group.id,
        }))
      ),
    [navigationGroups]
  );

  const paletteNavTargets = useMemo<PaletteNavTarget[]>(
    () =>
      uiNavTargets.map((item) => ({
        id: item.href,
        href: item.href,
        label: item.primary,
        description: item.secondary,
        badge: item.badge ?? null,
        keywords: [item.href, item.primary, item.secondary].filter(Boolean),
      })),
    [uiNavTargets]
  );

  const paletteActionGroups = useMemo<PaletteActionGroup[]>(
    () =>
      quickActionGroups.map((group) => ({
        id: group.id,
        title: group.title,
        subtitle: group.subtitle,
        actions: group.actions.map((action) => {
          const secondaryParts = [action.secondary, action.secondaryDescription].filter(Boolean);
          return {
            id: `${group.id}:${action.href}`,
            label: action.primary,
            description: action.description,
            secondaryLabel: secondaryParts.length ? secondaryParts.join(" · ") : undefined,
            href: action.href,
            badge: action.badge ?? null,
            keywords: [
              action.primary,
              action.description,
              action.secondary,
              action.secondaryDescription,
            ].filter(Boolean) as string[],
          };
        }),
      })),
    [quickActionGroups]
  );

  const breadcrumbs = useMemo(
    () =>
      getBreadcrumbChain(pathname).map((crumb) => ({
        label: t(crumb.labelKey, crumb.fallbackLabel),
        href: crumb.href,
      })),
    [pathname, t]
  );

  return (
    <CommandPaletteProvider
      profile={profile}
      navTargets={paletteNavTargets}
      actionGroups={paletteActionGroups}
    >
      <DefaultAppShellView
        saccoName={saccoName}
        navTargets={uiNavTargets}
        quickActionGroups={quickActionGroups}
        navigationGroups={navigationGroups}
        breadcrumbs={breadcrumbs}
      >
        {children}
      </DefaultAppShellView>
    </CommandPaletteProvider>
  );
}

interface DefaultAppShellViewProps {
  children: React.ReactNode;
  saccoName: string;
  navTargets: UiNavTarget[];
  quickActionGroups: QuickActionGroupDefinition[];
  navigationGroups: NavigationRailProps["groups"];
  breadcrumbs: Array<{ label: string; href?: string | null }>;
}

function DefaultAppShellView({
  children,
  saccoName,
  navTargets,
  quickActionGroups,
  navigationGroups,
  breadcrumbs,
}: DefaultAppShellViewProps) {
  const pathname = usePathname();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileQuickOpen, setMobileQuickOpen] = useState(false);
  const { openPalette } = useCommandPalette();
  const { t } = useTranslation();

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  const mobileBadges = useMemo(
    () =>
      navTargets.reduce<Partial<Record<string, UiNavTarget["badge"]>>>((acc, item) => {
        if (item.badge) {
          acc[item.href] = item.badge;
        }
        return acc;
      }, {}),
    [navTargets]
  );

  return (
    <>
      <div className="relative flex min-h-screen bg-[color-mix(in_srgb,#020617_92%,rgba(15,23,42,0.75))] text-neutral-2">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50 focus:rounded-full focus:bg-kigali focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
        >
          Skip to content · Siga ujye ku bikorwa
        </a>

        <NavigationRail
          groups={navigationGroups}
          collapsedGroups={collapsedSections}
          onToggleGroup={toggleSection}
          collapsed={railCollapsed}
          onToggleCollapsed={() => setRailCollapsed((value) => !value)}
          saccoName={saccoName}
          brandLabel={t("brand.consoleTitle", "Ibimina Staff Console")}
        />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-white/10 bg-white/5 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-neutral-3 transition hover:bg-white/10 hover:text-neutral-0 lg:hidden"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label={t("nav.open", "Open navigation")}
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-neutral-6">
                    {t("brand.org", "Umurenge SACCO")}
                  </p>
                  <h1 className="text-lg font-semibold text-neutral-0 lg:text-xl">{saccoName}</h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                <NetworkStatusIndicator />
                <button
                  type="button"
                  onClick={openPalette}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-3 transition hover:bg-white/10 hover:text-neutral-0"
                >
                  <Command className="h-4 w-4" aria-hidden="true" />
                  {t("nav.search", "Command Palette")}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileQuickOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-3 transition hover:bg-white/10 hover:text-neutral-0 lg:hidden"
                >
                  <ListPlus className="h-4 w-4" aria-hidden="true" />
                  {t("dashboard.quick.title", "Quick actions")}
                </button>
                <LanguageSwitcher className="text-xs font-semibold" />
                <SignOutButton className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide shadow-md backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/20 hover:text-neutral-0" />
              </div>
            </div>
            <div className="px-4 pb-4 lg:px-8">
              <Breadcrumbs items={breadcrumbs} />
            </div>
          </header>

          <OfflineBanner />

          <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6">
            <main
              id="main-content"
              className="flex flex-1 flex-col gap-6 px-4 pb-20 pt-6 lg:px-8 lg:pb-12"
            >
              {children}
            </main>

            <aside className="hidden border-l border-white/10 bg-white/5 px-6 py-6 lg:flex lg:flex-col lg:gap-6">
              <QuickActionsPanel groups={quickActionGroups} onCommandPalette={openPalette} />
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <QueuedSyncSummary />
              </div>
            </aside>
          </div>
        </div>
      </div>

      <MobileNavigationDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        groups={navigationGroups}
        isActive={isActive}
        badges={mobileBadges}
      />

      <MobileQuickActionsDrawer
        open={mobileQuickOpen}
        onClose={() => setMobileQuickOpen(false)}
        groups={quickActionGroups}
      />

      <OfflineQueueIndicator />
      <OfflineConflictDialog />
    </>
  );
}

interface QuickActionsPanelProps {
  groups: QuickActionGroupDefinition[];
  onDismiss?: () => void;
  onCommandPalette: () => void;
}

function QuickActionsPanel({ groups, onDismiss, onCommandPalette }: QuickActionsPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-6">
            {t("dashboard.quick.title", "Quick actions")}
          </h2>
          <p className="mt-1 text-xs text-neutral-5">
            {t(
              "dashboard.quick.subtitle",
              "Jump into the common workflows or open the command palette."
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onCommandPalette}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-3 transition hover:bg-white/10 hover:text-neutral-0"
        >
          <Command className="h-4 w-4" aria-hidden="true" />
          {t("nav.search", "Command Palette")}
        </button>
      </div>
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.id} className="space-y-3">
            <header>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-0">
                {group.title}
              </h3>
              <p className="text-[10px] text-neutral-5">{group.subtitle}</p>
            </header>
            <ul className="space-y-3">
              {group.actions.map((action) => (
                <li key={`${group.id}-${action.primary}`}>
                  <Link
                    href={action.href}
                    onClick={onDismiss}
                    className="group block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-neutral-0 group-hover:text-white">
                          {action.primary}
                        </p>
                        <p className="text-xs text-neutral-4">{action.description}</p>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-5">
                          {action.secondary}
                        </p>
                        <p className="text-[11px] text-neutral-5">{action.secondaryDescription}</p>
                      </div>
                      {action.badge && (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
                            BADGE_TONE_STYLES[action.badge.tone]
                          )}
                        >
                          {action.badge.label}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

interface MobileNavigationDrawerProps {
  open: boolean;
  onClose: () => void;
  groups: NavigationRailProps["groups"];
  isActive: (href: string) => boolean;
  badges: Partial<Record<string, UiNavTarget["badge"]>>;
}

function MobileNavigationDrawer({
  open,
  onClose,
  groups,
  isActive,
  badges,
}: MobileNavigationDrawerProps) {
  const { t } = useTranslation();
  return (
    <Drawer open={open} onClose={onClose} title={t("nav.main", "Navigation")} size="full">
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group.id} className="space-y-3">
            <header>
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-4">
                {group.title}
              </h3>
              {group.description && (
                <p className="text-[11px] text-neutral-6">{group.description}</p>
              )}
            </header>
            <ul className="grid gap-2">
              {group.items.map((item) => {
                const badge = badges[item.href];
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition",
                        isActive(item.href)
                          ? "border-kigali/60 bg-kigali/20 text-neutral-0"
                          : "border-white/10 bg-white/5 text-neutral-3 hover:border-white/20 hover:text-neutral-0"
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      <div className="flex-1">
                        <p>{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-neutral-6">{item.description}</p>
                        )}
                      </div>
                      {badge && (
                        <span
                          className={cn(
                            "inline-flex h-fit items-center rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                            badge ? BADGE_TONE_STYLES[badge.tone] : undefined
                          )}
                        >
                          {badge.label}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </Drawer>
  );
}

interface MobileQuickActionsDrawerProps {
  open: boolean;
  onClose: () => void;
  groups: QuickActionGroupDefinition[];
}

function MobileQuickActionsDrawer({ open, onClose, groups }: MobileQuickActionsDrawerProps) {
  const { t } = useTranslation();
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("dashboard.quick.title", "Quick actions")}
      size="full"
    >
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.id} className="space-y-3">
            <header className="flex items-baseline justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-0">
                {group.title}
              </h3>
              <p className="text-[10px] text-neutral-5">{group.subtitle}</p>
            </header>
            <ul className="space-y-2">
              {group.actions.map((action) => (
                <li key={`${group.id}-${action.primary}`}>
                  <Link
                    href={action.href}
                    onClick={onClose}
                    className="block rounded-xl border border-white/15 bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-neutral-0">{action.primary}</p>
                        <p className="text-xs text-neutral-4">{action.description}</p>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-5">
                          {action.secondary}
                        </p>
                        <p className="text-[11px] text-neutral-5">{action.secondaryDescription}</p>
                      </div>
                      {action.badge && (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                            BADGE_TONE_STYLES[action.badge.tone]
                          )}
                        >
                          {action.badge.label}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Drawer>
  );
}
