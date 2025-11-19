import Link from "next/link";
import type { IconType } from "react-icons";

import styles from "./QuickActionsRow.module.css";

type QuickAction = {
  id: string;
  label: string;
  icon: IconType;
  href: string;
  ariaLabel?: string;
};

interface QuickActionsRowProps {
  actions: QuickAction[];
}

export function QuickActionsRow({ actions }: QuickActionsRowProps) {
  return (
    <div className={styles.row} role="list">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.id}
            href={action.href}
            className={styles.action}
            role="listitem"
            aria-label={action.ariaLabel ?? action.label}
          >
            <Icon className={styles.icon} aria-hidden="true" size={26} />
            <span className={styles.label}>{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
