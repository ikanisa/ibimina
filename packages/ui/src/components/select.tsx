"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "../utils/cn";
import { designTokens } from "../theme/design-tokens";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: ReactNode;
  options: SelectOption[] | string[];
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function Select({
  label,
  options,
  helperText,
  error,
  leftIcon,
  size = "md",
  fullWidth,
  className,
  disabled,
  required,
  id,
  ...props
}: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const helperTextId = helperText ? `${selectId}-helper` : undefined;

  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const sizeClasses = {
    sm: "h-11 text-sm",
    md: "h-12 text-base",
    lg: "h-14 text-lg",
  };

  return (
    <div className={cn("flex flex-col gap-2", fullWidth && "w-full")}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-neutral-900"
          style={{ color: designTokens.colors.text.primary }}
        >
          {label}
          {required && <span className="ml-1 text-error">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: designTokens.colors.text.secondary }}
          >
            {leftIcon}
          </div>
        )}
        
        <select
          id={selectId}
          disabled={disabled}
          required={required}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error ? errorId : helperText ? helperTextId : undefined
          }
          className={cn(
            "w-full appearance-none rounded-xl border bg-white transition-all",
            "focus:outline-none focus:ring-3 focus:ring-offset-0",
            sizeClasses[size],
            leftIcon ? "pl-12 pr-12" : "px-4 pr-12",
            error
              ? "border-error text-error focus:border-error focus:ring-error/30"
              : "border-neutral-300 text-neutral-900 focus:border-atlas-blue focus:ring-atlas-blue/30",
            disabled && "cursor-not-allowed opacity-50 bg-neutral-100",
            className
          )}
          style={{
            borderWidth: designTokens.borderWidth.default,
            fontSize: designTokens.typography.fontSize[size === "sm" ? "sm" : size === "lg" ? "lg" : "base"],
            minHeight: designTokens.size.touchTarget.comfortable,
          }}
          {...props}
        >
          {normalizedOptions.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2"
          style={{ color: designTokens.colors.text.secondary }}
          aria-hidden
        />
      </div>

      {error && (
        <p
          id={errorId}
          className="text-sm"
          style={{ color: designTokens.colors.semantic.errorDark }}
          role="alert"
        >
          {error}
        </p>
      )}

      {!error && helperText && (
        <p
          id={helperTextId}
          className="text-sm"
          style={{ color: designTokens.colors.text.secondary }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
