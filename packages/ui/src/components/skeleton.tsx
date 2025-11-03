import { cn } from "../utils/cn";
import { designTokens } from "../theme/design-tokens";

interface SkeletonProps {
  className?: string;
  "aria-label"?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

/**
 * Skeleton loader component for loading states
 *
 * Uses design tokens for consistent styling and supports multiple variants.
 * Always include aria-label for screen reader accessibility.
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" width="60%" height={16} aria-label="Loading content" />
 * <Skeleton variant="circular" width={48} height={48} aria-label="Loading avatar" />
 * <Skeleton variant="rectangular" aria-label="Loading card" className="h-32" />
 * ```
 */
export function Skeleton({
  className,
  "aria-label": ariaLabel = "Loading...",
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const styles: React.CSSProperties = {
    width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        variant === "text" && "rounded",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && `rounded-[${designTokens.borderRadius.lg}]`,
        "bg-neutral-200 dark:bg-neutral-700",
        className
      )}
      style={styles}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <div
        className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent"
        aria-hidden="true"
        style={{
          animationDuration: `${designTokens.motion.duration.base}ms`,
          animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}

// Preset skeleton components for common patterns
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={16}
          width={i === lines - 1 ? "60%" : "100%"}
          aria-label={`Loading line ${i + 1} of ${lines}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" width={48} height={48} aria-label="Loading avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" height={16} width="60%" aria-label="Loading title" />
          <Skeleton variant="text" height={14} width="40%" aria-label="Loading subtitle" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}
