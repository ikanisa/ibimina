"use client";

import { useMemo, type ReactNode } from "react";

import {
  IoCardOutline,
  IoDocumentTextOutline,
  IoHomeOutline,
  IoPeopleOutline,
  IoPersonCircleOutline,
} from "react-icons/io5";

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
      { href: "/home", label: navigation.home, ariaLabel: navigation.home, Icon: IoHomeOutline },
      {
        href: "/groups",
        label: navigation.groups,
        ariaLabel: navigation.groups,
        Icon: IoPeopleOutline,
      },
      { href: "/pay", label: navigation.pay, ariaLabel: navigation.pay, Icon: IoCardOutline },
      {
        href: "/statements",
        label: navigation.statements,
        ariaLabel: navigation.statements,
        Icon: IoDocumentTextOutline,
      },
      {
        href: "/profile",
        label: navigation.profile,
        ariaLabel: navigation.profile,
        Icon: IoPersonCircleOutline,
      },
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
      {isDesktop ? null : <BottomNav items={navigationItems} />}
      <div className={styles.bodyLayout}>
        {isDesktop ? <SidebarNav items={navigationItems} /> : null}
        <main className={styles.mainContent} role="main" id={mainId}>
          {children}
        </main>
      </div>
    </div>
  );
}
