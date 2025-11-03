import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export interface ValidationBannerProps {
  variant: "error" | "warning" | "info" | "success";
  title?: ReactNode;
  message: ReactNode;
  errors?: string[];
  className?: string;
  onDismiss?: () => void;
}

const variantStyles = {
  error: {
    container: "border-red-500/20 bg-red-500/5",
    icon: "text-red-400",
    title: "text-red-200",
    Icon: AlertCircle,
  },
  warning: {
    container: "border-yellow-500/20 bg-yellow-500/5",
    icon: "text-yellow-400",
    title: "text-yellow-200",
    Icon: AlertCircle,
  },
  info: {
    container: "border-blue-500/20 bg-blue-500/5",
    icon: "text-blue-400",
    title: "text-blue-200",
    Icon: Info,
  },
  success: {
    container: "border-green-500/20 bg-green-500/5",
    icon: "text-green-400",
    title: "text-green-200",
    Icon: CheckCircle2,
  },
};

/**
 * ValidationBanner - A banner for displaying form-level validation messages
 *
 * Features:
 * - Multiple variants (error, warning, info, success)
 * - Optional error list
 * - Dismissible
 * - Accessible with proper ARIA attributes
 * - Consistent with design tokens
 */
export function ValidationBanner({
  variant,
  title,
  message,
  errors,
  className,
  onDismiss,
}: ValidationBannerProps) {
  const styles = variantStyles[variant];
  const Icon = styles.Icon;

  return (
    <div
      className={cn("flex gap-3 rounded-2xl border p-4", styles.container, className)}
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", styles.icon)} />

      <div className="flex-1 space-y-2">
        {title && <h4 className={cn("text-sm font-semibold", styles.title)}>{title}</h4>}
        <div className="text-sm text-neutral-300">{message}</div>

        {errors && errors.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-neutral-400">
            {errors.map((error, index) => (
              <li key={index} className="flex gap-2">
                <span className="text-neutral-500">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 rounded p-1 text-neutral-400 transition-colors hover:bg-white/10 hover:text-neutral-300"
          aria-label="Dismiss"
        >
          <span className="text-lg leading-none">×</span>
        </button>
      )}
    </div>
  );
}
