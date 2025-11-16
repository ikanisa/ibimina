"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";

import styles from "./SidebarNav.module.css";

type NavItem = {
  href: string;
  label: string;
  Icon: IconType;
};

interface SidebarNavProps {
  items: NavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar} aria-label="Sidebar navigation">
      {items.map(({ href, label, Icon }) => {
        const isActive = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={styles.navLink}
            data-active={isActive}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className={styles.icon} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
