import styles from "./Cards.module.css";

type ActivityKind = "deposit" | "payment" | "loan-repay" | "group-contribution";

type Activity = {
  id: string;
  kind: ActivityKind;
  amount: number;
  currency: string;
  timestamp: string;
  label: string;
};

function formatRelative(timestamp: string, formatter: Intl.RelativeTimeFormat): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}

function symbolFor(kind: ActivityKind) {
  switch (kind) {
    case "deposit":
    case "group-contribution":
      return "+";
    case "payment":
    case "loan-repay":
    default:
      return "-";
  }
}

interface ActivityCardProps {
  title: string;
  activities: Activity[];
  emptyLabel: string;
  locale: string;
}

export function ActivityCard({ title, activities, emptyLabel, locale }: ActivityCardProps) {
  const relativeFormatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  return (
    <section className={styles.card} aria-labelledby="recent-activity">
      <header className={styles.cardHeader}>
        <h2 id="recent-activity" className={styles.cardTitle}>
          {title}
        </h2>
      </header>
      <ul className={styles.activityList}>
        {activities.map((activity) => (
          <li key={activity.id} className={styles.activityItem}>
            <div className={styles.activityMeta}>
              <span className={styles.activityLabel}>{activity.label}</span>
              <span className={styles.activityTime}>
                {formatRelative(activity.timestamp, relativeFormatter)}
              </span>
            </div>
            <span className={styles.badge}>
              {symbolFor(activity.kind)}
              {`${activity.currency} ${activity.amount.toLocaleString()}`}
            </span>
          </li>
        ))}
        {activities.length === 0 ? (
          <li className={styles.activityItem}>
            <span className={styles.activityLabel}>{emptyLabel}</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
