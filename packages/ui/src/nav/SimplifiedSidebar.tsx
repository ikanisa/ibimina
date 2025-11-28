"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  FileText,
  CheckSquare,
  Users,
  Settings,
  ChevronRight,
  Search,
  Plus,
} from "lucide-react";
import { cn } from "../utils/cn";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  children?: { label: string; path: string }[];
}

const defaultNavigation: NavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    path: "/",
  },
  {
    id: "work",
    label: "Work",
    icon: FileText,
    path: "/work",
    children: [
      { label: "Documents", path: "/documents" },
      { label: "Tasks", path: "/tasks" },
    ],
  },
  {
    id: "members",
    label: "Members",
    icon: Users,
    path: "/member",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

interface SimplifiedSidebarProps {
  navigation?: NavItem[];
  currentPath?: string;
  onNavigate?: (path: string) => void;
  logoText?: string;
  showSearch?: boolean;
  showCreate?: boolean;
}

export function SimplifiedSidebar({
  navigation = defaultNavigation,
  currentPath = "/",
  onNavigate,
  logoText = "SACCO",
  showSearch = true,
  showCreate = true,
}: SimplifiedSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-screen bg-background border-r flex flex-col"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">{logoText.charAt(0)}</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-semibold"
              >
                {logoText}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="p-3">
          <button
            onClick={() =>
              document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
            }
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg",
              "bg-muted/50 hover:bg-muted text-muted-foreground text-sm",
              "transition-colors"
            )}
          >
            <Search className="w-4 h-4" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Search...</span>
                <kbd className="text-xs bg-background px-1.5 py-0.5 rounded border">⌘K</kbd>
              </>
            )}
          </button>
        </div>
      )}

      {/* Quick Create */}
      {showCreate && (
        <div className="px-3 pb-3">
          <button
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
          {navigation.map((item) => (
            <NavItemComponent
              key={item.id}
              item={item}
              collapsed={collapsed}
              expanded={expandedItem === item.id}
              onExpand={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              active={
                currentPath === item.path ||
                Boolean(item.children?.some((c) => currentPath === c.path))
              }
              currentPath={currentPath}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ChevronRight
            className={cn("w-4 h-4 transition-transform", collapsed ? "" : "rotate-180")}
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
  currentPath: string;
  onNavigate?: (path: string) => void;
}

function NavItemComponent({
  item,
  collapsed,
  expanded,
  onExpand,
  active,
  currentPath,
  onNavigate,
}: NavItemComponentProps) {
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      onExpand();
    } else {
      onNavigate?.(item.path);
    }
  };

  return (
    <li>
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {hasChildren && (
              <ChevronRight
                className={cn("w-4 h-4 transition-transform", expanded && "rotate-90")}
              />
            )}
          </>
        )}
      </button>

      {/* Children */}
      <AnimatePresence>
        {!collapsed && expanded && hasChildren && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-8 mt-1 space-y-1 overflow-hidden"
          >
            {item.children?.map((child) => (
              <li key={child.path}>
                <button
                  onClick={() => onNavigate?.(child.path)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors",
                    currentPath === child.path
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {child.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}
