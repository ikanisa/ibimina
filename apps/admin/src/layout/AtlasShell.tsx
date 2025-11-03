"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  Command,
  Globe2,
  Handshake,
  Inbox,
  LayoutDashboard,
  Layers3,
  LineChart,
  Menu,
  Shield,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import type { ProfileRow } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/providers/i18n-provider";
import { GlobalSearchDialog } from "@/components/layout/global-search-dialog";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { OfflineQueueIndicator } from "@/components/system/offline-queue-indicator.ssr-wrapper";
import type {
  AtlasBreadcrumbDefinition,
  AtlasIconKey,
  AtlasNavBadgeRule,
  AtlasNavigationConfig,
  AtlasNavigationItemDefinition,
  AtlasRouteDefinition,
} from "@/src/navigation/atlas-navigation";

const ICON_MAP: Record<AtlasIconKey, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "layers-3": Layers3,
  inbox: Inbox,
  "line-chart": LineChart,
  "shield-check": ShieldCheck,
  "bar-chart-3": BarChart3,
  shield: Shield,
  "globe-2": Globe2,
  handshake: Handshake,
  "users-round": UsersRound,
};

type BadgeTone = "info" | "success" | "warning" | "critical";

type NavBadge = {
  label: string;
  tone: BadgeTone;
};

type QuickAction = {
  href: Route;
  label: string;
  description: string;
  tone: "default" | "highlight";
  badge?: NavBadge;
};

type QuickActionGroup = {
  id: string;
  title: string;
  actions: QuickAction[];
};

const BADGE_CLASSES: Record<BadgeTone, string> = {
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
};

const BADGE_DOT_CLASSES: Record<BadgeTone, string> = {
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-500",
};

const QUICK_ACTION_TONE_CLASSES: Record<QuickAction["tone"], string> = {
  default: "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50",
  highlight:
    "border-atlas-blue/40 bg-atlas-blue/5 hover:border-atlas-blue/60 hover:bg-atlas-blue/10",
};

const LOCAL_STORAGE_KEY = "atlas-shell-nav-collapsed";

function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  const [cleanPath] = pathname.split("?");
  return cleanPath.replace(/\/+$/, "");
}

function splitSegments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function patternMatches(pathname: string, pattern: string): boolean {
  const path = normalizePath(pathname);
  const patternPath = normalizePath(pattern);
  if (patternPath === "") {
    return path === "";
  }

  const pathSegments = splitSegments(path);
  const patternSegments = splitSegments(patternPath);

  if (patternSegments.length > pathSegments.length) {
    return false;
  }

  return patternSegments.every((segment, index) => {
    if (segment.startsWith("[...") && segment.endsWith("]")) {
      return true;
    }
    if (segment.startsWith("[") && segment.endsWith("]")) {
      return Boolean(pathSegments[index]);
    }
    return segment === pathSegments[index];
  });
}

function scorePattern(pattern: string): number {
  const segments = splitSegments(normalizePath(pattern));
  return segments.length;
}

function findActiveNavItem(
  pathname: string,
  items: AtlasNavigationItemDefinition[]
): AtlasNavigationItemDefinition | undefined {
  let match: AtlasNavigationItemDefinition | undefined;
  let bestScore = -1;
  for (const item of items) {
    if (patternMatches(pathname, item.pattern)) {
      const score = scorePattern(item.pattern);
      if (score > bestScore) {
        match = item;
        bestScore = score;
      }
    }
  }
  return match;
}

function findRouteDefinition(
  pathname: string,
  routes: AtlasRouteDefinition[]
): AtlasRouteDefinition | undefined {
  let match: AtlasRouteDefinition | undefined;
  let bestScore = -1;
  for (const route of routes) {
    if (patternMatches(pathname, route.pattern)) {
      const score = scorePattern(route.pattern);
      if (score > bestScore) {
        match = route;
        bestScore = score;
      }
    }
  }
  return match;
}

function resolveBadge(
  rule: AtlasNavBadgeRule | undefined,
  profile: ProfileRow,
  translate: ReturnType<typeof useTranslation>["t"]
): NavBadge | null {
  if (!rule) return null;
  switch (rule) {
    case "ops-alerts": {
      const count = profile.failed_mfa_count ?? 0;
      if (count <= 0) return null;
      return {
        label: translate("nav.badges.alerts", String(count)),
        tone: "critical",
      };
    }
    case "profile-security": {
      const enabled = Boolean(profile.mfa_enabled);
      return {
        label: enabled
          ? translate("nav.badges.secured", "Secured")
          : translate("nav.badges.action", "Action"),
        tone: enabled ? "success" : "critical",
      };
    }
    case "admin-role": {
      return profile.role === "SYSTEM_ADMIN"
        ? {
            label: translate("nav.badges.superUser", "Admin"),
            tone: "info",
          }
        : {
            label: translate("nav.badges.limited", "Limited"),
            tone: "warning",
          };
    }
    default:
      return null;
  }
}

function buildBreadcrumbs(
  groupLabel: string | undefined,
  navLabel: string | undefined,
  navHref: Route | undefined,
  translate: ReturnType<typeof useTranslation>["t"],
  extras: AtlasBreadcrumbDefinition[] | undefined
) {
  const crumbs: { label: string; href?: Route }[] = [];
  if (groupLabel) {
    crumbs.push({ label: groupLabel });
  }
  if (navLabel) {
    crumbs.push({ label: navLabel, href: navHref });
  }
  if (extras) {
    for (const crumb of extras) {
      crumbs.push({ label: translate(crumb.key, crumb.fallback), href: crumb.href });
    }
  }
  return crumbs;
}

function buildQuickActions(
  profile: ProfileRow,
  translate: ReturnType<typeof useTranslation>["t"]
): QuickActionGroup[] {
  const alerts = profile.failed_mfa_count ?? 0;
  const alertBadge =
    alerts > 0
      ? { label: translate("dashboard.quick.alerts", String(alerts)), tone: "critical" as const }
      : undefined;
  const securityBadge = profile.mfa_enabled
    ? { label: translate("dashboard.quick.secured", "Secured"), tone: "success" as const }
    : { label: translate("dashboard.quick.setup", "Setup"), tone: "critical" as const };

  return [
    {
      id: "start",
      title: translate("dashboard.quick.group.tasks", "Core workflows"),
      actions: [
        {
          href: "/ikimina",
          label: translate("dashboard.quick.createIkimina.title", "Create ikimina"),
          description: translate(
            "dashboard.quick.createIkimina.description",
            "Launch a new saving group in minutes."
          ),
          tone: "highlight",
        },
        {
          href: "/ikimina",
          label: translate("dashboard.quick.importMembers.title", "Import members"),
          description: translate(
            "dashboard.quick.importMembers.description",
            "Bulk upload roster spreadsheets."
          ),
          tone: "default",
        },
        {
          href: "/recon",
          label: translate("dashboard.quick.importStatement.title", "Import statement"),
          description: translate(
            "dashboard.quick.importStatement.description",
            "Drop MoMo statements for matching."
          ),
          tone: "default",
        },
      ],
    },
    {
      id: "operations",
      title: translate("dashboard.quick.group.operations", "Operational follow-up"),
      actions: [
        {
          href: "/recon",
          label: translate("dashboard.quick.goRecon.title", "Review reconciliation"),
          description: translate(
            "dashboard.quick.goRecon.description",
            "Resolve unmatched deposits and references."
          ),
          tone: "highlight",
          badge: alertBadge ?? undefined,
        },
        {
          href: "/ops",
          label: translate("dashboard.quick.operations.title", "Operations center"),
          description: translate(
            "dashboard.quick.operations.description",
            "Check incidents, alerts, and workloads."
          ),
          tone: "default",
          badge: alertBadge ?? undefined,
        },
        {
          href: "/profile",
          label: translate("dashboard.quick.security.title", "Account security"),
          description: translate(
            "dashboard.quick.security.description",
            "Review MFA and session health."
          ),
          tone: "default",
          badge: securityBadge,
        },
      ],
    },
    {
      id: "insights",
      title: translate("dashboard.quick.group.insights", "Insights"),
      actions: [
        {
          href: "/analytics",
          label: translate("dashboard.quick.viewAnalytics.title", "Analytics"),
          description: translate(
            "dashboard.quick.viewAnalytics.description",
            "Understand contribution trends and risk signals."
          ),
          tone: "default",
        },
        {
          href: "/reports",
          label: translate("dashboard.quick.generateReport.title", "Reports"),
          description: translate(
            "dashboard.quick.generateReport.description",
            "Export statements for SACCOs or ikimina."
          ),
          tone: "default",
        },
      ],
    },
  ];
}

interface AtlasShellProps {
  children: React.ReactNode;
  profile: ProfileRow;
  navigation: AtlasNavigationConfig;
}

export function AtlasShell({ children, profile, navigation }: AtlasShellProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      setNavCollapsed(stored === "1");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, navCollapsed ? "1" : "0");
  }, [navCollapsed]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") {
        setMobileNavOpen(false);
        setAssistantOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const container = mobileNavRef.current;
    const focusable = container?.querySelector<HTMLElement>("a, button");
    focusable?.focus();
  }, [mobileNavOpen]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const permittedItems = useMemo(() => {
    return navigation.items.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) {
        return true;
      }
      return item.permissions.includes(profile.role);
    });
  }, [navigation.items, profile.role]);

  const groupsWithItems = useMemo(() => {
    return navigation.groups
      .map((group) => ({
        group,
        items: permittedItems.filter((item) => item.groupId === group.id),
      }))
      .filter((entry) => entry.items.length > 0);
  }, [navigation.groups, permittedItems]);

  const activeNavItem = useMemo(
    () => findActiveNavItem(pathname ?? "", permittedItems),
    [pathname, permittedItems]
  );

  const activeRoute = useMemo(
    () => findRouteDefinition(pathname ?? "", navigation.routes),
    [pathname, navigation.routes]
  );

  const groupLabel = useMemo(() => {
    if (!activeNavItem) return undefined;
    const group = navigation.groups.find((entry) => entry.id === activeNavItem.groupId);
    return group ? t(group.labelKey, group.labelFallback) : undefined;
  }, [activeNavItem, navigation.groups, t]);

  const navLabel = useMemo(() => {
    if (!activeNavItem) return undefined;
    return t(activeNavItem.labelKey, activeNavItem.labelFallback);
  }, [activeNavItem, t]);

  const pageTitle = useMemo(() => {
    if (activeRoute?.titleKey) {
      return t(activeRoute.titleKey, activeRoute.titleFallback ?? navLabel ?? "");
    }
    if (activeNavItem?.titleKey) {
      return t(activeNavItem.titleKey, activeNavItem.titleFallback ?? navLabel ?? "");
    }
    return navLabel ?? t("nav.fallback", "Atlas console");
  }, [activeRoute, activeNavItem, navLabel, t]);

  const pageDescription = useMemo(() => {
    if (activeRoute?.descriptionKey) {
      return t(activeRoute.descriptionKey, activeRoute.descriptionFallback ?? "");
    }
    if (activeNavItem?.descriptionKey) {
      return t(activeNavItem.descriptionKey, activeNavItem.descriptionFallback ?? "");
    }
    return undefined;
  }, [activeRoute, activeNavItem, t]);

  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(groupLabel, navLabel, activeNavItem?.href, t, activeRoute?.breadcrumbs),
    [groupLabel, navLabel, activeNavItem?.href, activeRoute?.breadcrumbs, t]
  );

  const quickActionGroups = useMemo(() => buildQuickActions(profile, t), [profile, t]);

  const navTargets = useMemo(
    () =>
      permittedItems.map((item) => {
        const badge = resolveBadge(item.badgeRule, profile, t);
        const tone = badge?.tone === "warning" ? "critical" : badge?.tone;
        return {
          href: item.href,
          primary: t(item.labelKey, item.labelFallback),
          secondary: t(item.labelKey, item.labelFallback),
          badge: badge && tone ? { label: badge.label, tone } : undefined,
        };
      }),
    [permittedItems, profile, t]
  );

  const quickActionSearchTargets = useMemo(
    () =>
      quickActionGroups.map((group) => ({
        id: group.id,
        title: group.title,
        subtitle: group.title,
        actions: group.actions.map((action) => {
          const tone = action.badge?.tone === "warning" ? "critical" : action.badge?.tone;
          return {
            href: action.href,
            primary: action.label,
            secondary: action.description,
            description: action.description,
            secondaryDescription: action.description,
            badge: action.badge && tone ? { label: action.badge.label, tone } : undefined,
          };
        }),
      })),
    [quickActionGroups]
  );

  const currentLayout = activeRoute?.layout ?? { assistant: "placeholder" as const };
  const assistantEnabled = currentLayout.assistant !== "hidden";

  return (
    <div className="relative flex min-h-screen bg-neutral-50 text-neutral-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-atlas-blue focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t("common.skipToContent", "Skip to content")}
      </a>

      <aside
        className={cn(
          "relative hidden h-screen flex-shrink-0 border-r border-neutral-200 bg-white shadow-sm lg:flex",
          navCollapsed ? "w-20" : "w-72"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-2 px-4 py-4">
            <button
              type="button"
              onClick={() => setNavCollapsed((value) => !value)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-atlas-blue/60"
              aria-label={
                navCollapsed
                  ? t("nav.expand", "Expand navigation")
                  : t("nav.collapse", "Collapse navigation")
              }
              aria-pressed={!navCollapsed}
            >
              {navCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
            <span
              className={cn(
                "text-sm font-semibold tracking-tight text-neutral-600",
                navCollapsed && "sr-only"
              )}
            >
              {t("brand.consoleTitle", "Ibimina staff console")}
            </span>
          </div>
          <nav
            className="flex-1 space-y-6 overflow-y-auto px-3 pb-6"
            aria-label={t("nav.primary", "Primary navigation")}
          >
            {groupsWithItems.map(({ group, items }) => (
              <div key={group.id}>
                <p
                  className={cn(
                    "px-3 text-xs font-semibold uppercase tracking-widest text-neutral-400",
                    navCollapsed && "sr-only"
                  )}
                >
                  {t(group.labelKey, group.labelFallback)}
                </p>
                <ul className="mt-2 space-y-1">
                  {items.map((item) => {
                    const Icon = ICON_MAP[item.icon];
                    const isActive = patternMatches(pathname ?? "", item.pattern);
                    const badge = resolveBadge(item.badgeRule, profile, t);
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                            isActive
                              ? "bg-atlas-blue/10 text-atlas-blue-dark shadow-sm"
                              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                          )}
                          aria-current={isActive ? "page" : undefined}
                          title={navCollapsed ? t(item.labelKey, item.labelFallback) : undefined}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          <span className={cn(navCollapsed && "sr-only")}>
                            {t(item.labelKey, item.labelFallback)}
                          </span>
                          {badge ? (
                            <span
                              className={cn(
                                "ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                                BADGE_CLASSES[badge.tone],
                                navCollapsed && "sr-only"
                              )}
                            >
                              {badge.label}
                            </span>
                          ) : null}
                          {badge && navCollapsed ? (
                            <span
                              className={cn(
                                "absolute right-2 top-2 h-1.5 w-1.5 rounded-full",
                                BADGE_DOT_CLASSES[badge.tone]
                              )}
                              aria-hidden="true"
                            />
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="px-4 pb-5">
            <OfflineQueueIndicator />
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-start gap-3 lg:items-center">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-atlas-blue/60 lg:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-label={t("nav.open", "Open navigation")}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0 space-y-1">
                <nav
                  aria-label={t("nav.breadcrumb", "Breadcrumb")}
                  className="hidden text-xs font-medium text-neutral-500 sm:block"
                >
                  <ol className="flex flex-wrap items-center gap-1">
                    {breadcrumbs.map((crumb, index) => (
                      <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                        {crumb.href && index !== breadcrumbs.length - 1 ? (
                          <Link href={crumb.href} className="hover:text-neutral-700">
                            {crumb.label}
                          </Link>
                        ) : (
                          <span>{crumb.label}</span>
                        )}
                        {index < breadcrumbs.length - 1 ? <span aria-hidden="true">/</span> : null}
                      </li>
                    ))}
                  </ol>
                </nav>
                <h1 className="text-xl font-semibold text-neutral-900 sm:text-2xl">{pageTitle}</h1>
                {pageDescription ? (
                  <p className="text-sm text-neutral-600">{pageDescription}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-2">
                <LanguageSwitcher className="text-xs font-semibold" />
                <button
                  type="button"
                  onClick={() => setAssistantOpen((value) => !value)}
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition",
                    assistantOpen
                      ? "border-atlas-blue/60 bg-atlas-blue/10 text-atlas-blue-dark"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                  )}
                  aria-pressed={assistantOpen}
                >
                  <Bot className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("assistant.toggle", "Assistant")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCommandOpen(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-600 shadow-sm transition hover:border-neutral-300 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-atlas-blue/60"
                >
                  <Command className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("common.search", "Search")}</span>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-400">
                    ⌘K
                  </span>
                </button>
              </div>
              <SignOutButton className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400/60" />
            </div>
          </div>
        </header>

        <div
          className={cn(
            "mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 pb-24 pt-6 sm:px-6 lg:px-8",
            currentLayout?.fullWidth && "max-w-full px-0"
          )}
        >
          <main
            id="main-content"
            className={cn("flex-1", !currentLayout?.fullWidth && "space-y-6")}
          >
            {children}
          </main>

          {assistantEnabled ? (
            <aside
              className="hidden w-80 flex-shrink-0 flex-col rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm backdrop-blur xl:flex"
              aria-label={t("assistant.panel", "Assistant panel")}
            >
              {assistantOpen ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-neutral-700">
                      {t("assistant.title", "Atlas assistant")}
                    </p>
                    <button
                      type="button"
                      onClick={() => setAssistantOpen(false)}
                      className="rounded-lg border border-neutral-200 p-1 text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-800"
                      aria-label={t("assistant.close", "Close assistant")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-4 text-sm text-neutral-600">
                    {t(
                      "assistant.placeholder",
                      "Atlas copilots live here soon. Pin questions or send transcripts to teammates."
                    )}
                  </p>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-neutral-500">
                  <Bot className="h-8 w-8 text-atlas-blue" aria-hidden="true" />
                  <p className="text-sm font-medium">
                    {t("assistant.empty", "Assistant workspace is ready when you are.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAssistantOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
                  >
                    <Bot className="h-4 w-4" aria-hidden="true" />
                    {t("assistant.open", "Open assistant")}
                  </button>
                </div>
              )}
            </aside>
          ) : null}
        </div>

        {!currentLayout?.hideActionBar ? (
          <div className="sticky bottom-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-600">
                  {t("dashboard.quick.title", "Quick actions")}
                </span>
              </div>
              <div className="flex flex-1 flex-wrap gap-3">
                {quickActionGroups
                  .flatMap((group) => group.actions)
                  .map((action) => (
                    <Link
                      key={`${action.href}-${action.label}`}
                      href={action.href}
                      className={cn(
                        "group inline-flex min-w-[12rem] flex-1 items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                        QUICK_ACTION_TONE_CLASSES[action.tone]
                      )}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-neutral-800 group-hover:text-atlas-blue-dark">
                          {action.label}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">{action.description}</p>
                      </div>
                      {action.badge ? (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                            BADGE_CLASSES[action.badge.tone]
                          )}
                        >
                          {action.badge.label}
                        </span>
                      ) : null}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {mobileNavOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.primary", "Primary navigation")}
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            ref={mobileNavRef}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
                {t("brand.consoleTitle", "Ibimina staff console")}
              </span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg border border-neutral-200 p-2 text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-800"
                aria-label={t("nav.close", "Close navigation")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-6" aria-label={t("nav.primary", "Primary navigation")}>
              {groupsWithItems.map(({ group, items }) => (
                <div key={group.id}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    {t(group.labelKey, group.labelFallback)}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {items.map((item) => {
                      const Icon = ICON_MAP[item.icon];
                      const isActive = patternMatches(pathname ?? "", item.pattern);
                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                              isActive
                                ? "bg-atlas-blue/10 text-atlas-blue-dark"
                                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{t(item.labelKey, item.labelFallback)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>
      ) : null}

      {assistantOpen && assistantEnabled ? (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm xl:hidden">
          <div className="absolute inset-x-4 bottom-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-800">
                {t("assistant.title", "Atlas assistant")}
              </p>
              <button
                type="button"
                onClick={() => setAssistantOpen(false)}
                className="rounded-lg border border-neutral-200 p-2 text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-800"
                aria-label={t("assistant.close", "Close assistant")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-neutral-600">
              {t(
                "assistant.placeholder",
                "Atlas copilots live here soon. Pin questions or send transcripts to teammates."
              )}
            </p>
          </div>
        </div>
      ) : null}

      <GlobalSearchDialog
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        profile={profile}
        navItems={navTargets}
        quickActions={quickActionSearchTargets}
      />
    </div>
  );
}
