/**
 * Bottom Navigation Component
 *
 * Provides the main navigation bar for the client app with large touch targets
 * and clear icon-first navigation following mobile best practices.
 *
 * Features:
 * - 5 main sections: Home, Groups, Pay, Statements, Profile
 * - Large hit areas (≥48px) for accessibility
 * - Icon-first design with short labels
 * - Active state indication
 * - WCAG 2.1 AA compliant
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IoCardOutline,
  IoDocumentTextOutline,
  IoHomeOutline,
  IoPeopleOutline,
  IoPersonOutline,
} from "react-icons/io5";
import type { IconType } from "react-icons";

interface NavItem {
  href: string;
  icon: IconType;
  label: string;
  ariaLabel: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/home",
    icon: IoHomeOutline,
    label: "Home",
    ariaLabel: "Navigate to home page",
  },
  {
    href: "/groups",
    icon: IoPeopleOutline,
    label: "Groups",
    ariaLabel: "Navigate to groups page",
  },
  {
    href: "/pay",
    icon: IoCardOutline,
    label: "Pay",
    ariaLabel: "Navigate to payment page",
  },
  {
    href: "/statements",
    icon: IoDocumentTextOutline,
    label: "Statements",
    ariaLabel: "Navigate to statements page",
  },
  {
    href: "/profile",
    icon: IoPersonOutline,
    label: "Profile",
    ariaLabel: "Navigate to profile page",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom"
      aria-label="Main navigation"
    >
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label, ariaLabel }) => {
          const isActive = pathname === href || pathname?.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-label={ariaLabel}
              className={
                "flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-3 py-2 rounded-xl transition-all duration-interactive focus:outline-none focus:ring-2 focus:ring-atlas-blue/30 focus:ring-offset-2 " +
                (isActive
                  ? "text-atlas-blue bg-atlas-glow font-bold"
                  : "text-neutral-700 hover:text-atlas-blue hover:bg-neutral-50")
              }
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className="w-6 h-6 mb-1 transition-transform duration-interactive"
                size={22}
                aria-hidden="true"
              />
              <span
                className={
                  "text-xs font-medium transition-all duration-interactive " +
                  (isActive ? "font-bold" : "")
                }
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
