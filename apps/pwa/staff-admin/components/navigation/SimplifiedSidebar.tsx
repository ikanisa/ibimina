"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FileText,
  CheckSquare,
  Users,
  Settings,
  ChevronRight,
  Search,
  Plus,
} from 'lucide-react';
import { cn } from '@ibimina/ui';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navigation = [
  {
    id: 'home',
    label: 'Dashboard',
    icon: Home,
    path: '/dashboard',
  },
  {
    id: 'members',
    label: 'Members',
    icon: Users,
    path: '/members',
    children: [
      { label: 'All Members', path: '/members' },
      { label: 'Pending Approval', path: '/members/pending' },
      { label: 'Groups', path: '/members/groups' },
    ],
  },
  {
    id: 'savings',
    label: 'Savings',
    icon: FileText,
    path: '/savings',
    children: [
      { label: 'Accounts', path: '/savings/accounts' },
      { label: 'Products', path: '/savings/products' },
      { label: 'Transactions', path: '/savings/transactions' },
    ],
  },
  {
    id: 'loans',
    label: 'Loans',
    icon: CheckSquare,
    path: '/loans',
    children: [
      { label: 'Applications', path: '/loans/applications' },
      { label: 'Active Loans', path: '/loans/active' },
      { label: 'Products', path: '/loans/products' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

interface SimplifiedSidebarProps {
  defaultCollapsed?: boolean;
}

export function SimplifiedSidebar({ defaultCollapsed = false }: SimplifiedSidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="h-screen bg-background border-r flex flex-col"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">I</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-semibold"
              >
                Ibimina SACCO
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Search */}
      <div className="p-3">
        <button
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-muted/50 hover:bg-muted text-muted-foreground text-sm',
            'transition-colors'
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

      {/* Quick Create */}
      <div className="px-3 pb-3">
        <button
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'transition-colors'
          )}
        >
          <Plus className="w-4 h-4" />
          {!collapsed && <span>New</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              collapsed={collapsed}
              expanded={expandedItem === item.id}
              onExpand={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              active={pathname === item.path || item.children?.some((c) => pathname === c.path)}
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
            className={cn('w-4 h-4 transition-transform', collapsed ? '' : 'rotate-180')}
          />
        </button>
      </div>
    </motion.aside>
  );
}

interface NavItemProps {
  item: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    path: string;
    children?: Array<{ label: string; path: string }>;
  };
  collapsed: boolean;
  expanded: boolean;
  onExpand: () => void;
  active: boolean;
}

function NavItem({ item, collapsed, expanded, onExpand, active }: NavItemProps) {
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;

  return (
    <li>
      <Link
        href={hasChildren ? '#' : item.path}
        onClick={hasChildren ? (e) => { e.preventDefault(); onExpand(); } : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
          active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {hasChildren && (
              <ChevronRight
                className={cn('w-4 h-4 transition-transform', expanded && 'rotate-90')}
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
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-8 mt-1 space-y-1 overflow-hidden"
          >
            {item.children.map((child) => (
              <li key={child.path}>
                <Link
                  href={child.path}
                  className={cn(
                    'block px-3 py-1.5 rounded-lg text-sm transition-colors',
                    pathname === child.path ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
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
