"use client";

import { Bell, Search, User } from 'lucide-react';
import { cn } from '@ibimina/ui';

interface HeaderProps {
  compact?: boolean;
}

export function Header({ compact = false }: HeaderProps) {
  return (
    <header className={cn('border-b bg-background', compact ? 'h-12' : 'h-14')}>
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex-1">
          {!compact && <h1 className="text-lg font-semibold">Ibimina SACCO</h1>}
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
