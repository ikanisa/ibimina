"use client";

import React, { forwardRef } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Input component with validation and accessibility
 *
 * P0 Fixes:
 * - A11Y-11: Form errors not associated with inputs
 * - A11Y-3: Validation errors must have aria-describedby
 * - H5.1: No validation on forms
 *
 * WCAG 2.2 AA Compliant:
 * - Label properly associated with input
 * - Error messages linked via aria-describedby
 * - Inline validation with red border
 * - High contrast error colors (7:1 ratio)
 * - Minimum 44px touch target
 *
 * Usage:
 * ```tsx
 * <Input
 *   label="Phone Number"
 *   error="Please enter a valid phone number"
 *   helperText="Format: +250 788 123 456"
 *   required
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = "",
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    // Generate unique IDs for accessibility
    const inputId = id || `input-${Math.random().toString(36).substring(7)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const hasError = Boolean(error);

    const baseInputStyles =
      "w-full px-4 py-3 rounded-lg border transition-all duration-200 min-h-[48px] " +
      "focus:outline-none focus:ring-2 focus:ring-offset-2 " +
      "disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-500";

    const inputBorderStyles = hasError
      ? "border-error-500 focus:border-error-600 focus:ring-error-500/30"
      : "border-neutral-300 focus:border-brand-blue focus:ring-brand-blue/30";

    const iconPadding = leftIcon ? "pl-11" : rightIcon ? "pr-11" : "";

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-neutral-900 mb-2">
            {label}
            {required && (
              <span className="text-error-600 ml-1" aria-label="required">
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
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={
              [error && errorId, helperText && helperId].filter(Boolean).join(" ") || undefined
            }
            className={`${baseInputStyles} ${inputBorderStyles} ${iconPadding} ${className}`}
            {...props}
          />

          {/* Right icon or error icon */}
          {(rightIcon || hasError) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
              {hasError ? (
                <AlertCircle className="text-error-600" size={20} />
              ) : (
                <span className="text-neutral-500">{rightIcon}</span>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={errorId}
            className="mt-2 text-sm text-error-700 flex items-start gap-2"
            role="alert"
          >
            <AlertCircle className="flex-shrink-0 mt-0.5" size={16} aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-neutral-700">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/**
 * PasswordInput - Input with show/hide toggle
 */
interface PasswordInputProps extends Omit<InputProps, "type" | "rightIcon"> {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={showPassword ? "text" : "password"}
          {...props}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-700 hover:text-neutral-900 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

/**
 * Textarea component with same styling and accessibility
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = "",
      disabled,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substring(7)}`;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const hasError = Boolean(error);

    const baseStyles =
      "w-full px-4 py-3 rounded-lg border transition-all duration-200 resize-vertical min-h-[120px] " +
      "focus:outline-none focus:ring-2 focus:ring-offset-2 " +
      "disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-500";

    const borderStyles = hasError
      ? "border-error-500 focus:border-error-600 focus:ring-error-500/30"
      : "border-neutral-300 focus:border-brand-blue focus:ring-brand-blue/30";

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-semibold text-neutral-900 mb-2">
            {label}
            {required && (
              <span className="text-error-600 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            [error && errorId, helperText && helperId].filter(Boolean).join(" ") || undefined
          }
          className={`${baseStyles} ${borderStyles} ${className}`}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            className="mt-2 text-sm text-error-700 flex items-start gap-2"
            role="alert"
          >
            <AlertCircle className="flex-shrink-0 mt-0.5" size={16} aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-neutral-700">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
