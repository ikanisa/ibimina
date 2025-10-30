"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Search,
  LineChart,
} from "lucide-react";
import type { ProfileRow } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { GlobalSearchDialog } from "@/components/layout/global-search-dialog";
import { OfflineQueueIndicator } from "@/components/system/offline-queue-indicator.ssr-wrapper";
import { SignOutButton } from "@/components/auth/sign-out-button";

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
} as const;

const FOCUSABLE_SELECTORS =
  'a[href]:not([tabindex="-1"]):not([aria-hidden="true"]),button:not([disabled]):not([tabindex="-1"]),input:not([disabled]):not([tabindex="-1"]),textarea:not([disabled]):not([tabindex="-1"]),select:not([disabled]):not([tabindex="-1"]),[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])';

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [] as HTMLElement[];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (element) => !element.hasAttribute("disabled") && element.offsetParent !== null
  );
};

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

export function AppShell({ children, profile }: AppShellProps) {
  const pathname = usePathname();
  const isAdminPanel = pathname?.startsWith("/admin");
  if (isAdminPanel) {
    return <>{children}</>;
  }
  return <DefaultAppShell profile={profile}>{children}</DefaultAppShell>;
}

function DefaultAppShell({ children, profile }: AppShellProps) {
  const pathname = usePathname();
  const [showActions, setShowActions] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement | null>(null);
  const quickActionsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const quickActionsLastFocusRef = useRef<HTMLElement | null>(null);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const globalSearchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const wasGlobalSearchOpenRef = useRef(false);
  const wasQuickActionsOpenRef = useRef(false);
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

  useEffect(() => {
    if (showGlobalSearch) {
      wasGlobalSearchOpenRef.current = true;
      return;
    }
    if (wasGlobalSearchOpenRef.current) {
      wasGlobalSearchOpenRef.current = false;
      globalSearchTriggerRef.current?.focus();
    }
  }, [showGlobalSearch]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setShowGlobalSearch(true);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    const container = quickActionsRef.current;

    if (!showActions) {
      quickActionsTriggerRef.current?.focus();
      return;
    }

    if (!container) {
      return;
    }

    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => element.offsetParent !== null
      );

    const focusFirst = () => {
      const [first] = getFocusable();
      if (first) {
        setTimeout(() => first.focus(), 0);
      }
    };

    focusFirst();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowActions(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusable();
      if (focusable.length === 0) {
        return;
      }

      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      let nextIndex = currentIndex;

      if (event.shiftKey) {
        nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
      } else {
        nextIndex = currentIndex === focusable.length - 1 ? 0 : currentIndex + 1;
      }

      focusable[nextIndex].focus();
      event.preventDefault();
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [showActions]);

  const navTargets = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        href: item.href,
        primary: t(item.key),
        secondary: t(item.key),
        badge: navBadges[item.href],
      })),
    [navBadges, t]
  );

  const quickActionTargets = useMemo(
    () =>
      quickActionGroups.map((group) => ({
        id: group.id,
        title: group.title,
        subtitle: group.subtitle,
        actions: group.actions,
      })),
    [quickActionGroups]
  );

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <div className="relative flex min-h-screen flex-col bg-nyungwe text-neutral-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50 focus:rounded-full focus:bg-kigali focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Skip to content · Siga ujye ku bikorwa
      </a>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-20 top-6 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-[-10%] top-32 h-72 w-72 rounded-full bg-[#1bb06e26] blur-3xl" />
      </div>

      <header className="relative mx-auto w-full max-w-6xl px-4 pb-4 pt-6 md:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-glass backdrop-blur">
          <div
            className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-2 md:text-[0.7rem]">
                {t("brand.org", "Umurenge SACCO")}
              </p>
              <span className="text-gradient text-2xl font-semibold leading-tight">
                {t("brand.consoleTitle", "Ibimina Staff Console")}
              </span>
              <span className="text-sm text-neutral-2">{saccoName}</span>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
              <nav className="hidden items-center gap-2 text-sm font-semibold md:flex">
                {navTargets.map(({ href, primary, badge }, idx) => {
                  const Icon = NAV_ITEMS[idx].icon;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "interactive-scale flex items-center gap-2 rounded-full px-4 py-2 text-left text-sm tracking-[0.08em] transition md:text-[0.9rem]",
                        isActive(href)
                          ? "bg-white/20 text-neutral-0"
                          : "text-neutral-2 hover:bg-white/10 hover:text-neutral-0"
                      )}
                      aria-current={isActive(href) ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      <span className="leading-tight">{primary}</span>
                      {badge && (
                        <span
                          className={cn(
                            "ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-[0.12em]",
                            BADGE_TONE_STYLES[badge.tone]
                          )}
                        >
                          {badge.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex flex-wrap items-center gap-3">
                <LanguageSwitcher className="hidden text-[0.7rem] font-semibold md:flex" />
                <SignOutButton className="px-4 py-2 text-xs uppercase tracking-[0.3em] md:text-sm md:tracking-[0.1em]" />
                <button
                  type="button"
                  onClick={() => setShowGlobalSearch(true)}
                  className="interactive-scale inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold tracking-[0.1em] text-neutral-0 transition hover:border-white/25 hover:text-neutral-0 md:text-xs md:uppercase md:tracking-[0.3em]"
                  aria-haspopup="dialog"
                  aria-expanded={showGlobalSearch}
                  ref={globalSearchTriggerRef}
                >
                  <Search className="h-4 w-4" aria-hidden />
                  <span className="items-center">{t("common.search", "Search")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 px-4 pb-28 md:px-8">
        {children}
      </div>
      <OfflineQueueIndicator />

      <nav
        className="fixed inset-x-0 bottom-5 z-40 mx-auto flex w-[min(420px,92%)] items-center justify-between rounded-3xl border border-white/10 bg-ink/90 px-4 py-3 text-sm backdrop-blur md:hidden"
        aria-label={t("nav.mobile", "Mobile navigation")}
      >
        {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
          const badge = navBadges[href];
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "interactive-scale relative flex min-h-[48px] min-w-[48px] flex-col items-center justify-center text-[0.8rem] font-semibold tracking-[0.05em]",
                isActive(href) ? "text-neutral-0" : "text-neutral-2"
              )}
              aria-current={isActive(href) ? "page" : undefined}
              aria-label={t(key)}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {badge && (
                <span
                  className={cn(
                    "absolute right-3 top-1 h-2 w-2 rounded-full",
                    BADGE_DOT_STYLES[badge.tone]
                  )}
                  aria-hidden
                  aria-label={`${badge.label} notifications`}
                />
              )}
              <span className="mt-1 text-[0.7rem] leading-tight" aria-hidden>
                {t(key)}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setShowActions((v) => !v)}
          className="interactive-scale absolute left-1/2 top-0 flex min-h-[48px] -translate-y-1/2 -translate-x-1/2 items-center gap-2 rounded-full bg-kigali px-5 py-3 text-sm font-semibold tracking-[0.08em] text-ink shadow-glass"
          aria-expanded={showActions}
          aria-controls="quick-actions"
          aria-label={t("dashboard.quick.actions", "Quick actions menu")}
          ref={quickActionsTriggerRef}
        >
          <Plus className="h-4 w-4" aria-hidden />
          <span className="flex flex-col text-left leading-none">
            <span>{t("dashboard.quick.newPrimary", "New")}</span>
            <span className="text-[0.65rem] font-medium tracking-[0.12em] text-ink/70">
              {t("dashboard.quick.newSecondary", "New")}
            </span>
          </span>
        </button>
      </nav>

      {showActions && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 backdrop-blur-sm md:items-center"
          onClick={() => setShowActions(false)}
        >
          <div
            id="quick-actions"
            className="glass interactive-scale m-6 max-w-sm rounded-3xl p-6 text-sm text-neutral-0 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={t("dashboard.quick.title", "Quick actions")}
            onClick={(event) => event.stopPropagation()}
            ref={quickActionsRef}
            tabIndex={-1}
          >
            <div className="mb-4 flex items-center gap-2 text-neutral-2">
              <ListPlus className="h-4 w-4" />
              <span className="items-center gap-2 text-xs">
                {t("dashboard.quick.title", "Quick actions")}
              </span>
            </div>
            <div className="space-y-4">
              {quickActionGroups.map((group) => (
                <section key={group.id} className="space-y-2">
                  <header className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-neutral-2">
                    <span>{group.title}</span>
                    <span className="text-[10px] text-neutral-3">{group.subtitle}</span>
                  </header>
                  <ul className="space-y-3">
                    {group.actions.map((action) => (
                      <li key={`${group.id}-${action.primary}`}>
                        <Link
                          href={action.href}
                          onClick={() => setShowActions(false)}
                          className="interactive-scale block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-neutral-0 transition hover:bg-white/10"
                          data-quick-focus
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">{action.primary}</p>
                              <p className="text-xs text-neutral-2">{action.description}</p>
                              <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-2">
                                {action.secondary}
                              </p>
                              <p className="text-[11px] text-neutral-2">
                                {action.secondaryDescription}
                              </p>
                            </div>
                            {action.badge && (
                              <span
                                className={cn(
                                  "inline-flex h-min items-center gap-1 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.35em]",
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
            <button
              type="button"
              onClick={() => setShowActions(false)}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neutral-2"
              data-quick-focus
            >
              <Settings2 className="h-3.5 w-3.5" />
              {t("common.close", "Close")}
            </button>
          </div>
        </div>
      )}

      <GlobalSearchDialog
        open={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        profile={profile}
        navItems={navTargets}
        quickActions={quickActionTargets}
      />
    </div>
  );
}
