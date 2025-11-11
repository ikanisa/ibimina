"use client";

import { useMemo, type ReactNode } from "react";

import { CreditCard, FileText, Home, User, Users } from "lucide-react";

import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { useLocaleMessages } from "@/src/hooks/useLocaleMessages";
import { useResponsive } from "@/src/hooks/useResponsive";

import styles from "./AppShell.module.css";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "./OfflineBanner";
import { SidebarNav } from "./SidebarNav";
import { Omnibox } from "./TopBar/Omnibox";

interface AppShellProps {
  children: ReactNode;
  mainId?: string;
}

export function AppShell({ children, mainId = "main-content" }: AppShellProps) {
  const { isDesktop } = useResponsive();
  const { navigation } = useLocaleMessages();

  const navigationItems = useMemo(
    () => [
      { href: "/home", label: navigation.home, ariaLabel: navigation.home, Icon: Home },
      { href: "/groups", label: navigation.groups, ariaLabel: navigation.groups, Icon: Users },
      { href: "/pay", label: navigation.pay, ariaLabel: navigation.pay, Icon: CreditCard },
      {
        href: "/statements",
        label: navigation.statements,
        ariaLabel: navigation.statements,
        Icon: FileText,
      },
      { href: "/profile", label: navigation.profile, ariaLabel: navigation.profile, Icon: User },
    ],
    [navigation]
  );

  const skipLabel = navigation.skipToContent ?? "Skip to content";

  return (
    <div className={styles.appShell}>
      <a href={`#${mainId}`} className={styles.skipLink}>
        {skipLabel}
      </a>
      <OfflineBanner />
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Omnibox />
          <ThemeToggle />
        </div>
      </header>
      <div className={styles.bodyLayout}>
        {isDesktop ? <SidebarNav items={navigationItems} /> : null}
        <main className={styles.mainContent} role="main" id={mainId}>
          {children}
        </main>
      </div>
      {isDesktop ? null : <BottomNav items={navigationItems} />}
    </div>
  );
}
