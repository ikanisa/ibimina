import { Badge, type BadgeProps } from "@ibimina/ui";

interface StatusChipProps {
  children: React.ReactNode;
  tone?: "neutral" | "info" | "success" | "warning" | "critical";
}

const toneToVariant: Record<NonNullable<StatusChipProps["tone"]>, BadgeProps["variant"]> = {
  neutral: "neutral",
  info: "info",
  success: "success",
  warning: "warning",
  critical: "critical",
};

export function StatusChip({ children, tone = "neutral" }: StatusChipProps) {
  return (
    <span
      className={cn("rounded-full px-3 py-1 text-xs uppercase tracking-wide", toneClasses[tone])}
    >
      {children}
    </span>
  );
}
