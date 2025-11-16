"use client";

import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Command, Menu, Plus, Settings2 } from "lucide-react";
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
import { useFocusTrap } from "@/src/lib/a11y/useFocusTrap";
import {
  BADGE_TONE_STYLES,
  createQuickActionGroups,
  type QuickActionGroupDefinition,
} from "./quick-actions";

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

  const quickActionGroups = useMemo(
    () => createQuickActionGroups(t, profile),
    [profile, t]
  );

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
                  <Plus className="h-4 w-4" aria-hidden="true" />
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
        badges={navTargets.reduce<Partial<Record<string, UiNavTarget["badge"]>>>((acc, item) => {
          if (item.badge) {
            acc[item.href] = item.badge;
          }
          return acc;
        }, {})}
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
