"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Button component following Atlas UI design system
 *
 * WCAG 2.2 AA Compliant:
 * - Minimum 44x44px touch targets (48px recommended)
 * - High contrast ratios (4.5:1 minimum)
 * - Visible focus indicators
 * - Disabled state clearly indicated
 * - Loading state announced to screen readers
 *
 * Usage:
 * ```tsx
 * <Button variant="primary" size="lg">Click me</Button>
 * <Button loading>Processing...</Button>
 * <Button leftIcon={<Icon />}>With Icon</Button>
 * ```
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const variants = {
    primary:
      "bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-950 focus-visible:ring-neutral-900",
    secondary:
      "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 focus-visible:ring-neutral-500",
    outline:
      "border-2 border-neutral-300 text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100 focus-visible:ring-neutral-500",
    ghost:
      "text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-neutral-500",
    danger:
      "bg-error-600 text-white hover:bg-error-700 active:bg-error-800 focus-visible:ring-error-600",
  };

  // WCAG AA compliant sizing (minimum 44x44px touch targets)
  const sizes = {
    sm: "px-3 py-2 text-sm rounded-lg gap-1.5 min-h-[44px]", // 44px minimum
    md: "px-4 py-3 text-base rounded-lg gap-2 min-h-[48px]", // 48px recommended
    lg: "px-6 py-4 text-lg rounded-xl gap-2.5 min-h-[52px]", // 52px comfortable
  };

  const widthClass = fullWidth ? "w-full" : "";
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      aria-busy={loading}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <Loader2
            className="animate-spin"
            size={size === "sm" ? 14 : size === "lg" ? 20 : 16}
            aria-hidden="true"
          />
          <span>{children || "Loading..."}</span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span className="inline-flex" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          {children}
          {rightIcon && (
            <span className="inline-flex" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
}
