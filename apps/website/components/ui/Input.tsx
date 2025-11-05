import React from "react";
import { AlertCircle } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-neutral-900 mb-2">
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`
            w-full px-4 py-2.5 border rounded-lg bg-white text-neutral-900 
            placeholder-neutral-400 transition-all duration-200
            ${error ? "border-error-500 focus:ring-error-500/20" : "border-neutral-300 focus:border-brand-blue focus:ring-brand-blue/20"}
            ${leftIcon ? "pl-10" : ""}
            ${rightIcon ? "pr-10" : ""}
            focus:outline-none focus:ring-2
            disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60
            ${className}
          `}
          {...props}
        />

        {rightIcon && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {rightIcon}
          </div>
        )}

        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-error-500">
            <AlertCircle size={20} aria-hidden="true" />
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="mt-2 text-sm text-error-600 flex items-start gap-1" role="alert">
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

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
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
  ...props
}: TextareaProps) {
  const textareaId = id || `textarea-${label?.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-semibold text-neutral-900 mb-2">
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`
          w-full px-4 py-2.5 border rounded-lg bg-white text-neutral-900 
          placeholder-neutral-400 transition-all duration-200 resize-none
          ${error ? "border-error-500 focus:ring-error-500/20" : "border-neutral-300 focus:border-brand-blue focus:ring-brand-blue/20"}
          focus:outline-none focus:ring-2
          disabled:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60
          ${className}
        `}
        {...props}
      />

      {error && (
        <p id={errorId} className="mt-2 text-sm text-error-600 flex items-start gap-1" role="alert">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
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
