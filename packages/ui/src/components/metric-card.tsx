import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface MetricCardProps {
  label: ReactNode;
  value: string | number;
  trend?: ReactNode;
  accent?: "blue" | "yellow" | "green" | "neutral";
  className?: string;
}

const accentMap: Record<
  NonNullable<MetricCardProps["accent"]>,
  { border: string; bg: string; text: string; trend: string }
> = {
  blue: {
    border: "border-atlas-blue/20 dark:border-atlas-blue/30",
    bg: "bg-gradient-to-br from-atlas-blue/10 to-transparent dark:from-atlas-blue/15",
    text: "text-atlas-blue dark:text-atlas-blue-light",
    trend: "text-atlas-blue-dark dark:text-atlas-blue",
  },
  yellow: {
    border: "border-amber-500/20 dark:border-amber-400/30",
    bg: "bg-gradient-to-br from-amber-500/10 to-transparent dark:from-amber-400/15",
    text: "text-amber-600 dark:text-amber-400",
    trend: "text-amber-700 dark:text-amber-300",
  },
  green: {
    border: "border-emerald-500/20 dark:border-emerald-400/30",
    bg: "bg-gradient-to-br from-emerald-500/10 to-transparent dark:from-emerald-400/15",
    text: "text-emerald-600 dark:text-emerald-400",
    trend: "text-emerald-700 dark:text-emerald-300",
  },
  neutral: {
    border: "border-neutral-200 dark:border-neutral-700",
    bg: "bg-gradient-to-br from-neutral-100/80 to-transparent dark:from-neutral-800/50",
    text: "text-neutral-600 dark:text-neutral-400",
    trend: "text-neutral-700 dark:text-neutral-300",
  },
};

export function MetricCard({
  label,
  value,
  trend,
  accent = "neutral",
  className,
}: MetricCardProps) {
  const theme = accentMap[accent];
  return (
    <article
      className={cn(
        "rounded-2xl border bg-white p-5 shadow-atlas transition-all duration-interactive hover:-translate-y-1 hover:shadow-lg dark:bg-neutral-900",
        theme.border,
        "relative overflow-hidden",
        className
      )}
    >
      <div className={cn("absolute inset-0", theme.bg)} aria-hidden />
      <div className="relative space-y-2">
        <p className={cn("text-xs font-semibold uppercase tracking-wider", theme.text)}>{label}</p>
        <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-0">{value}</p>
        {trend && <div className={cn("text-sm font-medium", theme.trend)}>{trend}</div>}
      </div>
    </article>
  );
}
