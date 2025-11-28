"use client";

import { motion } from 'framer-motion';
import { Home, FileText, CheckSquare, Users, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@ibimina/ui';

const navItems = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: Users, label: 'Members', path: '/members' },
  { icon: FileText, label: 'Savings', path: '/savings' },
  { icon: CheckSquare, label: 'Loans', path: '/loans' },
  { icon: Menu, label: 'More', path: '/more' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur border-t z-50 safe-area-pb">
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path);

          return (
            <Link key={item.path} href={item.path} className="flex flex-col items-center justify-center flex-1 h-full">
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                className={cn('flex flex-col items-center gap-1', isActive ? 'text-primary' : 'text-muted-foreground')}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.div>
              {isActive && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 h-0.5 w-12 bg-primary rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
