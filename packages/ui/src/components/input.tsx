"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "../utils/cn";
import { designTokens } from "../theme/design-tokens";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: "default" | "error" | "success";
  fullWidth?: boolean;
}

/**
 * Input - Form input component with design tokens and validation states
 *
 * Features:
 * - Uses design tokens for consistency
 * - Validation states (error, success)
 * - Icon support (left/right)
 * - Helper text and error messages
 * - WCAG 2.2 AA compliant (4.5:1 contrast, proper labels)
 * - Touch target ≥44px
 *
 * @example
 * ```tsx
 * <Input
 *   label="Phone Number"
 *   placeholder="078 XXX XXXX"
 *   error="Invalid phone number"
 *   leftIcon={<Phone size={20} />}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    error,
    success,
    leftIcon,
    rightIcon,
    variant = "default",
    fullWidth = true,
    className,
    disabled,
    required,
    ...props
  },
  ref
) {
  // Determine state from props
  const hasError = Boolean(error) || variant === "error";
  const hasSuccess = Boolean(success) || variant === "success";

  return (
    <div className={cn("flex flex-col gap-2", fullWidth ? "w-full" : "w-auto")}>
      {/* Label */}
      {label && (
        <label
          htmlFor={props.id}
          className="text-sm font-medium text-neutral-900"
          style={{
            fontSize: designTokens.typography.fontSize.sm,
            fontWeight: designTokens.typography.fontWeight.medium,
            color: designTokens.colors.text.primary,
          }}
        >
          {label}
          {required && (
            <span className="text-red-600 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Left icon */}
        {leftIcon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none"
            aria-hidden="true"
            style={{ color: designTokens.colors.text.tertiary }}
          >
            {leftIcon}
          </div>
        )}

        {/* Input field */}
        <input
          ref={ref}
          disabled={disabled}
          required={required}
          aria-invalid={hasError ? "true" : "false"}
          aria-describedby={
            error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined
          }
          className={cn(
            // Base styles
            "w-full rounded-lg",
            "border",
            "px-4 py-3",
            "text-base text-neutral-900",
            "placeholder:text-neutral-500",
            "transition-all",
            `duration-[${designTokens.motion.duration.fast}ms]`,

            // Height for touch targets (minimum 44px)
            "min-h-[44px]",

            // Icon spacing
            leftIcon ? "pl-11" : "",
            rightIcon ? "pr-11" : "",

            // Default state
            !hasError &&
              !hasSuccess &&
              "border-neutral-300 bg-white focus:outline-none focus:ring-3 focus:ring-[#0066FF]/30 focus:border-[#0066FF]",

            // Error state
            hasError &&
              "border-red-500 bg-red-50 focus:outline-none focus:ring-3 focus:ring-red-500/30 focus:border-red-500",

            // Success state
            hasSuccess &&
              "border-green-600 bg-green-50 focus:outline-none focus:ring-3 focus:ring-green-600/30 focus:border-green-600",

            // Disabled state
            disabled && "opacity-40 cursor-not-allowed bg-neutral-100",

            className
          )}
          style={{
            fontSize: designTokens.typography.fontSize.base,
            borderRadius: designTokens.component.input.borderRadius,
            paddingLeft: leftIcon ? 44 : designTokens.spacing[4],
            paddingRight: rightIcon ? 44 : designTokens.spacing[4],
            paddingTop: designTokens.spacing[3],
            paddingBottom: designTokens.spacing[3],
          }}
          {...props}
        />

        {/* Right icon */}
        {rightIcon && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none"
            aria-hidden="true"
            style={{ color: designTokens.colors.text.tertiary }}
          >
            {rightIcon}
          </div>
        )}
      </div>

      {/* Helper text / Error message / Success message */}
      {(helperText || error || success) && (
        <div
          id={error ? `${props.id}-error` : `${props.id}-helper`}
          className={cn(
            "text-sm",
            hasError && "text-red-600",
            hasSuccess && "text-green-700",
            !hasError && !hasSuccess && "text-neutral-700"
          )}
          style={{
            fontSize: designTokens.typography.fontSize.sm,
          }}
          role={hasError ? "alert" : undefined}
        >
          {error || success || helperText}
        </div>
      )}
    </div>
  );
});
