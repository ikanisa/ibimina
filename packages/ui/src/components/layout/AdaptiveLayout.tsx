"use client";

import type { ReactNode } from "react";
import { useResponsive } from "../../hooks/useResponsive";
import { SimplifiedSidebar } from "../navigation/SimplifiedSidebar";
import { MobileNav } from "../navigation/MobileNav";
import type { NavItem, MobileNavItem } from "../navigation";

export interface AdaptiveLayoutProps {
  children: ReactNode;
  navigation: NavItem[];
  mobileNavigation?: MobileNavItem[];
  header?: ReactNode;
  logo?: {
    icon: React.ComponentType<{ className?: string }>;
    text: string;
    href: string;
  };
  onSearch?: () => void;
  onCreate?: () => void;
}

/**
 * AdaptiveLayout Component
 *
 * Responsive layout that adapts navigation based on screen size:
 * - Desktop (lg+): Sidebar + Header + Content
 * - Mobile (xs-sm): Header + Content + Bottom Nav
 * - Tablet (md): Collapsible Sidebar + Header + Content
 *
 * @example
 * ```tsx
 * import { Home, FileText, Users } from "lucide-react";
 * 
 * const navItems = [
 *   { id: 'home', label: 'Home', icon: Home, path: '/' },
 *   { id: 'work', label: 'Work', icon: FileText, path: '/work' },
 *   { id: 'team', label: 'Team', icon: Users, path: '/team' },
 * ];
 * 
 * const mobileNav = navItems.map(item => ({
 *   icon: item.icon,
 *   label: item.label,
 *   path: item.path
 * }));
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <AdaptiveLayout
 *       navigation={navItems}
 *       mobileNavigation={mobileNav}
 *       header={<Header />}
 *       onSearch={() => setSearchOpen(true)}
 *     >
 *       {children}
 *     </AdaptiveLayout>
 *   );
 * }
 * ```
 */
export function AdaptiveLayout({
  children,
  navigation,
  mobileNavigation,
  header,
  logo,
  onSearch,
  onCreate,
}: AdaptiveLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Use navigation items for mobile nav if not provided
  const mobileNav =
    mobileNavigation ||
    navigation.map((item) => ({
      icon: item.icon,
      label: item.label,
      path: item.path,
    }));

  // Desktop: Sidebar + Content
  if (isDesktop) {
    return (
      <div className="flex min-h-screen">
        <SimplifiedSidebar
          items={navigation}
          logo={logo}
          onSearch={onSearch}
          onCreate={onCreate}
        />
        <main className="flex-1 min-h-screen">
          {header && <div className="sticky top-0 z-40">{header}</div>}
          <div className="p-6">{children}</div>
        </main>
      </div>
    );
  }

  // Mobile: Bottom Nav + Content
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen">
        {header && <div className="sticky top-0 z-40">{header}</div>}
        <main className="flex-1 p-4 pb-20">{children}</main>
        <MobileNav items={mobileNav} />
      </div>
    );
  }

  // Tablet: Collapsible Sidebar
  return (
    <div className="flex min-h-screen">
      <SimplifiedSidebar
        items={navigation}
        logo={logo}
        onSearch={onSearch}
        onCreate={onCreate}
        defaultCollapsed={true}
      />
      <main className="flex-1 min-h-screen">
        {header && <div className="sticky top-0 z-40">{header}</div>}
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}
