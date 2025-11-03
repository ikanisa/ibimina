import { cn } from "../utils/cn";

interface SkeletonProps {
  className?: string;
  "aria-label"?: string;
}

export function Skeleton({ className, "aria-label": ariaLabel }: SkeletonProps) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-[var(--radius-md)] bg-white/5", className)}
      role={ariaLabel ? "status" : undefined}
      aria-label={ariaLabel}
      aria-live={ariaLabel ? "polite" : undefined}
    >
      <div
        className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden
      />
    </div>
  );
}
