"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";

import styles from "./BottomNav.module.css";

type NavItem = {
  href: string;
  label: string;
  ariaLabel?: string;
  Icon: IconType;
};

interface BottomNavProps {
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Primary">
      <div className={styles.list}>
        {items.map(({ href, label, ariaLabel, Icon }) => {
          const isActive = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-label={ariaLabel ?? label}
              aria-current={isActive ? "page" : undefined}
              className={styles.item}
              data-active={isActive}
            >
              <Icon aria-hidden="true" size={22} className={styles.icon} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
