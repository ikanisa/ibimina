"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "../utils/cn";
import { designTokens } from "../theme/design-tokens";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

// Updated variant classes using design tokens
// Now uses atlas-blue (#0066FF) as primary color for WCAG compliance
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[#0066FF] text-white hover:bg-[#3385FF] active:bg-[#0052CC] focus-visible:ring-[rgba(0,102,255,0.3)] disabled:opacity-40 shadow-sm hover:shadow-base transition-all duration-150",
  secondary:
    "bg-neutral-100 text-neutral-900 border border-neutral-200 hover:bg-neutral-200 active:bg-neutral-300 focus-visible:ring-[rgba(0,102,255,0.3)] disabled:opacity-40 transition-all duration-150",
  ghost:
    "bg-transparent text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-[rgba(0,102,255,0.3)] disabled:opacity-40 transition-all duration-150",
  destructive:
    "bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C] focus-visible:ring-[rgba(239,68,68,0.3)] disabled:opacity-40 shadow-sm hover:shadow-base transition-all duration-150",
  danger:
    "bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C] focus-visible:ring-[rgba(239,68,68,0.3)] disabled:opacity-40 shadow-sm hover:shadow-base transition-all duration-150",
};

// Updated size classes with proper touch targets (≥44px for WCAG 2.2 AA)
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-4 py-2.5 text-sm min-h-[44px]", // 44px minimum touch target
  md: "px-6 py-3 text-base min-h-[48px]", // 48px comfortable
  lg: "px-8 py-4 text-lg min-h-[56px]", // 56px large
  icon: "h-12 w-12 p-0 min-h-[48px] min-w-[48px]", // Square icon button
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    icon,
    iconPosition = "left",
    type = "button",
    disabled,
    children,
    ...props
  },
  ref
) {
  const resolvedVariant = variant as ButtonVariant;
  const resolvedSize = size as ButtonSize;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        // Base styles - updated to use design tokens
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-offset-2",
        // Variant styles
        VARIANT_CLASSES[resolvedVariant],
        // Size styles
        SIZE_CLASSES[resolvedSize],
        // Full width
        fullWidth ? "w-full" : undefined,
        // Cursor
        disabled || loading ? "cursor-not-allowed" : "cursor-pointer",
        // Additional classes
        className
      )}
      aria-busy={loading}
      aria-disabled={disabled}
      {...props}
    >
      {loading && (
        <span
          role="status"
          aria-label="Loading"
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {!loading && icon && iconPosition === "left" && (
        <span className="inline-flex flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
      {!loading && icon && iconPosition === "right" && (
        <span className="inline-flex flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  );
});
