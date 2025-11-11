import Link from "next/link";

import styles from "./Cards.module.css";

type Deadline = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  dueDate: string;
  actionHref?: string;
  actionLabel?: string;
};

interface UpcomingDeadlinesCardProps {
  deadlines: Deadline[];
  title: string;
  emptyLabel: string;
  actionLabel: string;
  locale: string;
}

export function UpcomingDeadlinesCard({
  title,
  deadlines,
  emptyLabel,
  actionLabel,
  locale,
}: UpcomingDeadlinesCardProps) {
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
  });

  return (
    <section className={styles.card} aria-labelledby="upcoming-deadlines">
      <header className={styles.cardHeader}>
        <h2 id="upcoming-deadlines" className={styles.cardTitle}>
          {title}
        </h2>
      </header>
      <ul className={styles.deadlines}>
        {deadlines.map((deadline) => (
          <li key={deadline.id} className={styles.deadlineItem}>
            <div className={styles.deadlineMeta}>
              <span className={styles.deadlineTitle}>{deadline.title}</span>
              <span className={styles.deadlineDate}>
                {dateFormatter.format(new Date(deadline.dueDate))}
              </span>
            </div>
            <div className={styles.deadlineMeta}>
              <span className={styles.deadlineAmount}>
                {`${deadline.currency} ${deadline.amount.toLocaleString()}`}
              </span>
              {deadline.actionHref ? (
                <Link href={deadline.actionHref} className={styles.badge}>
                  {deadline.actionLabel ?? actionLabel}
                </Link>
              ) : null}
            </div>
          </li>
        ))}
        {deadlines.length === 0 ? (
          <li className={styles.deadlineItem}>
            <span className={styles.deadlineTitle}>{emptyLabel}</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
