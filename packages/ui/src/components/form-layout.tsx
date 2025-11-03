import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface FormLayoutProps {
  children: ReactNode;
  columns?: 1 | 2;
  className?: string;
}

/**
 * FormLayout - A layout component for forms
 *
 * Features:
 * - Single or two-column grid layout
 * - Responsive: stacks on mobile
 * - Consistent spacing using design tokens
 * - Semantic HTML structure
 */
export function FormLayout({ children, columns = 1, className }: FormLayoutProps) {
  return (
    <div className={cn("grid gap-6", columns === 2 && "grid-cols-1 sm:grid-cols-2", className)}>
      {children}
    </div>
  );
}

export interface FormFieldProps {
  label: ReactNode;
  children: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  fullWidth?: boolean;
}

/**
 * FormField - A wrapper for form inputs with label, hint, and error
 *
 * Features:
 * - Consistent label styling
 * - Inline validation errors
 * - Optional hint text
 * - Required indicator
 * - Full-width option for spanning both columns
 * - Accessible with proper ARIA attributes
 */
export function FormField({
  label,
  children,
  error,
  hint,
  required,
  className,
  fullWidth,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", fullWidth && "sm:col-span-2", className)}>
      <label className="flex items-baseline gap-1 text-sm font-medium text-neutral-200">
        <span>{label}</span>
        {required && (
          <span className="text-red-400" aria-label="required">
            *
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <p className="text-xs text-neutral-400" role="note">
          {hint}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
