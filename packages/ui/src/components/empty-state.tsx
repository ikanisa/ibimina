import type { ReactNode } from "react";
import { Compass, WifiOff } from "lucide-react";

import { cn } from "../utils/cn";
import { designTokens } from "../theme/design-tokens";

type EmptyStateTone = "default" | "offline" | "quiet";

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
  action?: ReactNode;
  tone?: EmptyStateTone;
  offlineHint?: ReactNode;
}

/**
 * EmptyState component for displaying empty/no-data states
 *
 * Uses design tokens and provides friendly, helpful messaging.
 * Always include a clear action when possible.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="No groups yet"
 *   description="You haven't joined any groups yet. Ready to start saving together?"
 *   icon={<Users />}
 *   action={<Button variant="primary">Browse Groups</Button>}
 * />
 * ```
 */
export function EmptyState({
  title,
  description,
  icon,
  className,
  action,
  tone = "default",
  offlineHint,
}: EmptyStateProps) {
  const resolvedIcon =
    icon ??
    (tone === "offline" ? (
      <WifiOff className="h-6 w-6" aria-hidden />
    ) : (
      <Compass className="h-6 w-6" aria-hidden />
    ));

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-2xl border p-8",
        tone === "default" &&
          "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800",
        tone === "offline" &&
          "border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20",
        tone === "quiet" &&
          "border-dashed border-neutral-200 bg-transparent dark:border-neutral-700",
        className
      )}
      role="status"
      aria-live="polite"
      style={{
        gap: designTokens.spacing[4],
      }}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          "border",
          tone === "default" &&
            "border-neutral-200 bg-white text-neutral-600 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-400",
          tone === "offline" &&
            "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-600 dark:bg-amber-800 dark:text-amber-300",
          tone === "quiet" &&
            "border-neutral-200 bg-transparent text-neutral-500 dark:border-neutral-700 dark:text-neutral-500"
        )}
        style={{
          width: designTokens.size.icon.xl,
          height: designTokens.size.icon.xl,
        }}
      >
        {resolvedIcon}
      </div>
      <div style={{ gap: designTokens.spacing[2] }} className="flex flex-col">
        <h3
          className="font-semibold text-neutral-900 dark:text-neutral-100"
          style={{ fontSize: designTokens.typography.fontSize.lg }}
        >
          {title}
        </h3>
        {description ? (
          <p
            className="text-neutral-600 dark:text-neutral-400"
            style={{
              fontSize: designTokens.typography.fontSize.sm,
              marginTop: designTokens.spacing[1],
            }}
          >
            {description}
          </p>
        ) : null}
        {tone === "offline" && offlineHint ? (
          <p
            className="font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300"
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
