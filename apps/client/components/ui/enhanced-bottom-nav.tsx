/**
 * Enhanced Bottom Navigation Component with Feature Flags
 *
 * Provides the main navigation bar for the client app with feature-flagged items.
 * New items (Loans, Wallet) appear only when their respective features are enabled.
 *
 * Features:
 * - Dynamic navigation based on feature flags
 * - Large hit areas (≥48px) for accessibility
 * - Icon-first design with short labels
 * - Active state indication
 * - WCAG 2.1 AA compliant
 */

"use client";

import { Home, Users, CreditCard, FileText, User, Wallet, HandCoins } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { useMemo } from "react";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  ariaLabel: string;
  featureFlag?: string; // Optional feature flag requirement
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    href: "/home",
    icon: Home,
    label: "Home",
    ariaLabel: "Navigate to home page",
  },
  {
    href: "/groups",
    icon: Users,
    label: "Groups",
    ariaLabel: "Navigate to groups page",
  },
  {
    href: "/pay",
    icon: CreditCard,
    label: "Pay",
    ariaLabel: "Navigate to payment page",
  },
  {
    href: "/loans",
    icon: HandCoins,
    label: "Loans",
    ariaLabel: "Navigate to loans page",
    featureFlag: "loans-enabled",
  },
  {
    href: "/wallet",
    icon: Wallet,
    label: "Wallet",
    ariaLabel: "Navigate to wallet page",
    featureFlag: "wallet-enabled",
  },
  {
    href: "/statements",
    icon: FileText,
    label: "Statements",
    ariaLabel: "Navigate to statements page",
  },
  {
    href: "/profile",
    icon: User,
    label: "Profile",
    ariaLabel: "Navigate to profile page",
  },
];

const ADVANCED_MODULE_FLAGS = new Set(["loans-enabled", "wallet-enabled"]);

export function BottomNav() {
  const pathname = usePathname();
  const { isEnabled } = useFeatureFlags();
  const advancedModulesEnabled = isEnabled("advanced-modules");

  // Filter nav items based on feature flags
  const navItems = useMemo(() => {
    return ALL_NAV_ITEMS.filter((item) => {
      // If no feature flag is required, always show
      if (!item.featureFlag) return true;
      // Hide advanced modules behind the aggregate toggle
      if (ADVANCED_MODULE_FLAGS.has(item.featureFlag) && !advancedModulesEnabled) {
        return false;
      }
      // Otherwise, check if feature is enabled
      return isEnabled(item.featureFlag);
    });
  }, [advancedModulesEnabled, isEnabled]);

  // Limit to 5 items for optimal mobile UX
  const displayItems = navItems.slice(0, 5);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-2">
        {displayItems.map(({ href, icon: Icon, label, ariaLabel }) => {
          const isActive = pathname === href || pathname?.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-col items-center justify-center
                min-w-[64px] min-h-[48px] px-3 py-2
                rounded-lg transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${
                  isActive
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }
              `}
              aria-label={ariaLabel}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-6 h-6 mb-1" aria-hidden="true" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
