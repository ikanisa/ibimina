"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ComponentType } from "react";
import { cn } from "../../utils/cn";

export interface MobileNavItem {
  icon: ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

export interface MobileNavProps {
  items: MobileNavItem[];
  className?: string;
}

/**
 * MobileNav Component
 *
 * Bottom tab navigation bar for mobile devices.
 * Features active indicator animation and safe area support.
 * Recommended: 5 items maximum for optimal UX.
 *
 * @example
 * ```tsx
 * import { Home, FileText, Users, Settings } from "lucide-react";
 * 
 * const navItems = [
 *   { icon: Home, label: 'Home', path: '/' },
 *   { icon: FileText, label: 'Work', path: '/work' },
 *   { icon: Users, label: 'Team', path: '/team' },
 *   { icon: Settings, label: 'Settings', path: '/settings' },
 * ];
 * 
 * <MobileNav items={navItems} />
 * ```
 */
export function MobileNav({ items, className }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur",
        "border-t border-neutral-200 dark:border-neutral-800",
        "safe-area-pb z-50",
        className
      )}
    >
      <div className="flex items-center justify-around h-full px-2">
        {items.map((item) => {
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex flex-col items-center gap-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.div>

              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 h-0.5 w-12 bg-primary rounded-t-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
