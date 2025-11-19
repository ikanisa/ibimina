import type { TextareaHTMLAttributes } from "react";

import { Input } from "@ibimina/ui";
import type { InputProps } from "@ibimina/ui";

export { Input };
export type { InputProps };

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  className = "",
  id,
  required,
  ...props
}: TextareaProps) {
  const textareaId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="mb-2 block text-sm font-semibold text-neutral-900">
          {label}
          {required && <span className="ml-1 text-error-500">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`
          w-full resize-none rounded-lg border bg-white px-4 py-2.5 text-neutral-900
          placeholder-neutral-400 transition-all duration-200
          ${error ? "border-error-500 focus:ring-error-500/20" : "border-neutral-300 focus:border-brand-blue focus:ring-brand-blue/20"}
          focus:outline-none focus:ring-2
          disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-60
          ${className}
        `}
        required={required}
        {...props}
      />

      {error && (
        <p id={errorId} className="mt-2 flex items-start gap-1 text-sm text-error-600" role="alert">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={helperId} className="mt-2 text-sm text-neutral-600">
          {helperText}
        </p>
      )}
    </div>
  );
}
