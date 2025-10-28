"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChartBig,
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

  const activePath = useMemo(() => {
    if (!pathname) return "/admin";
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[0] === "admin") {
      return `/${parts.slice(0, 2).join("/")}`;
    }
    return "/admin";
  }, [pathname]);

  const saccoFilter = useMemo(() => searchParams?.get("sacco") ?? null, [searchParams]);

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
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      {navItems.map((item) => {
        const Icon = ICON_MAP[item.icon];
        const isActive = activePath === item.href;
        return (
          <Link
            key={item.href}
            href={{ pathname: item.href, query: saccoFilter ? { sacco: saccoFilter } : undefined }}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
              "text-neutral-3 hover:bg-white/5 hover:text-neutral-0",
              isActive && "bg-white/10 text-neutral-0 shadow-inner"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span
                className={cn(
                  "ml-auto inline-flex min-h-[1.25rem] items-center justify-center rounded-full px-2 text-[0.625rem] uppercase tracking-[0.2em]",
                  item.badge.tone === "critical" && "bg-red-500/20 text-red-100",
                  item.badge.tone === "warning" && "bg-amber-500/20 text-amber-100",
                  item.badge.tone === "info" && "bg-sky-500/15 text-sky-100",
                  item.badge.tone === "success" && "bg-emerald-500/20 text-emerald-100"
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
      <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(70,100,255,0.18),_transparent_55%)]">
        <AdminPanelTopBar
          profile={profile}
          tenantOptions={tenantOptions}
          alertsCount={alertsCount}
          onToggleNav={() => setMobileOpen((value) => !value)}
          alertsBreakdown={alertsBreakdown}
        />
        <div className="flex flex-1">
          <aside className="hidden w-64 flex-shrink-0 border-r border-white/5 bg-white/5 backdrop-blur lg:block">
            {nav}
          </aside>
          <div className="flex-1">
            <div className="px-4 pb-12 pt-20 sm:px-6 lg:px-10">{children}</div>
          </div>
        </div>
        <div className="lg:hidden">
          <button
            type="button"
            className="fixed bottom-4 right-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-neutral-0 shadow-lg shadow-black/30 backdrop-blur"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {mobileOpen && (
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur">
              <div className="absolute inset-x-4 bottom-20 rounded-2xl border border-white/10 bg-neutral-950/95 shadow-xl">
                {nav}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminPanelShortcuts>
  );
}
