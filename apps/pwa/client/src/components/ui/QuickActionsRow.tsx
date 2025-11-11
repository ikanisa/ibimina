import Link from "next/link";

import styles from "./QuickActionsRow.module.css";

type QuickAction = {
  id: string;
  label: string;
  icon: string;
  href: string;
  ariaLabel?: string;
};

interface QuickActionsRowProps {
  actions: QuickAction[];
}

export function QuickActionsRow({ actions }: QuickActionsRowProps) {
  return (
    <div className={styles.row} role="list">
      {actions.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          className={styles.action}
          role="listitem"
          aria-label={action.ariaLabel ?? action.label}
        >
          <span className={styles.icon} aria-hidden="true">
            {action.icon}
          </span>
          <span className={styles.label}>{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
