/**
 * Error State Component
 * Implements P0 Fix: H9.1, H9.2, H9.3, H9.5 - Error message improvements
 *
 * Displays user-friendly error messages with recovery actions.
 * WCAG 2.2 AA compliant with proper ARIA attributes.
 */

"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@ibimina/ui/components/button";
import { getUserFriendlyError, getErrorActionUrl } from "@/lib/errors/user-friendly-errors";
import { useRouter } from "next/navigation";

interface ErrorStateProps {
  error: unknown;
  reset?: () => void;
  className?: string;
}

export function ErrorState({ error, reset, className = "" }: ErrorStateProps) {
  const router = useRouter();
  const { title, message, action, actionLabel } = getUserFriendlyError(error);
  const actionUrl = getErrorActionUrl(action);

  const handleAction = () => {
    if (reset && (action === "retry" || !action)) {
      reset();
    } else if (actionUrl) {
      router.push(actionUrl);
    } else if (reset) {
      reset();
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex flex-col items-center max-w-md text-center space-y-4">
        {/* Error Icon */}
        <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-error-600" aria-hidden="true" />
        </div>

        {/* Error Title */}
        <h2 className="text-xl font-bold text-neutral-900">{title}</h2>

        {/* Error Message */}
        <p className="text-base text-neutral-700 leading-relaxed">{message}</p>

        {/* Recovery Action */}
        {actionLabel && (
          <Button onClick={handleAction} variant="primary" className="mt-4">
            {actionLabel}
          </Button>
        )}

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-4 text-left w-full">
            <summary className="text-sm text-neutral-500 cursor-pointer hover:text-neutral-700">
              Technical Details (Dev Only)
            </summary>
            <pre className="mt-2 p-3 bg-neutral-100 rounded-lg text-xs overflow-auto max-w-full">
              {error instanceof Error ? error.stack : String(error)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Inline Error - For form fields and inline errors
 */
interface InlineErrorProps {
  message: string;
  id?: string;
}

export function InlineError({ message, id }: InlineErrorProps) {
  return (
    <p
      id={id}
      className="mt-1 text-sm text-error-600 flex items-start gap-2"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

/**
 * Empty State with Action
 */
interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, message, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {icon && (
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-neutral-900 mb-2">{title}</h3>
      <p className="text-base text-neutral-700 mb-4 max-w-md">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
