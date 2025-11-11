"use client";

import { Children, Fragment, useEffect, useMemo, useRef, useState, isValidElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UsersRound,
  Workflow,
  BarChartBig,
  Settings2,
  Plus,
  ListPlus,
  Inbox,
  LineChart,
} from "lucide-react";
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
import { useFocusTrap } from "@/src/lib/a11y/useFocusTrap";

const GUEST_MODE = process.env.NEXT_PUBLIC_AUTH_GUEST_MODE === "1";

const HERO_SLOT = Symbol("AppShellHero");

interface HeroComponentProps {
  children: React.ReactNode;
}

interface HeroComponent extends React.FC<HeroComponentProps> {
  __slot: typeof HERO_SLOT;
}

export const AppShellHero: HeroComponent = ({ children }) => {
  return <Fragment>{children}</Fragment>;
};
AppShellHero.__slot = HERO_SLOT;

function isHeroElement(
  child: React.ReactNode
): child is React.ReactElement<HeroComponentProps> & { type: HeroComponent } {
  return Boolean(
    isValidElement(child) &&
      typeof child.type === "function" &&
      (child.type as HeroComponent).__slot === HERO_SLOT
  );
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
}

interface AppShellProps {
  children: React.ReactNode;
  profile: ProfileRow;
}

const NAV_ITEMS = [
  { href: "/dashboard" as const, key: "nav.dashboard", icon: LayoutDashboard },
  { href: "/ikimina" as const, key: "nav.ikimina", icon: Workflow },
  { href: "/recon" as const, key: "nav.recon", icon: Inbox },
  { href: "/analytics" as const, key: "nav.analytics", icon: LineChart },
  { href: "/ops" as const, key: "nav.ops", icon: Settings2 },
  { href: "/reports" as const, key: "nav.reports", icon: BarChartBig },
  { href: "/admin" as const, key: "nav.admin", icon: UsersRound },
];

const BADGE_TONE_STYLES = {
  critical: "border-red-500/40 bg-red-500/15 text-red-200",
  info: "border-sky-500/40 bg-sky-500/15 text-sky-100",
  success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
} as const;

const BADGE_DOT_STYLES = {
  critical: "bg-red-400",
  info: "bg-sky-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
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
  const { t } = useTranslation();

  const saccoName = useMemo(
    () => profile.sacco?.name ?? t("sacco.all", "All SACCOs"),
    [profile.sacco?.name, t]
  );

  const navBadges = useMemo(() => {
    const badges: Record<string, { label: string; tone: keyof typeof BADGE_TONE_STYLES }> = {};
    if ((profile.failed_mfa_count ?? 0) > 0) {
      badges["/ops"] = {
        label: t("nav.badges.alerts", String(profile.failed_mfa_count ?? 0)),
        tone: "critical",
      };
    }
    badges["/profile"] = profile.mfa_enabled
      ? { label: t("nav.badges.secured", "Secured"), tone: "success" }
      : { label: t("nav.badges.action", "Action"), tone: "critical" };
    badges["/admin"] =
      profile.role === "SYSTEM_ADMIN"
        ? { label: t("nav.badges.superUser", "Admin"), tone: "info" }
        : { label: t("nav.badges.limited", "Limited"), tone: "critical" };
    return badges;
  }, [profile.failed_mfa_count, profile.mfa_enabled, profile.role, t]);

  const quickActionGroups = useMemo<QuickActionGroupDefinition[]>(() => {
    const opsAlertBadge =
      (profile.failed_mfa_count ?? 0) > 0
        ? {
            label: t("dashboard.quick.alerts", String(profile.failed_mfa_count ?? 0)),
            tone: "critical" as const,
          }
        : undefined;
    const securityBadge = profile.mfa_enabled
      ? { label: t("dashboard.quick.secured", "Secured"), tone: "success" as const }
      : { label: t("dashboard.quick.setup", "Setup"), tone: "critical" as const };

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
            badge: opsAlertBadge,
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
        subtitle: t("dashboard.quick.group.operationsSubtitle", "Stability & security"),
        actions: [
          {
            href: "/ops" as const,
            primary: "Operations Center",
            secondary: "Ikigo cy'imikorere",
            description: "Review incidents, notifications, and MFA health.",
            secondaryDescription: "Reba ibibazo, ubutumwa bwateguwe, n'imiterere ya MFA.",
            badge: opsAlertBadge,
          },
          {
            href: "/profile" as const,
            primary: "Account Security",
            secondary: "Umutekano w'uburenganzira",
            description: "Update password and authenticator settings.",
            secondaryDescription: "Hindura ijambobanga n'uburyo bwa 2FA.",
            badge: securityBadge,
          },
        ],
      },
    ];
  }, [profile.failed_mfa_count, profile.mfa_enabled, t]);

  const uiNavTargets = useMemo<UiNavTarget[]>(
    () =>
      NAV_ITEMS.map((item) => ({
        href: item.href,
        primary: t(item.key),
        secondary: t(item.key),
        icon: item.icon,
        badge: navBadges[item.href] ?? null,
      })),
    [navBadges, t]
  );

  const paletteNavTargets = useMemo<PaletteNavTarget[]>(
    () =>
      uiNavTargets.map((item) => ({
        id: item.href,
        href: item.href,
        label: item.primary,
        description: item.secondary,
        badge: item.badge ?? null,
        keywords: [item.href, item.primary].filter(Boolean),
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
}

function DefaultAppShellView({
  children,
  saccoName,
  navTargets,
  quickActionGroups,
}: DefaultAppShellViewProps) {
  const pathname = usePathname();
  const [showActions, setShowActions] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement | null>(null);
  const quickActionsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const { open: paletteOpen, openPalette } = useCommandPalette();
  const { t } = useTranslation();

  const slotPartitions = useMemo(() => {
    const heroFragments: React.ReactNode[] = [];
    const contentFragments: React.ReactNode[] = [];
    Children.forEach(children, (child) => {
      if (isHeroElement(child)) {
        heroFragments.push(child.props.children);
      } else if (child !== null && child !== undefined) {
        contentFragments.push(child);
      }
    });
    return {
      hero: heroFragments.length ? heroFragments : null,
      content: contentFragments,
    };
  }, [children]);

  useEffect(() => {
    if (!showActions) {
      if (wasQuickActionsOpenRef.current) {
        wasQuickActionsOpenRef.current = false;
        (quickActionsTriggerRef.current ?? quickActionsLastFocusRef.current)?.focus();
      }
      return;
    }

    wasQuickActionsOpenRef.current = true;
    quickActionsLastFocusRef.current = document.activeElement as HTMLElement | null;
    const container = quickActionsRef.current;
    const firstFocusable = getFocusableElements(container).at(0);
    if (firstFocusable) {
      queueMicrotask(() => firstFocusable.focus());
    } else {
      container?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!container) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setShowActions(false);
        return;
      }
      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (activeElement === first || activeElement === container) {
          event.preventDefault();
          last.focus();
        }
      } else if (activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container?.addEventListener("keydown", handleKeyDown);
    return () => container?.removeEventListener("keydown", handleKeyDown);
  }, [showActions]);
  const resolveInitialQuickAction = useCallback(
    () => quickActionsRef.current?.querySelector<HTMLElement>("[data-quick-focus]") ?? null,
    []
  );

  useFocusTrap(showActions, quickActionsRef, {
    onEscape: () => setShowActions(false),
    initialFocus: resolveInitialQuickAction,
    returnFocus: () => quickActionsTriggerRef.current?.focus(),
  });

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  const heroContent = slotPartitions.hero ?? [
    <div key="default-hero" className="space-y-2">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-neutral-8">
        Ibimina Staff Console
      </p>
      <p className="text-lg font-semibold text-neutral-12">{saccoName}</p>
    </div>,
  ];

  return (
    <div className="relative min-h-screen bg-neutral-1 text-neutral-12">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50 focus:rounded-full focus:bg-kigali focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Skip to content · Siga ujye ku bikorwa
      </a>
      <OfflineBanner />
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-neutral-6/60 bg-white/60 backdrop-blur lg:flex lg:flex-col">
          <div className="border-b border-neutral-6/60 px-6 py-6">
            <div className="space-y-1">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-neutral-8">
                Umurenge SACCO
              </p>
              <p className="text-xl font-semibold text-neutral-12">Ibimina Staff Console</p>
              <p className="text-sm text-neutral-10">{saccoName}</p>
            </div>
            <button
              type="button"
              onClick={openPalette}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-neutral-6/80 bg-white/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-11 transition hover:border-neutral-7 hover:bg-white/60"
              aria-expanded={paletteOpen}
            >
              <ListPlus className="h-3.5 w-3.5" aria-hidden="true" />
              {t("dashboard.quick.title", "Quick actions")}
            </button>
          </div>
          <nav
            className="flex-1 overflow-y-auto px-3 py-6"
            aria-label={t("nav.main", "Main navigation")}
          >
            <ul className="space-y-1">
              {navTargets.map(({ href, primary, icon: Icon, badge }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
                      isActive(href)
                        ? "bg-ink text-neutral-0 shadow-lg"
                        : "text-neutral-8 hover:bg-white/80 hover:text-neutral-12"
                    )}
                    aria-current={isActive(href) ? "page" : undefined}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {primary}
                    </span>
                    {badge && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide",
                          BADGE_TONE_STYLES[badge.tone]
                        )}
                        aria-label={`${badge.label} notification`}
                      >
                        {badge.label}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-4 border-t border-neutral-6/60 px-6 py-6">
            <NetworkStatusIndicator />
            <LanguageSwitcher className="text-xs font-semibold" />
            <SignOutButton className="w-full rounded-lg border border-neutral-6/70 bg-white/50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-11 transition hover:border-neutral-7 hover:bg-white/70" />
          </div>
        </aside>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-neutral-6/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-neutral-8">
                  Umurenge SACCO
                </p>
                <p className="text-sm font-semibold text-neutral-12">Ibimina Staff Console</p>
                <p className="text-xs text-neutral-10">{saccoName}</p>
              </div>
              <div className="flex items-center gap-2">
                <NetworkStatusIndicator />
                <LanguageSwitcher popover side="bottom" className="text-xs font-semibold" />
                <SignOutButton className="rounded-lg border border-neutral-6/70 bg-white/60 px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-neutral-11" />
              </div>
            </div>
          </header>
          <div className="flex-1">
            <div className="border-b border-neutral-6/60 bg-white/70 px-4 py-6 shadow-sm backdrop-blur lg:px-10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">{heroContent}</div>
                <div className="flex flex-shrink-0 items-start justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowActions(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-kigali px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-ink shadow-lg transition hover:shadow-xl"
                    aria-expanded={showActions}
                    aria-controls="quick-actions"
                    ref={quickActionsTriggerRef}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t("dashboard.quick.newPrimary", "New")}
                  </button>
                  <button
                    type="button"
                    onClick={openPalette}
                    className="hidden items-center gap-2 rounded-lg border border-neutral-6/80 bg-white/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-11 transition hover:border-neutral-7 hover:bg-white/80 lg:inline-flex"
                    aria-expanded={paletteOpen}
                  >
                    <ListPlus className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("dashboard.quick.title", "Quick actions")}
                  </button>
                </div>
              </div>
            </div>
            <main id="main-content" className="px-4 py-6 lg:px-10 lg:py-10">
              <div className="space-y-6">{slotPartitions.content}</div>
            </main>
          </div>
        </div>
      </div>
      <OfflineQueueIndicator />
      <OfflineConflictDialog />

      <nav
        className="fixed inset-x-0 bottom-5 z-40 mx-auto flex w-[min(420px,92%)] items-center justify-between rounded-2xl border border-white/25 bg-gradient-to-br from-ink/95 to-ink/90 px-3 py-3.5 shadow-2xl backdrop-blur-xl md:hidden"
        aria-label={t("nav.mobile", "Mobile navigation")}
      >
        {navTargets.map(({ href, primary, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group relative flex flex-col items-center gap-1 rounded-lg px-2.5 py-2 text-[0.7rem] font-semibold transition-all",
              isActive(href)
                ? "text-neutral-0"
                : "text-neutral-2 hover:bg-white/10 hover:text-neutral-0"
            )}
            aria-current={isActive(href) ? "page" : undefined}
            aria-label={primary}
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-all",
                isActive(href) && "drop-shadow-[0_0_8px_rgba(0,161,222,0.5)]"
              )}
              aria-hidden="true"
            />
            {badge && (
              <span
                className={cn(
                  "absolute right-1 top-1 h-2 w-2 rounded-full ring-2 ring-ink",
                  BADGE_DOT_STYLES[badge.tone]
                )}
                aria-label={`${badge.label} notification`}
              />
            )}
            <span className="leading-none">{primary}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setShowActions((v) => !v)}
          className="group absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl bg-kigali px-5 py-3 text-sm font-bold tracking-tight text-ink shadow-2xl transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(0,161,222,0.3)]"
          aria-expanded={showActions}
          aria-controls="quick-actions"
          aria-label={t("dashboard.quick.title", "Quick actions")}
        >
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" aria-hidden="true" />
          <span className="flex flex-col text-left leading-none">
            <span>{t("dashboard.quick.newPrimary", "New")}</span>
            <span className="text-[0.65rem] font-semibold text-ink/70">
              {t("dashboard.quick.newSecondary", "New")}
            </span>
          </span>
        </button>
      </nav>

      {showActions && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-md md:items-center md:justify-end md:pr-6"
          onClick={() => setShowActions(false)}
          role="presentation"
        >
          <div
            id="quick-actions"
            className="m-6 w-full max-w-md rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 text-sm text-neutral-0 shadow-2xl backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label={t("dashboard.quick.title", "Quick actions")}
            onClick={(event) => event.stopPropagation()}
            ref={quickActionsRef}
            tabIndex={-1}
          >
            <div className="mb-6 flex items-center gap-2.5 border-b border-white/10 pb-4">
              <ListPlus className="h-5 w-5 text-rw-blue" aria-hidden="true" />
              <h2 className="text-base font-bold uppercase tracking-wider text-neutral-0">
                {t("dashboard.quick.title", "Quick actions")}
              </h2>
            </div>

            <div className="space-y-6">
              {quickActionGroups.map((group) => (
                <section key={group.id} className="space-y-3">
                  <header className="flex items-baseline justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-0">
                      {group.title}
                    </h3>
                    <p className="text-[10px] font-medium text-neutral-3">{group.subtitle}</p>
                  </header>
                  <ul className="space-y-2.5">
                    {group.actions.map((action) => (
                      <li key={`${group.id}-${action.primary}`}>
                        <Link
                          href={action.href}
                          onClick={() => setShowActions(false)}
                          className="group block rounded-xl border border-white/15 bg-gradient-to-br from-white/10 to-white/5 px-4 py-3.5 text-left transition-all hover:border-white/25 hover:from-white/15 hover:to-white/10 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-rw-blue/50 focus:ring-offset-2 focus:ring-offset-transparent"
                          data-quick-focus
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-bold text-neutral-0 group-hover:text-white">
                                {action.primary}
                              </p>
                              <p className="text-xs leading-relaxed text-neutral-2">
                                {action.description}
                              </p>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-3">
                                {action.secondary}
                              </p>
                              <p className="text-[11px] leading-relaxed text-neutral-3">
                                {action.secondaryDescription}
                              </p>
                            </div>
                            {action.badge && (
                              <span
                                className={cn(
                                  "inline-flex h-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                                  BADGE_TONE_STYLES[action.badge.tone]
                                )}
                                aria-label={`${action.badge.label} notification`}
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

            <button
              type="button"
              onClick={() => setShowActions(false)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-neutral-0 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-rw-blue/50"
              data-quick-focus
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              {t("common.close", "Close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
