"use client";

import { motion } from "framer-motion";
import { Home, FileText, CheckSquare, Users, Menu } from "lucide-react";
import { cn } from "../utils/cn";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const defaultNavItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: FileText, label: "Work", path: "/work" },
  { icon: CheckSquare, label: "Tasks", path: "/tasks" },
  { icon: Users, label: "Members", path: "/member" },
  { icon: Menu, label: "More", path: "/more" },
];

interface MobileNavProps {
  navItems?: NavItem[];
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export function MobileNav({
  navItems = defaultNavItems,
  currentPath = "/",
  onNavigate,
}: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur border-t z-50 safe-area-pb">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;

          return (
            <button
              key={item.path}
              onClick={() => onNavigate?.(item.path)}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                className={cn(
                  "flex flex-col items-center gap-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.div>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 h-0.5 w-12 bg-primary rounded-t-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
