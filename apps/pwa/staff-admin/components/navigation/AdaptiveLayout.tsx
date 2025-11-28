"use client";

import { ReactNode } from 'react';
import { useResponsive } from '@ibimina/ui';
import { SimplifiedSidebar } from './SimplifiedSidebar';
import { MobileNav } from './MobileNav';
import { Header } from './Header';

interface AdaptiveLayoutProps {
  children: ReactNode;
}

export function AdaptiveLayout({ children }: AdaptiveLayoutProps) {
  const { isMobile, isDesktop } = useResponsive();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: Sidebar + Content */}
      {isDesktop && (
        <div className="flex">
          <SimplifiedSidebar />
          <main className="flex-1 min-h-screen">
            <Header />
            <div className="p-6">{children}</div>
          </main>
        </div>
      )}

      {/* Mobile: Bottom Nav + Content */}
      {isMobile && (
        <div className="flex flex-col min-h-screen">
          <Header compact />
          <main className="flex-1 p-4 pb-20">{children}</main>
          <MobileNav />
        </div>
      )}

      {/* Tablet: Collapsible Sidebar */}
      {!isMobile && !isDesktop && (
        <div className="flex">
          <SimplifiedSidebar defaultCollapsed />
          <main className="flex-1 min-h-screen">
            <Header />
            <div className="p-4">{children}</div>
          </main>
        </div>
      )}
    </div>
  );
}
