import type { ReactNode } from "react";
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { cn } from "../utils/cn";

export interface ErrorStateProps {
  title: ReactNode;
  description?: ReactNode;
  error?: Error | string;
  icon?: ReactNode;
  className?: string;
  action?: ReactNode;
  variant?: "default" | "offline" | "critical";
  onRetry?: () => void;
}

const variantStyles = {
  default: {
    container: "border-red-500/20 bg-red-500/5",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    title: "text-neutral-0",
  },
  offline: {
    container: "border-yellow-500/20 bg-yellow-500/5",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
    title: "text-neutral-0",
  },
  critical: {
    container: "border-red-600/30 bg-red-600/10",
    iconBg: "bg-red-600/20",
    iconColor: "text-red-300",
    title: "text-red-100",
  },
};

const variantIcons = {
  default: AlertCircle,
  offline: WifiOff,
  critical: AlertCircle,
};

/**
 * ErrorState - A component for displaying error states
 *
 * Features:
 * - Multiple variants (default, offline, critical)
 * - Optional error details
 * - Optional retry action
 * - Custom icons and actions
 * - Accessible with proper ARIA attributes
 * - Consistent with design tokens
 */
export function ErrorState({
  title,
  description,
  error,
  icon,
  className,
  action,
  variant = "default",
  onRetry,
}: ErrorStateProps) {
  const styles = variantStyles[variant];
  const Icon = icon || variantIcons[variant];

  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed p-8 text-center",
        styles.container,
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full shadow-glass",
          styles.iconBg
        )}
      >
        {typeof Icon === "function" ? <Icon className={cn("h-6 w-6", styles.iconColor)} /> : Icon}
      </div>

      <div className="space-y-2">
        <h3 className={cn("text-base font-semibold", styles.title)}>{title}</h3>
        {description && <p className="text-sm text-neutral-300 max-w-md">{description}</p>}
        {errorMessage && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-neutral-400 hover:text-neutral-300">
              Technical details
            </summary>
            <p className="mt-2 rounded-lg bg-black/30 p-3 font-mono text-xs text-neutral-400 text-left overflow-x-auto">
              {errorMessage}
            </p>
          </details>
        )}
      </div>

      {(action || onRetry) && (
        <div className="flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-neutral-0 transition-colors hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
