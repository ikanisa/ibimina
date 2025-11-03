import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { designTokens } from "../theme/design-tokens";

// ============================================================================
// Card Component - Unified, composable card with design tokens
// ============================================================================

export interface CardProps {
  children: ReactNode;
  variant?: "default" | "elevated" | "outlined" | "ghost";
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
  role?: string;
  "aria-label"?: string;
  tabIndex?: number;
}

const variantStyles: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "bg-white border border-neutral-200 shadow-sm",
  elevated: "bg-white shadow-md hover:shadow-lg",
  outlined: "bg-white border-2 border-neutral-200",
  ghost: "bg-transparent",
};

/**
 * Card - A flexible container component following design token system
 *
 * Features:
 * - 4 variants: default, elevated, outlined, ghost
 * - Interactive mode with hover states
 * - Composable with CardHeader, CardContent, CardActions
 * - Uses design tokens for consistency
 * - WCAG 2.2 AA compliant
 *
 * @example
 * ```tsx
 * <Card variant="elevated" interactive>
 *   <CardHeader>
 *     <CardTitle>Group Name</CardTitle>
 *     <CardSubtitle>SACCO Name</CardSubtitle>
 *   </CardHeader>
 *   <CardContent>
 *     <Stat label="Total Savings" value="RWF 1,200,000" />
 *   </CardContent>
 *   <CardActions>
 *     <Button variant="primary">Join Group</Button>
 *   </CardActions>
 * </Card>
 * ```
 */
export function Card({
  children,
  variant = "default",
  interactive = false,
  className,
  onClick,
  role,
  "aria-label": ariaLabel,
  tabIndex,
}: CardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      role={role || (onClick ? "button" : undefined)}
      aria-label={ariaLabel}
      tabIndex={onClick ? (tabIndex ?? 0) : tabIndex}
      className={cn(
        // Base styles from design tokens
        "rounded-2xl",
        `p-${designTokens.component.card.padding}`,
        "transition-all",
        `duration-[${designTokens.motion.duration.base}ms]`,

        // Variant styles
        variantStyles[variant],

        // Interactive styles
        interactive &&
          "cursor-pointer hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#0066FF]/50",

        // Disabled state for buttons
        onClick && "disabled:opacity-40 disabled:cursor-not-allowed",

        className
      )}
      style={{
        // Apply design token values dynamically
        borderRadius: variant === "ghost" ? 0 : designTokens.component.card.borderRadius,
      }}
    >
      {children}
    </Component>
  );
}

// ============================================================================
// Card Sub-components
// ============================================================================

export interface CardHeaderProps {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/**
 * CardHeader - Header section with optional actions
 */
export function CardHeader({ children, actions, className }: CardHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-4", "mb-4", className)}>
      <div className="flex-1 min-w-0">{children}</div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
  );
}

export interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

/**
 * CardTitle - Main title with design token typography
 */
export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={cn("text-lg font-semibold", "text-neutral-900", "truncate", className)}
      style={{
        fontSize: designTokens.typography.fontSize.lg,
        fontWeight: designTokens.typography.fontWeight.semibold,
        lineHeight: designTokens.typography.lineHeight.tight,
      }}
    >
      {children}
    </h3>
  );
}

export interface CardSubtitleProps {
  children: ReactNode;
  className?: string;
}

/**
 * CardSubtitle - Secondary text with proper contrast (10.2:1)
 */
export function CardSubtitle({ children, className }: CardSubtitleProps) {
  return (
    <p
      className={cn(
        "text-sm",
        "text-neutral-700", // 10.2:1 contrast (WCAG AA compliant)
        "truncate",
        className
      )}
      style={{
        fontSize: designTokens.typography.fontSize.sm,
        color: designTokens.colors.text.secondary,
      }}
    >
      {children}
    </p>
  );
}

export interface CardContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * CardContent - Main content area
 */
export function CardContent({ children, className }: CardContentProps) {
  return (
    <div
      className={cn("space-y-3", className)}
      style={{
        gap: designTokens.spacing[3],
      }}
    >
      {children}
    </div>
  );
}

export interface CardActionsProps {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center" | "stretch";
}

/**
 * CardActions - Footer with action buttons
 */
export function CardActions({ children, className, align = "right" }: CardActionsProps) {
  const alignStyles = {
    left: "justify-start",
    right: "justify-end",
    center: "justify-center",
    stretch: "justify-stretch",
  };

  return (
    <footer
      className={cn(
        "flex items-center gap-3",
        "mt-4 pt-4",
        "border-t border-neutral-200",
        alignStyles[align],
        className
      )}
      style={{
        marginTop: designTokens.spacing[4],
        paddingTop: designTokens.spacing[4],
        gap: designTokens.spacing[3],
      }}
    >
      {children}
    </footer>
  );
}

// ============================================================================
// Stat Component - For displaying metrics in cards
// ============================================================================

export interface StatProps {
  label: string;
  value: string | number;
  trend?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/**
 * Stat - Display a metric with label and value
 */
export function Stat({ label, value, trend, icon, className }: StatProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-neutral-600">{icon}</span>}
        <span
          className="text-xs font-medium text-neutral-700 uppercase tracking-wide"
          style={{
            fontSize: designTokens.typography.fontSize.xs,
            color: designTokens.colors.text.secondary,
          }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="text-2xl font-bold text-neutral-900"
          style={{
            fontSize: designTokens.typography.fontSize["2xl"],
            fontWeight: designTokens.typography.fontWeight.bold,
            color: designTokens.colors.text.primary,
          }}
        >
          {value}
        </span>
        {trend && <span className="text-sm">{trend}</span>}
      </div>
    </div>
  );
}
