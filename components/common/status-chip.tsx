import { cn } from "@/lib/utils";

interface StatusChipProps {
  children: React.ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "critical";
}

const toneClasses: Record<NonNullable<StatusChipProps["tone"]>, string> = {
  neutral: "bg-white/10 text-neutral-1",
  info: "bg-sky-500/15 text-sky-100",
  success: "bg-emerald-500/10 text-emerald-200",
  warning: "bg-amber-500/15 text-amber-200",
  critical: "bg-red-500/15 text-red-200",
};

export function StatusChip({ children, tone = "neutral" }: StatusChipProps) {
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs uppercase tracking-wide", toneClasses[tone])}>{children}</span>
  );
}
