import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: ReactNode;
  accent?: "blue" | "yellow" | "green" | "neutral";
  className?: string;
}

const accentMap: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  blue: "from-rw-blue/30 to-white/5",
  yellow: "from-rw-yellow/30 to-white/5",
  green: "from-rw-green/30 to-white/5",
  neutral: "from-white/10 to-transparent",
};

export function MetricCard({
  label,
  value,
  trend,
  accent = "neutral",
  className,
}: MetricCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-white/10 bg-white/10 p-4 shadow-glass transition hover:-translate-y-0.5 hover:shadow-xl",
        "relative overflow-hidden",
        className
      )}
      data-glass
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", accentMap[accent])} aria-hidden />
      <div className="relative">
        <p className="text-xs uppercase tracking-[0.25em] text-neutral-2">{label}</p>
        <p className="mt-2 text-2xl font-bold text-neutral-0">{value}</p>
        {trend && <div className="mt-1 text-xs text-emerald-300">{trend}</div>}
      </div>
    </article>
  );
}
