"use client";

import { useEffect, useMemo, useState } from "react";
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
import { OfflineQueueIndicator } from "@/components/system/offline-queue-indicator";

interface AppShellProps {
  children: React.ReactNode;
  profile: ProfileRow;
}

const NAV_ITEMS = [
  { href: "/dashboard" as const, key: "nav.dashboard", icon: LayoutDashboard },
  { href: "/ikimina" as const, key: "nav.ikimina", icon: Workflow },
  { href: "/recon" as const, key: "nav.recon", icon: Inbox },
  { href: "/analytics" as const, key: "nav.analytics", icon: LineChart },
  { href: "/reports" as const, key: "nav.reports", icon: BarChartBig },
  { href: "/admin" as const, key: "nav.admin", icon: UsersRound },
];

const QUICK_ACTIONS = [
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
  {
    href: "/profile" as const,
    primary: "Account Security",
    secondary: "Umutekano w'uburenganzira",
    description: "Update password and authenticator settings.",
    secondaryDescription: "Hindura ijambobanga n'uburyo bwa 2FA.",
  },
];

export function AppShell({ children, profile }: AppShellProps) {
  const pathname = usePathname();
  const [showActions, setShowActions] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const { t } = useTranslation();

  const saccoName = useMemo(() => profile.saccos?.name ?? t("sacco.all", "All SACCOs"), [profile.saccos?.name, t]);

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

  const navTargets = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        href: item.href,
        primary: t(item.key),
        secondary: t(item.key),
      })),
    [t]
  );

  const quickActionTargets = useMemo(
    () =>
      QUICK_ACTIONS.map((action) => ({
        href: action.href,
        primary: action.primary,
        secondary: action.secondary,
        description: action.description,
        secondaryDescription: action.secondaryDescription,
      })),
    []
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
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" aria-hidden />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-2">{t("brand.org", "Umurenge SACCO")}</p>
              <span className="text-gradient text-2xl font-semibold leading-tight">{t("brand.consoleTitle", "Ibimina Staff Console")}</span>
              <span className="text-sm text-neutral-2">{saccoName}</span>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
              <nav className="hidden items-center gap-2 text-sm font-medium md:flex">
                {navTargets.map(({ href, primary }, idx) => {
                  const Icon = NAV_ITEMS[idx].icon;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "interactive-scale flex items-center gap-2 rounded-full px-4 py-2 text-left text-xs uppercase tracking-[0.25em] transition",
                        isActive(href)
                          ? "bg-white/20 text-neutral-0"
                          : "text-neutral-2 hover:bg-white/10 hover:text-neutral-0"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      <span className="leading-tight">{primary}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="flex items-center gap-3">
                <LanguageSwitcher className="hidden text-[10px] md:flex" />
                <button
                  type="button"
                  onClick={() => setShowGlobalSearch(true)}
                  className="interactive-scale inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-0 transition hover:border-white/25 hover:text-neutral-0"
                  aria-haspopup="dialog"
                  aria-expanded={showGlobalSearch}
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

      <nav className="fixed inset-x-0 bottom-5 z-40 mx-auto flex w-[min(420px,92%)] items-center justify-between rounded-3xl border border-white/10 bg-ink/90 px-4 py-3 backdrop-blur md:hidden">
        {NAV_ITEMS.map(({ href, key, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "interactive-scale flex flex-col items-center text-[11px] font-medium uppercase tracking-[0.2em]",
              isActive(href) ? "text-neutral-0" : "text-neutral-2"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="mt-1">{t(key)}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setShowActions((v) => !v)}
          className="interactive-scale absolute left-1/2 top-0 flex -translate-y-1/2 -translate-x-1/2 items-center gap-2 rounded-full bg-kigali px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-ink shadow-glass"
          aria-expanded={showActions}
          aria-controls="quick-actions"
        >
          <Plus className="h-4 w-4" />
          <span className="flex flex-col text-left leading-none">
            <span>New</span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-ink/70">Gishya</span>
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
            aria-label="Quick actions"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-2 text-neutral-2">
              <ListPlus className="h-4 w-4" />
              <span className="items-center gap-2 text-xs">{t("dashboard.quick.title", "Quick actions")}</span>
            </div>
            <ul className="space-y-3">
              {QUICK_ACTIONS.map((action) => (
                <li key={action.primary}>
                  <Link
                    href={action.href}
                    onClick={() => setShowActions(false)}
                    className="interactive-scale block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-neutral-0 transition hover:bg-white/10"
                  >
                    <p className="font-medium text-sm">{action.primary}</p>
                    <p className="text-xs text-neutral-2">{action.description}</p>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-2">{action.secondary}</p>
                    <p className="text-[11px] text-neutral-2">{action.secondaryDescription}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setShowActions(false)}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-neutral-2"
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
