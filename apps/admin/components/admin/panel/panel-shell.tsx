"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChartBig,
  Bot,
  Building2,
  Flag,
  Inbox,
  LayoutDashboard,
  Menu,
  Megaphone,
  Scan,
  ScrollText,
  Settings2,
  SlidersHorizontal,
  UsersRound,
  UserSquare2,
  UserCog,
  Wallet,
  X,
  Workflow,
} from "lucide-react";
import type { ProfileRow } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { AdminPanelTopBar } from "@/components/admin/panel/top-bar";
import type { PanelBadgeTone, PanelIconKey, TenantOption } from "@/components/admin/panel/types";
import { ADMIN_NAV_LINKS } from "@/components/admin/panel/nav-items";
import { AdminPanelShortcuts } from "@/components/admin/panel/shortcuts";

interface AdminPanelShellProps {
  children: React.ReactNode;
  profile: ProfileRow;
  tenantOptions: TenantOption[];
  alertsCount: number;
  alertsBreakdown: { approvals: number; reconciliation: number };
}

type PanelNavItem = {
  href: string;
  label: string;
  icon: PanelIconKey;
  badge?: { label: string; tone: PanelBadgeTone } | null;
};

const ICON_MAP: Record<PanelIconKey, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  saccos: Building2,
  groups: UsersRound,
  members: UserSquare2,
  loans: Workflow,
  staff: UserCog,
  approvals: Inbox,
  reconciliation: Wallet,
  payments: SlidersHorizontal,
  ocr: Scan,
  notifications: Megaphone,
  reports: BarChartBig,
  settings: Settings2,
  audit: ScrollText,
  "feature-flags": Flag,
  support: Bot,
};

export function AdminPanelShell({
  children,
  profile,
  tenantOptions,
  alertsCount,
  alertsBreakdown,
}: AdminPanelShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  const activePath = useMemo(() => {
    if (!pathname) return "/admin";
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[0] === "admin") {
      return `/${parts.slice(0, 2).join("/")}`;
    }
    return "/admin";
  }, [pathname]);

  const saccoFilterValue = searchParams.get("sacco");
  const saccoFilter = useMemo(() => saccoFilterValue ?? null, [saccoFilterValue]);

  const navItems: PanelNavItem[] = useMemo(() => {
    return ADMIN_NAV_LINKS.map((item) => {
      if (item.href === "/admin/approvals" && alertsBreakdown.approvals > 0) {
        return {
          ...item,
          badge: { label: String(alertsBreakdown.approvals), tone: "warning" },
        };
      }
      if (item.href === "/admin/reconciliation" && alertsBreakdown.reconciliation > 0) {
        return {
          ...item,
          badge: { label: String(alertsBreakdown.reconciliation), tone: "critical" },
        };
      }
      return { ...item, badge: null } satisfies PanelNavItem;
    });
  }, [alertsBreakdown]);

  const nav = (
    <nav className="flex h-full flex-col gap-1.5 overflow-y-auto p-3">
      {navItems.map((item) => {
        const Icon = ICON_MAP[item.icon];
        const isActive = activePath === item.href;
        return (
          <Link
            key={item.href}
            href={{ pathname: item.href, query: saccoFilter ? { sacco: saccoFilter } : undefined }}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-interactive",
              isActive
                ? "bg-atlas-blue text-white shadow-atlas shadow-atlas-blue/30"
                : "text-neutral-600 hover:bg-atlas-blue/5 hover:text-atlas-blue-dark dark:text-neutral-300 dark:hover:bg-atlas-blue/10"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span
                className={cn(
                  "ml-auto inline-flex min-h-[1.25rem] items-center justify-center rounded-full px-2 text-[0.625rem] font-semibold uppercase tracking-wider",
                  item.badge.tone === "critical" &&
                    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
                  item.badge.tone === "warning" &&
                    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
                  item.badge.tone === "info" &&
                    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
                  item.badge.tone === "success" &&
                    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                )}
              >
                {item.badge.label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <AdminPanelShortcuts>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        <AdminPanelTopBar
          profile={profile}
          tenantOptions={tenantOptions}
          alertsCount={alertsCount}
          onToggleNav={() => setMobileOpen((value) => !value)}
          alertsBreakdown={alertsBreakdown}
        />
        <div className="flex flex-1">
          <aside className="hidden w-64 flex-shrink-0 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:block">
            {nav}
          </aside>
          <div className="flex-1">
            <div className="px-4 pb-12 pt-20 sm:px-6 lg:px-10">{children}</div>
          </div>
        </div>
        <div className="lg:hidden">
          <button
            type="button"
            className="fixed bottom-4 right-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-atlas-blue text-white shadow-atlas shadow-atlas-blue/40 transition-all duration-interactive hover:bg-atlas-blue-dark hover:shadow-lg"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {mobileOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              role="presentation"
            >
              <div
                className="absolute inset-x-4 bottom-20 rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation menu"
              >
                {nav}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminPanelShortcuts>
  );
}
