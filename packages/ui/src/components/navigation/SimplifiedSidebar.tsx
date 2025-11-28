"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Search, Plus } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "../../utils/cn";

export interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  path: string;
  children?: Array<{
    label: string;
    path: string;
  }>;
}

export interface SimplifiedSidebarProps {
  items: NavItem[];
  logo?: {
    icon: ComponentType<{ className?: string }>;
    text: string;
    href: string;
  };
  onSearch?: () => void;
  onCreate?: () => void;
  defaultCollapsed?: boolean;
}

/**
 * SimplifiedSidebar Component
 *
 * A collapsible sidebar navigation for desktop interfaces.
 * Features nested navigation, search shortcut, and quick create button.
 *
 * @example
 * ```tsx
 * import { Home, FileText, Users } from "lucide-react";
 * 
 * const navItems = [
 *   { id: 'home', label: 'Home', icon: Home, path: '/' },
 *   { id: 'work', label: 'Work', icon: FileText, path: '/work',
 *     children: [
 *       { label: 'Documents', path: '/documents' },
 *       { label: 'Clients', path: '/clients' },
 *     ]
 *   },
 *   { id: 'team', label: 'Team', icon: Users, path: '/team' },
 * ];
 * 
 * <SimplifiedSidebar 
 *   items={navItems}
 *   onSearch={() => setSearchOpen(true)}
 *   onCreate={() => setCreateModalOpen(true)}
 * />
 * ```
 */
export function SimplifiedSidebar({
  items,
  logo,
  onSearch,
  onCreate,
  defaultCollapsed = false,
}: SimplifiedSidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-screen bg-background border-r border-neutral-200 dark:border-neutral-800 flex flex-col"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-neutral-200 dark:border-neutral-800">
        {logo ? (
          <Link href={logo.href} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <logo.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-semibold text-foreground"
                >
                  {logo.text}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary" />
        )}
      </div>

      {/* Search */}
      {onSearch && (
        <div className="p-3">
          <button
            onClick={onSearch}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
              "bg-muted/50 hover:bg-muted text-muted-foreground text-sm",
              "transition-colors"
            )}
          >
            <Search className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Search...</span>
                <kbd className="text-xs bg-background px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700">
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>
      )}

      {/* Quick Create */}
      {onCreate && (
        <div className="px-3 pb-3">
          <button
            onClick={onCreate}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "transition-colors"
            )}
          >
            <Plus className="w-4 h-4" />
            {!collapsed && <span>Create</span>}
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-1">
          {items.map((item) => (
            <NavItemComponent
              key={item.id}
              item={item}
              collapsed={collapsed}
              expanded={expandedItem === item.id}
              onExpand={() =>
                setExpandedItem(expandedItem === item.id ? null : item.id)
              }
              active={Boolean(
                pathname === item.path ||
                item.children?.some((c) => pathname === c.path)
              )}
            />
          ))}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform",
              collapsed ? "" : "rotate-180"
            )}
          />
        </button>
      </div>
    </motion.aside>
  );
}

interface NavItemComponentProps {
  item: NavItem;
  collapsed: boolean;
  expanded: boolean;
  onExpand: () => void;
  active: boolean;
}

function NavItemComponent({
  item,
  collapsed,
  expanded,
  onExpand,
  active,
}: NavItemComponentProps) {
  const pathname = usePathname();
  const hasChildren = Boolean(item.children && item.children.length > 0);

  return (
    <li>
      <Link
        href={hasChildren ? "#" : item.path}
        onClick={hasChildren ? (e) => { e.preventDefault(); onExpand(); } : undefined}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
          active
            ? "bg-primary/10 text-primary dark:bg-primary/20"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {hasChildren && (
              <ChevronRight
                className={cn(
                  "w-4 h-4 transition-transform",
                  expanded && "rotate-90"
                )}
              />
            )}
          </>
        )}
      </Link>

      {/* Children */}
      <AnimatePresence>
        {!collapsed && expanded && hasChildren && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-8 mt-1 space-y-1 overflow-hidden"
          >
            {item.children!.map((child) => (
              <li key={child.path}>
                <Link
                  href={child.path}
                  className={cn(
                    "block px-3 py-1.5 rounded-lg text-sm transition-colors",
                    pathname === child.path
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {child.label}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}
