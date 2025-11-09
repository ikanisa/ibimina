import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface BadgeProps {
  children: ReactNode;
  variant?: "neutral" | "info" | "success" | "warning" | "critical" | "pending";
  size?: "sm" | "md" | "lg";
  className?: string;
  dot?: boolean;
}

/**
 * Badge Component - Atlas UI Design System
 *
 * WCAG AA compliant with proper contrast ratios.
 * Used for status indicators, tags, and labels.
 */
const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  neutral:
    "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
  info: "bg-info-50 text-info-700 border-info-200 dark:bg-info-700 dark:text-info-50 dark:border-info-600",
  success:
    "bg-success-50 text-success-700 border-success-200 dark:bg-success-700 dark:text-success-50 dark:border-success-600",
  warning:
    "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-700 dark:text-warning-50 dark:border-warning-600",
  critical:
    "bg-error-50 text-error-700 border-error-200 dark:bg-error-700 dark:text-error-50 dark:border-error-600",
  pending:
    "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-700 dark:text-warning-50 dark:border-warning-600",
};

const sizeClasses: Record<NonNullable<BadgeProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-2.5 py-1 text-sm gap-1.5",
  lg: "px-3 py-1.5 text-base gap-2",
};

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "success" && "bg-success-600",
            variant === "warning" && "bg-warning-600",
            variant === "critical" && "bg-error-600",
            variant === "info" && "bg-info-600",
            variant === "pending" && "bg-warning-600 animate-pulse",
            variant === "neutral" && "bg-neutral-600"
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
