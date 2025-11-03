import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { designTokens } from "../theme/design-tokens";

export interface BadgeProps {
  children: ReactNode;
  variant?: "neutral" | "info" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: ReactNode;
}

/**
 * Badge - Status indicator with semantic colors
 *
 * Features:
 * - Uses design tokens for consistency
 * - 5 semantic variants (neutral, info, success, warning, error)
 * - 3 sizes (sm, md, lg)
 * - WCAG 2.2 AA compliant colors (4.5:1+ contrast)
 * - Optional icon support
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning" icon={<AlertCircle size={14} />}>
 *   Pending
 * </Badge>
 * ```
 */

const variantClasses: Record<
  NonNullable<BadgeProps["variant"]>,
  { bg: string; text: string; border: string }
> = {
  neutral: {
    bg: "bg-neutral-100",
    text: "text-neutral-900",
    border: "border-neutral-300",
  },
  info: {
    bg: "bg-blue-100",
    text: "text-blue-900",
    border: "border-blue-300",
  },
  success: {
    bg: "bg-green-100",
    text: "text-green-900",
    border: "border-green-300",
  },
  warning: {
    bg: "bg-amber-100",
    text: "text-amber-900",
    border: "border-amber-300",
  },
  error: {
    bg: "bg-red-100",
    text: "text-red-900",
    border: "border-red-300",
  },
};

const sizeClasses: Record<NonNullable<BadgeProps["size"]>, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export function Badge({ children, variant = "neutral", size = "md", icon, className }: BadgeProps) {
  const styles = variantClasses[variant];

  return (
    <span
      className={cn(
        // Base styles
        "inline-flex items-center gap-1.5",
        "rounded-full",
        "border",
        "font-medium",
        "whitespace-nowrap",
        "transition-colors",
        `duration-[${designTokens.motion.duration.fast}ms]`,

        // Variant styles (WCAG compliant)
        styles.bg,
        styles.text,
        styles.border,

        // Size styles
        sizeClasses[size],

        className
      )}
      style={{
        borderRadius: designTokens.component.badge.borderRadius,
        fontSize:
          size === "sm"
            ? designTokens.typography.fontSize.xs
            : size === "md"
              ? designTokens.typography.fontSize.sm
              : designTokens.typography.fontSize.base,
        fontWeight: designTokens.typography.fontWeight.medium,
      }}
    >
      {icon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
