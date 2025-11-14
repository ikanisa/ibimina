"use client";

import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Typography } from "./Typography";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  inputSize?: "md" | "lg";
}

const SIZE_CLASSES: Record<NonNullable<InputProps["inputSize"]>, string> = {
  md: "min-h-[2.75rem] px-4 text-base",
  lg: "min-h-[3.25rem] px-5 text-base",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    inputSize = "md",
    className,
    id: providedId,
    disabled,
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const helperId = helperText ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const hasIconLeft = Boolean(leftIcon);
  const hasIconRight = Boolean(rightIcon);

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <Typography as="label" htmlFor={id} variant="body-sm" tone="muted" className="font-medium">
          {label}
        </Typography>
      ) : null}
      <div className="relative">
        {hasIconLeft ? (
          <span
            className="pointer-events-none absolute left-3 top-1/2 inline-flex -translate-y-1/2 text-[var(--color-foreground-subtle)]"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : helperId}
          className={cn(
            "w-full rounded-lg border bg-[var(--color-surface)] text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)] shadow-sm transition-[box-shadow,border-color,background-color,color] duration-150 ease-[var(--motion-ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--state-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]",
            disabled
              ? "cursor-not-allowed border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-[var(--color-foreground-muted)]"
              : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
            error
              ? "border-[var(--color-danger-500)] focus-visible:ring-[var(--color-danger-500)]"
              : null,
            SIZE_CLASSES[inputSize],
            hasIconLeft ? "pl-10" : null,
            hasIconRight ? "pr-10" : null,
            className
          )}
          {...rest}
        />
        {hasIconRight ? (
          <span
            className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 text-[var(--color-foreground-subtle)]"
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        ) : null}
      </div>
      {error ? (
        <div
          id={errorId}
          role="alert"
          className="flex items-center gap-2 text-[var(--color-danger-600)]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M7.99967 1.33334C4.31967 1.33334 1.33301 4.32001 1.33301 8.00001C1.33301 11.68 4.31967 14.6667 7.99967 14.6667C11.6797 14.6667 14.6663 11.68 14.6663 8.00001C14.6663 4.32001 11.6797 1.33334 7.99967 1.33334ZM8.66634 11.3333H7.33301V10H8.66634V11.3333ZM8.66634 8.66668H7.33301V4.66668H8.66634V8.66668Z" />
          </svg>
          <Typography as="span" variant="body-sm" tone="danger">
            {error}
          </Typography>
        </div>
      ) : helperText ? (
        <Typography id={helperId} as="span" variant="body-sm" tone="subtle">
          {helperText}
        </Typography>
      ) : null}
    </div>
  );
});
