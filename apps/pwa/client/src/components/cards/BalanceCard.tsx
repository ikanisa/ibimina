import styles from "./Cards.module.css";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface BalanceCardProps {
  total: number;
  currency?: string;
  label: string;
  deltaText?: string;
  ariaLabel?: string;
}

export function BalanceCard({
  total,
  currency = "RWF",
  label,
  deltaText,
  ariaLabel,
}: BalanceCardProps) {
  const formatted = `${currency} ${NUMBER_FORMATTER.format(total)}`;

  return (
    <section className={styles.card} aria-label={ariaLabel ?? label}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{label}</h2>
        {deltaText ? (
          <span className={`${styles.delta} ${styles.deltaPositive}`}>{deltaText}</span>
        ) : null}
      </header>
      <p className={styles.balanceValue}>{formatted}</p>
    </section>
  );
}
