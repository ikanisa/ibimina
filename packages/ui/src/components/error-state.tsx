import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

import { cn } from "../utils/cn";
import { designTokens } from "../theme/design-tokens";

export interface ErrorStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  icon?: ReactNode;
  offlineHint?: ReactNode;
}

/**
 * ErrorState component for displaying error conditions
 *
 * Uses design tokens and semantic error colors (WCAG compliant).
 * Always provide a recovery action when possible.
 *
 * @example
 * ```tsx
 * <ErrorState
 *   title="Failed to load groups"
 *   description="We couldn't fetch your groups. Please check your connection and try again."
 *   action={<Button variant="secondary" onClick={retry}>Try Again</Button>}
 * />
 * ```
 */
export function ErrorState({
  title,
  description,
  action,
  className,
  icon,
  offlineHint,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-2xl border p-8",
        "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
        className
      )}
      style={{
        gap: designTokens.spacing[4],
      }}
    >
      <div
        className="flex items-center justify-center rounded-full border border-red-300 bg-red-100 text-red-700 dark:border-red-700 dark:bg-red-800 dark:text-red-200"
        style={{
          width: designTokens.size.icon.xl,
          height: designTokens.size.icon.xl,
        }}
      >
        {icon ?? <AlertTriangle className="h-6 w-6" aria-hidden />}
      </div>
      <div style={{ gap: designTokens.spacing[2] }} className="flex flex-col">
        <h3
          className="font-semibold text-red-900 dark:text-red-100"
          style={{ fontSize: designTokens.typography.fontSize.lg }}
        >
          {title}
        </h3>
        {description ? (
          <p
            className="text-red-700 dark:text-red-300"
            style={{
              fontSize: designTokens.typography.fontSize.sm,
              marginTop: designTokens.spacing[1],
            }}
          >
            {description}
          </p>
        ) : null}
        {offlineHint ? (
          <p
            className="font-medium uppercase tracking-wider text-amber-700 dark:text-amber-300"
            style={{
              fontSize: designTokens.typography.fontSize.xs,
              marginTop: designTokens.spacing[3],
            }}
          >
            {offlineHint}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
