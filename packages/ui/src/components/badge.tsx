import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface BadgeProps {
  children: ReactNode;
  variant?: "neutral" | "info" | "success" | "warning" | "critical";
  size?: "sm" | "md";
  className?: string;
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral: "bg-white/10 text-neutral-1 border-white/15",
  info: "bg-sky-500/15 text-sky-100 border-sky-500/25",
  success: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
  warning: "bg-amber-500/15 text-amber-200 border-amber-500/25",
  critical: "bg-red-500/15 text-red-200 border-red-500/25",
};

const sizeClasses: Record<NonNullable<BadgeProps["size"]>, string> = {
  sm: "px-2.5 py-0.5 text-[10px]",
  md: "px-3 py-1 text-xs",
};

export function Badge({ children, variant = "neutral", size = "md", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border uppercase tracking-wide font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}
