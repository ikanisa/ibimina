"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary-500)] text-[var(--color-foreground-inverse)] hover:bg-[var(--color-primary-600)] focus-visible:bg-[var(--color-primary-600)] active:bg-[var(--color-primary-700)]",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-foreground)] border border-[var(--color-border)] hover:bg-[var(--color-surface-subtle)] hover:border-[var(--color-border-strong)] focus-visible:bg-[var(--color-surface-subtle)]",
  outline:
    "border border-[var(--color-border-strong)] text-[var(--color-foreground)] bg-transparent hover:bg-[var(--color-surface-subtle)]",
  ghost:
    "bg-transparent text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--state-hover)] active:bg-[var(--state-active)]",
  danger:
    "bg-[var(--color-danger-500)] text-[var(--color-foreground-inverse)] hover:bg-[var(--color-danger-600)] focus-visible:bg-[var(--color-danger-600)] active:bg-[var(--color-danger-700)]",
  link: "bg-transparent text-[var(--color-primary-600)] hover:text-[var(--color-primary-500)] underline-offset-4 hover:underline px-0",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "min-h-[2.25rem] px-3 text-sm",
  md: "min-h-[2.75rem] px-4 text-sm",
  lg: "min-h-[3.25rem] px-5 text-base",
  xl: "min-h-[3.5rem] px-6 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    className,
    children,
    type = "button",
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-[var(--motion-ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--state-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-60",
        variant === "link" ? "focus-visible:ring-offset-0" : null,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? "w-full" : null,
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            role="status"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V2a10 10 0 100 20v-2a8 8 0 01-8-8z"
            />
          </svg>
          <span className="typography-body-sm">Loading…</span>
        </span>
      ) : (
        <>
          {leftIcon ? (
            <span className="inline-flex items-center text-[inherit]">{leftIcon}</span>
          ) : null}
          {children}
          {rightIcon ? (
            <span className="inline-flex items-center text-[inherit]">{rightIcon}</span>
          ) : null}
        </>
      )}
    </button>
  );
});
