import type { ReactNode } from "react";

import { cn } from "../utils/cn";

export interface GradientHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function GradientHeader({
  title,
  subtitle,
  badge,
  className,
  children,
}: GradientHeaderProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl bg-kigali p-6 text-ink", className)}>
      <div className="glass relative z-10 rounded-2xl border-white/20 bg-white/20 p-6 shadow-glass">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <div className="text-sm text-ink/70">{subtitle}</div>}
          </div>
          {badge}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
      <div className="absolute inset-0 bg-nyungwe opacity-40" aria-hidden />
    </div>
  );
}
