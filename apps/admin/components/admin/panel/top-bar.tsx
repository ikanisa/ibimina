"use client";

import { useMemo, useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import type { ProfileRow } from "@/lib/auth";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { GlobalSearchDialog } from "@/components/layout/global-search-dialog";
import { OfflineQueueIndicator } from "@/components/system/offline-queue-indicator";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { TenantSwitcher } from "@/components/admin/panel/tenant-switcher";
import type { PanelNavItem, TenantOption } from "@/components/admin/panel/types";

interface AdminPanelTopBarProps {
  profile: ProfileRow;
  tenantOptions: TenantOption[];
  alertsCount: number;
  onToggleNav: () => void;
  navItems: PanelNavItem[];
}

export function AdminPanelTopBar({ profile, tenantOptions, alertsCount, onToggleNav, navItems }: AdminPanelTopBarProps) {
  const [showSearch, setShowSearch] = useState(false);
  const navTargets = useMemo(
    () =>
      navItems.map((item) => ({
        href: item.href,
        primary: item.label,
        secondary: "",
        badge: item.badge
          ? {
              label: item.badge.label,
              tone: item.badge.tone === "warning" ? "critical" : (item.badge.tone as "critical" | "info" | "success"),
            }
          : undefined,
      })),
    [navItems],
  );

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/5 bg-neutral-950/70 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleNav}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-0 lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <TenantSwitcher options={tenantOptions} className="hidden md:flex" />
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
          <TenantSwitcher options={tenantOptions} className="md:hidden" />
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-1 shadow-sm transition hover:bg-white/10"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold text-neutral-3 sm:inline">⌘K</kbd>
          </button>
          <div className="relative inline-flex items-center">
            <Bell className="h-5 w-5 text-neutral-3" aria-hidden />
            {alertsCount > 0 && (
              <span className="absolute -right-2 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 text-[11px] font-semibold text-neutral-950">
                {alertsCount}
              </span>
            )}
          </div>
          <OfflineQueueIndicator />
          <LanguageSwitcher variant="compact" />
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-left sm:flex">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neutral-3">{profile.role}</p>
              <p className="text-sm font-medium text-neutral-0">{profile.email}</p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <SignOutButton variant="ghost" className="text-xs uppercase tracking-[0.3em] text-neutral-3" />
          </div>
        </div>
      </div>
      <GlobalSearchDialog
        open={showSearch}
        onClose={() => setShowSearch(false)}
        profile={profile}
        navItems={navTargets}
        quickActions={[]}
      />
    </header>
  );
}
